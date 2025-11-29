#!/usr/bin/env python3
"""
Example inference script that demonstrates usage of model_config.yaml for predictions.
This script shows how the centralized configuration drives runtime predictions.
"""

import sys
import yaml
import pandas as pd
from pathlib import Path
from sklearn.linear_model import LogisticRegression
import joblib
import numpy as np


def load_config(config_path: str = "model_config.yaml") -> dict:
    """Load the ML configuration from YAML file."""
    with open(config_path, 'r') as f:
        return yaml.safe_load(f)


def load_model(model_id: str, model_path: str = "models/") -> object:
    """
    Load a trained model from disk.
    Note: In a real implementation, this would load the actual trained model.
    For demo purposes, we'll create a mock model.
    """
    model_file = Path(model_path) / f"{model_id}.pkl"
    
    if model_file.exists():
        return joblib.load(model_file)
    else:
        # Create a mock model for demonstration
        print(f"⚠️  Mock model created for {model_id} (real model not found)")
        model = LogisticRegression()
        # Fit with dummy data to make it functional
        dummy_X = np.random.rand(10, 4)
        dummy_y = np.random.randint(0, 2, 10)
        model.fit(dummy_X, dummy_y)
        return model


def prepare_prediction_input(features: list, feature_values: dict) -> pd.DataFrame:
    """Prepare input data for prediction ensuring correct feature order."""
    # Create DataFrame with features in the correct order
    input_data = {}
    for feature in features:
        if feature not in feature_values:
            raise ValueError(f"Missing value for feature: {feature}")
        input_data[feature] = [feature_values[feature]]
    
    return pd.DataFrame(input_data)


def predict_match(model, features: list, feature_values: dict) -> dict:
    """Make a prediction for a football match."""
    try:
        # Prepare input with correct feature order
        input_df = prepare_prediction_input(features, feature_values)
        
        # Make prediction
        prediction_proba = model.predict_proba(input_df)[0]
        prediction = model.predict(input_df)[0]
        
        # Format results
        result = {
            "prediction": int(prediction),
            "probability": float(prediction_proba[1]),  # Probability of class 1
            "prediction_interpretation": "Home Win" if prediction == 1 else "Away/Draw",
            "confidence": "High" if max(prediction_proba) > 0.7 else "Medium" if max(prediction_proba) > 0.6 else "Low"
        }
        
        return result
        
    except Exception as e:
        raise ValueError(f"Prediction failed: {e}")


def main():
    """Main inference function using configuration."""
    try:
        # Load configuration
        print("Loading configuration...")
        config = load_config()
        
        # Extract inference parameters
        inference_config = config["inference"]
        active_model_id = inference_config["active_model_id"]
        input_features = inference_config["input_features"]
        prediction_target = inference_config["prediction_target"]
        
        print(f"Active model: {active_model_id}")
        print(f"Prediction target: {prediction_target}")
        print(f"Input features: {input_features}")
        
        # Load model
        print(f"\nLoading model: {active_model_id}")
        model = load_model(active_model_id)
        
        # Example prediction scenarios
        print("\n" + "="*50)
        print("EXAMPLE PREDICTIONS")
        print("="*50)
        
        # Scenario 1: Strong home team
        scenario1 = {
            "team_a_rolling_xG": 1.8,
            "team_b_rolling_xG": 0.9,
            "head_to_head_score": 0.6,
            "venue_advantage": 1.0
        }
        
        result1 = predict_match(model, input_features, scenario1)
        print(f"\nScenario 1: Strong home team")
        print(f"Input: {scenario1}")
        print(f"Prediction: {result1['prediction_interpretation']}")
        print(f"Probability: {result1['probability']:.3f}")
        print(f"Confidence: {result1['confidence']}")
        
        # Scenario 2: Balanced teams
        scenario2 = {
            "team_a_rolling_xG": 1.2,
            "team_b_rolling_xG": 1.1,
            "head_to_head_score": 0.0,
            "venue_advantage": 0.0
        }
        
        result2 = predict_match(model, input_features, scenario2)
        print(f"\nScenario 2: Balanced teams")
        print(f"Input: {scenario2}")
        print(f"Prediction: {result2['prediction_interpretation']}")
        print(f"Probability: {result2['probability']:.3f}")
        print(f"Confidence: {result2['confidence']}")
        
        # Scenario 3: Strong away team
        scenario3 = {
            "team_a_rolling_xG": 0.8,
            "team_b_rolling_xG": 1.6,
            "head_to_head_score": -0.4,
            "venue_advantage": -1.0
        }
        
        result3 = predict_match(model, input_features, scenario3)
        print(f"\nScenario 3: Strong away team")
        print(f"Input: {scenario3}")
        print(f"Prediction: {result3['prediction_interpretation']}")
        print(f"Probability: {result3['probability']:.3f}")
        print(f"Confidence: {result3['confidence']}")
        
        print("\n✅ Inference completed successfully!")
        print("\nNote: This is a demonstration with mock model predictions.")
        print("In production, ensure trained models are properly saved and loaded.")
        
        return 0
        
    except Exception as e:
        print(f"❌ Inference failed: {e}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
