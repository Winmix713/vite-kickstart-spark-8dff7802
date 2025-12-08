-- Create retrain_suggestion_log table for tracking automatic retrain suggestions
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

-- Create indexes for performance
CREATE INDEX idx_retrain_suggestion_status ON public.retrain_suggestion_log(status);
CREATE INDEX idx_retrain_suggestion_suggested_at ON public.retrain_suggestion_log(suggested_at);
CREATE INDEX idx_retrain_suggestion_accuracy ON public.retrain_suggestion_log(accuracy);

-- Enable RLS
ALTER TABLE public.retrain_suggestion_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Admins can select all suggestions
CREATE POLICY "Admins can view all retrain suggestions" ON public.retrain_suggestion_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_profiles.user_id = auth.uid() 
      AND user_profiles.role = 'admin'
    )
  );

-- Admins can update suggestions (accept/dismiss)
CREATE POLICY "Admins can update retrain suggestions" ON public.retrain_suggestion_log
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_profiles.user_id = auth.uid() 
      AND user_profiles.role = 'admin'
    )
  );

-- Service role can insert/update pending suggestions (for cron jobs)
CREATE POLICY "Service can manage pending retrain suggestions" ON public.retrain_suggestion_log
  FOR ALL USING (
    auth.role() = 'service_role'
  ) WITH CHECK (
    auth.role() = 'service_role'
  );

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION public.update_retrain_suggestion_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_retrain_suggestion_timestamp
  BEFORE UPDATE ON public.retrain_suggestion_log
  FOR EACH ROW
  EXECUTE FUNCTION public.update_retrain_suggestion_timestamp();

-- Function to check for existing pending suggestions
CREATE OR REPLACE FUNCTION public.has_pending_retrain_suggestion()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.retrain_suggestion_log 
    WHERE status = 'pending'
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;