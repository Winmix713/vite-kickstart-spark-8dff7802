-- System health metrics table for admin health dashboard
SET search_path = public;

CREATE TABLE IF NOT EXISTS public.system_health_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  db_response_time INTEGER,
  api_response_time INTEGER,
  error_rate NUMERIC,
  active_users INTEGER,
  memory_usage INTEGER,
  cpu_usage NUMERIC,
  cache_hit_rate NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_health_metrics_timestamp ON public.system_health_metrics(timestamp DESC);

-- High-traffic prediction queries benefit from created_at index
CREATE INDEX IF NOT EXISTS idx_predictions_created_at ON public.predictions(created_at DESC);
