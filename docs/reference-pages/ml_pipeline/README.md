# ML Pipeline - Auto Reinforcement Loop

This module handles automatic model fine-tuning based on prediction errors. It's designed to work with the WinMix TipsterHub system for continuous model improvement.

## Quick Start

### Setup

```bash
# Install dependencies
pip install -r ml_pipeline/requirements.txt

# Set environment variables
export SUPABASE_URL="your-supabase-url"
export SUPABASE_SERVICE_KEY="your-service-key"
export LOG_LEVEL="INFO"
```

### Run Auto Reinforcement

```bash
# Run automatic daily retraining
python -m ml_pipeline.auto_reinforcement

# Or programmatically
python -c "from ml_pipeline.auto_reinforcement import run_auto_reinforcement; run_auto_reinforcement()"
```

## Module Structure

### config.py
Configuration management with sensible defaults:
- Database and storage paths
- Training hyperparameters
- Directory structure setup

### supabase_client.py
Supabase integration:
- Client initialization
- Storage operations (download/upload)
- Database operations (retraining runs, requests)

### data_loader.py
Data preparation pipeline:
- Evaluation log loading from storage
- Error filtering and sampling
- Fine-tuning dataset creation

### train_model.py
Model training CLI:
- Supports both fine-tuning and training from scratch
- Flexible hyperparameter configuration
- JSON output for integration

### auto_reinforcement.py
Main orchestration:
- Coordinates data loading, training, and result recording
- Handles both automatic and manual requests
- Error handling and logging

## Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| SUPABASE_URL | Yes | - | Supabase project URL |
| SUPABASE_SERVICE_KEY | Yes | - | Service role key |
| LOG_LEVEL | No | INFO | Logging level |
| DEBUG | No | false | Enable debug mode |

### Parameters (config.py)

| Parameter | Default | Description |
|-----------|---------|-------------|
| DEFAULT_LOOKBACK_DAYS | 7 | Days to look back for errors |
| MIN_ERROR_SAMPLES_FOR_RETRAINING | 10 | Minimum errors to trigger training |
| ERROR_CONFIDENCE_THRESHOLD | 0.7 | Only include high-confidence errors |
| DEFAULT_FINE_TUNE_EPOCHS | 5 | Training epochs |
| DEFAULT_LEARNING_RATE | 0.001 | Learning rate multiplier |

## API

### run_auto_reinforcement()

```python
def run_auto_reinforcement(
    lookback_days: int = DEFAULT_LOOKBACK_DAYS,
    source: str = "auto_daily",
    request_id: Optional[str] = None
) -> bool:
    """
    Run the auto reinforcement loop
    
    Args:
        lookback_days: Days to look back for errors
        source: Trigger source ('auto_daily', 'manual', 'decay_triggered')
        request_id: Optional request ID for manual requests
    
    Returns:
        True if successful, False otherwise
    """
```

### prepare_retraining_data()

```python
def prepare_retraining_data(
    lookback_days: int = DEFAULT_LOOKBACK_DAYS,
    confidence_threshold: float = ERROR_CONFIDENCE_THRESHOLD
) -> Tuple[Optional[str], int]:
    """
    Prepare fine-tuning dataset
    
    Returns:
        Tuple of (dataset_path, error_count)
    """
```

### train_model.py CLI

```bash
python ml_pipeline/train_model.py \
  --dataset PATH/TO/DATASET.csv \
  --config PATH/TO/CONFIG.yaml \
  --output_dir ./models/retrained \
  --fine_tune true \
  --learning_rate 0.001 \
  --epochs 5
```

**Arguments:**
- `--dataset` (required): Path to training CSV
- `--config`: Path to model config YAML (default: model_config.yaml)
- `--output_dir`: Directory for output model (default: ./models)
- `--fine_tune`: Enable fine-tuning (default: false)
- `--model_path`: Path to existing model for fine-tuning
- `--learning_rate`: Learning rate (default: 0.001)
- `--epochs`: Training epochs (default: 5)
- `--random_seed`: Random seed (default: 42)

## Testing

### Run Tests

```bash
# All tests
python -m pytest ml_pipeline/tests/ -v

# Specific test file
python -m pytest ml_pipeline/tests/test_data_loader.py -v

# With coverage
python -m pytest ml_pipeline/tests/ --cov=ml_pipeline --cov-report=html
```

### Test Coverage

- **test_data_loader.py**: Data filtering, dataset creation, file handling
- **test_train_model.py**: Model creation, training, evaluation, CLI parsing

## Database Schema

### model_retraining_runs

Tracks all retraining executions:

```sql
id UUID PRIMARY KEY
source TEXT CHECK (source IN ('auto_daily', 'manual', 'decay_triggered'))
dataset_size INTEGER
fine_tune_flag BOOLEAN
status TEXT CHECK (status IN ('pending', 'running', 'completed', 'failed'))
metrics JSONB -- { "accuracy": 0.85, "precision": 0.82, ... }
started_at TIMESTAMPTZ
completed_at TIMESTAMPTZ
log_url TEXT
error_message TEXT
triggered_by UUID
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

### model_retraining_requests

Queue for manual requests:

```sql
id UUID PRIMARY KEY
requested_by UUID
reason TEXT
priority TEXT CHECK (priority IN ('low', 'normal', 'high'))
status TEXT CHECK (status IN ('pending', 'processing', 'completed', 'cancelled'))
processed_at TIMESTAMPTZ
retraining_run_id UUID
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

## Workflow

### Automatic Daily Run

1. GitHub Actions triggers at 2:00 UTC
2. Python environment set up with dependencies
3. `auto_reinforcement.py` starts
4. Load evaluation log from Supabase Storage
5. Filter: incorrect + high confidence (>70%) + last 7 days
6. Check: minimum 10 samples
7. Create fine-tune dataset (CSV)
8. Run `train_model.py` with fine-tuning
9. Capture metrics and model path
10. Update database with results
11. Upload logs to Storage

### Manual Request Workflow

1. User triggers via Monitoring UI
2. Request created in `model_retraining_requests` table
3. `auto_reinforcement.py` detects pending request
4. Same process as automatic run
5. Request linked to run via `retraining_run_id`
6. Status updates visible in real-time in UI

## Error Handling

### Insufficient Data
- Logged as INFO level
- Run record marked as completed (no action)
- Not treated as failure

### Training Failures
- Full error message captured
- Run marked as failed
- Error logged for debugging
- No partial updates

### Missing Configuration
- Process exits with error code 1
- Clear error messages to STDERR
- Check config file path and syntax

## Logging

Structured logging with timestamps and levels:

```
2025-01-15 14:23:45,123 - auto_reinforcement - INFO - Auto Reinforcement Loop Started
2025-01-15 14:23:46,234 - data_loader - INFO - Prepared dataset with 45 error samples
2025-01-15 14:24:12,567 - train_model - INFO - Training complete
```

Log levels:
- DEBUG: Detailed execution information
- INFO: General execution flow
- WARNING: Recoverable issues
- ERROR: Failures requiring attention

## Performance

### Typical Execution Times
- Data loading: 5-10s
- Dataset creation: 2-5s
- Model training: 60-300s (depends on dataset size)
- Total: 2-10 minutes

### Resource Usage
- Memory: 100-500MB
- Disk: 10-50MB (temporary files)
- Network: 1-5MB (storage operations)

## Troubleshooting

### Common Issues

**Retraining not triggering**
- Check GitHub Actions workflow logs
- Verify Supabase credentials
- Check evaluation log exists in Storage

**Training fails**
- Check error message in `model_retraining_runs.error_message`
- Verify dataset format (required columns)
- Check model configuration is valid

**Metrics not updating**
- Verify database connection
- Check RLS policies allow service role access
- Check Supabase Storage permissions

### Debug Mode

```bash
export DEBUG=true
export LOG_LEVEL=DEBUG
python -m ml_pipeline.auto_reinforcement
```

## Integration with Web UI

### Monitoring Page

The auto reinforcement section displays:
- Latest run status (pending, running, completed, failed)
- Training metrics (accuracy, precision, recall, F1-score)
- Dataset size and timestamp
- Manual "Retrain Now" button
- Auto-refresh every 30 seconds

### Data Flow

```
Web UI ──> Supabase ──> model_retraining_runs
          ◄──────────────────────┘
         (real-time via Postgres)

Monitoring Page ──> Query latest run
                ──> Display status and metrics
                ──> Allow manual trigger
```

## Development

### Adding New Features

1. Update configuration in `config.py`
2. Add functions to appropriate module
3. Add tests in `ml_pipeline/tests/`
4. Update documentation
5. Test locally before deployment

### Code Style

- Follow PEP 8
- Type hints for all functions
- Docstrings for modules, classes, functions
- Logging for key operations

## Next Steps

1. Deploy database migrations
2. Configure GitHub Secrets:
   - SUPABASE_URL
   - SUPABASE_SERVICE_KEY
3. Test manual retraining via UI
4. Monitor first automatic run
5. Adjust hyperparameters based on results

## Related Documentation

- [Auto Reinforcement Guide](../docs/AUTO_REINFORCEMENT.md)
- [Model Training Pipeline](../TRAINING_PIPELINE.md)
- [Explainability Safeguards](../docs/EXPLAINABILITY_SAFEGUARDS.md)
