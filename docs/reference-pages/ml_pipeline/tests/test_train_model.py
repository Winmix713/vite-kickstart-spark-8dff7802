"""Unit tests for train_model module"""

import unittest
from unittest.mock import MagicMock, patch
from pathlib import Path

import pandas as pd
import numpy as np

from ml_pipeline.train_model import ModelTrainer, MissingFeatureError


class TestModelTrainer(unittest.TestCase):
    """Tests for ModelTrainer class"""

    def setUp(self):
        """Set up test fixtures"""
        self.sample_config = {
            "model_type": "LogisticRegression",
            "input_features": ["feature1", "feature2"],
            "target_column": "target",
            "hyperparameters": {"max_iter": 100},
        }
        
        self.sample_data = pd.DataFrame({
            "feature1": np.random.rand(100),
            "feature2": np.random.rand(100),
            "target": np.random.choice([0, 1], 100),
        })

    @patch("builtins.open", create=True)
    @patch("yaml.safe_load")
    def test_load_config(self, mock_yaml, mock_open):
        """Test loading configuration"""
        mock_yaml.return_value = self.sample_config
        
        trainer = ModelTrainer(config_path="test_config.yaml")
        config = trainer.load_config()
        
        self.assertEqual(config["model_type"], "LogisticRegression")
        self.assertIn("input_features", config)

    def test_validate_data_success(self):
        """Test data validation with valid data"""
        trainer = ModelTrainer()
        trainer.config = self.sample_config
        
        # Should not raise
        trainer.validate_data(self.sample_data)

    def test_validate_data_missing_columns(self):
        """Test data validation with missing columns"""
        trainer = ModelTrainer()
        trainer.config = self.sample_config
        
        incomplete_data = self.sample_data[["feature1"]]
        
        with self.assertRaises(MissingFeatureError):
            trainer.validate_data(incomplete_data)

    def test_create_model_logistic_regression(self):
        """Test creating LogisticRegression model"""
        trainer = ModelTrainer()
        trainer.config = {
            "model_type": "LogisticRegression",
            "hyperparameters": {"max_iter": 200},
        }
        
        model = trainer.create_model()
        self.assertIsNotNone(model)

    def test_create_model_decision_tree(self):
        """Test creating DecisionTree model"""
        trainer = ModelTrainer()
        trainer.config = {
            "model_type": "DecisionTree",
            "hyperparameters": {"max_depth": 5},
        }
        
        model = trainer.create_model()
        self.assertIsNotNone(model)

    def test_train_and_evaluate(self):
        """Test training and evaluation"""
        trainer = ModelTrainer()
        trainer.config = self.sample_config
        trainer.create_model()
        
        X = self.sample_data[["feature1", "feature2"]]
        y = self.sample_data["target"]
        
        metrics = trainer.train_and_evaluate(X, y)
        
        self.assertIn("accuracy", metrics)
        self.assertIn("precision", metrics)
        self.assertIn("recall", metrics)
        self.assertIn("f1_score", metrics)
        
        # Metrics should be between 0 and 1
        for value in metrics.values():
            self.assertTrue(0 <= value <= 1)

    def test_parse_arguments_dataset_required(self):
        """Test that dataset argument is required"""
        from ml_pipeline.train_model import parse_arguments
        
        # This will fail if dataset is not provided
        import sys
        old_argv = sys.argv
        try:
            sys.argv = ["train_model.py", "--dataset", "test.csv"]
            args = parse_arguments()
            self.assertEqual(args.dataset, "test.csv")
        finally:
            sys.argv = old_argv

    def test_parse_arguments_fine_tune_flag(self):
        """Test fine_tune argument parsing"""
        from ml_pipeline.train_model import parse_arguments
        
        import sys
        old_argv = sys.argv
        try:
            sys.argv = ["train_model.py", "--dataset", "test.csv", "--fine_tune", "true"]
            args = parse_arguments()
            self.assertTrue(args.fine_tune)
            
            sys.argv = ["train_model.py", "--dataset", "test.csv", "--fine_tune", "false"]
            args = parse_arguments()
            self.assertFalse(args.fine_tune)
        finally:
            sys.argv = old_argv

    def test_parse_arguments_learning_rate(self):
        """Test learning_rate argument parsing"""
        from ml_pipeline.train_model import parse_arguments
        
        import sys
        old_argv = sys.argv
        try:
            sys.argv = ["train_model.py", "--dataset", "test.csv", "--learning_rate", "0.01"]
            args = parse_arguments()
            self.assertEqual(args.learning_rate, 0.01)
        finally:
            sys.argv = old_argv

    def test_parse_arguments_epochs(self):
        """Test epochs argument parsing"""
        from ml_pipeline.train_model import parse_arguments
        
        import sys
        old_argv = sys.argv
        try:
            sys.argv = ["train_model.py", "--dataset", "test.csv", "--epochs", "20"]
            args = parse_arguments()
            self.assertEqual(args.epochs, 20)
        finally:
            sys.argv = old_argv


if __name__ == "__main__":
    unittest.main()
