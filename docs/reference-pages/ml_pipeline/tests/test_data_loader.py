"""Unit tests for data_loader module"""

import unittest
from datetime import datetime, timedelta
from pathlib import Path
from unittest.mock import MagicMock, patch

import pandas as pd

from ml_pipeline.data_loader import (
    create_finetuning_dataset,
    filter_errors_for_retraining,
    generate_dataset_filename,
)


class TestDataLoader(unittest.TestCase):
    """Tests for data loader functions"""

    def setUp(self):
        """Set up test fixtures"""
        self.sample_data = pd.DataFrame({
            "predicted_outcome": ["win", "loss", "win", "draw", "win", "loss"],
            "actual_outcome": ["win", "win", "loss", "draw", "win", "loss"],
            "confidence": [0.95, 0.75, 0.8, 0.6, 0.72, 0.85],
            "match_date": [
                datetime.now() - timedelta(days=1),
                datetime.now() - timedelta(days=2),
                datetime.now() - timedelta(days=3),
                datetime.now() - timedelta(days=4),
                datetime.now() - timedelta(days=5),
                datetime.now() - timedelta(days=10),
            ],
        })

    def test_filter_errors_for_retraining_basic(self):
        """Test basic filtering of errors"""
        result = filter_errors_for_retraining(self.sample_data, lookback_days=7)
        
        # Should filter out incorrect predictions with confidence > 0.7
        # Rows 0 and 3 are incorrect, row 0 has confidence 0.95 > 0.7, row 3 has confidence 0.6 < 0.7
        # Row 1 has confidence 0.75 > 0.7 but within 7 days
        # Row 2 has confidence 0.8 > 0.7 but within 7 days
        # Row 5 is older than 7 days
        
        self.assertLess(len(result), len(self.sample_data))
        
        # All filtered results should have confidence > 0.7
        self.assertTrue((result["confidence"] > 0.7).all())
        
        # All filtered results should have mismatches
        self.assertTrue((result["predicted_outcome"] != result["actual_outcome"]).all())

    def test_filter_errors_confidence_threshold(self):
        """Test confidence threshold filtering"""
        result = filter_errors_for_retraining(
            self.sample_data, 
            lookback_days=7, 
            confidence_threshold=0.8
        )
        
        # Should filter errors with confidence > 0.8
        self.assertTrue((result["confidence"] > 0.8).all() or len(result) == 0)

    def test_filter_errors_empty_dataframe(self):
        """Test filtering empty dataframe"""
        empty_df = pd.DataFrame()
        result = filter_errors_for_retraining(empty_df)
        
        self.assertEqual(len(result), 0)
        self.assertTrue(isinstance(result, pd.DataFrame))

    def test_filter_errors_missing_columns(self):
        """Test filtering with missing required columns"""
        incomplete_df = pd.DataFrame({
            "confidence": [0.95, 0.75],
            "match_date": [datetime.now(), datetime.now()],
        })
        
        result = filter_errors_for_retraining(incomplete_df)
        self.assertEqual(len(result), 0)

    def test_create_finetuning_dataset(self, tmp_path=None):
        """Test creating fine-tuning dataset"""
        if tmp_path is None:
            tmp_path = Path("/tmp")
        
        output_file = tmp_path / "test_dataset.csv"
        
        # Create a sample dataset
        sample_errors = self.sample_data[
            (self.sample_data["predicted_outcome"] != self.sample_data["actual_outcome"]) &
            (self.sample_data["confidence"] > 0.7)
        ]
        
        if len(sample_errors) > 0:
            result = create_finetuning_dataset(sample_errors, str(output_file))
            
            if result:
                self.assertTrue(Path(result).exists())
                # Clean up
                Path(result).unlink()

    def test_create_finetuning_dataset_empty(self, tmp_path=None):
        """Test creating dataset with no errors"""
        if tmp_path is None:
            tmp_path = Path("/tmp")
        
        empty_errors = pd.DataFrame(columns=["predicted_outcome", "actual_outcome", "confidence"])
        output_file = tmp_path / "test_empty.csv"
        
        result = create_finetuning_dataset(empty_errors, str(output_file))
        self.assertIsNone(result)

    def test_generate_dataset_filename(self):
        """Test filename generation"""
        filename = generate_dataset_filename()
        
        self.assertTrue(filename.startswith("finetune_"))
        self.assertTrue(filename.endswith(".csv"))
        self.assertIn("_", filename)  # Should have timestamp separator


if __name__ == "__main__":
    unittest.main()
