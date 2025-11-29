#!/usr/bin/env python3
"""
Configuration validation utility for ML model configuration.
Validates model_config.yaml against required schema and constraints.
"""

import sys
import yaml
from pathlib import Path
from typing import Dict, Any, List


def load_config(config_path: str = "model_config.yaml") -> Dict[str, Any]:
    """Load and parse the YAML configuration file."""
    try:
        config_file = Path(config_path)
        if not config_file.exists():
            raise FileNotFoundError(f"Configuration file not found: {config_path}")
        
        with open(config_file, 'r') as f:
            config = yaml.safe_load(f)
        
        if not isinstance(config, dict):
            raise ValueError("Configuration must be a dictionary")
        
        return config
    
    except yaml.YAMLError as e:
        raise ValueError(f"Invalid YAML syntax: {e}")
    except Exception as e:
        raise ValueError(f"Error loading configuration: {e}")


def validate_meta(meta: Dict[str, Any]) -> None:
    """Validate the meta section of the configuration."""
    required_fields = ["domain", "config_version"]
    
    for field in required_fields:
        if field not in meta:
            raise ValueError(f"Missing required field in meta: {field}")
    
    if not isinstance(meta["domain"], str) or not meta["domain"].strip():
        raise ValueError("meta.domain must be a non-empty string")
    
    if not isinstance(meta["config_version"], str) or not meta["config_version"].strip():
        raise ValueError("meta.config_version must be a non-empty string")


def validate_inference(inference: Dict[str, Any]) -> None:
    """Validate the inference section of the configuration."""
    required_fields = ["active_model_id", "prediction_target", "input_features"]
    
    for field in required_fields:
        if field not in inference:
            raise ValueError(f"Missing required field in inference: {field}")
    
    # Validate active_model_id
    if not isinstance(inference["active_model_id"], str) or not inference["active_model_id"].strip():
        raise ValueError("inference.active_model_id must be a non-empty string")
    
    # Validate prediction_target
    valid_targets = ["halftime_result", "fulltime_result"]
    if inference["prediction_target"] not in valid_targets:
        raise ValueError(f"inference.prediction_target must be one of {valid_targets}")
    
    # Validate input_features
    if not isinstance(inference["input_features"], list):
        raise ValueError("inference.input_features must be a list")
    
    if len(inference["input_features"]) == 0:
        raise ValueError("inference.input_features cannot be empty")
    
    if not all(isinstance(feature, str) and feature.strip() for feature in inference["input_features"]):
        raise ValueError("All input_features must be non-empty strings")
    
    # Check for duplicate features
    if len(inference["input_features"]) != len(set(inference["input_features"])):
        raise ValueError("input_features contains duplicate entries")


def validate_training(training: Dict[str, Any]) -> None:
    """Validate the training section of the configuration."""
    required_fields = ["algorithm", "random_seed", "hyperparameters", "data_source"]
    
    for field in required_fields:
        if field not in training:
            raise ValueError(f"Missing required field in training: {field}")
    
    # Validate algorithm
    valid_algorithms = ["LogisticRegression", "DecisionTree", "RandomForest"]
    if training["algorithm"] not in valid_algorithms:
        raise ValueError(f"training.algorithm must be one of {valid_algorithms}")
    
    # Validate random_seed
    if not isinstance(training["random_seed"], int):
        raise ValueError("training.random_seed must be an integer")
    
    # Validate hyperparameters
    if not isinstance(training["hyperparameters"], dict):
        raise ValueError("training.hyperparameters must be a dictionary")
    
    # Validate data_source
    if not isinstance(training["data_source"], dict):
        raise ValueError("training.data_source must be a dictionary")
    
    data_source_required = ["path", "target_column"]
    for field in data_source_required:
        if field not in training["data_source"]:
            raise ValueError(f"Missing required field in training.data_source: {field}")
    
    if not isinstance(training["data_source"]["path"], str) or not training["data_source"]["path"].strip():
        raise ValueError("training.data_source.path must be a non-empty string")
    
    if not isinstance(training["data_source"]["target_column"], str) or not training["data_source"]["target_column"].strip():
        raise ValueError("training.data_source.target_column must be a non-empty string")


def validate_config(config: Dict[str, Any]) -> None:
    """Validate the entire configuration structure."""
    required_sections = ["meta", "inference", "training"]
    
    for section in required_sections:
        if section not in config:
            raise ValueError(f"Missing required section: {section}")
    
    validate_meta(config["meta"])
    validate_inference(config["inference"])
    validate_training(config["training"])


def main():
    """Main validation function."""
    config_path = "model_config.yaml"
    
    if len(sys.argv) > 1:
        config_path = sys.argv[1]
    
    try:
        print(f"Validating configuration: {config_path}")
        
        config = load_config(config_path)
        validate_config(config)
        
        print("✅ Configuration validation passed!")
        print(f"✅ Domain: {config['meta']['domain']}")
        print(f"✅ Algorithm: {config['training']['algorithm']}")
        print(f"✅ Features: {len(config['inference']['input_features'])} input features")
        print(f"✅ Target: {config['inference']['prediction_target']}")
        
        return 0
    
    except Exception as e:
        print(f"❌ Validation failed: {e}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
