-- Fix existing predictions
UPDATE public.predictions
SET 
  css_score = confidence_score,
  prediction_factors = jsonb_build_object(
    'backfilled', true,
    'original_confidence', confidence_score,
    'updated_at', NOW()
  )
WHERE css_score IS NULL;

-- Add comment
COMMENT ON COLUMN public.predictions.css_score IS 'Continuous Scaled Score - same as confidence_score but used for calibration analysis';
