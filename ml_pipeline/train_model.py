#!/usr/bin/env python3
"""
ML Pipeline train_model.py - CLI interface for model training with fine-tuning support
"""

import argparse
import json
import logging
import sys
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, Optional

import numpy as np
import pandas as pd
import traceback
import yaml
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report, f1_score, precision_score, recall_score
from sklearn.model_selection import train_test_split
from sklearn.tree import DecisionTreeClassifier
import joblib

from .config import DEBUG, LOG_LEVEL, MODELS_DIR, RETRAINED_MODELS_DIR
from .supabase_client import insert_system_log

# Configure logging
logging.basicConfig(
    level=getattr(logging, LOG_LEVEL),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


class MissingFeatureError(Exception):
    """Raised when required features are missing from the dataset."""
    pass


class ModelTrainer:
    """Handles model training, evaluation, and fine-tuning."""

    def __init__(self, config_path: str = "model_config.yaml", random_seed: int = 42):
        """
        Initialize the model trainer.

        Args:
            config_path: Path to the YAML configuration file
            random_seed: Random seed for reproducibility
        """
        self.config_path = config_path
        self.random_seed = random_seed
        self.config = None
        self.model = None
        self.metrics = {}

    def load_config(self) -> Dict[str, Any]:
        """Load and parse the model configuration from YAML."""
        try:
            config_path = Path(self.config_path)
            if not config_path.is_absolute():
                config_path = Path(__file__).parent.parent / config_path

            with open(config_path, "r") as f:
                self.config = yaml.safe_load(f)
            logger.info(f"Configuration loaded from {config_path}")
            return self.config
        except FileNotFoundError:
            logger.error(f"Configuration file not found: {self.config_path}")
            sys.exit(1)
        except yaml.YAMLError as e:
            logger.error(f"Error parsing YAML configuration: {e}")
            sys.exit(1)

    def validate_data(self, df: pd.DataFrame) -> None:
        """
        Validate that the dataset contains all required features.

        Args:
            df: The loaded dataset

        Raises:
            MissingFeatureError: If required columns are missing
        """
        required_columns = self.config["input_features"] + [self.config["target_column"]]
        missing_columns = [col for col in required_columns if col not in df.columns]

        if missing_columns:
            raise MissingFeatureError(
                f"Missing required columns: {', '.join(missing_columns)}"
            )

        logger.info(f"Data validation passed - {len(required_columns)} required columns present")

    def load_data(self, data_path: str) -> tuple:
        """
        Load and validate the training dataset.

        Args:
            data_path: Path to the CSV file

        Returns:
            Tuple of (features DataFrame, target Series)
        """
        try:
            df = pd.read_csv(data_path)
            logger.info(f"Dataset loaded from {data_path} ({len(df)} rows)")

            self.validate_data(df)

            X = df[self.config["input_features"]]
            y = df[self.config["target_column"]]

            return X, y
        except FileNotFoundError:
            logger.error(f"Dataset file not found: {data_path}")
            sys.exit(1)
        except pd.errors.EmptyDataError:
            logger.error(f"Dataset file is empty: {data_path}")
            sys.exit(1)
        except MissingFeatureError as e:
            logger.error(f"Data validation failed: {e}")
            sys.exit(1)

    def create_model(self, learning_rate: Optional[float] = None) -> Any:
        """
        Create a model instance based on the configuration.

        Args:
            learning_rate: Optional learning rate for fine-tuning

        Returns:
            Instantiated model object
        """
        model_type = self.config["model_type"]
        hyperparameters = self.config.get("hyperparameters", {}).copy()

        # Apply learning rate if fine-tuning
        if learning_rate is not None:
            if model_type == "LogisticRegression":
                # Adjust regularization based on learning rate
                hyperparameters["C"] = learning_rate
            logger.info(f"Fine-tuning with learning_rate={learning_rate}")

        if model_type == "LogisticRegression":
            self.model = LogisticRegression(**hyperparameters)
        elif model_type == "DecisionTree":
            self.model = DecisionTreeClassifier(**hyperparameters)
        else:
            logger.error(f"Unsupported model type: {model_type}")
            sys.exit(1)

        logger.info(f"Model created: {model_type}")
        return self.model

    def train_and_evaluate(self, X: pd.DataFrame, y: pd.Series) -> Dict[str, float]:
        """
        Train the model and evaluate its performance.

        Args:
            X: Feature matrix
            y: Target vector

        Returns:
            Dictionary containing evaluation metrics
        """
        # Split data with reproducible random seed
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=self.random_seed, stratify=y
        )

        logger.info(f"Data split: {len(X_train)} training, {len(X_test)} test samples")

        # Train the model
        logger.info("Training model...")
        self.model.fit(X_train, y_train)
        logger.info("Training complete")

        # Make predictions
        y_pred = self.model.predict(X_test)

        # Calculate metrics
        accuracy = accuracy_score(y_test, y_pred)
        precision = precision_score(y_test, y_pred, average="weighted", zero_division=0)
        recall = recall_score(y_test, y_pred, average="weighted", zero_division=0)
        f1 = f1_score(y_test, y_pred, average="weighted", zero_division=0)

        self.metrics = {
            "accuracy": float(accuracy),
            "precision": float(precision),
            "recall": float(recall),
            "f1_score": float(f1),
        }

        logger.info(f"Metrics: accuracy={accuracy:.4f}, precision={precision:.4f}, recall={recall:.4f}, f1={f1:.4f}")

        return self.metrics

    def save_model(self, output_dir: Optional[str] = None) -> str:
        """
        Save the trained model.

        Args:
            output_dir: Directory to save the model (default: models dir)

        Returns:
            Path to the saved model file
        """
        if output_dir is None:
            output_dir = str(MODELS_DIR)

        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)

        # Generate timestamped filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        model_type = self.config["model_type"]
        filename = f"{model_type}_{timestamp}.pkl"
        filepath = output_path / filename

        logger.info(f"Saving model to {filepath}...")
        joblib.dump(self.model, filepath)
        logger.info("Model saved successfully")

        return str(filepath)

    def load_existing_model(self, model_path: str) -> None:
        """
        Load an existing model for fine-tuning.

        Args:
            model_path: Path to the existing model file
        """
        try:
            self.model = joblib.load(model_path)
            logger.info(f"Loaded existing model from {model_path}")
        except FileNotFoundError:
            logger.error(f"Model file not found: {model_path}")
            sys.exit(1)
        except Exception as e:
            logger.error(f"Failed to load model: {e}")
            sys.exit(1)


def parse_arguments() -> argparse.Namespace:
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(
        description="Train and fine-tune machine learning models"
    )

    parser.add_argument(
        "--dataset",
        type=str,
        required=True,
        help="Path to training dataset (CSV file)",
    )

    parser.add_argument(
        "--config",
        type=str,
        default="model_config.yaml",
        help="Path to model configuration YAML file",
    )

    parser.add_argument(
        "--output_dir",
        type=str,
        default=None,
        help="Directory to save trained model",
    )

    parser.add_argument(
        "--fine_tune",
        type=lambda x: x.lower() in ("true", "1", "yes"),
        default=False,
        help="Enable fine-tuning mode (default: False)",
    )

    parser.add_argument(
        "--model_path",
        type=str,
        default=None,
        help="Path to existing model for fine-tuning",
    )

    parser.add_argument(
        "--learning_rate",
        type=float,
        default=0.001,
        help="Learning rate for fine-tuning (default: 0.001)",
    )

    parser.add_argument(
        "--epochs",
        type=int,
        default=5,
        help="Number of training epochs (default: 5)",
    )

    parser.add_argument(
        "--random_seed",
        type=int,
        default=42,
        help="Random seed for reproducibility (default: 42)",
    )

    return parser.parse_args()


def main():
    """Main execution function."""
    args = parse_arguments()

    logger.info("="*60)
    logger.info("ML Pipeline Model Training")
    logger.info("="*60)
    logger.info(f"Dataset: {args.dataset}")
    logger.info(f"Config: {args.config}")
    logger.info(f"Fine-tune: {args.fine_tune}")
    if args.fine_tune and args.model_path:
        logger.info(f"Model path: {args.model_path}")
    logger.info(f"Learning rate: {args.learning_rate}")
    logger.info(f"Epochs: {args.epochs}")
    logger.info("="*60)

    # Log training start
    insert_system_log(
        component="train_model",
        status="info",
        message=f"Training started: {'fine-tune' if args.fine_tune else 'from scratch'}",
        details={
            "dataset": args.dataset,
            "fine_tune": args.fine_tune,
            "learning_rate": args.learning_rate,
            "epochs": args.epochs,
        }
    )

    try:
        # Initialize trainer
        trainer = ModelTrainer(config_path=args.config, random_seed=args.random_seed)

        # Load configuration
        trainer.load_config()

        # Load and validate data
        X, y = trainer.load_data(args.dataset)
        
        # Log dataset prepared
        insert_system_log(
            component="train_model",
            status="info",
            message=f"Dataset prepared: {len(X)} samples",
            details={"dataset_size": len(X), "features": len(X.columns)}
        )

        # Create or load model
        if args.fine_tune and args.model_path:
            trainer.load_existing_model(args.model_path)
        else:
            trainer.create_model(learning_rate=args.learning_rate if args.fine_tune else None)

        # Train and evaluate
        metrics = trainer.train_and_evaluate(X, y)

        # Save model
        output_dir = args.output_dir or (str(RETRAINED_MODELS_DIR) if args.fine_tune else str(MODELS_DIR))
        model_path = trainer.save_model(output_dir)

        # Log training success
        insert_system_log(
            component="train_model",
            status="info",
            message=f"Training completed successfully",
            details={
                "metrics": metrics,
                "model_path": model_path,
                "dataset_size": len(X),
            }
        )

        # Output metrics as JSON for integration with auto_reinforcement.py
        metrics_output = {
            "status": "success",
            "model_path": model_path,
            "metrics": metrics,
            "dataset_size": len(X),
            "timestamp": datetime.now().isoformat(),
        }

        print(json.dumps(metrics_output, indent=2))
        logger.info("Training completed successfully")

        return 0
    
    except Exception as e:
        # Log error with stack trace
        error_details = {
            "error": str(e),
            "error_type": type(e).__name__,
            "traceback": traceback.format_exc(),
        }
        
        insert_system_log(
            component="train_model",
            status="error",
            message=f"Training failed: {str(e)}",
            details=error_details
        )
        
        logger.error(f"Training failed: {e}", exc_info=True)
        return 1


if __name__ == "__main__":
    sys.exit(main())
