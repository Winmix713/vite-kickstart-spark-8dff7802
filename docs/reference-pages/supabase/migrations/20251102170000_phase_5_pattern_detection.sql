-- Phase 5: Advanced Pattern Detection

-- 1. team_patterns table - stores detected team-level patterns
CREATE TABLE IF NOT EXISTS public.team_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  pattern_type TEXT NOT NULL,
  pattern_name TEXT NOT NULL,
  confidence NUMERIC NOT NULL DEFAULT 0, -- 0-100
  strength INTEGER NOT NULL DEFAULT 0,    -- 0-100
  valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  prediction_impact NUMERIC NOT NULL DEFAULT 0, -- impact on prediction confidence (+/-)
  historical_accuracy NUMERIC NOT NULL DEFAULT 0, -- % based on verification feedback
  pattern_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.team_patterns IS 'Detected and verified team-level patterns with validity windows and metadata.';
COMMENT ON COLUMN public.team_patterns.pattern_type IS 'Machine-readable key: winning_streak, home_dominance, high_scoring_trend, defensive_solid, form_surge, etc.';
COMMENT ON COLUMN public.team_patterns.pattern_name IS 'Human-friendly label for UI rendering.';
COMMENT ON COLUMN public.team_patterns.confidence IS '0-100 confidence that the pattern currently holds.';
COMMENT ON COLUMN public.team_patterns.strength IS '0-100 intensity/strength based on underlying stats.';
COMMENT ON COLUMN public.team_patterns.pattern_metadata IS 'JSONB payload with algorithm details (sample sizes, rates, supporting stats).';

-- Only one active pattern per (team, pattern_type)
CREATE UNIQUE INDEX IF NOT EXISTS uq_team_patterns_active
  ON public.team_patterns(team_id, pattern_type)
  WHERE valid_until IS NULL;

CREATE INDEX IF NOT EXISTS idx_team_patterns_team_id ON public.team_patterns(team_id);
CREATE INDEX IF NOT EXISTS idx_team_patterns_valid_until ON public.team_patterns(valid_until);
CREATE INDEX IF NOT EXISTS idx_team_patterns_type ON public.team_patterns(pattern_type);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.touch_updated_at_team_patterns()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_touch_team_patterns_updated_at ON public.team_patterns;
CREATE TRIGGER trg_touch_team_patterns_updated_at
BEFORE UPDATE ON public.team_patterns
FOR EACH ROW
EXECUTE FUNCTION public.touch_updated_at_team_patterns();

-- 2. pattern_definitions table - centralized configuration for detection algorithms
CREATE TABLE IF NOT EXISTS public.pattern_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_name TEXT NOT NULL UNIQUE,
  detection_function TEXT NOT NULL,
  min_sample_size INTEGER NOT NULL DEFAULT 5,
  min_confidence_threshold NUMERIC NOT NULL DEFAULT 60, -- percent
  priority INTEGER NOT NULL DEFAULT 5,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.pattern_definitions IS 'Central config for team-level pattern detection thresholds and toggles.';

CREATE INDEX IF NOT EXISTS idx_pattern_definitions_active ON public.pattern_definitions(is_active);
CREATE INDEX IF NOT EXISTS idx_pattern_definitions_priority ON public.pattern_definitions(priority DESC);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.touch_updated_at_pattern_definitions()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_touch_pattern_definitions_updated_at ON public.pattern_definitions;
CREATE TRIGGER trg_touch_pattern_definitions_updated_at
BEFORE UPDATE ON public.pattern_definitions
FOR EACH ROW
EXECUTE FUNCTION public.touch_updated_at_pattern_definitions();

-- 3. Seed default definitions
INSERT INTO public.pattern_definitions (pattern_name, detection_function, min_sample_size, min_confidence_threshold, priority, is_active)
VALUES
  ('winning_streak', 'detectStreak', 3, 60, 10, TRUE),
  ('home_dominance', 'detectHomeDominance', 5, 65, 9, TRUE),
  ('high_scoring_trend', 'detectHighScoring', 6, 60, 7, TRUE),
  ('form_surge', 'detectFormSurge', 6, 60, 8, TRUE)
ON CONFLICT (pattern_name) DO NOTHING;
