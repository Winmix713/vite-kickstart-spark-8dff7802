# Model Training Pipeline Documentation

## Overview

The WinMix TipsterHub training pipeline provides a robust, reproducible, and version-controlled approach to training machine learning models for football match prediction.

## Key Features

### 1. Reproducibility
- Fixed random seed (default: 42) ensures identical results across runs
- Deterministic train/test splits using stratified sampling
- All runs with the same seed produce bit-exact identical metrics

### 2. Versioning & Non-Destructive Updates
- Timestamped model files: `models/<algorithm>_<YYYYMMDD_HHMMSS>.pkl`
- Never overwrites existing models
- Maintains complete history of all training runs

### 3. Comprehensive Metrics
Every training run calculates:
- **Accuracy**: Overall correctness
- **Precision**: Ratio of correctly predicted positives
- **Recall**: Ratio of actual positives identified
- **F1-Score**: Harmonic mean of precision and recall

### 4. Registry Management
`models/model_registry.json` tracks every model with:
- **id**: Unique UUID for traceability
- **timestamp**: ISO 8601 formatted timestamp
- **metrics**: All calculated performance scores
- **parameters**: Exact hyperparameters used
- **model_path**: Path to serialized model file
- **status**: Model status (default: "candidate")
- **random_seed**: Seed used for this training run
- **features**: List of input features used
- **target**: Target column name

### 5. Error Handling
- **Missing Features**: Clear error messages when CSV lacks required columns
- **File Validation**: Checks for empty or missing datasets
- **Config Validation**: Validates YAML configuration format
- **Registry Recovery**: Handles corrupted registry files gracefully

### 6. CLI Flexibility
```bash
# Standard training
python train_model.py

# Custom data location
python train_model.py --data-path data/custom.csv

# Custom configuration
python train_model.py --config model_config_custom.yaml

# Test without saving
python train_model.py --dry-run

# Custom random seed
python train_model.py --random-seed 123
```

## File Structure

```
project/
├── train_model.py              # Main training script
├── requirements.txt            # Pinned Python dependencies
├── model_config.yaml           # Model configuration (LogisticRegression)
├── model_config_tree.yaml      # Alternative config (DecisionTree)
├── test_reproducibility.py    # Reproducibility verification test
├── data/
│   └── training_dataset.csv    # Sample training data
└── models/
    ├── model_registry.json     # Training history and metadata
    └── *.pkl                   # Serialized trained models (gitignored)
```

## Configuration Format

```yaml
model_type: LogisticRegression  # or DecisionTree
target_column: fulltime_result

input_features:
  - home_goals_avg
  - away_goals_avg
  - home_form
  - away_form
  - head_to_head
  - possession_avg
  - shots_on_target_avg
  - corner_kicks_avg

hyperparameters:
  max_iter: 1000
  random_state: 42
  solver: lbfgs
  C: 1.0
```

## Dataset Requirements

The training dataset CSV must contain:
1. All columns listed in `input_features`
2. The column specified in `target_column`

Example format:
```csv
home_goals_avg,away_goals_avg,home_form,away_form,head_to_head,possession_avg,shots_on_target_avg,corner_kicks_avg,fulltime_result
2.1,1.3,0.75,0.45,0.6,58.5,5.2,6.3,home
1.5,1.8,0.55,0.65,0.4,48.2,4.1,5.1,away
```

## Supported Model Types

### LogisticRegression
Suitable for multi-class classification with linear decision boundaries.

Common hyperparameters:
- `max_iter`: Maximum iterations for convergence
- `solver`: Optimization algorithm (lbfgs, saga, etc.)
- `C`: Inverse regularization strength
- `random_state`: Random seed

### DecisionTree
Tree-based model suitable for non-linear patterns.

Common hyperparameters:
- `max_depth`: Maximum tree depth
- `min_samples_split`: Minimum samples to split node
- `random_state`: Random seed

## Workflow Example

```bash
# 1. Setup virtual environment
python3 -m venv venv
source venv/bin/activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Verify data
head data/training_dataset.csv

# 4. Test with dry run
python train_model.py --dry-run

# 5. Train and save
python train_model.py

# 6. Verify model was created
ls -lh models/

# 7. Check registry
cat models/model_registry.json
```

## Testing Reproducibility

Run the included test to verify identical results:
```bash
python test_reproducibility.py
```

Expected output:
```
✅ SUCCESS: Metrics are identical - reproducibility verified!
```

## Registry Entry Example

```json
{
  "id": "56b92dd4-3c2b-4b24-a93b-5999e12719b2",
  "timestamp": "2025-11-20T11:31:15.543534",
  "model_type": "LogisticRegression",
  "metrics": {
    "accuracy": 1.0,
    "precision": 1.0,
    "recall": 1.0,
    "f1_score": 1.0
  },
  "parameters": {
    "max_iter": 1000,
    "random_state": 42,
    "solver": "lbfgs",
    "C": 1.0
  },
  "model_path": "models/LogisticRegression_20251120_113115.pkl",
  "status": "candidate",
  "random_seed": 42,
  "features": [
    "home_goals_avg",
    "away_goals_avg",
    "home_form",
    "away_form",
    "head_to_head",
    "possession_avg",
    "shots_on_target_avg",
    "corner_kicks_avg"
  ],
  "target": "fulltime_result"
}
```

## Troubleshooting

### Import Errors
```bash
# Make sure dependencies are installed
pip install -r requirements.txt
```

### Missing Columns Error
```
✗ Missing required columns in dataset: home_form, away_form
Expected columns: home_goals_avg, away_goals_avg, home_form, ...
Found columns: home_goals_avg, away_goals_avg
```
**Solution**: Add missing columns to your CSV or update `model_config.yaml`

### File Not Found
```
✗ Dataset file not found: data/training_dataset.csv
```
**Solution**: Create the file or use `--data-path` to specify location

### Registry Corruption
The script automatically recovers from corrupted registry files by creating a new one.

## Best Practices

1. **Always use dry-run first** when testing new configurations
2. **Document your experiments** by tracking the UUID of each training run
3. **Use meaningful random seeds** for different experiment groups
4. **Version control your configs** (model_config.yaml files)
5. **Keep training data immutable** - create new files for different datasets
6. **Promote models carefully** - change status from "candidate" to "active" only after validation

## Integration with TipsterHub

Models trained with this pipeline can be loaded and used for predictions:

```python
import joblib
import pandas as pd

# Load a trained model
model = joblib.load('models/LogisticRegression_20251120_113115.pkl')

# Make predictions
features = pd.DataFrame({
    'home_goals_avg': [2.1],
    'away_goals_avg': [1.3],
    'home_form': [0.75],
    'away_form': [0.45],
    'head_to_head': [0.6],
    'possession_avg': [58.5],
    'shots_on_target_avg': [5.2],
    'corner_kicks_avg': [6.3]
})

prediction = model.predict(features)
print(f"Predicted outcome: {prediction[0]}")
```

## Future Enhancements

Potential improvements for future versions:
- Model comparison dashboard
- Automated model selection based on metrics
- Cross-validation support
- Hyperparameter tuning automation
- Model ensemble capabilities
- A/B testing framework
- Production deployment automation
