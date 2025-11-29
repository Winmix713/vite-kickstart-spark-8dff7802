#!/usr/bin/env python3
"""
Comprehensive ML Pipeline Integration Test Runner
Validates end-to-end ML workflows and integration points
"""

import os
import sys
import unittest
import tempfile
import shutil
from pathlib import Path
from datetime import datetime, timedelta
import json
import asyncio
import pandas as pd
import yaml

# Add ML pipeline to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from ml_pipeline.auto_reinforcement import (
    run_auto_reinforcement,
    run_training,
    parse_training_output,
    process_manual_requests
)
from ml_pipeline.data_loader import (
    prepare_retraining_data,
    filter_errors_for_retraining,
    create_finetuning_dataset
)
from ml_pipeline.train_model import ModelTrainer, parse_arguments
from ml_pipeline.config import (
    DEFAULT_LOOKBACK_DAYS,
    MIN_ERROR_SAMPLES_FOR_RETRAINING,
    ERROR_CONFIDENCE_THRESHOLD
)


class MLPipelineIntegrationTestSuite(unittest.TestCase):
    """Comprehensive integration test suite for ML Pipeline"""

    @classmethod
    def setUpClass(cls):
        """Set up test environment"""
        print("🚀 Setting up ML Pipeline Integration Test Environment")
        
        # Create temporary directory for tests
        cls.temp_dir = Path(tempfile.mkdtemp(prefix="ml_integration_test_"))
        print(f"📁 Temporary directory: {cls.temp_dir}")
        
        # Set environment variables for testing
        os.environ['SUPABASE_URL'] = 'https://test.supabase.co'
        os.environ['SUPABASE_SERVICE_KEY'] = 'test-key'
        os.environ['LOG_LEVEL'] = 'DEBUG'
        
        # Create test data
        cls.setup_test_data()
        
        print("✅ Test environment setup complete")

    @classmethod
    def tearDownClass(cls):
        """Clean up test environment"""
        print("🧹 Cleaning up test environment")
        shutil.rmtree(cls.temp_dir, ignore_errors=True)
        print("✅ Cleanup complete")

    @classmethod
    def setup_test_data(cls):
        """Create comprehensive test data"""
        # Create evaluation log with sufficient errors
        cls.evaluation_data = []
        
        for i in range(100):  # 100 samples for robust testing
            date = datetime.now() - timedelta(days=i)
            
            # Create some incorrect predictions with high confidence
            if i % 3 == 0:  # Every 3rd prediction is wrong
                predicted = 'win'
                actual = 'loss'
                confidence = 0.85 + (i % 10) * 0.01  # High confidence
            else:
                predicted = 'win'
                actual = 'win'
                confidence = 0.75 + (i % 10) * 0.01
            
            cls.evaluation_data.append({
                'predicted_outcome': predicted,
                'actual_outcome': actual,
                'confidence': confidence,
                'match_date': date.isoformat(),
                'model_id': f'test_model_{i % 5}',
                'match_id': f'match_{i}',
                'league_id': f'league_{i % 10}',
                'feature1': 0.5 + (i % 20) * 0.05,
                'feature2': 0.3 + (i % 15) * 0.04,
                'feature3': 0.7 + (i % 25) * 0.03
            })
        
        # Save test data
        cls.evaluation_file = cls.temp_dir / "evaluation_log.csv"
        pd.DataFrame(cls.evaluation_data).to_csv(cls.evaluation_file, index=False)

    def test_01_data_preparation_workflow(self):
        """Test complete data preparation workflow"""
        print("\n📊 Testing Data Preparation Workflow...")
        
        # Test error filtering
        filtered_data = filter_errors_for_retraining(
            self.evaluation_data,
            lookback_days=30,
            confidence_threshold=ERROR_CONFIDENCE_THRESHOLD
        )
        
        self.assertGreater(len(filtered_data), MIN_ERROR_SAMPLES_FOR_RETRAINING,
                         "Should have sufficient error samples for training")
        
        # Test dataset creation
        dataset_file = self.temp_dir / "finetune_dataset.csv"
        created_dataset = create_finetuning_dataset(filtered_data, str(dataset_file))
        
        self.assertIsNotNone(created_dataset, "Dataset should be created successfully")
        self.assertTrue(Path(created_dataset).exists(), "Dataset file should exist")
        
        # Verify dataset format
        dataset_df = pd.read_csv(created_dataset)
        self.assertIn('target', dataset_df.columns, "Dataset should have target column")
        self.assertGreater(len(dataset_df), 0, "Dataset should not be empty")
        
        print(f"✅ Dataset created with {len(dataset_df)} samples")

    def test_02_model_training_integration(self):
        """Test model training with real data"""
        print("\n🤖 Testing Model Training Integration...")
        
        # Create training config
        config_file = self.temp_dir / "model_config.yaml"
        config_data = {
            "model_type": "LogisticRegression",
            "input_features": ["feature1", "feature2", "feature3"],
            "target_column": "target",
            "hyperparameters": {
                "max_iter": 100,
                "random_state": 42
            }
        }
        
        with open(config_file, 'w') as f:
            yaml.dump(config_data, f)
        
        # Create training dataset
        training_data = []
        for i in range(200):
            training_data.append({
                'feature1': 0.1 + i * 0.01,
                'feature2': 0.2 + i * 0.015,
                'feature3': 0.3 + i * 0.02,
                'target': 1 if i % 2 == 0 else 0
            })
        
        training_file = self.temp_dir / "training_data.csv"
        pd.DataFrame(training_data).to_csv(training_file, index=False)
        
        # Initialize trainer
        trainer = ModelTrainer(config_path=str(config_file))
        trainer.load_config()
        trainer.create_model()
        
        # Test training
        train_df = pd.read_csv(training_file)
        X = train_df[["feature1", "feature2", "feature3"]]
        y = train_df["target"]
        
        metrics = trainer.train_and_evaluate(X, y)
        
        # Validate metrics
        self.assertIn('accuracy', metrics, "Should have accuracy metric")
        self.assertIn('precision', metrics, "Should have precision metric")
        self.assertIn('recall', metrics, "Should have recall metric")
        self.assertIn('f1_score', metrics, "Should have F1 score metric")
        
        # Validate metric ranges
        for metric_name, metric_value in metrics.items():
            self.assertIsInstance(metric_value, (int, float), f"{metric_name} should be numeric")
            self.assertGreaterEqual(metric_value, 0, f"{metric_name} should be >= 0")
            self.assertLessEqual(metric_value, 1, f"{metric_name} should be <= 1")
        
        print(f"✅ Model trained successfully with accuracy: {metrics['accuracy']:.3f}")

    def test_03_training_output_parsing(self):
        """Test training output parsing functionality"""
        print("\n📝 Testing Training Output Parsing...")
        
        # Test valid JSON output
        json_output = '{"metrics": {"accuracy": 0.85, "precision": 0.82}}'
        result = parse_training_output(json_output)
        
        self.assertIn('metrics', result, "Should parse metrics from JSON output")
        self.assertEqual(result['metrics']['accuracy'], 0.85, "Should extract accuracy correctly")
        
        # Test mixed output (JSON embedded in text)
        mixed_output = """Training started...
{"metrics": {"accuracy": 0.85, "precision": 0.82}}
Training completed."""
        result = parse_training_output(mixed_output)
        
        self.assertIn('metrics', result, "Should parse metrics from mixed output")
        self.assertEqual(result['metrics']['accuracy'], 0.85, "Should extract accuracy from mixed output")
        
        # Test invalid output
        invalid_output = "No JSON here"
        result = parse_training_output(invalid_output)
        
        self.assertEqual(result, {"metrics": {}}, "Should return empty metrics for invalid output")
        
        print("✅ Training output parsing working correctly")

    def test_04_cli_argument_parsing(self):
        """Test command line argument parsing"""
        print("\n⌨️ Testing CLI Argument Parsing...")
        
        # Test valid arguments
        old_argv = sys.argv
        
        try:
            sys.argv = [
                'train_model.py',
                '--dataset', 'test.csv',
                '--config', 'config.yaml',
                '--output_dir', './models',
                '--fine_tune', 'true',
                '--epochs', '10',
                '--learning_rate', '0.01',
                '--random_seed', '42'
            ]
            
            args = parse_arguments()
            
            self.assertEqual(args.dataset, 'test.csv')
            self.assertEqual(args.config, 'config.yaml')
            self.assertEqual(args.output_dir, './models')
            self.assertTrue(args.fine_tune)
            self.assertEqual(args.epochs, 10)
            self.assertEqual(args.learning_rate, 0.01)
            self.assertEqual(args.random_seed, 42)
            
        finally:
            sys.argv = old_argv
        
        print("✅ CLI argument parsing working correctly")


def run_integration_tests():
    """Run complete integration test suite"""
    print("🚀 Starting ML Pipeline Integration Test Suite")
    print("=" * 60)
    
    # Create test suite
    loader = unittest.TestLoader()
    suite = loader.loadTestsFromTestCase(MLPipelineIntegrationTestSuite)
    
    # Run tests with detailed output
    runner = unittest.TextTestRunner(verbosity=2, stream=sys.stdout)
    result = runner.run(suite)
    
    # Print summary
    print("\n" + "=" * 60)
    print("📊 Test Results Summary:")
    print(f"Tests run: {result.testsRun}")
    print(f"Failures: {len(result.failures)}")
    print(f"Errors: {len(result.errors)}")
    print(f"Success rate: {((result.testsRun - len(result.failures) - len(result.errors)) / result.testsRun * 100):.1f}%")
    
    if result.failures:
        print("\n❌ Failures:")
        for test, traceback in result.failures:
            print(f"  - {test}: {traceback}")
    
    if result.errors:
        print("\n💥 Errors:")
        for test, traceback in result.errors:
            print(f"  - {test}: {traceback}")
    
    if result.wasSuccessful():
        print("\n🎉 All integration tests passed!")
        return True
    else:
        print("\n⚠️ Some tests failed. Please review the output above.")
        return False


if __name__ == "__main__":
    success = run_integration_tests()
    sys.exit(0 if success else 1)