-- Ensemble Predictor: Weighted Voting System
-- Adds support for combining multiple sub-model predictions (Full-time, Half-time, Pattern-based)

-- 1. Add ensemble_breakdown column to predictions table
ALTER TABLE public.predictions ADD COLUMN IF NOT EXISTS
  ensemble_breakdown JSONB;

-- 2. Create index for ensemble queries
CREATE INDEX IF NOT EXISTS idx_predictions_ensemble_breakdown ON public.predictions USING gin(ensemble_breakdown);

-- 3. Add comment explaining structure
COMMENT ON COLUMN public.predictions.ensemble_breakdown IS 
'JSONB object containing ensemble prediction breakdown:
{
  "weights_used": {"ft": 0.5, "ht": 0.3, "pt": 0.2},
  "votes": {
    "full_time": {"prediction": "HOME", "confidence": 0.75},
    "half_time": {"prediction": "DRAW", "confidence": 0.45},
    "pattern": {"prediction": "HOME", "confidence": 0.60}
  },
  "scores": {
    "HOME": 0.675,
    "DRAW": 0.135,
    "AWAY": 0.0
  },
  "winner": "HOME",
  "final_confidence": 0.675,
  "conflict_detected": false,
  "conflict_margin": 0.54
}';

-- 4. Function to calculate ensemble prediction
CREATE OR REPLACE FUNCTION public.calculate_ensemble_prediction(
  p_full_time_prediction TEXT,
  p_full_time_confidence NUMERIC,
  p_half_time_prediction TEXT,
  p_half_time_confidence NUMERIC,
  p_pattern_prediction TEXT,
  p_pattern_confidence NUMERIC,
  p_weights JSONB DEFAULT '{"ft": 0.5, "ht": 0.3, "pt": 0.2}'::jsonb
)
RETURNS JSONB AS $$
DECLARE
  v_ft_weight NUMERIC;
  v_ht_weight NUMERIC;
  v_pt_weight NUMERIC;
  v_total_weight NUMERIC;
  v_scores JSONB;
  v_home_score NUMERIC := 0;
  v_draw_score NUMERIC := 0;
  v_away_score NUMERIC := 0;
  v_winner TEXT;
  v_final_confidence NUMERIC;
  v_conflict_detected BOOLEAN := false;
  v_conflict_margin NUMERIC;
  v_sorted_scores NUMERIC[];
BEGIN
  -- Extract weights (with defaults if null)
  v_ft_weight := COALESCE((p_weights->>'ft')::NUMERIC, 0.5);
  v_ht_weight := COALESCE((p_weights->>'ht')::NUMERIC, 0.3);
  v_pt_weight := COALESCE((p_weights->>'pt')::NUMERIC, 0.2);
  
  -- Handle null models by re-weighting
  v_total_weight := 0;
  IF p_full_time_prediction IS NOT NULL THEN
    v_total_weight := v_total_weight + v_ft_weight;
  END IF;
  IF p_half_time_prediction IS NOT NULL THEN
    v_total_weight := v_total_weight + v_ht_weight;
  END IF;
  IF p_pattern_prediction IS NOT NULL THEN
    v_total_weight := v_total_weight + v_pt_weight;
  END IF;
  
  -- Normalize weights if we have any valid models
  IF v_total_weight > 0 THEN
    IF p_full_time_prediction IS NOT NULL THEN
      v_ft_weight := v_ft_weight / v_total_weight;
    ELSE
      v_ft_weight := 0;
    END IF;
    IF p_half_time_prediction IS NOT NULL THEN
      v_ht_weight := v_ht_weight / v_total_weight;
    ELSE
      v_ht_weight := 0;
    END IF;
    IF p_pattern_prediction IS NOT NULL THEN
      v_pt_weight := v_pt_weight / v_total_weight;
    ELSE
      v_pt_weight := 0;
    END IF;
  END IF;
  
  -- Calculate scores for each outcome
  -- Full-time model contribution
  IF p_full_time_prediction IS NOT NULL THEN
    CASE UPPER(p_full_time_prediction)
      WHEN 'HOME', 'HOME_WIN' THEN
        v_home_score := v_home_score + (p_full_time_confidence * v_ft_weight);
      WHEN 'DRAW' THEN
        v_draw_score := v_draw_score + (p_full_time_confidence * v_ft_weight);
      WHEN 'AWAY', 'AWAY_WIN' THEN
        v_away_score := v_away_score + (p_full_time_confidence * v_ft_weight);
    END CASE;
  END IF;
  
  -- Half-time model contribution
  IF p_half_time_prediction IS NOT NULL THEN
    CASE UPPER(p_half_time_prediction)
      WHEN 'HOME', 'HOME_WIN' THEN
        v_home_score := v_home_score + (p_half_time_confidence * v_ht_weight);
      WHEN 'DRAW' THEN
        v_draw_score := v_draw_score + (p_half_time_confidence * v_ht_weight);
      WHEN 'AWAY', 'AWAY_WIN' THEN
        v_away_score := v_away_score + (p_half_time_confidence * v_ht_weight);
    END CASE;
  END IF;
  
  -- Pattern model contribution
  IF p_pattern_prediction IS NOT NULL THEN
    CASE UPPER(p_pattern_prediction)
      WHEN 'HOME', 'HOME_WIN' THEN
        v_home_score := v_home_score + (p_pattern_confidence * v_pt_weight);
      WHEN 'DRAW' THEN
        v_draw_score := v_draw_score + (p_pattern_confidence * v_pt_weight);
      WHEN 'AWAY', 'AWAY_WIN' THEN
        v_away_score := v_away_score + (p_pattern_confidence * v_pt_weight);
    END CASE;
  END IF;
  
  -- Determine winner
  IF v_home_score >= v_draw_score AND v_home_score >= v_away_score THEN
    v_winner := 'home_win';
    v_final_confidence := v_home_score;
  ELSIF v_draw_score >= v_home_score AND v_draw_score >= v_away_score THEN
    v_winner := 'draw';
    v_final_confidence := v_draw_score;
  ELSE
    v_winner := 'away_win';
    v_final_confidence := v_away_score;
  END IF;
  
  -- Check for conflict (top 2 scores differ by < 0.1)
  v_sorted_scores := ARRAY[v_home_score, v_draw_score, v_away_score];
  v_sorted_scores := (SELECT ARRAY_AGG(val ORDER BY val DESC) FROM unnest(v_sorted_scores) val);
  v_conflict_margin := v_sorted_scores[1] - v_sorted_scores[2];
  
  IF v_conflict_margin < 0.1 THEN
    v_conflict_detected := true;
  END IF;
  
  -- Build result JSON
  RETURN jsonb_build_object(
    'weights_used', jsonb_build_object(
      'ft', v_ft_weight,
      'ht', v_ht_weight,
      'pt', v_pt_weight
    ),
    'votes', jsonb_build_object(
      'full_time', CASE WHEN p_full_time_prediction IS NOT NULL THEN
        jsonb_build_object('prediction', p_full_time_prediction, 'confidence', p_full_time_confidence)
      ELSE NULL END,
      'half_time', CASE WHEN p_half_time_prediction IS NOT NULL THEN
        jsonb_build_object('prediction', p_half_time_prediction, 'confidence', p_half_time_confidence)
      ELSE NULL END,
      'pattern', CASE WHEN p_pattern_prediction IS NOT NULL THEN
        jsonb_build_object('prediction', p_pattern_prediction, 'confidence', p_pattern_confidence)
      ELSE NULL END
    ),
    'scores', jsonb_build_object(
      'HOME', v_home_score,
      'DRAW', v_draw_score,
      'AWAY', v_away_score
    ),
    'winner', v_winner,
    'final_confidence', v_final_confidence,
    'conflict_detected', v_conflict_detected,
    'conflict_margin', v_conflict_margin
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION public.calculate_ensemble_prediction IS
'Calculates ensemble prediction using weighted voting from three sub-models (Full-time, Half-time, Pattern).
Handles null models by dynamically re-weighting. Detects conflicts when top 2 scores differ by < 0.1.';
