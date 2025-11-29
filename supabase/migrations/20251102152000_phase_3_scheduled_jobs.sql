-- Phase 3: Scheduled jobs infrastructure

-- 1. Scheduled jobs registry
CREATE TABLE public.scheduled_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name TEXT NOT NULL UNIQUE,
  job_type TEXT NOT NULL,
  cron_schedule TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.scheduled_jobs IS 'Stores metadata for background jobs managed by the WinMix scheduler.';
COMMENT ON COLUMN public.scheduled_jobs.job_type IS 'Categorises the job: data_import, prediction, aggregation, maintenance, etc.';
COMMENT ON COLUMN public.scheduled_jobs.cron_schedule IS 'Cron expression in UTC that defines when the job should run.';
COMMENT ON COLUMN public.scheduled_jobs.config IS 'JSONB configuration payload for custom job parameters (window sizes, descriptions, etc.).';

CREATE INDEX idx_scheduled_jobs_enabled ON public.scheduled_jobs(enabled);
CREATE INDEX idx_scheduled_jobs_next_run_at ON public.scheduled_jobs(next_run_at);

-- 2. Job execution logs
CREATE TABLE public.job_execution_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.scheduled_jobs(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL,
  duration_ms INTEGER,
  records_processed INTEGER DEFAULT 0,
  error_message TEXT,
  error_stack TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.job_execution_logs IS 'Execution history for scheduled jobs including success/failure metadata.';
COMMENT ON COLUMN public.job_execution_logs.status IS 'running, success, error';

CREATE INDEX idx_job_execution_logs_job_id ON public.job_execution_logs(job_id);
CREATE INDEX idx_job_execution_logs_started_at ON public.job_execution_logs(started_at DESC);
CREATE INDEX idx_job_execution_logs_status ON public.job_execution_logs(status);

-- 3. Helper function for keeping updated_at fresh
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_touch_scheduled_jobs_updated_at
BEFORE UPDATE ON public.scheduled_jobs
FOR EACH ROW
EXECUTE FUNCTION public.touch_updated_at();

-- 4. Seed default jobs with initial schedules
INSERT INTO public.scheduled_jobs (job_name, job_type, cron_schedule, enabled, next_run_at, config)
VALUES
  (
    'fetch_upcoming_fixtures',
    'data_import',
    '0 2 * * *',
    true,
    NOW(),
    '{"description": "Frissíti a közelgő mérkőzések listáját a következő napokra", "source": "internal_seed"}'::jsonb
  ),
  (
    'run_daily_predictions',
    'prediction',
    '0 3 * * *',
    true,
    NOW(),
    '{"description": "AI predikciók futtatása a következő 24 órában kezdődő mérkőzésekre", "prediction_window_hours": 24}'::jsonb
  ),
  (
    'update_team_stats',
    'aggregation',
    '0 4 * * *',
    true,
    NOW(),
    '{"description": "Aggregálja a csapat és pattern statisztikákat naponta"}'::jsonb
  ),
  (
    'cleanup_old_logs',
    'maintenance',
    '0 1 * * 0',
    true,
    NOW(),
    '{"description": "Eltávolítja a 30 napnál régebbi job execution logokat", "retention_days": 30}'::jsonb
  );
