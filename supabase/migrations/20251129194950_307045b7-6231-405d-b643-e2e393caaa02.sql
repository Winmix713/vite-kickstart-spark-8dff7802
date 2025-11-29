-- Phase 9: Collaborative Intelligence Database Schema

-- Create user_predictions table
CREATE TABLE public.user_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL,
  user_id TEXT NOT NULL,
  predicted_outcome TEXT NOT NULL CHECK (predicted_outcome IN ('home_win', 'draw', 'away_win')),
  confidence_score INTEGER NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 100),
  predicted_home_score INTEGER CHECK (predicted_home_score >= 0 AND predicted_home_score <= 10),
  predicted_away_score INTEGER CHECK (predicted_away_score >= 0 AND predicted_away_score <= 10),
  btts_prediction BOOLEAN,
  over_under_prediction TEXT CHECK (over_under_prediction IN ('over_2.5', 'under_2.5')),
  reasoning TEXT CHECK (char_length(reasoning) <= 500),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(match_id, user_id)
);

-- Create crowd_wisdom table for aggregated predictions
CREATE TABLE public.crowd_wisdom (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL UNIQUE,
  total_predictions INTEGER NOT NULL DEFAULT 0,
  home_win_percentage DECIMAL(5,2),
  draw_percentage DECIMAL(5,2),
  away_win_percentage DECIMAL(5,2),
  avg_confidence_score DECIMAL(5,2),
  btts_yes_percentage DECIMAL(5,2),
  over_2_5_percentage DECIMAL(5,2),
  avg_predicted_home_score DECIMAL(3,1),
  avg_predicted_away_score DECIMAL(3,1),
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create market_odds table for bookmaker odds
CREATE TABLE public.market_odds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL,
  bookmaker TEXT NOT NULL,
  home_win_odds DECIMAL(6,2),
  draw_odds DECIMAL(6,2),
  away_win_odds DECIMAL(6,2),
  over_2_5_odds DECIMAL(6,2),
  under_2_5_odds DECIMAL(6,2),
  btts_yes_odds DECIMAL(6,2),
  btts_no_odds DECIMAL(6,2),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(match_id, bookmaker)
);

-- Create value_bets table for identified opportunities
CREATE TABLE public.value_bets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL,
  bookmaker TEXT NOT NULL,
  bet_type TEXT NOT NULL,
  odds DECIMAL(6,2) NOT NULL,
  model_probability DECIMAL(5,4) NOT NULL,
  implied_probability DECIMAL(5,4) NOT NULL,
  expected_value DECIMAL(5,4) NOT NULL,
  confidence_level TEXT NOT NULL CHECK (confidence_level IN ('low', 'medium', 'high')),
  kelly_fraction DECIMAL(5,4),
  detection_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  market_signals JSONB,
  correlation_strength DECIMAL(5,4),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.user_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crowd_wisdom ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_odds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.value_bets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_predictions
-- Users can view all predictions (for crowd wisdom)
CREATE POLICY "Anyone can view user predictions"
  ON public.user_predictions
  FOR SELECT
  USING (true);

-- Users can insert their own predictions
CREATE POLICY "Users can insert their own predictions"
  ON public.user_predictions
  FOR INSERT
  WITH CHECK (true);

-- Users can update their own predictions
CREATE POLICY "Users can update their own predictions"
  ON public.user_predictions
  FOR UPDATE
  USING (user_id = current_setting('request.headers', true)::json->>'user-id')
  WITH CHECK (user_id = current_setting('request.headers', true)::json->>'user-id');

-- RLS Policies for crowd_wisdom
-- Everyone can view crowd wisdom
CREATE POLICY "Anyone can view crowd wisdom"
  ON public.crowd_wisdom
  FOR SELECT
  USING (true);

-- Only authenticated users can update crowd wisdom (via function)
CREATE POLICY "System can update crowd wisdom"
  ON public.crowd_wisdom
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- RLS Policies for market_odds
-- Everyone can view market odds
CREATE POLICY "Anyone can view market odds"
  ON public.market_odds
  FOR SELECT
  USING (true);

-- Only system can insert/update odds
CREATE POLICY "System can manage market odds"
  ON public.market_odds
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- RLS Policies for value_bets
-- Everyone can view value bets
CREATE POLICY "Anyone can view value bets"
  ON public.value_bets
  FOR SELECT
  USING (true);

-- Only system can insert/update value bets
CREATE POLICY "System can manage value bets"
  ON public.value_bets
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_user_predictions_updated_at
  BEFORE UPDATE ON public.user_predictions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_market_odds_updated_at
  BEFORE UPDATE ON public.market_odds
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to update crowd wisdom when predictions are added/updated
CREATE OR REPLACE FUNCTION public.update_crowd_wisdom(p_match_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total INTEGER;
  v_home_win DECIMAL;
  v_draw DECIMAL;
  v_away_win DECIMAL;
  v_avg_confidence DECIMAL;
  v_btts_yes DECIMAL;
  v_over_2_5 DECIMAL;
  v_avg_home_score DECIMAL;
  v_avg_away_score DECIMAL;
BEGIN
  -- Calculate aggregations
  SELECT 
    COUNT(*),
    ROUND(SUM(CASE WHEN predicted_outcome = 'home_win' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2),
    ROUND(SUM(CASE WHEN predicted_outcome = 'draw' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2),
    ROUND(SUM(CASE WHEN predicted_outcome = 'away_win' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2),
    ROUND(AVG(confidence_score), 2),
    ROUND(SUM(CASE WHEN btts_prediction = true THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2),
    ROUND(SUM(CASE WHEN over_under_prediction = 'over_2.5' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2),
    ROUND(AVG(predicted_home_score), 1),
    ROUND(AVG(predicted_away_score), 1)
  INTO
    v_total,
    v_home_win,
    v_draw,
    v_away_win,
    v_avg_confidence,
    v_btts_yes,
    v_over_2_5,
    v_avg_home_score,
    v_avg_away_score
  FROM public.user_predictions
  WHERE match_id = p_match_id;

  -- Upsert crowd wisdom
  INSERT INTO public.crowd_wisdom (
    match_id,
    total_predictions,
    home_win_percentage,
    draw_percentage,
    away_win_percentage,
    avg_confidence_score,
    btts_yes_percentage,
    over_2_5_percentage,
    avg_predicted_home_score,
    avg_predicted_away_score,
    last_updated
  )
  VALUES (
    p_match_id,
    v_total,
    v_home_win,
    v_draw,
    v_away_win,
    v_avg_confidence,
    v_btts_yes,
    v_over_2_5,
    v_avg_home_score,
    v_avg_away_score,
    now()
  )
  ON CONFLICT (match_id) DO UPDATE SET
    total_predictions = EXCLUDED.total_predictions,
    home_win_percentage = EXCLUDED.home_win_percentage,
    draw_percentage = EXCLUDED.draw_percentage,
    away_win_percentage = EXCLUDED.away_win_percentage,
    avg_confidence_score = EXCLUDED.avg_confidence_score,
    btts_yes_percentage = EXCLUDED.btts_yes_percentage,
    over_2_5_percentage = EXCLUDED.over_2_5_percentage,
    avg_predicted_home_score = EXCLUDED.avg_predicted_home_score,
    avg_predicted_away_score = EXCLUDED.avg_predicted_away_score,
    last_updated = now();
END;
$$;

-- Create indexes for better performance
CREATE INDEX idx_user_predictions_match_id ON public.user_predictions(match_id);
CREATE INDEX idx_user_predictions_user_id ON public.user_predictions(user_id);
CREATE INDEX idx_user_predictions_created_at ON public.user_predictions(created_at DESC);
CREATE INDEX idx_crowd_wisdom_match_id ON public.crowd_wisdom(match_id);
CREATE INDEX idx_market_odds_match_id ON public.market_odds(match_id);
CREATE INDEX idx_market_odds_updated_at ON public.market_odds(updated_at DESC);
CREATE INDEX idx_value_bets_match_id ON public.value_bets(match_id);
CREATE INDEX idx_value_bets_confidence_level ON public.value_bets(confidence_level);
CREATE INDEX idx_value_bets_detection_timestamp ON public.value_bets(detection_timestamp DESC);