-- Create system_logs table for ML pipeline logging
CREATE TABLE IF NOT EXISTS public.system_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  component TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('info', 'warning', 'error')),
  message TEXT,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS system_logs_component_created_at_idx 
  ON public.system_logs(component, created_at DESC);
CREATE INDEX IF NOT EXISTS system_logs_status_idx 
  ON public.system_logs(status);

-- Enable RLS
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Service role can insert logs
CREATE POLICY "Service can insert system logs" 
  ON public.system_logs
  FOR INSERT 
  WITH CHECK (auth.role() = 'service_role');

-- Admins can view all logs
CREATE POLICY "Admins can view system logs" 
  ON public.system_logs
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_profiles.user_id = auth.uid() 
      AND user_profiles.role = 'admin'
    )
  );

-- Analysts can view all logs
CREATE POLICY "Analysts can view system logs" 
  ON public.system_logs
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_profiles.user_id = auth.uid() 
      AND user_profiles.role = 'analyst'
    )
  );

-- Service role can view all logs
CREATE POLICY "Service can view system logs" 
  ON public.system_logs
  FOR SELECT 
  USING (auth.role() = 'service_role');

COMMENT ON TABLE public.system_logs IS 'System-level logging for ML pipeline events and errors.';
COMMENT ON COLUMN public.system_logs.component IS 'Source component that generated the log (e.g., train_model, auto_reinforcement)';
COMMENT ON COLUMN public.system_logs.status IS 'Log status: info, warning, error';
COMMENT ON COLUMN public.system_logs.message IS 'Human-readable log message';
COMMENT ON COLUMN public.system_logs.details IS 'Additional structured data about the event';
