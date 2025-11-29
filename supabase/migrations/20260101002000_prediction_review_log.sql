-- Prediction Review Log for Admin Triage
-- Allows admins to review and accept/reject blocked/overconfident predictions

-- 1. Create prediction_review_log table
CREATE TABLE IF NOT EXISTS public.prediction_review_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prediction_id UUID NOT NULL REFERENCES public.predictions(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('accepted', 'rejected')),
  reviewer_id UUID NOT NULL REFERENCES public.user_profiles(id),
  notes TEXT,
  previous_status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_prediction_review_log_prediction_id 
  ON public.prediction_review_log(prediction_id);
CREATE INDEX IF NOT EXISTS idx_prediction_review_log_created_at_desc 
  ON public.prediction_review_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_prediction_review_log_reviewer_id 
  ON public.prediction_review_log(reviewer_id);

-- 3. Create view for blocked predictions needing review
CREATE OR REPLACE VIEW public.blocked_predictions_for_review AS
SELECT 
  p.id,
  p.match_id,
  p.predicted_outcome,
  p.confidence_score,
  p.downgraded_from_confidence,
  p.prediction_status,
  p.overconfidence_flag,
  p.blocked_reason,
  p.alternate_outcome,
  p.blocked_at,
  p.reviewed_by,
  p.created_at,
  m.home_team_id,
  m.away_team_id,
  (SELECT name FROM public.teams WHERE id = m.home_team_id) AS home_team_name,
  (SELECT name FROM public.teams WHERE id = m.away_team_id) AS away_team_name,
  (SELECT email FROM public.user_profiles WHERE id = p.reviewed_by) AS reviewer_email
FROM public.predictions p
JOIN public.matches m ON p.match_id = m.id
WHERE p.overconfidence_flag = true
  AND p.prediction_status IN ('uncertain', 'blocked')
ORDER BY p.blocked_at DESC;

COMMENT ON VIEW public.blocked_predictions_for_review IS
  'View for admins to review blocked/overconfident predictions';

-- 4. Enable RLS on prediction_review_log
ALTER TABLE public.prediction_review_log ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for prediction_review_log
-- Admin can select all
CREATE POLICY admin_select_prediction_review_log ON public.prediction_review_log
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE id = auth.uid() AND role = 'admin'
  ));

-- Analyst can select all (optional, per ticket requirements)
CREATE POLICY analyst_select_prediction_review_log ON public.prediction_review_log
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE id = auth.uid() AND role = 'analyst'
  ));

-- Admin can insert
CREATE POLICY admin_insert_prediction_review_log ON public.prediction_review_log
  FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE id = auth.uid() AND role = 'admin'
  ) AND reviewer_id = auth.uid());

-- Service role can insert
-- Note: Service role operations bypass RLS, but we include this policy for completeness
CREATE POLICY service_insert_prediction_review_log ON public.prediction_review_log
  FOR INSERT
  WITH CHECK (true);

-- 6. Add comments to columns
COMMENT ON COLUMN public.prediction_review_log.id IS 'Unique identifier';
COMMENT ON COLUMN public.prediction_review_log.prediction_id IS 'Reference to the prediction being reviewed';
COMMENT ON COLUMN public.prediction_review_log.action IS 'Admin action: accepted or rejected';
COMMENT ON COLUMN public.prediction_review_log.reviewer_id IS 'User who performed the review';
COMMENT ON COLUMN public.prediction_review_log.notes IS 'Optional notes from the reviewer';
COMMENT ON COLUMN public.prediction_review_log.previous_status IS 'Status of prediction before the action';
COMMENT ON COLUMN public.prediction_review_log.created_at IS 'Timestamp of the review action';
