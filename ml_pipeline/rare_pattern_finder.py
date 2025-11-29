#!/usr/bin/env python3
"""
Rare Pattern Finder - Identifies statistically rare but high-accuracy patterns.

This module analyzes prediction evaluation logs to discover patterns that occur
infrequently (<5%) but with consistently high accuracy (≥80%). These insights
are valuable for understanding edge cases and emerging winning strategies.

Key Responsibilities:
- Read and parse evaluation logs (CSV format)
- Compute pattern signatures combining multiple prediction attributes
- Calculate frequency and accuracy metrics
- Filter patterns meeting the rare + reliable criteria
- Output structured pattern insights for database insertion
"""

import json
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional
from datetime import datetime, timedelta, timezone

try:
    import pandas as pd
except ImportError:
    print("ERROR: pandas is required. Install via: pip install pandas")
    sys.exit(1)


def find_rare_patterns(
    evaluation_log_path: str,
    frequency_threshold: float = 0.05,
    accuracy_threshold: float = 0.80,
    min_sample_size: int = 5,
) -> List[Dict[str, Any]]:
    """
    Identify rare but reliable patterns from prediction evaluation logs.

    :param evaluation_log_path: Path to evaluation log CSV file
    :param frequency_threshold: Maximum occurrence frequency (default 5%)
    :param accuracy_threshold: Minimum accuracy threshold (default 80%)
    :param min_sample_size: Minimum sample size for statistical reliability
    :return: List of high-value pattern dictionaries
    :raises FileNotFoundError: If evaluation log file doesn't exist
    :raises ValueError: If data is invalid or missing required columns
    """
    # Validate input file
    log_path = Path(evaluation_log_path)
    if not log_path.exists():
        raise FileNotFoundError(f"Evaluation log not found: {evaluation_log_path}")

    # Read evaluation log
    try:
        df = pd.read_csv(evaluation_log_path)
    except Exception as e:
        raise ValueError(f"Failed to read evaluation log: {str(e)}")

    # Validate required columns
    required_columns = ["predicted_result", "actual_result", "confidence"]
    missing_columns = [col for col in required_columns if col not in df.columns]
    if missing_columns:
        raise ValueError(f"Missing required columns: {missing_columns}")

    # Handle null values - filter out predictions without actual results
    df = df.dropna(subset=["actual_result"])

    if len(df) == 0:
        return []

    # Create is_correct column
    df["is_correct"] = df["predicted_result"] == df["actual_result"]

    # Optional columns with defaults
    btts_col = "btts_prediction" if "btts_prediction" in df.columns else None
    template_col = "template_name" if "template_name" in df.columns else None
    outcome_col = "predicted_result"  # Always present

    # Build pattern signature combining predicted outcome, BTTS, and template
    pattern_parts = [df[outcome_col].astype(str)]

    if btts_col:
        pattern_parts.append(df[btts_col].astype(str))
    else:
        pattern_parts.append(pd.Series(["NA"] * len(df)))

    if template_col:
        pattern_parts.append(df[template_col].fillna("NONE").astype(str))
    else:
        pattern_parts.append(pd.Series(["NONE"] * len(df)))

    df["pattern_key"] = (
        pattern_parts[0] + "_" + pattern_parts[1] + "_" + pattern_parts[2]
    )

    total_predictions = len(df)

    # Aggregate statistics by pattern
    pattern_stats = (
        df.groupby("pattern_key")
        .agg(
            {
                "is_correct": ["sum", "count", "mean"],
                "confidence": "mean",
            }
        )
        .reset_index()
    )

    pattern_stats.columns = [
        "pattern_key",
        "correct_count",
        "total_count",
        "accuracy",
        "avg_confidence",
    ]

    # Calculate frequency percentage
    pattern_stats["frequency"] = pattern_stats["total_count"] / total_predictions
    pattern_stats["frequency_pct"] = pattern_stats["frequency"] * 100

    # Apply filters
    rare_patterns_df = pattern_stats[
        (pattern_stats["frequency"] < frequency_threshold)
        & (pattern_stats["accuracy"] >= accuracy_threshold)
        & (pattern_stats["total_count"] >= min_sample_size)
    ]

    # Build output list with additional context
    result = []
    for _, row in rare_patterns_df.iterrows():
        pattern_key = row["pattern_key"]

        # Get supporting matches for this pattern
        pattern_matches = df[df["pattern_key"] == pattern_key]
        supporting_matches = []

        for _, match_row in pattern_matches.iterrows():
            match_entry = {
                "match_id": int(match_row.name) if hasattr(match_row, "name") else None,
                "date": (
                    str(match_row.get("timestamp", "N/A"))
                    if "timestamp" in match_row.index
                    else "N/A"
                ),
                "teams": (
                    f"{match_row.get('team_a', 'Team A')} vs {match_row.get('team_b', 'Team B')}"
                    if "team_a" in match_row.index and "team_b" in match_row.index
                    else "N/A"
                ),
            }
            supporting_matches.append(match_entry)

        # Parse pattern key components
        key_parts = pattern_key.split("_")
        predicted_outcome = key_parts[0] if len(key_parts) > 0 else "unknown"
        btts_flag = key_parts[1] if len(key_parts) > 1 else "NA"
        template_name = "_".join(key_parts[2:]) if len(key_parts) > 2 else "NONE"

        # Build human-readable label
        label_parts = []
        if predicted_outcome == "home_win":
            label_parts.append("Home Win")
        elif predicted_outcome == "away_win":
            label_parts.append("Away Win")
        else:
            label_parts.append(predicted_outcome.replace("_", " ").title())

        if btts_flag != "NA":
            btts_text = (
                "+ BTTS"
                if btts_flag.lower() in ["true", "1"]
                else "- No BTTS"
            )
            label_parts.append(btts_text)

        if template_name != "NONE":
            label_parts.append(template_name.replace("_", " ").title())

        label = " ".join(label_parts) if label_parts else pattern_key

        # Create highlight text
        accuracy_pct = row["accuracy"] * 100
        freq_pct = row["frequency_pct"]
        highlight_text = (
            f"Rare but reliable: {label} pattern found in only {freq_pct:.1f}% "
            f"of predictions with {accuracy_pct:.1f}% accuracy"
        )

        # Calculate expiry (30 days from now)
        discovered_at = datetime.now(timezone.utc)
        expires_at = discovered_at + timedelta(days=30)

        pattern_insight = {
            "pattern_key": pattern_key,
            "label": label,
            "frequency_pct": round(freq_pct, 2),
            "accuracy_pct": round(accuracy_pct, 2),
            "sample_size": int(row["total_count"]),
            "supporting_matches": supporting_matches[
                :10
            ],  # Limit to first 10 matches
            "discovered_at": discovered_at.isoformat() + "Z",
            "expires_at": expires_at.isoformat() + "Z",
            "highlight_text": highlight_text,
        }

        result.append(pattern_insight)

    # Sort by accuracy descending, then by sample size descending
    result.sort(key=lambda p: (p["accuracy_pct"], p["sample_size"]), reverse=True)

    return result


def main():
    """CLI entry point for rare pattern finding."""
    import argparse

    parser = argparse.ArgumentParser(
        description="Find rare but reliable patterns in prediction evaluation logs"
    )
    parser.add_argument(
        "log_file",
        help="Path to evaluation log CSV file",
    )
    parser.add_argument(
        "--frequency-threshold",
        type=float,
        default=0.05,
        help="Maximum frequency threshold (default: 0.05 = 5%%)",
    )
    parser.add_argument(
        "--accuracy-threshold",
        type=float,
        default=0.80,
        help="Minimum accuracy threshold (default: 0.80 = 80%%)",
    )
    parser.add_argument(
        "--min-samples",
        type=int,
        default=5,
        help="Minimum sample size for statistical reliability (default: 5)",
    )
    parser.add_argument(
        "--output",
        help="Output JSON file (default: stdout)",
    )

    args = parser.parse_args()

    try:
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
            print(f"✅ Found {len(patterns)} rare patterns. Output: {args.output}")
        else:
            print(output)

        return 0

    except Exception as e:
        print(f"❌ Error: {str(e)}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
