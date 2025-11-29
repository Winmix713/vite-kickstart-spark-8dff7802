-- Phase 9: Advanced Features Database Schema

-- 1. User predictions table for collaborative intelligence
CREATE TABLE public.user_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL, -- In a real app, this would be auth.users.id
  predicted_outcome TEXT NOT NULL CHECK (predicted_outcome IN ('home_win', 'draw', 'away_win')),
  confidence_score DECIMAL(5,2) NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 100),
  predicted_home_score INTEGER,
  predicted_away_score INTEGER,
  btts_prediction BOOLEAN,
  over_under_prediction TEXT CHECK (over_under_prediction IN ('over_2.5', 'under_2.5', null)),
  reasoning TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_user_match_prediction UNIQUE (match_id, user_id)
);

COMMENT ON TABLE public.user_predictions IS 'User-submitted predictions for collaborative intelligence features.';
COMMENT ON COLUMN public.user_predictions.user_id IS 'User identifier - in production this should reference auth.users.id';
COMMENT ON COLUMN public.user_predictions.reasoning IS 'Optional user-provided reasoning for their prediction';

CREATE INDEX idx_user_predictions_match ON public.user_predictions(match_id);
CREATE INDEX idx_user_predictions_user ON public.user_predictions(user_id);
CREATE INDEX idx_user_predictions_created_at ON public.user_predictions(created_at DESC);

-- 2. Crowd wisdom aggregation table
CREATE TABLE public.crowd_wisdom (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  total_predictions INTEGER NOT NULL DEFAULT 0,
  home_win_predictions INTEGER NOT NULL DEFAULT 0,
  draw_predictions INTEGER NOT NULL DEFAULT 0,
  away_win_predictions INTEGER NOT NULL DEFAULT 0,
  average_confidence DECIMAL(5,2) NOT NULL DEFAULT 0.0,
  consensus_prediction TEXT CHECK (consensus_prediction IN ('home_win', 'draw', 'away_win', null)),
  consensus_confidence DECIMAL(5,2) DEFAULT 0.0,
  model_vs_crowd_divergence DECIMAL(5,2) DEFAULT 0.0, -- Percentage difference between model and crowd
  last_calculated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_match_crowd_wisdom UNIQUE (match_id)
);

COMMENT ON TABLE public.crowd_wisdom IS 'Aggregated crowd wisdom compared against model predictions.';
COMMENT ON COLUMN public.crowd_wisdom.consensus_prediction IS 'The crowd consensus prediction based on majority vote';
COMMENT ON COLUMN public.crowd_wisdom.model_vs_crowd_divergence IS 'Percentage difference between model confidence and crowd consensus';

CREATE INDEX idx_crowd_wisdom_match ON public.crowd_wisdom(match_id);
CREATE INDEX idx_crowd_wisdom_last_calculated ON public.crowd_wisdom(last_calculated_at DESC);

-- 3. Market odds table for external API integration
CREATE TABLE public.market_odds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  bookmaker TEXT NOT NULL, -- Name of the bookmaker (e.g., "Bet365", "William Hill")
  home_win_odds DECIMAL(8,4) NOT NULL CHECK (home_win_odds > 0),
  draw_odds DECIMAL(8,4) NOT NULL CHECK (draw_odds > 0),
  away_win_odds DECIMAL(8,4) NOT NULL CHECK (away_win_odds > 0),
  over_2_5_odds DECIMAL(8,4) CHECK (over_2_5_odds > 0),
  under_2_5_odds DECIMAL(8,4) CHECK (under_2_5_odds > 0),
  btts_yes_odds DECIMAL(8,4) CHECK (btts_yes_odds > 0),
  btts_no_odds DECIMAL(8,4) CHECK (btts_no_odds > 0),
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  api_source TEXT NOT NULL DEFAULT 'odds-api', -- Source API
  raw_response JSONB, -- Store raw API response for debugging
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_match_bookmaker UNIQUE (match_id, bookmaker)
);

COMMENT ON TABLE public.market_odds IS 'External bookmaker odds fetched from APIs for value bet detection.';
COMMENT ON COLUMN public.market_odds.bookmaker IS 'Name of the bookmaker offering these odds';
COMMENT ON COLUMN public.market_odds.api_source IS 'Which external API provided these odds';

CREATE INDEX idx_market_odds_match ON public.market_odds(match_id);
CREATE INDEX idx_market_odds_last_updated ON public.market_odds(last_updated DESC);
CREATE INDEX idx_market_odds_bookmaker ON public.market_odds(bookmaker);

-- 4. Value bets table
CREATE TABLE public.value_bets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  bookmaker TEXT NOT NULL,
  bet_type TEXT NOT NULL CHECK (bet_type IN ('home_win', 'draw', 'away_win', 'over_2_5', 'under_2_5', 'btts_yes', 'btts_no')),
  bookmaker_odds DECIMAL(8,4) NOT NULL,
  model_probability DECIMAL(5,4) NOT NULL CHECK (model_probability >= 0 AND model_probability <= 1),
  implied_probability DECIMAL(5,4) NOT NULL CHECK (implied_probability >= 0 AND implied_probability <= 1),
  expected_value DECIMAL(8,4) NOT NULL, -- EV calculation
  kelly_fraction DECIMAL(5,4) NOT NULL CHECK (kelly_fraction >= 0 AND kelly_fraction <= 1), -- Kelly Criterion
  confidence_level TEXT NOT NULL DEFAULT 'medium' CHECK (confidence_level IN ('low', 'medium', 'high')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.value_bets IS 'Detected value bets based on model predictions vs market odds.';
COMMENT ON COLUMN public.value_bets.expected_value IS 'Expected value = (model_probability * odds) - 1';
COMMENT ON COLUMN public.value_bets.kelly_fraction IS 'Optimal bet size according to Kelly Criterion';

CREATE INDEX idx_value_bets_match ON public.value_bets(match_id);
CREATE INDEX idx_value_bets_active ON public.value_bets(is_active) WHERE is_active = true;
CREATE INDEX idx_value_bets_ev ON public.value_bets(expected_value DESC);
CREATE INDEX idx_value_bets_created_at ON public.value_bets(created_at DESC);

-- 5. Information freshness tracking for temporal decay
CREATE TABLE public.information_freshness (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  data_type TEXT NOT NULL, -- 'match', 'team_stats', 'pattern', 'odds', etc.
  last_updated TIMESTAMPTZ NOT NULL,
  decay_rate DECIMAL(5,4) NOT NULL DEFAULT 0.1, -- Customizable decay rate per data type
  freshness_score DECIMAL(5,4) NOT NULL DEFAULT 1.0, -- Calculated using exponential decay
  is_stale BOOLEAN NOT NULL DEFAULT false,
  stale_threshold_days INTEGER NOT NULL DEFAULT 7,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_table_record UNIQUE (table_name, record_id)
);

COMMENT ON TABLE public.information_freshness IS 'Tracks data freshness for temporal decay calculations.';
COMMENT ON COLUMN public.information_freshness.decay_rate IS 'Rate at which information decays (e.g., 0.1 = 10% per day)';
COMMENT ON COLUMN public.information_freshness.freshness_score IS 'Current freshness score (0-1, where 1 is perfectly fresh)';

CREATE INDEX idx_information_freshness_table_record ON public.information_freshness(table_name, record_id);
CREATE INDEX idx_information_freshness_stale ON public.information_freshness(is_stale) WHERE is_stale = true;
CREATE INDEX idx_information_freshness_updated ON public.information_freshness(last_updated DESC);

-- 6. Feature experiments table for self-improving system
CREATE TABLE public.feature_experiments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_name TEXT NOT NULL,
  feature_type TEXT NOT NULL CHECK (feature_type IN ('polynomial', 'interaction', 'ratio', 'temporal', 'aggregate')),
  base_features JSONB NOT NULL, -- Array of base features used
  generated_feature JSONB NOT NULL, -- Description of the generated feature
  feature_expression TEXT NOT NULL, -- Mathematical expression
  test_start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  test_end_date TIMESTAMPTZ,
  sample_size INTEGER DEFAULT 0,
  control_accuracy DECIMAL(5,2), -- Accuracy without this feature
  test_accuracy DECIMAL(5,2), -- Accuracy with this feature
  improvement_delta DECIMAL(5,2), -- test_accuracy - control_accuracy
  statistical_significance BOOLEAN DEFAULT false,
  p_value DECIMAL(8,6),
  is_active BOOLEAN DEFAULT false,
  is_approved BOOLEAN DEFAULT false, -- Approved for production use
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.feature_experiments IS 'Auto-generated feature engineering experiments for self-improvement.';
COMMENT ON COLUMN public.feature_experiments.feature_expression IS 'Mathematical expression defining the new feature';
COMMENT ON COLUMN public.feature_experiments.improvement_delta IS 'Performance improvement in percentage points';

CREATE INDEX idx_feature_experiments_active ON public.feature_experiments(is_active) WHERE is_active = true;
CREATE INDEX idx_feature_experiments_approved ON public.feature_experiments(is_approved) WHERE is_approved = true;
CREATE INDEX idx_feature_experiments_improvement ON public.feature_experiments(improvement_delta DESC);
CREATE INDEX idx_feature_experiments_type ON public.feature_experiments(feature_type);

-- 7. Updated trigger function for updated_at columns
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Create triggers for all tables with updated_at columns
CREATE TRIGGER trg_user_predictions_updated_at
  BEFORE UPDATE ON public.user_predictions
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TRIGGER trg_crowd_wisdom_updated_at
  BEFORE UPDATE ON public.crowd_wisdom
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TRIGGER trg_market_odds_updated_at
  BEFORE UPDATE ON public.market_odds
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TRIGGER trg_value_bets_updated_at
  BEFORE UPDATE ON public.value_bets
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TRIGGER trg_information_freshness_updated_at
  BEFORE UPDATE ON public.information_freshness
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TRIGGER trg_feature_experiments_updated_at
  BEFORE UPDATE ON public.feature_experiments
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 8. Function to calculate temporal freshness score
CREATE OR REPLACE FUNCTION public.calculate_freshness_score(
  last_updated TIMESTAMPTZ,
  decay_rate DECIMAL,
  current_time TIMESTAMPTZ DEFAULT NOW()
)
RETURNS DECIMAL
LANGUAGE plpgsql
AS $$
DECLARE
  days_elapsed DECIMAL;
  freshness_score DECIMAL;
BEGIN
  -- Calculate days elapsed with precision
  days_elapsed := EXTRACT(EPOCH FROM (current_time - last_updated)) / (24 * 3600);
  
  -- Exponential decay: e^(-decay_rate * days_elapsed)
  freshness_score := EXP(-decay_rate * days_elapsed);
  
  -- Ensure score is between 0 and 1
  freshness_score := GREATEST(0, LEAST(1, freshness_score));
  
  RETURN freshness_score;
END;
$$;

-- 9. Function to update crowd wisdom aggregation
CREATE OR REPLACE FUNCTION public.update_crowd_wisdom(p_match_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  total_count INTEGER;
  home_count INTEGER;
  draw_count INTEGER;
  away_count INTEGER;
  avg_confidence DECIMAL;
  consensus TEXT;
  consensus_conf DECIMAL;
  divergence DECIMAL;
  model_outcome TEXT;
  model_confidence DECIMAL;
BEGIN
  -- Get user prediction statistics
  SELECT 
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE predicted_outcome = 'home_win') as home,
    COUNT(*) FILTER (WHERE predicted_outcome = 'draw') as draw,
    COUNT(*) FILTER (WHERE predicted_outcome = 'away_win') as away,
    AVG(confidence_score) as avg_conf
  INTO total_count, home_count, draw_count, away_count, avg_confidence
  FROM public.user_predictions 
  WHERE match_id = p_match_id;

  -- Determine consensus
  IF home_count > draw_count AND home_count > away_count THEN
    consensus := 'home_win';
    consensus_conf := (home_count::DECIMAL / total_count::DECIMAL) * 100;
  ELSIF draw_count > home_count AND draw_count > away_count THEN
    consensus := 'draw';
    consensus_conf := (draw_count::DECIMAL / total_count::DECIMAL) * 100;
  ELSIF away_count > home_count AND away_count > draw_count THEN
    consensus := 'away_win';
    consensus_conf := (away_count::DECIMAL / total_count::DECIMAL) * 100;
  ELSE
    consensus := NULL;
    consensus_conf := 0;
  END IF;

  -- Get model prediction for comparison
  SELECT predicted_outcome, confidence_score 
  INTO model_outcome, model_confidence
  FROM public.predictions 
  WHERE match_id = p_match_id;

  -- Calculate divergence if both exist
  IF model_outcome IS NOT NULL AND consensus IS NOT NULL THEN
    IF model_outcome = consensus THEN
      divergence := ABS(model_confidence - consensus_conf);
    ELSE
      divergence := model_confidence + consensus_conf;
    END IF;
  ELSE
    divergence := 0;
  END IF;

  -- Upsert crowd wisdom
  INSERT INTO public.crowd_wisdom (
    match_id, 
    total_predictions, 
    home_win_predictions, 
    draw_predictions, 
    away_win_predictions,
    average_confidence,
    consensus_prediction,
    consensus_confidence,
    model_vs_crowd_divergence,
    last_calculated_at
  ) VALUES (
    p_match_id,
    total_count,
    home_count,
    draw_count,
    away_count,
    COALESCE(avg_confidence, 0),
    consensus,
    consensus_conf,
    divergence,
    NOW()
  )
  ON CONFLICT (match_id) DO UPDATE SET
    total_predictions = EXCLUDED.total_predictions,
    home_win_predictions = EXCLUDED.home_win_predictions,
    draw_predictions = EXCLUDED.draw_predictions,
    away_win_predictions = EXCLUDED.away_win_predictions,
    average_confidence = EXCLUDED.average_confidence,
    consensus_prediction = EXCLUDED.consensus_prediction,
    consensus_confidence = EXCLUDED.consensus_confidence,
    model_vs_crowd_divergence = EXCLUDED.model_vs_crowd_divergence,
    last_calculated_at = EXCLUDED.last_calculated_at,
    updated_at = NOW();
END;
$$;

-- 10. Seed some default data types for information freshness
INSERT INTO public.information_freshness (table_name, record_id, data_type, last_updated, decay_rate, stale_threshold_days)
VALUES 
  ('matches', 'sample', 'match', NOW(), 0.05, 3),  -- Match data decays slowly
  ('team_stats', 'sample', 'team_stats', NOW(), 0.1, 7),  -- Team stats decay moderately
  ('market_odds', 'sample', 'odds', NOW(), 0.5, 1),  -- Odds decay very fast
  ('patterns', 'sample', 'pattern', NOW(), 0.15, 5)  -- Patterns decay moderately
ON CONFLICT (table_name, record_id) DO NOTHING;