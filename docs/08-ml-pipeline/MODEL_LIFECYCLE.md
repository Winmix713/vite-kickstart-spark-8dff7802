---
title: "Model Lifecycle Documentation"
description: "Model registry system, JSON schema, and lifecycle management for ML models"
category: "08-ml-pipeline"
language: "en"
version: "1.0.0"
last_updated: "2025-11-27"
status: "active"
tags: ["ml", "models", "lifecycle", "registry", "versioning"]
---

# Model Lifecycle Documentation

This document explains the model registry system, JSON schema, and lifecycle management for machine learning models in this application.

## Overview

The model registry provides a centralized, type-safe way to manage model versions, metadata, and deployment status. It separates heavy binary artifacts from lightweight metadata, ensuring efficient version control and clear deployment state management.

## JSON Schema

The model registry is stored in `models/model_registry.json` and follows this schema:

### Model Registry Entry

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `id` | UUIDv4 string | Unique identifier | `"550e8400-e29b-41d4-a716-446655440000"` |
| `version` | Semantic version | Version with 'v' prefix | `"v1.0.0"` |
| `algorithm` | String | ML algorithm name | `"LogisticRegression"` |
| `metrics` | Object | Performance metrics | See Metrics Schema |
| `created_at` | ISO 8601 | Creation timestamp | `"2024-01-15T10:30:00.000Z"` |
| `status` | Enum | Deployment status | `"active"`, `"candidate"`, `"archived"` |
| `file_path` | String | Path to model file | `"models/v1_champion.pkl"` |

### Metrics Schema

| Field | Type | Range | Description |
|-------|------|-------|-------------|
| `accuracy` | Float | 0.0 - 1.0 | Model accuracy score |
| `f1_score` | Float | 0.0 - 1.0 | F1 score |
| `precision` | Float | 0.0 - 1.0 | Precision score |
| `recall` | Float | 0.0 - 1.0 | Recall score |

## Model Lifecycle States

### 1. `candidate` 🔄
New models that have been trained and evaluated but not yet promoted to production.

**Transition**: Promoted to `active` after meeting performance criteria.

### 2. `active` ✅
The current production model serving live traffic. Only one model should typically be in this state.

**Transition**: Demoted to `archived` when replaced by a better model.

### 3. `archived` 📦
Previous production models kept for historical reference or rollback purposes.

## Lifecycle Flow

```
    Training Complete
            ↓
     [candidate] ←───┐
            ↓        │
    Performance &   │
    Business Review  │
            ↓        │
        [active] ────┘
            ↓
    Model Replaced
            ↓
      [archived]
```

## Type-Safe Access

The application provides a type-safe access layer through `src/lib/model-registry.ts`:

### Key Functions

- `getAllModels()`: Returns all model entries
- `getActiveModel()`: Returns the current active model
- `getModelsByStatus(status)`: Filters models by status
- `getModelById(id)`: Retrieves a specific model by UUID

### Validation

All registry access uses Zod schema validation to ensure data integrity.

## File Management

### Binary Artifacts
- **Location**: `/models/` directory
- **Formats**: `.pkl`, `.joblib`, `.h5` (ignored by git)
- **Naming**: Use semantic versioning (e.g., `v1_champion.pkl`)

### Metadata
- **Registry**: `models/model_registry.json` (tracked in git)
- **Logs**: `*.csv` files (tracked in git)
- **Config**: `*.yaml` files (tracked in git)

## Manual Registry Management

### Adding a New Model

```json
{
  "id": "generated-uuid-v4",
  "version": "v1.3.0",
  "algorithm": "YourAlgorithm",
  "metrics": {
    "accuracy": 0.92,
    "f1_score": 0.90,
    "precision": 0.93,
    "recall": 0.87
  },
  "created_at": "2024-01-30T12:00:00.000Z",
  "status": "candidate",
  "file_path": "models/v1_3_candidate.pkl"
}
```

### Rollback Procedure

1. Update current `active` model status to `candidate` or `archived`
2. Update previous `archived` model status to `active`
3. Update application configuration if needed
4. Commit the changes

## Best Practices

1. **UUID Generation**: Use proper UUID v4 generator
2. **Semantic Versioning**: Follow `v{major}.{minor}.{patch}` format
3. **Timestamps**: Always use UTC timestamps in ISO 8601 format
4. **Performance Tracking**: Record all relevant metrics
5. **Atomic Updates**: Make status changes as single commits
6. **Backup Strategy**: Regular backups recommended

## Related Documentation

- [Ensemble Predictor](./ENSEMBLE_PREDICTOR.md)
- [Auto Reinforcement](./AUTO_REINFORCEMENT.md)
- [Configuration Reference](./CONFIGURATION_REFERENCE.md)
- [Analytics Features](./ANALYTICS_FEATURES.md)
