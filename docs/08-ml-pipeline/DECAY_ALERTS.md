---
title: "Prediction Decay Alerts"
description: "Automated monitoring of model prediction accuracy with decay detection and alerts"
category: "08-ml-pipeline"
language: "en"
version: "1.0.0"
last_updated: "2025-11-27"
status: "active"
tags: ["ml", "monitoring", "alerts", "decay", "accuracy"]
---

# Prediction Decay Alerts (Pontosság Csökkenés Riasztások)

## Overview

The Prediction Decay Alerts system provides automated monitoring of model prediction accuracy, detecting significant performance degradation and triggering actionable alerts for the operations team.

## Features

### 1. Daily Accuracy Tracking
- Aggregates prediction accuracy metrics daily from evaluated predictions
- Calculates rolling 3-day and 7-day accuracy windows
- Computes accuracy drop percentage to detect degradation trends
- Stores detailed breakdown by league, outcome type in JSONB payload

### 2. Decay Detection Algorithm

**Detection Threshold:**
- Drop percentage ≥ 20% triggers an alert
- Requires at least 7 days of data for accurate detection

**Severity Levels:**
- **Warning** (20-30% drop): Minor performance degradation
- **Critical** (30-40% drop): Significant performance issues
- **Severe** (≥40% drop): Critical system failure requiring immediate action

**Calculation Method:**
```typescript
drop_percentage = ((7_day_accuracy - 3_day_accuracy) / 7_day_accuracy) * 100
```

### 3. Alert Lifecycle

**Status Flow:**
1. **Pending** - Initial state when decay is detected
2. **Acknowledged** - Team has viewed the alert
3. **Auto Retrain Triggered** - Automatic model retraining initiated
4. **Overridden** - Alert dismissed with reason

### 4. Monitoring UI

The Prediction Decay Card shows:
- 7-day average accuracy
- 3-day recent accuracy (with trend indicator)
- Performance drop percentage
- Alert severity with color coding
- Action buttons (Auto Retrain / Override)

**Color Coding:**
- 🔴 Red border: Severe (≥40% drop)
- 🟠 Orange border: Critical (30-40% drop)
- 🟡 Yellow border: Warning (20-30% drop)
- 🟢 Green: No alerts (healthy state)

## Database Schema

### prediction_accuracy_daily
```sql
CREATE TABLE public.prediction_accuracy_daily (
  id UUID PRIMARY KEY,
  date DATE UNIQUE NOT NULL,
  total_predictions INTEGER NOT NULL,
  correct_predictions INTEGER NOT NULL,
  accuracy_pct NUMERIC(5,2) NOT NULL,
  rolling_3day_accuracy NUMERIC(5,2),
  rolling_7day_accuracy NUMERIC(5,2),
  accuracy_drop_pct NUMERIC(5,2),
  raw_payload JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

### prediction_decay_events
```sql
CREATE TABLE public.prediction_decay_events (
  id UUID PRIMARY KEY,
  window_start DATE NOT NULL,
  window_end DATE NOT NULL,
  three_day_accuracy NUMERIC(5,2) NOT NULL,
  seven_day_avg_accuracy NUMERIC(5,2) NOT NULL,
  drop_percentage NUMERIC(5,2) NOT NULL,
  severity TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  action_taken TEXT,
  override_reason TEXT,
  triggered_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ
);
```

## Edge Function: model-decay-monitor

**Schedule:** Daily at 3:00 AM UTC

**Process:**
1. Fetches evaluated predictions from last 30 days
2. Aggregates by date (total predictions, correct predictions)
3. Calculates rolling windows for each date
4. Upserts daily statistics
5. Checks for decay (≥20% drop)
6. Creates alert if threshold exceeded

## User Actions

### Auto Retrain
1. Updates event status to `auto_retrain_triggered`
2. Records action timestamp
3. Triggers model retraining

### Override Alert
1. Opens dialog for reason input
2. Updates event status to `overridden`
3. Records user ID and timestamp

## Related Documentation

- [Auto Reinforcement](./AUTO_REINFORCEMENT.md)
- [Model Lifecycle](./MODEL_LIFECYCLE.md)
- [Analytics Features](./ANALYTICS_FEATURES.md)
