# ML Configuration System

This directory contains the centralized Machine Learning configuration and control plane for the football prediction system.

## 📁 File Structure

```
.
├── model_config.yaml          # Main configuration file
├── model_registry.json        # Model registry with metadata
├── data/
│   └── training_dataset.csv   # Sample training data
├── scripts/
│   ├── validate_config.py    # Configuration validation utility
│   ├── train_model.py        # Example training script
│   └── predict.py            # Example inference script
└── docs/
    └── CONFIG_REFERENCE.md   # Detailed configuration reference
```

## 🚀 Quick Start

### 1. Validate Configuration

```bash
# Validate the default configuration
python3 scripts/validate_config.py

# Validate a custom configuration
python3 scripts/validate_config.py path/to/config.yaml
```

### 2. Train a Model

```bash
# Train a model using the configuration
python3 scripts/train_model.py
```

### 3. Make Predictions

```bash
# Run inference using the configuration
python3 scripts/predict.py
```

## 📋 Configuration Overview

The `model_config.yaml` file provides a single source of truth for ML operations:

### Key Sections

- **`meta`**: Configuration metadata (domain, version)
- **`inference`**: Runtime settings (active model, features, prediction target)
- **`training`**: Experimentation settings (algorithm, hyperparameters, data source)

### Critical Requirements

1. **Feature Order**: The `input_features` order must exactly match training data columns
2. **Model Registry**: `active_model_id` must reference an entry in `model_registry.json`
3. **Data Path**: Training data must exist at the specified path
4. **Validation**: Always validate configuration changes before deployment

## 🔧 Common Operations

### Adding New Features

1. Add feature column to training dataset
2. Update `input_features` array in configuration
3. Retrain model with new feature set
4. Update `active_model_id` to reference new model

### Changing Algorithms

1. Update `training.algorithm` in configuration
2. Adjust `training.hyperparameters` for new algorithm
3. Retrain model
4. Update `active_model_id` to reference new model

### Switching Prediction Targets

1. Change `prediction_target` in configuration
2. Ensure training data has appropriate target column
3. Retrain model for new target
4. Update `active_model_id` to reference new model

## ✅ Validation Rules

The configuration validator enforces:

- Required sections and fields
- Valid enum values for algorithms and targets
- Non-empty input features list
- No duplicate feature names
- Proper data types
- File existence for training data

## 🔄 CI/CD Integration

Add configuration validation to your pipeline:

```yaml
# Example GitHub Actions
- name: Validate ML Configuration
  run: python3 scripts/validate_config.py
```

## 📊 Supported Algorithms

- **LogisticRegression**: Binary classification baseline
- **DecisionTree**: Non-linear decision boundaries
- **RandomForest**: Ensemble method for improved accuracy

## 🎯 Prediction Targets

- **`halftime_result`**: First-half match outcome
- **`fulltime_result`**: Full-time match outcome

## 📖 Documentation

See `docs/CONFIG_REFERENCE.md` for detailed field documentation, examples, and best practices.

## ⚠️ Important Notes

1. **Feature Order Dependency**: ML models are sensitive to feature order. Always maintain consistency between training and inference.
2. **Model Versioning**: Each trained model should have a unique ID in the model registry.
3. **Configuration Changes**: Always validate configuration changes before deploying to production.
4. **Data Consistency**: Ensure training data schema matches the expected input features.

## 🐛 Troubleshooting

### Common Issues

1. **Validation Failures**: Check for missing required fields or invalid enum values
2. **Training Errors**: Verify data path and feature names match configuration
3. **Prediction Failures**: Ensure model exists and feature order matches training

### Debug Commands

```bash
# Validate configuration
python3 scripts/validate_config.py --verbose

# Check data schema
python3 -c "import pandas as pd; print(pd.read_csv('data/training_dataset.csv').columns.tolist())"

# Test model loading
python3 -c "from scripts.predict import load_model; print(load_model('logistic_regression_v1'))"
```

## 🔄 Workflow Integration

This configuration system supports:

1. **Experimentation**: Easy parameter changes without code modifications
2. **Version Control**: Track configuration changes alongside code
3. **Collaboration**: Clear separation of concerns between analysts and developers
4. **Automation**: Scriptable validation and deployment processes

## 📈 Next Steps

1. Extend configuration with additional algorithms
2. Add cross-validation parameters
3. Implement model performance tracking
4. Add A/B testing configuration
5. Integrate with monitoring and alerting systems
