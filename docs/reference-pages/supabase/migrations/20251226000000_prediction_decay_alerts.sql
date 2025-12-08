-- Prediction Decay Alerts: Model accuracy monitoring and alerting system
-- Tracks daily prediction accuracy and detects significant performance degradation

-- 1. Daily accuracy tracking table
CREATE TABLE IF NOT EXISTS public.prediction_accuracy_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE UNIQUE NOT NULL,
  total_predictions INTEGER NOT NULL,
  correct_predictions INTEGER NOT NULL,
  accuracy_pct NUMERIC(5,2) NOT NULL,
  rolling_3day_accuracy NUMERIC(5,2),
  rolling_7day_accuracy NUMERIC(5,2),
  accuracy_drop_pct NUMERIC(5,2), -- 7-day vs 3-day percentage drop
  raw_payload JSONB, -- Detailed breakdown by outcome, league, etc.
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.prediction_accuracy_daily IS 'Daily aggregated prediction accuracy metrics with rolling averages';
COMMENT ON COLUMN public.prediction_accuracy_daily.accuracy_drop_pct IS 'Percentage drop from 7-day average to 3-day recent accuracy';
COMMENT ON COLUMN public.prediction_accuracy_daily.raw_payload IS 'JSONB payload with detailed breakdown by league, outcome type, etc.';

-- 2. Decay events tracking table
CREATE TABLE IF NOT EXISTS public.prediction_decay_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  window_start DATE NOT NULL,
  window_end DATE NOT NULL,
  three_day_accuracy NUMERIC(5,2) NOT NULL,
  seven_day_avg_accuracy NUMERIC(5,2) NOT NULL,
  drop_percentage NUMERIC(5,2) NOT NULL CHECK (drop_percentage > 0),
  severity TEXT NOT NULL CHECK (severity IN ('warning', 'critical', 'severe')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'acknowledged', 'auto_retrain_triggered', 'overridden')),
  action_taken TEXT, -- "Auto retrain queued at 2025-11-20 10:30"
  override_reason TEXT,
  overridden_by UUID REFERENCES auth.users(id),
  triggered_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

COMMENT ON TABLE public.prediction_decay_events IS 'Records significant accuracy decay events requiring attention';
COMMENT ON COLUMN public.prediction_decay_events.severity IS 'warning: 20-30% drop, critical: 30-40% drop, severe: 40%+ drop';
COMMENT ON COLUMN public.prediction_decay_events.status IS 'Lifecycle: pending -> acknowledged/auto_retrain_triggered/overridden';

-- 3. Create indexes for performance
CREATE INDEX idx_daily_accuracy_date ON public.prediction_accuracy_daily(date DESC);
CREATE INDEX idx_daily_accuracy_recent ON public.prediction_accuracy_daily(date DESC) 
  WHERE rolling_3day_accuracy IS NOT NULL;

CREATE INDEX idx_decay_events_status ON public.prediction_decay_events(status) 
  WHERE status = 'pending';
CREATE INDEX idx_decay_events_triggered_at ON public.prediction_decay_events(triggered_at DESC);
CREATE INDEX idx_decay_events_severity ON public.prediction_decay_events(severity);

-- 4. Helper function to calculate severity based on drop percentage
CREATE OR REPLACE FUNCTION public.calculate_decay_severity(drop_pct NUMERIC)
RETURNS TEXT AS $$
BEGIN
  RETURN CASE
    WHEN drop_pct >= 40 THEN 'severe'
    WHEN drop_pct >= 30 THEN 'critical'
    WHEN drop_pct >= 20 THEN 'warning'
    ELSE 'warning'
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 5. Trigger to auto-update updated_at on prediction_accuracy_daily
CREATE TRIGGER trg_touch_daily_accuracy_updated_at
BEFORE UPDATE ON public.prediction_accuracy_daily
FOR EACH ROW
EXECUTE FUNCTION public.touch_updated_at();

-- 6. Row Level Security (RLS) Policies
ALTER TABLE public.prediction_accuracy_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prediction_decay_events ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read accuracy data
CREATE POLICY "Authenticated users can read daily accuracy"
  ON public.prediction_accuracy_daily
  FOR SELECT
  TO authenticated
  USING (true);

-- Service role can insert/update daily accuracy (for edge function)
CREATE POLICY "Service role can insert daily accuracy"
  ON public.prediction_accuracy_daily
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can update daily accuracy"
  ON public.prediction_accuracy_daily
  FOR UPDATE
  TO service_role
  USING (true);

-- Authenticated users can read decay events
CREATE POLICY "Authenticated users can read decay events"
  ON public.prediction_decay_events
  FOR SELECT
  TO authenticated
  USING (true);

-- Service role can insert decay events (for edge function)
CREATE POLICY "Service role can insert decay events"
  ON public.prediction_decay_events
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Authenticated users can update decay events (for acknowledging/overriding)
CREATE POLICY "Authenticated users can update decay events"
  ON public.prediction_decay_events
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 7. View for active decay alerts
CREATE OR REPLACE VIEW public.active_decay_alerts AS
SELECT 
  id,
  window_start,
  window_end,
  three_day_accuracy,
  seven_day_avg_accuracy,
  drop_percentage,
  severity,
  status,
  triggered_at,
  EXTRACT(EPOCH FROM (NOW() - triggered_at)) / 3600 AS hours_pending
FROM public.prediction_decay_events
WHERE status = 'pending'
ORDER BY triggered_at DESC;

COMMENT ON VIEW public.active_decay_alerts IS 'Quick view of pending decay alerts requiring action';
