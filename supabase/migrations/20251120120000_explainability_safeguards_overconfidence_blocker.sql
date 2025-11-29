-- Explainability Safeguards: Overconfidence Blocker and Explanation Features
-- Adds support for human-readable explanations and overconfidence detection

-- 1. Add new columns to predictions table
ALTER TABLE public.predictions ADD COLUMN IF NOT EXISTS
  explanation JSONB,
  decision_path JSONB,
  prediction_status TEXT DEFAULT 'active' CHECK (prediction_status IN ('active', 'uncertain', 'blocked')),
  overconfidence_flag BOOLEAN DEFAULT false,
  blocked_reason TEXT,
  alternate_outcome TEXT CHECK (alternate_outcome IN ('home_win', 'draw', 'away_win')),
  downgraded_from_confidence NUMERIC(5,4),
  blocked_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id);

-- 2. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_predictions_status ON public.predictions(prediction_status);
CREATE INDEX IF NOT EXISTS idx_predictions_overconfidence ON public.predictions(overconfidence_flag) WHERE overconfidence_flag = true;
CREATE INDEX IF NOT EXISTS idx_predictions_confidence_score ON public.predictions(confidence_score DESC);
CREATE INDEX IF NOT EXISTS idx_predictions_created_recent ON public.predictions(created_at DESC) 
  WHERE confidence_score > 0.95 AND prediction_status IN ('active', 'uncertain');

-- 3. Function to check for overconfidence and apply downgrade
CREATE OR REPLACE FUNCTION public.check_overconfidence_and_apply_downgrade(
  p_match_id UUID,
  p_home_team_id UUID,
  p_away_team_id UUID,
  p_predicted_outcome TEXT,
  p_confidence NUMERIC,
  p_ensemble_scores JSONB DEFAULT NULL
)
RETURNS TABLE (
  should_block BOOLEAN,
  reason TEXT,
  downgraded_confidence NUMERIC(5,4),
  alternate_outcome TEXT,
  prior_failure_date TIMESTAMPTZ
) AS $$
DECLARE
  v_recent_failures INT;
  v_recent_failure_date TIMESTAMPTZ;
  v_downgraded_conf NUMERIC(5,4);
  v_alternate_outcome TEXT;
  v_thirty_days_ago TIMESTAMPTZ;
BEGIN
  -- If confidence is not above 95%, don't block
  IF p_confidence <= 0.95 THEN
    RETURN QUERY SELECT 
      false::BOOLEAN,
      NULL::TEXT,
      p_confidence,
      NULL::TEXT,
      NULL::TIMESTAMPTZ;
    RETURN;
  END IF;

  -- Set threshold date (30 days ago)
  v_thirty_days_ago := NOW() - INTERVAL '30 days';

  -- Look for similar failed predictions in the last 30 days
  SELECT COUNT(*), MAX(created_at)
  INTO v_recent_failures, v_recent_failure_date
  FROM public.predictions
  WHERE home_team_id = p_home_team_id
    AND away_team_id = p_away_team_id
    AND predicted_outcome = p_predicted_outcome
    AND confidence_score >= 0.95
    AND (was_correct = false OR (was_correct IS NULL AND actual_outcome IS NOT NULL AND actual_outcome != predicted_outcome))
    AND created_at >= v_thirty_days_ago;

  -- If recent failures found, downgrade the prediction
  IF v_recent_failures > 0 AND v_recent_failure_date IS NOT NULL THEN
    -- Calculate downgraded confidence: MIN(0.88, original * 0.92)
    v_downgraded_conf := LEAST(0.88::NUMERIC(5,4), (p_confidence * 0.92)::NUMERIC(5,4));
    
    -- Determine alternate outcome from ensemble scores if available
    -- If no ensemble scores, return NULL for alternate outcome
    v_alternate_outcome := NULL;
    
    RETURN QUERY SELECT 
      true::BOOLEAN,
      format('High confidence (%.1f%%) prediction for same matchup failed within last 30 days (on %s)', 
             p_confidence * 100, 
             to_char(v_recent_failure_date, 'YYYY-MM-DD HH24:MI')),
      v_downgraded_conf,
      v_alternate_outcome,
      v_recent_failure_date;
    RETURN;
  END IF;

  -- No issues found
  RETURN QUERY SELECT 
    false::BOOLEAN,
    NULL::TEXT,
    p_confidence,
    NULL::TEXT,
    NULL::TIMESTAMPTZ;
END;
$$ LANGUAGE plpgsql;

-- 4. Function to generate explanation summary (stub, will be called from application)
-- This is a placeholder that returns the raw JSONB back for now
CREATE OR REPLACE FUNCTION public.get_prediction_explanation(p_prediction_id UUID)
RETURNS JSONB AS $$
BEGIN
  RETURN (SELECT explanation FROM public.predictions WHERE id = p_prediction_id);
END;
$$ LANGUAGE plpgsql;

-- 5. Function to update prediction status and apply overconfidence downgrade
CREATE OR REPLACE FUNCTION public.apply_overconfidence_downgrade(
  p_prediction_id UUID,
  p_reason TEXT,
  p_downgraded_confidence NUMERIC(5,4),
  p_alternate_outcome TEXT,
  p_user_id UUID DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  UPDATE public.predictions
  SET 
    prediction_status = 'uncertain',
    overconfidence_flag = true,
    blocked_reason = p_reason,
    downgraded_from_confidence = confidence_score,
    confidence_score = p_downgraded_confidence,
    alternate_outcome = p_alternate_outcome,
    blocked_at = NOW(),
    reviewed_by = p_user_id
  WHERE id = p_prediction_id;
END;
$$ LANGUAGE plpgsql;

-- 6. Create a view for recent high-confidence predictions that might need review
CREATE OR REPLACE VIEW public.high_confidence_predictions_needing_review AS
SELECT 
  p.id,
  p.match_id,
  p.predicted_outcome,
  p.confidence_score,
  p.prediction_status,
  p.overconfidence_flag,
  p.created_at,
  m.home_team_id,
  m.away_team_id,
  (SELECT COUNT(*) FROM public.predictions p2
   WHERE p2.home_team_id = m.home_team_id
     AND p2.away_team_id = m.away_team_id
     AND p2.predicted_outcome = p.predicted_outcome
     AND p2.confidence_score >= 0.95
     AND (p2.was_correct = false OR (p2.was_correct IS NULL AND p2.actual_outcome IS NOT NULL AND p2.actual_outcome != p2.predicted_outcome))
     AND p2.created_at >= NOW() - INTERVAL '30 days'
     AND p2.id != p.id) AS recent_similar_failures
FROM public.predictions p
JOIN public.matches m ON p.match_id = m.id
WHERE p.confidence_score > 0.95
  AND p.prediction_status = 'active'
  AND p.overconfidence_flag = false
  AND p.created_at >= NOW() - INTERVAL '30 days';

COMMENT ON VIEW public.high_confidence_predictions_needing_review IS 
'View for identifying predictions that might need overconfidence downgrade based on recent similar failures';

-- 7. Add comment to new columns
COMMENT ON COLUMN public.predictions.explanation IS 'JSONB object containing structured explanation with summary, key_factors, decision_tree, and confidence_breakdown';
COMMENT ON COLUMN public.predictions.decision_path IS 'JSONB object representing decision tree nodes with conditions and outcomes';
COMMENT ON COLUMN public.predictions.prediction_status IS 'Status of prediction: active (normal), uncertain (downgraded), or blocked (prevented)';
COMMENT ON COLUMN public.predictions.overconfidence_flag IS 'Flag indicating if prediction confidence was downgraded due to overconfidence detection';
COMMENT ON COLUMN public.predictions.blocked_reason IS 'Human-readable reason why prediction was downgraded or blocked';
COMMENT ON COLUMN public.predictions.alternate_outcome IS 'Second-best outcome suggestion when prediction is downgraded';
COMMENT ON COLUMN public.predictions.downgraded_from_confidence IS 'Original confidence score before downgrade';
COMMENT ON COLUMN public.predictions.blocked_at IS 'Timestamp when prediction was downgraded/blocked';
COMMENT ON COLUMN public.predictions.reviewed_by IS 'User ID of reviewer who approved the downgrade (if manual review)';
