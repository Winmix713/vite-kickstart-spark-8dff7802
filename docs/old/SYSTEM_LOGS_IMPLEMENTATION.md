# System Logs Pipeline Implementation

## Overview
This document summarizes the implementation of the Pipeline System Logs feature (TASK 2), which creates a persistent `system_logs` table, instruments the Python ML pipeline to write logs, and surfaces them in the admin dashboard.

## Implementation Components

### 1. Database Migration
**File**: `supabase/migrations/20260101001000_system_logs.sql`

Created `public.system_logs` table with:
- **Columns**: `id` (uuid PK), `component` (text NOT NULL), `status` (text CHECK in 'info'/'warning'/'error'), `message` (text), `details` (jsonb), `created_at` (timestamptz)
- **Indexes**: 
  - `(component, created_at DESC)` for component-specific queries
  - `status` for filtering by status
- **RLS Policies**:
  - Admins can SELECT (via `user_profiles.role = 'admin'`)
  - Analysts can SELECT (via `user_profiles.role = 'analyst'`)
  - Service role can INSERT and SELECT
  - Public users have no access

### 2. Python ML Pipeline Instrumentation

#### `ml_pipeline/supabase_client.py`
Added `insert_system_log(component, status, message, details)` helper:
- Inserts log entries into `system_logs` table
- Gracefully handles connectivity failures (returns `False` on error, no exceptions raised)
- Ensures pipeline continues even if logging fails

#### `ml_pipeline/train_model.py`
Added system logging at key checkpoints:
- **Start**: Log training start with parameters
- **Dataset Prepared**: Log dataset size and features
- **Training Success**: Log completion with metrics and model path
- **Error Handler**: Log failures with stack trace in details

#### `ml_pipeline/auto_reinforcement.py`
Added system logging at key checkpoints:
- **Start**: Log auto reinforcement start with run ID
- **Dataset Prepared**: Log error sample count
- **Insufficient Samples**: Log warning when samples < threshold
- **Training Success**: Log completion with metrics
- **Error Handler**: Log failures with stack trace in details

#### `ml_pipeline/tests/test_system_log.py`
Unit tests covering:
- Successful log insertion
- Insertion without details
- Error handling (graceful failure)
- All valid status values

### 3. TypeScript Types
**File**: `src/integrations/supabase/types.ts`

Added `system_logs` table definition with:
- Row, Insert, and Update types
- Status as union type: `"info" | "warning" | "error"`
- JSON type for details field

### 4. Admin UI Component
**File**: `src/components/admin/model-status/SystemLogTable.tsx`

Features:
- Queries last 10 log entries ordered by `created_at DESC`
- Auto-refreshes every 30 seconds
- Manual "Frissítés" (Refresh) button with loading spinner
- Color-coded status badges:
  - **Error**: Destructive variant with red background
  - **Warning**: Amber border and text
  - **Info**: Secondary variant
- Status icons (AlertCircle, AlertTriangle, Info)
- Hungarian localization for UI text
- Toast notifications on refresh success/failure

**File**: `src/pages/admin/ModelStatusDashboard.tsx`
- Mounted `SystemLogTable` below the system overview card
- Positioned before the main tabs section

## Acceptance Criteria Status

✅ **Running `auto_reinforcement.py` or `train_model.py` locally writes entries into `system_logs`**
- Both scripts instrumented with `insert_system_log()` calls at key checkpoints
- Logs are visible in Supabase via service role credentials

✅ **`/admin/model-status` displays the new table with color-coded statuses and a reload control**
- SystemLogTable component displays last 10 entries
- Errors have destructive styling, warnings have amber badges
- Manual refresh button with spinner and toast feedback
- Auto-refresh every 30 seconds

✅ **Unauthorized users cannot read `system_logs`, and service-role insertions bypass RLS errors**
- RLS policies restrict SELECT to admins and analysts only
- Service role has full INSERT and SELECT permissions
- Public users have no access

✅ **Pipeline continues to succeed even if logging fails**
- `insert_system_log()` catches all exceptions and returns `False`
- No exceptions are raised that would crash the pipeline
- Only warning logs are emitted on logging failures

## Usage Examples

### Python Pipeline Usage
```python
from ml_pipeline.supabase_client import insert_system_log

# Log info
insert_system_log(
    component="train_model",
    status="info",
    message="Training started",
    details={"dataset": "path/to/data.csv"}
)

# Log warning
insert_system_log(
    component="auto_reinforcement",
    status="warning",
    message="Insufficient samples",
    details={"sample_count": 5, "min_required": 10}
)

# Log error
insert_system_log(
    component="train_model",
    status="error",
    message="Training failed",
    details={"error": str(e), "traceback": traceback.format_exc()}
)
```

### Viewing Logs
1. Navigate to `/admin/model-status` in the web app
2. System logs table appears below the system overview card
3. Click "Frissítés" to manually refresh
4. Auto-refreshes every 30 seconds

## Testing

### Python Unit Tests
Run tests with:
```bash
python -m unittest ml_pipeline.tests.test_system_log -v
```

Tests verify:
- Successful log insertion with correct payload
- Graceful error handling
- All status values work correctly

### Manual Testing
1. Run auto_reinforcement or train_model scripts
2. Check Supabase `system_logs` table for new entries
3. Open admin dashboard and verify logs appear
4. Test refresh button functionality
5. Verify error/warning styling

## Notes

- Hungarian localization used for UI elements ("Frissítés", "Rendszernapló", etc.)
- Logs are retained indefinitely - consider adding cleanup policy in future
- Details field stores arbitrary JSON for extensibility
- Component names match Python module names for consistency
