-- Create model_override_log table to capture manual promotion overrides
CREATE TABLE IF NOT EXISTS public.model_override_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id UUID REFERENCES public.model_registry(id) ON DELETE SET NULL,
  previous_state JSONB NOT NULL,
  new_state JSONB NOT NULL,
  reason TEXT,
  triggered_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS model_override_log_model_id_idx ON public.model_override_log(model_id);
CREATE INDEX IF NOT EXISTS model_override_log_created_at_idx ON public.model_override_log(created_at DESC);

ALTER TABLE public.model_override_log ENABLE ROW LEVEL SECURITY;

-- Service role policies
CREATE POLICY "Service can insert model override log"
  ON public.model_override_log
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service can view model override log"
  ON public.model_override_log
  FOR SELECT
  USING (auth.role() = 'service_role');

-- Admin policies
CREATE POLICY "Admins can insert model override log"
  ON public.model_override_log
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.user_id = auth.uid()
        AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can view model override log"
  ON public.model_override_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.user_id = auth.uid()
        AND user_profiles.role = 'admin'
    )
  );

COMMENT ON TABLE public.model_override_log IS 'Audit log capturing manual model promotion overrides triggered from the admin dashboard.';
COMMENT ON COLUMN public.model_override_log.previous_state IS 'JSON snapshot of the model row before promotion.';
COMMENT ON COLUMN public.model_override_log.new_state IS 'JSON snapshot of the model row after promotion.';
COMMENT ON COLUMN public.model_override_log.reason IS 'Optional human readable reason for the override.';
COMMENT ON COLUMN public.model_override_log.triggered_by IS 'User ID of the admin who initiated the promotion.';
