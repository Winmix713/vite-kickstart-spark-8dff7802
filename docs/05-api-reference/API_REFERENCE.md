# API Reference – Supabase Edge Functions

Last updated: 2025-11

This document lists the public Edge Functions relevant to analytics widgets and various system operations. All endpoints support CORS and accept either JSON bodies (POST) or URL query params (GET). Authentication requirements vary; read the notes for each endpoint.

Base: Supabase Edge Functions
- Local: http://localhost:54321/functions/v1/<name>
- Production: https://<project-id>.supabase.co/functions/v1/<name>

---

## Admin Functions

### admin-import-env

- Method: POST
- Auth: Bearer token ({{ env.SUPABASE_ANON_KEY }})
- Body:
  - `env_vars`: object (Environment variables to import)

### admin-import-matches-csv

- Method: POST
- Auth: Bearer token ({{ env.SUPABASE_ANON_KEY }})
- Body:
  - `csv_data`: string (CSV data of matches)

### admin-model-analytics

- Method: GET
- Auth: Bearer token ({{ env.SUPABASE_ANON_KEY }})

### admin-model-promote

- Method: POST
- Auth: Bearer token ({{ env.SUPABASE_ANON_KEY }})
- Body:
  - `model_id`: string (ID of the model to promote)

### admin-model-system-status

- Method: GET
- Auth: Bearer token ({{ env.SUPABASE_ANON_KEY }})

### admin-model-trigger-training

- Method: POST
- Auth: Bearer token ({{ env.SUPABASE_ANON_KEY }})
- Body:
  - `training_params`: object (Parameters for model training)

### admin-prediction-review

- Method: POST
- Auth: Bearer token ({{ env.SUPABASE_ANON_KEY }})
- Body:
  - `review_data`: object (Data for prediction review)

---

## AI Functions

### ai-chat

- Method: POST
- Auth: Bearer token ({{ env.SUPABASE_ANON_KEY }})
- Body:
  - `message`: string (Chat message)

---

## Cross-League Functions

### cross-league-analyze

- Method: POST
- Auth: Bearer token ({{ env.SUPABASE_ANON_KEY }})
- Body:
  - `analysis_params`: object (Parameters for cross-league analysis)

### cross-league-correlations

- Method: GET
- Auth: Bearer token ({{ env.SUPABASE_ANON_KEY }})

---

## Jobs Functions

### jobs-create

- Method: POST
- Auth: Bearer token ({{ env.SUPABASE_ANON_KEY }})
- Body:
  - `job_details`: object (Details for the job to create)

### jobs-delete

- Method: POST
- Auth: Bearer token ({{ env.SUPABASE_ANON_KEY }})
- Body:
  - `job_id`: string (ID of the job to delete)

### jobs-list

- Method: GET
- Auth: Bearer token ({{ env.SUPABASE_ANON_KEY }})

### jobs-logs

- Method: GET
- Auth: Bearer token ({{ env.SUPABASE_ANON_KEY }})
- Body:
  - `job_id`: string (ID of the job to get logs for)

### jobs-scheduler

- Method: POST
- Auth: Bearer token ({{ env.SUPABASE_ANON_KEY }})
- Body:
  - `scheduler_config`: object (Scheduler configuration)

### jobs-toggle

- Method: POST
- Auth: Bearer token ({{ env.SUPABASE_ANON_KEY }})
- Body:
  - `job_id`: string (ID of the job to toggle)
  - `enabled`: boolean (Whether to enable or disable the job)

### jobs-trigger

- Method: POST
- Auth: Bearer token ({{ env.SUPABASE_ANON_KEY }})
- Body:
  - `job_id`: string (ID of the job to trigger)

### jobs-update

- Method: POST
- Auth: Bearer token ({{ env.SUPABASE_ANON_KEY }})
- Body:
  - `job_id`: string (ID of the job to update)
  - `update_details`: object (Details to update for the job)

---

## ML Functions

### analyze-match

- Method: POST
- Auth: Bearer token ({{ env.SUPABASE_ANON_KEY }})
- Body:
  - `match_data`: object (Match data to analyze)

### get-predictions

- Method: POST
- Auth: Bearer token ({{ env.SUPABASE_ANON_KEY }})
- Body:
  - `prediction_request`: object (Request parameters for predictions)

### meta-patterns-apply

- Method: POST
- Auth: Bearer token ({{ env.SUPABASE_ANON_KEY }})
- Body:
  - `pattern_data`: object (Pattern data to apply)

### meta-patterns-discover

- Method: POST
- Auth: Bearer token ({{ env.SUPABASE_ANON_KEY }})
- Body:
  - `discovery_params`: object (Parameters for meta pattern discovery)

### models-auto-prune

- Method: POST
- Auth: Bearer token ({{ env.SUPABASE_ANON_KEY }})

### models-compare

- Method: POST
- Auth: Bearer token ({{ env.SUPABASE_ANON_KEY }})
- Body:
  - `model_ids`: array of strings (IDs of models to compare)

### models-performance

- Method: GET
- Auth: Bearer token ({{ env.SUPABASE_ANON_KEY }})
- Body:
  - `model_id`: string (ID of the model to get performance for)

### patterns-detect

- Method: POST
- Auth: Bearer token ({{ env.SUPABASE_ANON_KEY }})
- Body:
  - `detection_params`: object (Parameters for pattern detection)

### patterns-team

- Method: GET
- Auth: Bearer token ({{ env.SUPABASE_ANON_KEY }})
- Body:
  - `team_id`: string (ID of the team to get patterns for)

### patterns-verify

- Method: POST
- Auth: Bearer token ({{ env.SUPABASE_ANON_KEY }})
- Body:
  - `verification_data`: object (Data for pattern verification)

### predictions-track

- Method: POST
- Auth: Bearer token ({{ env.SUPABASE_ANON_KEY }})
- Body:
  - `prediction_data`: object (Prediction data to track)

### predictions-update-results

- Method: POST
- Auth: Bearer token ({{ env.SUPABASE_ANON_KEY }})
- Body:
  - `results_data`: object (Results data to update predictions with)

### rare-pattern-sync

- Method: POST
- Auth: Bearer token ({{ env.SUPABASE_ANON_KEY }})
- Body:
  - `sync_data`: object (Data for rare pattern synchronization)

### reconcile-prediction-result

- Method: POST
- Auth: Bearer token ({{ env.SUPABASE_ANON_KEY }})
- Body:
  - `reconciliation_data`: object (Data for prediction result reconciliation)

### retrain-suggestion-action

- Method: POST
- Auth: Bearer token ({{ env.SUPABASE_ANON_KEY }})
- Body:
  - `action_data`: object (Action data for retraining suggestion)

### retrain-suggestion-check

- Method: GET
- Auth: Bearer token ({{ env.SUPABASE_ANON_KEY }})
- Body:
  - `check_params`: object (Parameters for retraining suggestion check)

### team-streaks

- Method: GET
- Auth: Bearer token ({{ env.SUPABASE_ANON_KEY }})
- Body:
  - `team_id`: string (ID of the team)

### team-transition-matrix

- Method: GET
- Auth: Bearer token ({{ env.SUPABASE_ANON_KEY }})
- Body:
  - `team_id`: string (ID of the team)

---

## Monitoring Functions

### model-decay-monitor

- Method: GET
- Auth: Bearer token ({{ env.SUPABASE_ANON_KEY }})

### monitoring-alerts

- Method: GET
- Auth: Bearer token ({{ env.SUPABASE_ANON_KEY }})

### monitoring-computation-graph

- Method: GET
- Auth: Bearer token ({{ env.SUPABASE_ANON_KEY }})

### monitoring-health

- Method: GET
- Auth: Bearer token ({{ env.SUPABASE_ANON_KEY }})

### monitoring-metrics

- Method: GET
- Auth: Bearer token ({{ env.SUPABASE_ANON_KEY }})

---

## Phase 9 Functions

### phase9-collaborative-intelligence

- Method: POST
- Auth: Bearer token ({{ env.SUPABASE_ANON_KEY }})
- Body:
  - `intelligence_data`: object (Collaborative intelligence data)

### phase9-market-integration

- Method: POST
- Auth: Bearer token ({{ env.SUPABASE_ANON_KEY }})
- Body:
  - `market_data`: object (Market integration data)

### phase9-self-improving-system

- Method: POST
- Auth: Bearer token ({{ env.SUPABASE_ANON_KEY }})
- Body:
  - `system_feedback`: object (System feedback data)

### phase9-temporal-decay

- Method: POST
- Auth: Bearer token ({{ env.SUPABASE_ANON_KEY }})
- Body:
  - `decay_params`: object (Temporal decay parameters)

---

## User Functions

### submit-feedback

- Method: POST
- Auth: Bearer token ({{ env.SUPABASE_ANON_KEY }})
- Body:
  - `feedback_data`: object (User feedback data)

---

Notes
- For sensitive tables, protect endpoints using RBAC and the helpers in `_shared/auth.ts`.
- Keep service role usage read-only unless absolutely necessary.