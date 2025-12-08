-- Phase 7: Cross-League Intelligence
-- 1) Cross league correlations
CREATE TABLE IF NOT EXISTS public.cross_league_correlations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_a_id UUID NOT NULL REFERENCES public.leagues(id) ON DELETE CASCADE,
  league_b_id UUID NOT NULL REFERENCES public.leagues(id) ON DELETE CASCADE,
  correlation_type TEXT NOT NULL CHECK (correlation_type IN ('form_impact','home_advantage','scoring_trend')),
  coefficient DOUBLE PRECISION NOT NULL,
  p_value DOUBLE PRECISION,
  sample_size INTEGER NOT NULL DEFAULT 0,
  insight_summary TEXT,
  last_calculated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (league_a_id, league_b_id, correlation_type)
);

COMMENT ON TABLE public.cross_league_correlations IS 'Stores cached Pearson correlations between pairs of leagues across multiple correlation types.';

CREATE INDEX IF NOT EXISTS idx_cross_corr_league_pair ON public.cross_league_correlations(league_a_id, league_b_id);
CREATE INDEX IF NOT EXISTS idx_cross_corr_type ON public.cross_league_correlations(correlation_type);
CREATE INDEX IF NOT EXISTS idx_cross_corr_updated_at ON public.cross_league_correlations(last_calculated DESC);

-- 2) Meta patterns
CREATE TABLE IF NOT EXISTS public.meta_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_name TEXT NOT NULL,
  pattern_type TEXT NOT NULL,
  supporting_leagues UUID[] NOT NULL DEFAULT '{}',
  evidence_strength INTEGER NOT NULL CHECK (evidence_strength >= 0 AND evidence_strength <= 100),
  prediction_impact DOUBLE PRECISION NOT NULL DEFAULT 0,
  pattern_description TEXT,
  discovered_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.meta_patterns IS 'Global patterns observed across multiple leagues.';
CREATE INDEX IF NOT EXISTS idx_meta_patterns_type ON public.meta_patterns(pattern_type);
CREATE INDEX IF NOT EXISTS idx_meta_patterns_strength ON public.meta_patterns(evidence_strength DESC);

-- 3) League characteristics (normalized metrics for comparison)
CREATE TABLE IF NOT EXISTS public.league_characteristics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id UUID NOT NULL REFERENCES public.leagues(id) ON DELETE CASCADE,
  avg_goals DOUBLE PRECISION,
  home_advantage_index DOUBLE PRECISION,
  competitive_balance_index DOUBLE PRECISION,
  predictability_score DOUBLE PRECISION,
  physicality_index DOUBLE PRECISION,
  trend_data JSONB DEFAULT '{}'::jsonb,
  season TEXT DEFAULT '2024-2025',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (league_id, season)
);

COMMENT ON TABLE public.league_characteristics IS 'Normalized and comparable league metrics for cross-league analysis.';
CREATE INDEX IF NOT EXISTS idx_league_characteristics_league ON public.league_characteristics(league_id);
CREATE INDEX IF NOT EXISTS idx_league_characteristics_season ON public.league_characteristics(season);

-- trigger to keep updated_at fresh
CREATE OR REPLACE FUNCTION public.touch_league_characteristics_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;$$;

DROP TRIGGER IF EXISTS trg_touch_league_characteristics_updated_at ON public.league_characteristics;
CREATE TRIGGER trg_touch_league_characteristics_updated_at
BEFORE UPDATE ON public.league_characteristics
FOR EACH ROW
EXECUTE FUNCTION public.touch_league_characteristics_updated_at();
