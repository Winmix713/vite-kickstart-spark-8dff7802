-- Auto Reinforcement Loop: Model Retraining Infrastructure

-- Model retraining runs tracking
CREATE TABLE IF NOT EXISTS public.model_retraining_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL CHECK (source IN ('auto_daily', 'manual', 'decay_triggered')),
  dataset_size INTEGER NOT NULL,
  fine_tune_flag BOOLEAN NOT NULL DEFAULT true,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  metrics JSONB DEFAULT '{}', -- { "accuracy": 0.85, "precision": 0.82, "recall": 0.88 }
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  log_url TEXT,
  error_message TEXT,
  triggered_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.model_retraining_runs IS 'Tracks model retraining executions triggered by auto reinforcement loop or manual requests.';
COMMENT ON COLUMN public.model_retraining_runs.source IS 'Source of the retraining trigger: auto_daily (scheduled), manual (user requested), decay_triggered (model performance degradation).';
COMMENT ON COLUMN public.model_retraining_runs.dataset_size IS 'Number of error samples used for fine-tuning.';
COMMENT ON COLUMN public.model_retraining_runs.fine_tune_flag IS 'true for fine-tuning existing model, false for training from scratch.';
COMMENT ON COLUMN public.model_retraining_runs.metrics IS 'JSON object with training metrics: accuracy, precision, recall, f1_score, loss.';
COMMENT ON COLUMN public.model_retraining_runs.log_url IS 'URL to training logs stored in Supabase Storage.';

CREATE INDEX idx_retraining_status ON public.model_retraining_runs(status);
CREATE INDEX idx_retraining_source ON public.model_retraining_runs(source);
CREATE INDEX idx_retraining_created_at ON public.model_retraining_runs(created_at DESC);
CREATE INDEX idx_retraining_started_at ON public.model_retraining_runs(started_at DESC);
CREATE INDEX idx_retraining_triggered_by ON public.model_retraining_runs(triggered_by);

-- Model retraining requests (for manual triggering and priority queuing)
CREATE TABLE IF NOT EXISTS public.model_retraining_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requested_by UUID REFERENCES auth.users(id) NOT NULL,
  reason TEXT,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'cancelled')),
  processed_at TIMESTAMPTZ,
  retraining_run_id UUID REFERENCES public.model_retraining_runs(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.model_retraining_requests IS 'Queue for manual model retraining requests with priority handling.';
COMMENT ON COLUMN public.model_retraining_requests.reason IS 'User-provided reason for requesting retraining.';
COMMENT ON COLUMN public.model_retraining_requests.priority IS 'Priority level: low, normal, high. Higher priority requests are processed first.';
COMMENT ON COLUMN public.model_retraining_requests.retraining_run_id IS 'Link to the actual retraining run executed for this request.';

CREATE INDEX idx_requests_pending ON public.model_retraining_requests(status) WHERE status = 'pending';
CREATE INDEX idx_requests_requested_by ON public.model_retraining_requests(requested_by);
CREATE INDEX idx_requests_priority ON public.model_retraining_requests(priority);
CREATE INDEX idx_requests_created_at ON public.model_retraining_requests(created_at DESC);

-- Trigger to update updated_at on model_retraining_runs
CREATE OR REPLACE FUNCTION public.touch_model_retraining_runs_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_touch_model_retraining_runs_updated_at
BEFORE UPDATE ON public.model_retraining_runs
FOR EACH ROW
EXECUTE FUNCTION public.touch_model_retraining_runs_updated_at();

-- Trigger to update updated_at on model_retraining_requests
CREATE TRIGGER trg_touch_model_retraining_requests_updated_at
BEFORE UPDATE ON public.model_retraining_requests
FOR EACH ROW
EXECUTE FUNCTION public.touch_model_retraining_runs_updated_at();

-- Enable RLS
ALTER TABLE public.model_retraining_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.model_retraining_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for model_retraining_runs (read-only for authenticated users, insert/update for service role)
CREATE POLICY "Enable read access for authenticated users" ON public.model_retraining_runs
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for service role only" ON public.model_retraining_runs
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Enable update for service role only" ON public.model_retraining_runs
  FOR UPDATE
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- RLS Policies for model_retraining_requests (users can create requests, see their own, admins see all)
CREATE POLICY "Users can create requests" ON public.model_retraining_requests
  FOR INSERT
  WITH CHECK (auth.uid() = requested_by);

CREATE POLICY "Users can read their own requests" ON public.model_retraining_requests
  FOR SELECT
  USING (auth.uid() = requested_by OR auth.role() = 'service_role');

CREATE POLICY "Users can update their pending requests" ON public.model_retraining_requests
  FOR UPDATE
  USING (auth.uid() = requested_by AND status = 'pending')
  WITH CHECK (auth.uid() = requested_by AND status = 'pending');

-- Service role can manage all
CREATE POLICY "Service role can manage all" ON public.model_retraining_requests
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
