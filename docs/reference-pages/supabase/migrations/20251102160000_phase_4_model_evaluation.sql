-- Phase 4: Feedback Loop & Model Evaluation

-- 1) Extend predictions with CSS, prediction factors and calibration
ALTER TABLE public.predictions
  ADD COLUMN IF NOT EXISTS css_score DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS prediction_factors JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS calibration_error DECIMAL(6,4);

COMMENT ON COLUMN public.predictions.css_score IS 'Confidence Score System value (0-100) at prediction time';
COMMENT ON COLUMN public.predictions.prediction_factors IS 'JSONB payload describing factors contributing to the prediction (patterns, form, league, etc.)';
COMMENT ON COLUMN public.predictions.calibration_error IS '|p - y| where p is css_score/confidence in [0,1] and y is outcome (1 if correct)';

-- 2) Aggregated model performance table
CREATE TABLE IF NOT EXISTS public.model_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_version TEXT NOT NULL,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  total_predictions INTEGER NOT NULL DEFAULT 0,
  accuracy_overall DECIMAL(5,2),
  accuracy_winner DECIMAL(5,2),
  accuracy_btts DECIMAL(5,2),
  confidence_calibration_score DECIMAL(6,4),
  league_breakdown JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_model_period UNIQUE (model_version, period_start, period_end)
);

CREATE INDEX IF NOT EXISTS idx_model_performance_version ON public.model_performance(model_version);
CREATE INDEX IF NOT EXISTS idx_model_performance_period ON public.model_performance(period_start, period_end);

-- 3) Model comparison table
CREATE TABLE IF NOT EXISTS public.model_comparison (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_a_id TEXT NOT NULL,
  model_b_id TEXT NOT NULL,
  comparison_date TIMESTAMPTZ DEFAULT NOW(),
  accuracy_diff DECIMAL(5,2),
  p_value DECIMAL(6,5),
  winning_model TEXT,
  sample_size INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.model_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.model_comparison ENABLE ROW LEVEL SECURITY;

-- Open policies for prototype (align with existing tables)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'model_performance' AND policyname = 'Enable read access for all users'
  ) THEN
    CREATE POLICY "Enable read access for all users" ON public.model_performance FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'model_performance' AND policyname = 'Enable insert for all users'
  ) THEN
    CREATE POLICY "Enable insert for all users" ON public.model_performance FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'model_performance' AND policyname = 'Enable update for all users'
  ) THEN
    CREATE POLICY "Enable update for all users" ON public.model_performance FOR UPDATE USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'model_performance' AND policyname = 'Enable delete for all users'
  ) THEN
    CREATE POLICY "Enable delete for all users" ON public.model_performance FOR DELETE USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'model_comparison' AND policyname = 'Enable read access for all users'
  ) THEN
    CREATE POLICY "Enable read access for all users" ON public.model_comparison FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'model_comparison' AND policyname = 'Enable insert for all users'
  ) THEN
    CREATE POLICY "Enable insert for all users" ON public.model_comparison FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'model_comparison' AND policyname = 'Enable update for all users'
  ) THEN
    CREATE POLICY "Enable update for all users" ON public.model_comparison FOR UPDATE USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'model_comparison' AND policyname = 'Enable delete for all users'
  ) THEN
    CREATE POLICY "Enable delete for all users" ON public.model_comparison FOR DELETE USING (true);
  END IF;
END $$;
