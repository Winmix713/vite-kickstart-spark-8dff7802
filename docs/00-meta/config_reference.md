# ML Configuration Reference Guide

This document provides a comprehensive reference for the `model_config.yaml` file, which serves as the centralized configuration for the Machine Learning pipeline.

## Overview

The `model_config.yaml` file establishes a single source of truth for ML model parameters, separating configuration from code and enabling analysts to experiment without modifying Python code.

## Configuration Structure

The configuration is organized into three main sections:

### `meta` Section

Contains metadata about the configuration itself.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `domain` | string | ✅ | The problem domain (e.g., "football_prediction") |
| `config_version` | string | ✅ | Configuration version for compatibility tracking |

**Example:**
```yaml
meta:
  domain: "football_prediction"
  config_version: "1.0"
```

### `inference` Section

Runtime configuration used by the prediction engine.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `active_model_id` | string | ✅ | UUID or tag identifying the model to use for predictions |
| `prediction_target` | enum | ✅ | Target variable: `"halftime_result"` or `"fulltime_result"` |
| `input_features` | array | ✅ | Ordered list of feature names (order must match training) |

**Critical Note:** The `input_features` order must exactly match the column order used during model training. Any deviation will cause prediction failures.

**Example:**
```yaml
inference:
  active_model_id: "logistic_regression_v1"
  prediction_target: "fulltime_result"
  input_features:
    - "team_a_rolling_xG"
    - "team_b_rolling_xG"
    - "head_to_head_score"
    - "venue_advantage"
```

### `training` Section

Experimentation configuration used by training scripts.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `algorithm` | enum | ✅ | ML algorithm: `"LogisticRegression"`, `"DecisionTree"`, or `"RandomForest"` |
| `random_seed` | integer | ✅ | Random seed for reproducible experiments (default: 42) |
| `hyperparameters` | object | ✅ | Algorithm-specific hyperparameters |
| `data_source` | object | ✅ | Training data configuration |

#### `hyperparameters` Object

Algorithm-specific parameters:

**LogisticRegression:**
- `max_iter`: Maximum iterations (default: 1000)
- `C`: Regularization strength (default: 1.0)
- `solver`: Optimization algorithm (default: "liblinear")

**DecisionTree:**
- `max_depth`: Maximum tree depth (default: 5)
- `min_samples_split`: Minimum samples to split (default: 2)

**RandomForest:**
- `n_estimators`: Number of trees (default: 100)
- `max_depth`: Maximum tree depth (default: 5)

#### `data_source` Object

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `path` | string | ✅ | Path to training CSV file |
| `target_column` | string | ✅ | Name of the target variable column |

**Example:**
```yaml
training:
  algorithm: "LogisticRegression"
  random_seed: 42
  hyperparameters:
    max_iter: 1000
    C: 1.0
    solver: "liblinear"
  data_source:
    path: "data/training_dataset.csv"
    target_column: "fulltime_result"
```

## Safe Editing Guidelines

### Adding New Features

When adding new features to the model:

1. **Update CSV Data**: Add the new feature column to your training dataset
2. **Update Configuration**: Add the feature to `input_features` array in the correct position
3. **Retrain Model**: Train a new model with the updated feature set
4. **Update Model ID**: Change `active_model_id` to reference the new trained model

**Critical:** The order in `input_features` must exactly match the column order in your training data.

### Switching Prediction Targets

To change from halftime to fulltime result prediction:

1. **Update Configuration**: Change `prediction_target` to `"halftime_result"` or `"fulltime_result"`
2. **Update Training Data**: Ensure your CSV has the appropriate target column
3. **Retrain Model**: Train a new model for the new target
4. **Update Model ID**: Update `active_model_id` to reference the new model

### Algorithm Changes

To switch between algorithms:

1. **Update Configuration**: Change `training.algorithm` to the desired algorithm
2. **Adjust Hyperparameters**: Update `training.hyperparameters` with algorithm-specific parameters
3. **Retrain Model**: Run training with the new algorithm
4. **Update Model ID**: Set `active_model_id` to the new trained model

## Validation

The configuration is automatically validated using the `scripts/validate_config.py` script:

```bash
# Validate default configuration
python3 scripts/validate_config.py

# Validate custom configuration
python3 scripts/validate_config.py path/to/config.yaml
```

The validator checks for:
- Required fields and sections
- Valid enum values
- Non-empty input features list
- Proper data types
- No duplicate feature names

## Integration with CI/CD

The validation script should be integrated into your CI/CD pipeline:

```yaml
# Example GitHub Actions step
- name: Validate ML Configuration
  run: python3 scripts/validate_config.py
```

## Model Registry Integration

The `active_model_id` should correspond to an entry in your model registry (`model_registry.json`). This ensures proper versioning and tracking of deployed models.

## Troubleshooting

### Common Issues

1. **Feature Order Mismatch**: Ensure `input_features` order matches training data columns
2. **Missing Features**: All features in `input_features` must exist in training data
3. **Invalid Algorithm**: Use only supported algorithms: LogisticRegression, DecisionTree, RandomForest
4. **Invalid Target**: Use only supported targets: halftime_result, fulltime_result

### Debugging

Use the validation script to check configuration validity:
```bash
python3 scripts/validate_config.py
```

For detailed error information, the validator provides specific field-level validation messages.

## Best Practices

1. **Version Control**: Always commit configuration changes with corresponding model updates
2. **Documentation**: Document the rationale for feature selection and hyperparameter choices
3. **Testing**: Validate configuration changes in a staging environment before production
4. **Backup**: Keep previous configuration versions for rollback capability
5. **Monitoring**: Monitor model performance after configuration changes

## Example Complete Configuration

```yaml
meta:
  domain: "football_prediction"
  config_version: "1.0"

inference:
  active_model_id: "logistic_regression_v1"
  prediction_target: "fulltime_result"
  input_features:
    - "team_a_rolling_xG"
    - "team_b_rolling_xG"
    - "head_to_head_score"
    - "venue_advantage"

training:
  algorithm: "LogisticRegression"
  random_seed: 42
  hyperparameters:
    max_iter: 1000
    C: 1.0
    solver: "liblinear"
  data_source:
    path: "data/training_dataset.csv"
    target_column: "fulltime_result"
```

This configuration provides a robust baseline for football prediction experiments while maintaining clear separation between runtime inference settings and training experimentation parameters.
