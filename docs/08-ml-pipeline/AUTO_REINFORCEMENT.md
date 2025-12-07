---
title: "Auto Reinforcement Loop"
description: "Automated model fine-tuning system that monitors prediction accuracy and retrains when performance degrades"
category: "08-ml-pipeline"
language: "en"
version: "1.0.0"
last_updated: "2025-11-27"
status: "active"
tags: ["ml", "retraining", "automation", "fine-tuning", "monitoring"]
---

# Auto Reinforcement Loop - Model Fine-tuning Guide

## Overview

The Auto Reinforcement Loop is an automated system that monitors prediction accuracy and automatically fine-tunes the ML model when performance degrades. This feature collects high-confidence prediction errors, creates fine-tuning datasets, and retrains the model daily.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│ Daily Schedule (GitHub Actions) / Manual Request (Web UI)      │
└────────────────────────────┬────────────────────────────────────┘
                             │
                   ┌─────────▼────────────┐
                   │ auto_reinforcement.py│
                   └─────────┬────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
┌───────▼────────┐  ┌───────▼──────┐   ┌────────▼─────────┐
│ data_loader.py │  │supabase_...py│   │ train_model.py   │
│ • Load eval log│  │ • Fetch reqs │   │ • Train model    │
│ • Filter errors│  │ • Update stat│   │ • Output metrics │
│ • Create dataset  │ • Upload logs │   └────────┬─────────┘
└────────┬────────┘  └────────┬──────┘            │
         │                    │                    │
         └────────────────────┼────────────────────┘
                              │
                    ┌─────────▼────────────┐
                    │  Supabase Database   │
                    │ • model_retraining_* │
                    │ • Model artifacts    │
                    └──────────────────────┘
```

## Features

### 1. Automatic Daily Retraining
- Runs daily at 2:00 UTC via GitHub Actions
- Evaluates prediction errors from the last 7 days
- Filters errors with confidence > 70%
- Requires minimum 10 error samples to trigger retraining

### 2. Manual Retraining Requests
- Users can manually trigger retraining from the Monitoring page
- Requests are queued and prioritized
- Support for user-provided reason/description
- Real-time status updates in UI

### 3. Comprehensive Logging
- All retraining runs stored in `model_retraining_runs` table
- Metrics captured: accuracy, precision, recall, F1-score
- Training logs uploaded to Supabase Storage
- Error tracking for failed runs

## Database Schema

### model_retraining_runs
```sql
id UUID PRIMARY KEY
source TEXT -- 'auto_daily', 'manual', 'decay_triggered'
dataset_size INTEGER -- Number of error samples
fine_tune_flag BOOLEAN -- true for fine-tuning, false for from-scratch
status TEXT -- 'pending', 'running', 'completed', 'failed'
metrics JSONB -- { "accuracy": 0.85, "precision": 0.82, ... }
started_at TIMESTAMPTZ
completed_at TIMESTAMPTZ
log_url TEXT
error_message TEXT
triggered_by UUID
```

### model_retraining_requests
```sql
id UUID PRIMARY KEY
requested_by UUID -- User who requested retraining
reason TEXT -- Optional reason/description
priority TEXT -- 'low', 'normal', 'high'
status TEXT -- 'pending', 'processing', 'completed', 'cancelled'
processed_at TIMESTAMPTZ
retraining_run_id UUID -- Link to actual run
```

## Configuration

### Environment Variables

```bash
# Required
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key

# Optional
LOG_LEVEL=INFO  # DEBUG, INFO, WARNING, ERROR
DEBUG=false
```

### Default Settings (ml_pipeline/config.py)

```python
DEFAULT_LOOKBACK_DAYS = 7              # Days to look back for errors
MIN_ERROR_SAMPLES_FOR_RETRAINING = 10  # Minimum errors to trigger retraining
ERROR_CONFIDENCE_THRESHOLD = 0.7       # Only high-confidence errors included
DEFAULT_FINE_TUNE_EPOCHS = 5           # Training epochs for fine-tuning
DEFAULT_LEARNING_RATE = 0.001          # Learning rate multiplier
```

## Local Development

### Installation

```bash
pip install -r ml_pipeline/requirements.txt
export SUPABASE_URL="your-url"
export SUPABASE_SERVICE_KEY="your-key"
```

### Running Tests

```bash
python -m pytest ml_pipeline/tests/ -v
python -m pytest ml_pipeline/tests/ --cov=ml_pipeline --cov-report=html
```

## Web UI Integration

The Auto Reinforcement section in the Monitoring page provides:
- **Latest Run Status**: Shows status badges (pending, running, completed, failed)
- **Dataset Metrics**: Number of error samples used for retraining
- **Training Metrics**: Accuracy, precision, recall, F1-score
- **Manual Retrain Button**: Trigger retraining on demand
- **Auto-refresh**: Updates every 30 seconds

## Related Documentation

- [Decay Alerts](./DECAY_ALERTS.md)
- [Model Lifecycle](./MODEL_LIFECYCLE.md)
- [Ensemble Predictor](./ENSEMBLE_PREDICTOR.md)
- [Analytics Features](./ANALYTICS_FEATURES.md)
