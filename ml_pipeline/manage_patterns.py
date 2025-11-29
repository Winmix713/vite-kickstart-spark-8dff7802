#!/usr/bin/env python3
"""
Pattern Management CLI - Utilities for managing rare patterns lifecycle.

This module provides command-line tools for:
- Deactivating expired patterns
- Listing active patterns
- Manually triggering pattern discovery
- Syncing patterns to database
"""

import json
import sys
import asyncio
from pathlib import Path
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

try:
    import aiohttp
except ImportError:
    aiohttp = None

try:
    import pandas as pd
except ImportError:
    pd = None


class PatternManager:
    """Manage rare patterns lifecycle and database operations."""

    def __init__(self, supabase_url: str, service_role_key: str):
        """
        Initialize pattern manager.

        :param supabase_url: Supabase project URL
        :param service_role_key: Supabase service role key
        """
        self.supabase_url = supabase_url
        self.service_role_key = service_role_key
        self.edge_function_url = (
            f"{supabase_url}/functions/v1/rare-pattern-sync"
        )

    async def sync_patterns(
        self,
        patterns: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        """
        Sync patterns to database via edge function.

        :param patterns: List of pattern dictionaries
        :return: Response from edge function
        :raises Exception: If sync fails
        """
        if not aiohttp:
            raise ImportError(
                "aiohttp required for sync. Install: pip install aiohttp"
            )

        async with aiohttp.ClientSession() as session:
            headers = {
                "Authorization": f"Bearer {self.service_role_key}",
                "Content-Type": "application/json",
            }

            payload = {"patterns": patterns}

            try:
                async with session.post(
                    self.edge_function_url,
                    json=payload,
                    headers=headers,
                    timeout=aiohttp.ClientTimeout(total=30),
                ) as response:
                    if response.status == 200:
                        return await response.json()
                    else:
                        error_text = await response.text()
                        raise Exception(
                            f"Sync failed: {response.status} - {error_text}"
                        )
            except asyncio.TimeoutError:
                raise Exception("Pattern sync request timed out")

    def print_patterns_summary(self, patterns: List[Dict[str, Any]]) -> None:
        """Print summary of patterns."""
        if not patterns:
            print("No patterns found.")
            return

        print(f"\nFound {len(patterns)} patterns:\n")
        for i, pattern in enumerate(patterns, 1):
            print(f"{i}. {pattern.get('label', 'Unknown')}")
            print(f"   Pattern Key: {pattern.get('pattern_key', 'N/A')}")
            print(f"   Frequency: {pattern.get('frequency_pct', 0):.2f}%")
            print(f"   Accuracy: {pattern.get('accuracy_pct', 0):.2f}%")
            print(f"   Samples: {pattern.get('sample_size', 0)}")
            print(f"   Expires: {pattern.get('expires_at', 'N/A')}")
            print()


def main():
    """CLI entry point."""
    import argparse

    parser = argparse.ArgumentParser(
        description="Manage rare patterns lifecycle"
    )
    subparsers = parser.add_subparsers(dest="command", help="Commands")

    # Discover command
    discover_parser = subparsers.add_parser(
        "discover",
        help="Discover patterns from evaluation log",
    )
    discover_parser.add_argument(
        "log_file",
        help="Path to evaluation log CSV",
    )
    discover_parser.add_argument(
        "--frequency-threshold",
        type=float,
        default=0.05,
        help="Maximum frequency threshold (default: 0.05)",
    )
    discover_parser.add_argument(
        "--accuracy-threshold",
        type=float,
        default=0.80,
        help="Minimum accuracy threshold (default: 0.80)",
    )
    discover_parser.add_argument(
        "--min-samples",
        type=int,
        default=5,
        help="Minimum sample size (default: 5)",
    )
    discover_parser.add_argument(
        "--output",
        help="Output JSON file",
    )

    # Sync command
    sync_parser = subparsers.add_parser(
        "sync",
        help="Sync patterns to database",
    )
    sync_parser.add_argument(
        "patterns_file",
        help="Path to patterns JSON file",
    )
    sync_parser.add_argument(
        "--supabase-url",
        required=True,
        help="Supabase URL",
    )
    sync_parser.add_argument(
        "--service-role-key",
        required=True,
        help="Supabase service role key",
    )

    # Info command
    info_parser = subparsers.add_parser(
        "info",
        help="Display pattern information",
    )
    info_parser.add_argument(
        "patterns_file",
        help="Path to patterns JSON file",
    )

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        return 1

    try:
        if args.command == "discover":
            from ml_pipeline.rare_pattern_finder import find_rare_patterns

            patterns = find_rare_patterns(
                args.log_file,
                frequency_threshold=args.frequency_threshold,
                accuracy_threshold=args.accuracy_threshold,
                min_sample_size=args.min_samples,
            )

            output = json.dumps(patterns, indent=2)

            if args.output:
                with open(args.output, "w") as f:
                    f.write(output)
                print(
                    f"✅ Found {len(patterns)} patterns. Output: {args.output}"
                )
            else:
                print(output)

            return 0

        elif args.command == "sync":
            with open(args.patterns_file) as f:
                patterns = json.load(f)

            manager = PatternManager(args.supabase_url, args.service_role_key)

            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            result = loop.run_until_complete(manager.sync_patterns(patterns))

            print(f"✅ Sync successful: {result.get('synced', 0)} patterns")
            return 0

        elif args.command == "info":
            with open(args.patterns_file) as f:
                patterns = json.load(f)

            manager = PatternManager("", "")
            manager.print_patterns_summary(patterns)
            return 0

    except Exception as e:
        print(f"❌ Error: {str(e)}", file=sys.stderr)
        return 1

    return 0


if __name__ == "__main__":
    sys.exit(main())
