# Confidence Analytics & Retrain Implementation

## Overview

This implementation combines analytics improvements with automatic retrain suggestions to provide a comprehensive monitoring and model maintenance system.

## Implementation Details

### 1. Analytics API Improvements

**File: `supabase/functions/admin-model-analytics/index.ts`**
- ✅ Updated to query correct columns: `confidence_score`, `predicted_outcome`, `actual_outcome`
- ✅ Added optional `window_days` parameter (default 7)
- ✅ Filters by `created_at >= now() - interval 'window_days days'`
- ✅ Computes accuracy & avg confidence and includes both in `timeSeriesData`
- ✅ Added input validation with 403 responses for unauthorized users
- ✅ Maintains backward compatibility (works without `window_days`)

### 2. PredictionConfidenceChart UI Component

**File: `src/components/admin/model-status/PredictionConfidenceChart.tsx`**
- ✅ Dual Y-axis chart using Recharts (accuracy % and avg confidence)
- ✅ Filter buttons for 7 & 30 days with refetch functionality
- ✅ Skeleton loaders and spinners during loading
- ✅ Footer stats showing selected range metrics
- ✅ Real-time auto-refresh every 60 seconds
- ✅ Error handling and empty states

**Features:**
- Interactive time window selection (7/30 days)
- Responsive design with mobile support
- Real-time data updates
- System status badges
- Detailed tooltips with formatted percentages

### 3. Retrain Suggestion Backend

**Database Migration: `supabase/migrations/20260101003000_retrain_suggestion_log.sql`**
```sql
CREATE TABLE public.retrain_suggestion_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  window_days INTEGER NOT NULL DEFAULT 7,
  accuracy NUMERIC(5,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'dismissed')),
  suggested_at TIMESTAMPTZ DEFAULT NOW(),
  acknowledged_at TIMESTAMPTZ,
  retraining_run_id UUID REFERENCES public.model_retraining_runs(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Features:**
- RLS policies for secure data access
- Admins can select/update, service role can insert/update
- Performance indexes on status, suggested_at, and accuracy
- Automatic timestamp updates via trigger

**System Logs Migration: `supabase/migrations/20260101003100_system_logs.sql`**
```sql
CREATE TABLE public.system_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level TEXT NOT NULL CHECK (level IN ('debug', 'info', 'warning', 'error', 'critical')),
  message TEXT NOT NULL,
  context JSONB DEFAULT '{}'::jsonb,
  source TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4. Edge Functions

**Retrain Suggestion Check: `supabase/functions/retrain-suggestion-check/index.ts`**
- ✅ Computes last-7-day accuracy from `predictions` table
- ✅ Inserts suggestion when accuracy < 70% and no pending suggestion exists
- ✅ Logs to `system_logs` for traceability
- ✅ Requires minimum 10 predictions for meaningful analysis
- ✅ Service role authentication for cron safety

**Retrain Suggestion Action: `supabase/functions/retrain-suggestion-action/index.ts`**
- ✅ POST handler for admins to accept/dismiss suggestions
- ✅ Updates `retrain_suggestion_log` status
- ✅ Inserts into `model_retraining_requests` when accepted
- ✅ Triggers `admin-model-trigger-training` workflow
- ✅ Logs to `admin_audit_log` for audit trail

### 5. Cron Job Configuration

**File: `supabase/config.toml`**
```toml
[cron.retrain-suggestion-check]
schedule = "0 * * * *"  # Run every hour at minute 0
method = "POST"
```

### 6. Admin UI Integration

**File: `src/pages/MonitoringPage.tsx`**
- ✅ Added `useLatestRetrainSuggestion` query hook
- ✅ Added `retrainSuggestionActionMutation` for handling actions
- ✅ Badge showing "Retrain javasolt" when status=`pending`
- ✅ Alert with accuracy details and Hungarian buttons:
  - "Elfogadom" (Accept) - enqueues retraining request
  - "Elutasítom" (Dismiss) - marks suggestion as dismissed
- ✅ Real-time auto-refresh every 30 seconds
- ✅ Integration with existing auto-reinforcement section

**File: `src/components/admin/model-status/AnalyticsPanel.tsx`**
- ✅ Added `PredictionConfidenceChart` import and integration
- ✅ Positioned at top of analytics section for visibility

## Acceptance Criteria Met

### ✅ Analytics Tab Enhancements
- [x] 7/30 day toggle functionality
- [x] Combined confidence/accuracy chart with dual Y axes
- [x] Correct averages displayed (verified against sample data)
- [x] Real-time refresh with loading states

### ✅ Backend Implementation
- [x] Cron job inserts `retrain_suggestion_log` rows when accuracy < 70%
- [x] Viewable in Supabase with proper RLS
- [x] Writes to `system_logs` for traceability
- [x] Minimum 10 predictions requirement prevents false positives

### ✅ Admin UI Features
- [x] Badge displays when pending suggestion exists
- [x] "Elfogadom" button accepts suggestion and enqueues retraining
- [x] Creates entry in `model_retraining_requests` (visible in auto-reinforcement)
- [x] Records action in `admin_audit_log`
- [x] Real-time updates after action completion

### ✅ Backward Compatibility
- [x] Existing analytics consumers continue working
- [x] `admin-model-analytics` function works without `window_days` parameter
- [x] No breaking changes to existing APIs

## Technical Architecture

### Data Flow
1. **Cron Job** (hourly) → `retrain-suggestion-check`
2. **Check Function** → Calculates 7-day accuracy → If < 70% → Creates suggestion
3. **UI Polling** → `useLatestRetrainSuggestion` → Shows badge
4. **Admin Action** → `retrain-suggestion-action` → Updates status + Triggers training
5. **Audit Trail** → `admin_audit_log` + `system_logs` → Complete traceability

### Security Model
- **RLS Policies**: Admin-only access to suggestions, service-only cron access
- **Authentication**: JWT verification for all admin functions
- **Authorization**: Role-based access control (admin/analyst vs service)
- **Audit Logging**: Complete action tracking with IP addresses

### Performance Considerations
- **Indexing**: Optimized queries on status, dates, and accuracy
- **Caching**: React Query with 30-60 second refresh intervals
- **Batching**: Efficient bulk operations for logging
- **Pagination**: Limited result sets for responsive UI

## Usage Instructions

### For Administrators
1. **Monitor Analytics**: Visit Monitoring page → Analytics tab
2. **Check Suggestions**: Look for "Retrain javasolt" badge
3. **Accept Suggestion**: Click "Elfogadom" to trigger retraining
4. **Dismiss Suggestion**: Click "Elutasítom" if not needed
5. **Track Progress**: Monitor auto-reinforcement section for training status

### For Developers
1. **Custom Windows**: Modify `window_days` parameter in API calls
2. **Adjust Thresholds**: Update 70% accuracy threshold in Edge Functions
3. **Extend Logging**: Add new log levels to `system_logs` table
4. **Custom UI**: Modify `PredictionConfidenceChart` component

## File Structure

```
supabase/
├── migrations/
│   ├── 20260101003000_retrain_suggestion_log.sql
│   └── 20260101003100_system_logs.sql
├── functions/
│   ├── admin-model-analytics/index.ts (updated)
│   ├── retrain-suggestion-check/index.ts (new)
│   └── retrain-suggestion-action/index.ts (new)
└── config.toml (updated)

src/
├── components/admin/model-status/
│   ├── PredictionConfidenceChart.tsx (new)
│   └── AnalyticsPanel.tsx (updated)
├── pages/
│   └── MonitoringPage.tsx (updated)
└── integrations/admin-model-status/
    └── service.ts (updated)
```

## Testing

Run the verification script:
```bash
python test_confidence_analytics_implementation.py
```

This validates:
- ✅ All required files exist
- ✅ Function signatures and imports are correct
- ✅ Database migrations are complete
- ✅ UI components are properly integrated
- ✅ Configuration is updated

## Deployment Notes

1. **Database**: Run migrations in order:
   - `20260101003000_retrain_suggestion_log.sql`
   - `20260101003100_system_logs.sql`

2. **Edge Functions**: Deploy to Supabase:
   - `retrain-suggestion-check`
   - `retrain-suggestion-action`

3. **Cron Job**: Configure in Supabase dashboard or via config.toml

4. **Frontend**: Deploy updated React components

5. **Environment**: Ensure required environment variables:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

## Monitoring & Maintenance

### Health Checks
- Monitor `system_logs` for errors in suggestion creation
- Check `admin_audit_log` for admin actions
- Verify cron job execution hourly
- Track suggestion acceptance rates

### Performance Metrics
- Query response times for analytics functions
- UI refresh frequency optimization
- Database query performance with indexes
- Memory usage in real-time updates

### Troubleshooting
- **Missing Suggestions**: Check cron job status and `system_logs`
- **Permission Errors**: Verify RLS policies and user roles
- **UI Not Updating**: Check React Query cache and network requests
- **Training Not Triggered**: Verify `admin-model-trigger-training` function

This implementation provides a complete, production-ready solution for confidence analytics and automatic retrain suggestions with full admin controls and audit trails.