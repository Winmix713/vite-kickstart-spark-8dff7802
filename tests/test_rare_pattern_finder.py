#!/usr/bin/env python3
"""
Test suite for rare pattern finder module.

Tests cover:
- Pattern detection logic
- Frequency and accuracy calculations
- Filtering by thresholds
- Edge cases and error handling
"""

import unittest
import tempfile
import json
from pathlib import Path
from datetime import datetime, timedelta

import pandas as pd

from ml_pipeline.rare_pattern_finder import find_rare_patterns


class TestRarePatternFinder(unittest.TestCase):
    """Test cases for rare pattern discovery."""

    def setUp(self):
        """Create temporary evaluation log for testing."""
        self.temp_dir = tempfile.TemporaryDirectory()
        self.log_path = Path(self.temp_dir.name) / "test_log.csv"

    def tearDown(self):
        """Clean up temporary files."""
        self.temp_dir.cleanup()

    def create_evaluation_log(
        self, rows: list[dict]
    ) -> str:
        """Create a CSV evaluation log with test data."""
        df = pd.DataFrame(rows)
        df.to_csv(self.log_path, index=False)
        return str(self.log_path)

    def test_find_rare_patterns_basic(self):
        """Test basic pattern discovery."""
        rows = [
            {
                "predicted_result": "home_win",
                "actual_result": "home_win",
                "confidence": 0.75,
                "btts_prediction": False,
                "template_name": "form",
            },
            {
                "predicted_result": "home_win",
                "actual_result": "home_win",
                "confidence": 0.70,
                "btts_prediction": False,
                "template_name": "form",
            },
            # Filler predictions (different patterns)
            *[
                {
                    "predicted_result": "away_win",
                    "actual_result": "away_win" if i % 2 == 0 else "home_win",
                    "confidence": 0.60,
                    "btts_prediction": True,
                    "template_name": "h2h",
                }
                for i in range(100)
            ],
        ]

        log_path = self.create_evaluation_log(rows)
        patterns = find_rare_patterns(
            log_path,
            frequency_threshold=0.05,
            accuracy_threshold=0.80,
            min_sample_size=2,
        )

        # Should find at least the home_win pattern
        self.assertGreater(len(patterns), 0)

        # Check pattern has required fields
        for pattern in patterns:
            self.assertIn("pattern_key", pattern)
            self.assertIn("label", pattern)
            self.assertIn("frequency_pct", pattern)
            self.assertIn("accuracy_pct", pattern)
            self.assertIn("sample_size", pattern)
            self.assertIn("discovered_at", pattern)
            self.assertIn("expires_at", pattern)

    def test_frequency_filtering(self):
        """Test that patterns are filtered by frequency threshold."""
        # Create mostly rare pattern, some common patterns
        rows = [
            {
                "predicted_result": "home_win",
                "actual_result": "home_win",
                "confidence": 0.85,
                "btts_prediction": False,
                "template_name": "rare",
            },
            {
                "predicted_result": "home_win",
                "actual_result": "home_win",
                "confidence": 0.85,
                "btts_prediction": False,
                "template_name": "rare",
            },
            {
                "predicted_result": "home_win",
                "actual_result": "home_win",
                "confidence": 0.85,
                "btts_prediction": False,
                "template_name": "rare",
            },
            # Common patterns (98 more)
            *[
                {
                    "predicted_result": "away_win",
                    "actual_result": "away_win",
                    "confidence": 0.60,
                    "btts_prediction": True,
                    "template_name": "common",
                }
                for i in range(98)
            ],
        ]

        log_path = self.create_evaluation_log(rows)
        patterns = find_rare_patterns(
            log_path,
            frequency_threshold=0.05,
            accuracy_threshold=0.80,
            min_sample_size=2,
        )

        # Verify at least one rare pattern found
        self.assertGreater(len(patterns), 0)

        # Verify frequency is < 5%
        for pattern in patterns:
            self.assertLess(pattern["frequency_pct"], 5.0)

    def test_accuracy_filtering(self):
        """Test that patterns are filtered by accuracy threshold."""
        rows = [
            # High accuracy pattern (all correct)
            {
                "predicted_result": "home_win",
                "actual_result": "home_win",
                "confidence": 0.75,
                "btts_prediction": False,
                "template_name": "accurate",
            },
            {
                "predicted_result": "home_win",
                "actual_result": "home_win",
                "confidence": 0.75,
                "btts_prediction": False,
                "template_name": "accurate",
            },
            {
                "predicted_result": "home_win",
                "actual_result": "home_win",
                "confidence": 0.75,
                "btts_prediction": False,
                "template_name": "accurate",
            },
            # Low accuracy pattern
            {
                "predicted_result": "away_win",
                "actual_result": "home_win",
                "confidence": 0.60,
                "btts_prediction": True,
                "template_name": "inaccurate",
            },
            {
                "predicted_result": "away_win",
                "actual_result": "away_win",
                "confidence": 0.60,
                "btts_prediction": True,
                "template_name": "inaccurate",
            },
            # Filler
            *[
                {
                    "predicted_result": "draw",
                    "actual_result": "draw",
                    "confidence": 0.50,
                    "btts_prediction": False,
                    "template_name": "draw",
                }
                for i in range(100)
            ],
        ]

        log_path = self.create_evaluation_log(rows)
        patterns = find_rare_patterns(
            log_path,
            frequency_threshold=0.10,
            accuracy_threshold=0.80,
            min_sample_size=2,
        )

        # All patterns should have accuracy >= 80%
        for pattern in patterns:
            self.assertGreaterEqual(pattern["accuracy_pct"], 80.0)

    def test_minimum_sample_size(self):
        """Test that patterns require minimum sample size."""
        rows = [
            # Only 2 samples of rare pattern
            {
                "predicted_result": "home_win",
                "actual_result": "home_win",
                "confidence": 0.90,
                "btts_prediction": False,
                "template_name": "small_sample",
            },
            {
                "predicted_result": "home_win",
                "actual_result": "home_win",
                "confidence": 0.90,
                "btts_prediction": False,
                "template_name": "small_sample",
            },
            # Filler
            *[
                {
                    "predicted_result": "away_win",
                    "actual_result": "away_win",
                    "confidence": 0.60,
                    "btts_prediction": True,
                    "template_name": "filler",
                }
                for i in range(100)
            ],
        ]

        log_path = self.create_evaluation_log(rows)

        # With min_sample_size=5, should not find pattern
        patterns = find_rare_patterns(
            log_path,
            frequency_threshold=0.10,
            accuracy_threshold=0.80,
            min_sample_size=5,
        )

        # Should not include the 2-sample pattern
        small_sample_patterns = [
            p for p in patterns
            if "small_sample" in p.get("pattern_key", "")
        ]
        self.assertEqual(len(small_sample_patterns), 0)

    def test_missing_file_raises_error(self):
        """Test that missing log file raises FileNotFoundError."""
        with self.assertRaises(FileNotFoundError):
            find_rare_patterns("/nonexistent/path/log.csv")

    def test_missing_required_column_raises_error(self):
        """Test that missing required columns raise ValueError."""
        # Missing 'actual_result' column
        rows = [
            {
                "predicted_result": "home_win",
                "confidence": 0.75,
                "btts_prediction": False,
            }
        ]

        log_path = self.create_evaluation_log(rows)

        with self.assertRaises(ValueError) as context:
            find_rare_patterns(log_path)

        self.assertIn("Missing required columns", str(context.exception))

    def test_null_actual_results_handled(self):
        """Test that predictions without results are filtered."""
        rows = [
            {
                "predicted_result": "home_win",
                "actual_result": None,  # Unresolved prediction
                "confidence": 0.75,
                "btts_prediction": False,
                "template_name": "test",
            },
            {
                "predicted_result": "home_win",
                "actual_result": "home_win",
                "confidence": 0.75,
                "btts_prediction": False,
                "template_name": "test",
            },
            *[
                {
                    "predicted_result": "away_win",
                    "actual_result": "away_win",
                    "confidence": 0.60,
                    "btts_prediction": True,
                    "template_name": "filler",
                }
                for i in range(100)
            ],
        ]

        log_path = self.create_evaluation_log(rows)
        patterns = find_rare_patterns(log_path)

        # Should process without error, ignoring null actual_results
        self.assertIsInstance(patterns, list)

    def test_expiry_dates_set(self):
        """Test that expiry dates are 30 days in future."""
        rows = [
            {
                "predicted_result": "home_win",
                "actual_result": "home_win",
                "confidence": 0.85,
                "btts_prediction": False,
                "template_name": "expiry_test",
            },
            {
                "predicted_result": "home_win",
                "actual_result": "home_win",
                "confidence": 0.85,
                "btts_prediction": False,
                "template_name": "expiry_test",
            },
            *[
                {
                    "predicted_result": "away_win",
                    "actual_result": "away_win",
                    "confidence": 0.60,
                    "btts_prediction": True,
                    "template_name": "filler",
                }
                for i in range(100)
            ],
        ]

        log_path = self.create_evaluation_log(rows)
        patterns = find_rare_patterns(log_path)

        now = datetime.utcnow()
        for pattern in patterns:
            discovered = datetime.fromisoformat(
                pattern["discovered_at"].replace("Z", "+00:00")
            )
            expires = datetime.fromisoformat(
                pattern["expires_at"].replace("Z", "+00:00")
            )

            # Expiry should be ~30 days after discovery
            diff = (expires - discovered).days
            self.assertAlmostEqual(diff, 30, delta=1)

    def test_pattern_key_construction(self):
        """Test that pattern keys are constructed correctly."""
        rows = [
            {
                "predicted_result": "home_win",
                "actual_result": "home_win",
                "confidence": 0.85,
                "btts_prediction": True,
                "template_name": "counterattack",
            },
            {
                "predicted_result": "home_win",
                "actual_result": "home_win",
                "confidence": 0.85,
                "btts_prediction": True,
                "template_name": "counterattack",
            },
            {
                "predicted_result": "home_win",
                "actual_result": "home_win",
                "confidence": 0.85,
                "btts_prediction": True,
                "template_name": "counterattack",
            },
            {
                "predicted_result": "home_win",
                "actual_result": "home_win",
                "confidence": 0.85,
                "btts_prediction": True,
                "template_name": "counterattack",
            },
            {
                "predicted_result": "home_win",
                "actual_result": "home_win",
                "confidence": 0.85,
                "btts_prediction": True,
                "template_name": "counterattack",
            },
            *[
                {
                    "predicted_result": "away_win",
                    "actual_result": "away_win",
                    "confidence": 0.60,
                    "btts_prediction": False,
                    "template_name": "filler",
                }
                for i in range(100)
            ],
        ]

        log_path = self.create_evaluation_log(rows)
        patterns = find_rare_patterns(
            log_path,
            frequency_threshold=0.10,
            accuracy_threshold=0.80,
            min_sample_size=3,
        )

        # Find pattern with btts=true and counterattack
        btts_patterns = [
            p for p in patterns
            if "counterattack" in p.get("pattern_key", "").lower()
        ]

        self.assertGreater(len(btts_patterns), 0, "Should find at least one counterattack pattern")
        for pattern in btts_patterns:
            # Pattern key should contain all components
            self.assertIn("home_win", pattern["pattern_key"])
            self.assertIn("counterattack", pattern["pattern_key"])

    def test_empty_log_returns_empty_list(self):
        """Test that empty evaluation log returns empty patterns list."""
        # Create a CSV with headers but no data rows
        df = pd.DataFrame({
            "predicted_result": [],
            "actual_result": [],
            "confidence": []
        })
        df.to_csv(self.log_path, index=False)
        log_path = str(self.log_path)

        patterns = find_rare_patterns(log_path)

        self.assertEqual(patterns, [])

    def test_patterns_sorted_by_accuracy(self):
        """Test that patterns are sorted by accuracy (descending)."""
        rows = [
            # 85% accurate (2 samples)
            {
                "predicted_result": "home_win",
                "actual_result": "home_win",
                "confidence": 0.75,
                "btts_prediction": False,
                "template_name": "pattern_85",
            },
            {
                "predicted_result": "home_win",
                "actual_result": "home_win",
                "confidence": 0.75,
                "btts_prediction": False,
                "template_name": "pattern_85",
            },
            # 100% accurate (5 samples)
            *[
                {
                    "predicted_result": "away_win",
                    "actual_result": "away_win",
                    "confidence": 0.60,
                    "btts_prediction": True,
                    "template_name": "pattern_100",
                }
                for i in range(5)
            ],
            # Filler
            *[
                {
                    "predicted_result": "draw",
                    "actual_result": "draw",
                    "confidence": 0.50,
                    "btts_prediction": False,
                    "template_name": "filler",
                }
                for i in range(100)
            ],
        ]

        log_path = self.create_evaluation_log(rows)
        patterns = find_rare_patterns(
            log_path,
            frequency_threshold=0.10,
            accuracy_threshold=0.80,
            min_sample_size=2,
        )

        # Patterns should be sorted by accuracy descending
        accuracies = [p["accuracy_pct"] for p in patterns]
        self.assertEqual(accuracies, sorted(accuracies, reverse=True))


if __name__ == "__main__":
    unittest.main()
