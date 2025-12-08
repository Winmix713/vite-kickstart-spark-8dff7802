-- Add prediction_id column for evaluation logging tracking
-- This enables robust tracking from prediction to result reconciliation

ALTER TABLE public.predictions
  ADD COLUMN IF NOT EXISTS prediction_id TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS model_version TEXT DEFAULT 'v1.0';

-- Create index for fast lookups during reconciliation
CREATE INDEX IF NOT EXISTS idx_predictions_prediction_id ON public.predictions(prediction_id);

-- Add comments explaining the purpose
COMMENT ON COLUMN public.predictions.prediction_id IS 'Unique UUIDv4 identifier for tracking predictions through evaluation logging and result reconciliation';
COMMENT ON COLUMN public.predictions.model_version IS 'Model version identifier (git commit hash or version string) for performance tracking across code updates';