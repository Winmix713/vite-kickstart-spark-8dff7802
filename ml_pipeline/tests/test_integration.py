"""
Integration tests for ML Pipeline end-to-end workflows
Tests model training workflows from data loading to model deployment
"""

import json
import os
import tempfile
import unittest
from datetime import datetime, timedelta
from pathlib import Path
from unittest.mock import MagicMock, Mock, patch, mock_open
import pandas as pd
import numpy as np

# Import ML pipeline modules
from ml_pipeline.auto_reinforcement import (
    run_auto_reinforcement,
    run_training,
    parse_training_output,
    process_manual_requests,
    upload_logs_to_storage,
    RetrainingError
)
from ml_pipeline.data_loader import (
    prepare_retraining_data,
    filter_errors_for_retraining,
    create_finetuning_dataset
)
from ml_pipeline.supabase_client import (
    get_supabase_client,
    insert_retraining_run,
    update_retraining_run,
    get_pending_retraining_requests,
    update_retraining_request
)
from ml_pipeline.train_model import ModelTrainer, parse_arguments
from ml_pipeline.config import (
    DEFAULT_LOOKBACK_DAYS,
    MIN_ERROR_SAMPLES_FOR_RETRAINING,
    ERROR_CONFIDENCE_THRESHOLD
)


class TestMLPipelineIntegration(unittest.TestCase):
    """Integration tests for ML Pipeline workflows"""

    def setUp(self):
        """Set up test fixtures"""
        self.temp_dir = Path(tempfile.mkdtemp())
        self.test_config = {
            "model_type": "LogisticRegression",
            "input_features": ["feature1", "feature2", "feature3"],
            "target_column": "target",
            "hyperparameters": {"max_iter": 100, "random_state": 42}
        }
        
        # Sample evaluation log data
        self.sample_evaluation_data = pd.DataFrame({
            "predicted_outcome": ["win", "loss", "win", "draw", "win", "loss", "win", "draw"],
            "actual_outcome": ["win", "win", "loss", "draw", "win", "loss", "loss", "win"],
            "confidence": [0.95, 0.75, 0.8, 0.6, 0.72, 0.85, 0.9, 0.65],
            "match_date": [
                datetime.now() - timedelta(days=1),
                datetime.now() - timedelta(days=2),
                datetime.now() - timedelta(days=3),
                datetime.now() - timedelta(days=4),
                datetime.now() - timedelta(days=5),
                datetime.now() - timedelta(days=6),
                datetime.now() - timedelta(days=7),
                datetime.now() - timedelta(days=8),
            ],
            "feature1": np.random.rand(8),
            "feature2": np.random.rand(8),
            "feature3": np.random.rand(8),
        })

    def tearDown(self):
        """Clean up test fixtures"""
        import shutil
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    @patch('ml_pipeline.supabase_client.get_supabase_client')
    @patch('ml_pipeline.supabase_client.download_from_storage')
    def test_end_to_end_auto_reinforcement_success(self, mock_download, mock_client):
        """Test complete auto reinforcement workflow with successful training"""
        # Mock Supabase client
        mock_supabase = MagicMock()
        mock_client.return_value = mock_supabase
        
        # Mock storage download
        mock_download.return_value = str(self.temp_dir / "evaluation_log.csv")
        self.sample_evaluation_data.to_csv(mock_download.return_value, index=False)
        
        # Mock database operations
        mock_run_id = "test-run-id"
        mock_supabase.table.return_value.insert.return_value.execute.return_value.data = [{"id": mock_run_id}]
        mock_supabase.table.return_value.update.return_value.execute.return_value.data = [{"id": mock_run_id}]
        
        # Create sufficient error samples for training
        error_data = self.sample_evaluation_data[
            (self.sample_evaluation_data["predicted_outcome"] != self.sample_evaluation_data["actual_outcome"]) &
            (self.sample_evaluation_data["confidence"] > ERROR_CONFIDENCE_THRESHOLD)
        ].copy()
        
        # Ensure we have enough samples
        while len(error_data) < MIN_ERROR_SAMPLES_FOR_RETRAINING:
            error_data = pd.concat([error_data, error_data.head(1)], ignore_index=True)
        
        error_data.to_csv(mock_download.return_value, index=False)
        
        with patch('ml_pipeline.auto_reinforcement.run_training') as mock_training:
            mock_training.return_value = {
                "metrics": {
                    "accuracy": 0.85,
                    "precision": 0.82,
                    "recall": 0.88,
                    "f1_score": 0.85
                },
                "model_path": str(self.temp_dir / "model.pkl")
            }
            
            with patch('ml_pipeline.auto_reinforcement.upload_logs_to_storage') as mock_upload:
                mock_upload.return_value = "https://storage.example.com/logs.txt"
                
                result = run_auto_reinforcement(lookback_days=7, source="auto_daily")
                
                self.assertTrue(result)
                mock_training.assert_called_once()
                mock_upload.assert_called_once()

    @patch('ml_pipeline.supabase_client.get_supabase_client')
    @patch('ml_pipeline.supabase_client.download_from_storage')
    def test_end_to_end_insufficient_data(self, mock_download, mock_client):
        """Test auto reinforcement with insufficient error samples"""
        # Mock Supabase client
        mock_supabase = MagicMock()
        mock_client.return_value = mock_supabase
        
        # Mock storage download with insufficient data
        mock_download.return_value = str(self.temp_dir / "evaluation_log.csv")
        
        # Create data with insufficient errors
        insufficient_data = self.sample_evaluation_data.head(2)  # Only 2 samples
        insufficient_data.to_csv(mock_download.return_value, index=False)
        
        # Mock database operations
        mock_run_id = "test-run-id"
        mock_supabase.table.return_value.insert.return_value.execute.return_value.data = [{"id": mock_run_id}]
        mock_supabase.table.return_value.update.return_value.execute.return_value.data = [{"id": mock_run_id}]
        
        result = run_auto_reinforcement(lookback_days=7, source="auto_daily")
        
        # Should return True (no error, but no training due to insufficient data)
        self.assertTrue(result)

    def test_training_output_parsing(self):
        """Test parsing of training script output"""
        # Test valid JSON output
        json_output = '{"metrics": {"accuracy": 0.85, "precision": 0.82}}'
        result = parse_training_output(json_output)
        
        self.assertIn("metrics", result)
        self.assertEqual(result["metrics"]["accuracy"], 0.85)
        
        # Test mixed output (JSON embedded in text)
        mixed_output = """Training started...
{"metrics": {"accuracy": 0.85, "precision": 0.82}}
Training completed."""
        result = parse_training_output(mixed_output)
        
        self.assertIn("metrics", result)
        self.assertEqual(result["metrics"]["accuracy"], 0.85)
        
        # Test invalid output
        invalid_output = "No JSON here"
        result = parse_training_output(invalid_output)
        
        self.assertEqual(result, {"metrics": {}})

    @patch('subprocess.run')
    def test_training_execution_success(self, mock_subprocess):
        """Test successful training execution"""
        # Mock successful subprocess execution
        mock_result = MagicMock()
        mock_result.returncode = 0
        mock_result.stdout = '{"metrics": {"accuracy": 0.85}}'
        mock_result.stderr = ""
        mock_subprocess.return_value = mock_result
        
        dataset_path = str(self.temp_dir / "dataset.csv")
        output_dir = str(self.temp_dir / "output")
        
        result = run_training(dataset_path, output_dir, fine_tune=True, epochs=5)
        
        self.assertIsNotNone(result)
        self.assertIn("metrics", result)
        mock_subprocess.assert_called_once()

    @patch('subprocess.run')
    def test_training_execution_failure(self, mock_subprocess):
        """Test training execution failure"""
        # Mock failed subprocess execution
        mock_result = MagicMock()
        mock_result.returncode = 1
        mock_result.stdout = ""
        mock_result.stderr = "Training failed"
        mock_subprocess.return_value = mock_result
        
        dataset_path = str(self.temp_dir / "dataset.csv")
        output_dir = str(self.temp_dir / "output")
        
        result = run_training(dataset_path, output_dir, fine_tune=True, epochs=5)
        
        self.assertIsNone(result)
        mock_subprocess.assert_called_once()

    @patch('ml_pipeline.supabase_client.upload_file_to_storage')
    def test_log_upload_success(self, mock_upload):
        """Test successful log upload to storage"""
        mock_upload.return_value = "https://storage.example.com/logs.txt"
        
        logs_content = "Training log content"
        run_id = "test-run-id"
        
        result = upload_logs_to_storage(logs_content, run_id)
        
        self.assertEqual(result, "https://storage.example.com/logs.txt")
        mock_upload.assert_called_once()

    @patch('ml_pipeline.supabase_client.get_pending_retraining_requests')
    @patch('ml_pipeline.supabase_client.update_retraining_request')
    def test_manual_request_processing(self, mock_update, mock_requests):
        """Test processing of manual retraining requests"""
        # Mock pending requests
        mock_requests.return_value = [
            {
                "id": "request-1",
                "priority": "high",
                "reason": "Model performance degradation"
            }
        ]
        
        mock_update.return_value = {"id": "request-1"}
        
        result = process_manual_requests()
        
        self.assertEqual(result, "request-1")
        mock_requests.assert_called_once()
        mock_update.assert_called_once_with("request-1", {"status": "processing"})

    @patch('ml_pipeline.supabase_client.get_pending_retraining_requests')
    def test_manual_request_processing_empty(self, mock_requests):
        """Test processing when no manual requests exist"""
        mock_requests.return_value = []
        
        result = process_manual_requests()
        
        self.assertIsNone(result)
        mock_requests.assert_called_once()

    def test_data_preparation_workflow(self):
        """Test complete data preparation workflow"""
        # Create test data with sufficient errors
        test_data = self.sample_evaluation_data.copy()
        
        # Ensure we have enough error samples
        error_mask = (
            (test_data["predicted_outcome"] != test_data["actual_outcome"]) &
            (test_data["confidence"] > ERROR_CONFIDENCE_THRESHOLD)
        )
        
        error_data = test_data[error_mask].copy()
        while len(error_data) < MIN_ERROR_SAMPLES_FOR_RETRAINING:
            error_data = pd.concat([error_data, error_data.head(1)], ignore_index=True)
        
        # Test filtering
        filtered_errors = filter_errors_for_retraining(
            error_data, 
            lookback_days=7, 
            confidence_threshold=ERROR_CONFIDENCE_THRESHOLD
        )
        
        self.assertGreaterEqual(len(filtered_errors), MIN_ERROR_SAMPLES_FOR_RETRAINING)
        
        # Test dataset creation
        dataset_path = str(self.temp_dir / "test_dataset.csv")
        result_path = create_finetuning_dataset(filtered_errors, dataset_path)
        
        self.assertIsNotNone(result_path)
        self.assertTrue(Path(result_path).exists())
        
        # Verify dataset format
        created_data = pd.read_csv(result_path)
        self.assertIn("target", created_data.columns)
        self.assertGreater(len(created_data), 0)

    def test_model_training_integration(self):
        """Test model training with real data"""
        # Create training data
        train_data = pd.DataFrame({
            "feature1": np.random.rand(100),
            "feature2": np.random.rand(100),
            "feature3": np.random.rand(100),
            "target": np.random.choice([0, 1], 100)
        })
        
        # Save training data
        dataset_path = str(self.temp_dir / "train_dataset.csv")
        train_data.to_csv(dataset_path, index=False)
        
        # Create config
        config_path = str(self.temp_dir / "config.yaml")
        import yaml
        with open(config_path, 'w') as f:
            yaml.dump(self.test_config, f)
        
        # Test training
        trainer = ModelTrainer(config_path=config_path)
        trainer.load_config()
        trainer.create_model()
        
        X = train_data[["feature1", "feature2", "feature3"]]
        y = train_data["target"]
        
        metrics = trainer.train_and_evaluate(X, y)
        
        self.assertIn("accuracy", metrics)
        self.assertIn("precision", metrics)
        self.assertIn("recall", metrics)
        self.assertIn("f1_score", metrics)
        
        # Verify metrics are valid
        for metric_name, metric_value in metrics.items():
            self.assertIsInstance(metric_value, (int, float))
            self.assertGreaterEqual(metric_value, 0)
            self.assertLessEqual(metric_value, 1)

    def test_cli_argument_parsing(self):
        """Test command line argument parsing for training script"""
        import sys
        
        # Test basic arguments
        old_argv = sys.argv
        try:
            sys.argv = [
                "train_model.py",
                "--dataset", "test.csv",
                "--output_dir", "./models",
                "--fine_tune", "true",
                "--epochs", "10",
                "--learning_rate", "0.01"
            ]
            
            args = parse_arguments()
            
            self.assertEqual(args.dataset, "test.csv")
            self.assertEqual(args.output_dir, "./models")
            self.assertTrue(args.fine_tune)
            self.assertEqual(args.epochs, 10)
            self.assertEqual(args.learning_rate, 0.01)
            
        finally:
            sys.argv = old_argv

    @patch('ml_pipeline.supabase_client.get_supabase_client')
    def test_database_integration(self, mock_client):
        """Test database operations integration"""
        # Mock Supabase client
        mock_supabase = MagicMock()
        mock_client.return_value = mock_supabase
        
        # Test retraining run insertion
        mock_run_id = "test-run-id"
        mock_supabase.table.return_value.insert.return_value.execute.return_value.data = [{"id": mock_run_id}]
        
        run_data = {
            "source": "auto_daily",
            "dataset_size": 50,
            "fine_tune_flag": True,
            "status": "pending"
        }
        
        result = insert_retraining_run(run_data)
        self.assertIsNotNone(result)
        
        # Test run update
        mock_supabase.table.return_value.update.return_value.execute.return_value.data = [{"id": mock_run_id}]
        
        update_data = {
            "status": "completed",
            "metrics": {"accuracy": 0.85}
        }
        
        result = update_retraining_run(mock_run_id, update_data)
        self.assertIsNotNone(result)

    def test_error_handling_workflow(self):
        """Test error handling throughout the workflow"""
        # Test with invalid data
        invalid_data = pd.DataFrame({
            "wrong_column": [1, 2, 3]
        })
        
        # Should handle gracefully
        filtered = filter_errors_for_retraining(invalid_data)
        self.assertEqual(len(filtered), 0)
        
        # Test with missing files
        result = create_finetuning_dataset(invalid_data, "/nonexistent/path/dataset.csv")
        self.assertIsNone(result)

    @patch('ml_pipeline.auto_reinforcement.run_training')
    @patch('ml_pipeline.supabase_client.get_supabase_client')
    @patch('ml_pipeline.supabase_client.download_from_storage')
    def test_manual_request_end_to_end(self, mock_download, mock_client, mock_training):
        """Test end-to-end manual request processing"""
        # Mock Supabase client
        mock_supabase = MagicMock()
        mock_client.return_value = mock_supabase
        
        # Mock storage download
        mock_download.return_value = str(self.temp_dir / "evaluation_log.csv")
        self.sample_evaluation_data.to_csv(mock_download.return_value, index=False)
        
        # Mock manual request
        mock_request_id = "manual-request-123"
        mock_run_id = "run-456"
        
        mock_supabase.table.return_value.insert.return_value.execute.return_value.data = [{"id": mock_run_id}]
        mock_supabase.table.return_value.update.return_value.execute.return_value.data = [{"id": mock_run_id}]
        
        # Mock training success
        mock_training.return_value = {
            "metrics": {"accuracy": 0.88},
            "model_path": str(self.temp_dir / "model.pkl")
        }
        
        with patch('ml_pipeline.supabase_client.get_pending_retraining_requests') as mock_requests:
            mock_requests.return_value = [
                {
                    "id": mock_request_id,
                    "priority": "high",
                    "reason": "Manual testing"
                }
            ]
            
            with patch('ml_pipeline.supabase_client.update_retraining_request') as mock_update_request:
                mock_update_request.return_value = {"id": mock_request_id}
                
                # Run auto reinforcement with manual request
                result = run_auto_reinforcement(
                    lookback_days=7,
                    source="manual",
                    request_id=mock_request_id
                )
                
                self.assertTrue(result)
                mock_training.assert_called_once()
                mock_update_request.assert_called()


class TestMLPipelinePerformance(unittest.TestCase):
    """Performance and stress tests for ML Pipeline"""

    def setUp(self):
        """Set up performance test fixtures"""
        self.temp_dir = Path(tempfile.mkdtemp())

    def tearDown(self):
        """Clean up performance test fixtures"""
        import shutil
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def test_large_dataset_processing(self):
        """Test processing of large datasets"""
        # Create large dataset (10,000 samples)
        large_data = pd.DataFrame({
            "predicted_outcome": np.random.choice(["win", "loss", "draw"], 10000),
            "actual_outcome": np.random.choice(["win", "loss", "draw"], 10000),
            "confidence": np.random.uniform(0.5, 1.0, 10000),
            "match_date": [datetime.now() - timedelta(days=i) for i in range(10000)],
            "feature1": np.random.rand(10000),
            "feature2": np.random.rand(10000),
            "feature3": np.random.rand(10000),
        })
        
        # Add some errors
        error_mask = large_data["predicted_outcome"] != large_data["actual_outcome"]
        large_data.loc[error_mask, "confidence"] = np.random.uniform(0.7, 1.0, error_mask.sum())
        
        import time
        start_time = time.time()
        
        # Test filtering performance
        filtered = filter_errors_for_retraining(large_data, lookback_days=30)
        
        end_time = time.time()
        processing_time = end_time - start_time
        
        # Should process within reasonable time (less than 5 seconds)
        self.assertLess(processing_time, 5.0)
        self.assertIsInstance(filtered, pd.DataFrame)

    def test_memory_usage(self):
        """Test memory usage during processing"""
        import psutil
        import os
        
        process = psutil.Process(os.getpid())
        initial_memory = process.memory_info().rss / 1024 / 1024  # MB
        
        # Create and process multiple datasets
        for i in range(10):
            test_data = pd.DataFrame({
                "predicted_outcome": np.random.choice(["win", "loss", "draw"], 1000),
                "actual_outcome": np.random.choice(["win", "loss", "draw"], 1000),
                "confidence": np.random.uniform(0.5, 1.0, 1000),
                "match_date": [datetime.now() - timedelta(days=i) for i in range(1000)],
            })
            
            filtered = filter_errors_for_retraining(test_data)
            del filtered  # Explicit cleanup
        
        final_memory = process.memory_info().rss / 1024 / 1024  # MB
        memory_increase = final_memory - initial_memory
        
        # Memory increase should be reasonable (less than 100MB)
        self.assertLess(memory_increase, 100)


if __name__ == "__main__":
    unittest.main()