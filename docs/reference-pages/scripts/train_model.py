#!/usr/bin/env python3
"""
Example training script that demonstrates usage of model_config.yaml.
This script shows how the centralized configuration decouples parameters from code.
"""

import sys
import yaml
import pandas as pd
from pathlib import Path
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score


def load_config(config_path: str = "model_config.yaml") -> dict:
    """Load the ML configuration from YAML file."""
    with open(config_path, 'r') as f:
        return yaml.safe_load(f)


def load_data(data_path: str) -> pd.DataFrame:
    """Load training data from CSV file."""
    if not Path(data_path).exists():
        raise FileNotFoundError(f"Training data not found: {data_path}")
    
    return pd.read_csv(data_path)


def create_model(algorithm: str, hyperparameters: dict, random_seed: int):
    """Create a model instance based on configuration."""
    if algorithm == "LogisticRegression":
        return LogisticRegression(
            random_state=random_seed,
            **hyperparameters
        )
    elif algorithm == "DecisionTree":
        from sklearn.tree import DecisionTreeClassifier
        return DecisionTreeClassifier(
            random_state=random_seed,
            **hyperparameters
        )
    elif algorithm == "RandomForest":
        from sklearn.ensemble import RandomForestClassifier
        return RandomForestClassifier(
            random_state=random_seed,
            **hyperparameters
        )
    else:
        raise ValueError(f"Unsupported algorithm: {algorithm}")


def main():
    """Main training function using configuration."""
    try:
        # Load configuration
        print("Loading configuration...")
        config = load_config()
        
        # Extract training parameters
        training_config = config["training"]
        inference_config = config["inference"]
        
        # Load data
        print(f"Loading data from {training_config['data_source']['path']}...")
        data = load_data(training_config["data_source"]["path"])
        
        # Prepare features and target
        input_features = inference_config["input_features"]
        target_column = training_config["data_source"]["target_column"]
        
        print(f"Using features: {input_features}")
        print(f"Target variable: {target_column}")
        
        X = data[input_features]
        y = data[target_column]
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, 
            test_size=0.2, 
            random_state=training_config["random_seed"],
            stratify=y
        )
        
        # Create and train model
        print(f"Training {training_config['algorithm']} model...")
        model = create_model(
            training_config["algorithm"],
            training_config["hyperparameters"],
            training_config["random_seed"]
        )
        
        model.fit(X_train, y_train)
        
        # Evaluate model
        y_pred = model.predict(X_test)
        accuracy = accuracy_score(y_test, y_pred)
        
        print(f"Training completed!")
        print(f"Model accuracy: {accuracy:.4f}")
        
        # Note: In a real implementation, you would save the model
        # and update the model registry with the new model_id
        
        print("✅ Training completed successfully!")
        return 0
        
    except Exception as e:
        print(f"❌ Training failed: {e}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
