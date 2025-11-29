-- Create high_value_patterns table for rare but reliable pattern insights
CREATE TABLE IF NOT EXISTS public.high_value_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_key TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL,
  frequency_pct NUMERIC(5,2) NOT NULL CHECK (frequency_pct < 5.0),
  accuracy_pct NUMERIC(5,2) NOT NULL CHECK (accuracy_pct >= 80.0),
  sample_size INTEGER NOT NULL CHECK (sample_size >= 5),
  supporting_matches JSONB NOT NULL DEFAULT '[]'::jsonb,
  discovered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  highlight_text TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_hvp_active ON public.high_value_patterns(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_hvp_expiry ON public.high_value_patterns(expires_at);
CREATE INDEX IF NOT EXISTS idx_hvp_pattern_key ON public.high_value_patterns(pattern_key);

-- Enable RLS
ALTER TABLE public.high_value_patterns ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Authenticated users can read patterns" ON public.high_value_patterns;
DROP POLICY IF EXISTS "Service role can write patterns" ON public.high_value_patterns;

-- RLS Policy: Authenticated users can read active patterns
CREATE POLICY "Authenticated users can read patterns"
  ON public.high_value_patterns FOR SELECT
  USING (auth.role() = 'authenticated' OR is_active = true);

-- RLS Policy: Service role can write patterns (insert/update/delete)
CREATE POLICY "Service role can write patterns"
  ON public.high_value_patterns FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Create function to automatically mark expired patterns as inactive
CREATE OR REPLACE FUNCTION public.deactivate_expired_patterns()
RETURNS void AS $$
BEGIN
  UPDATE public.high_value_patterns
  SET is_active = false, updated_at = now()
  WHERE is_active = true AND expires_at < now();
END;
$$ LANGUAGE plpgsql;

-- Create view for active, non-expired patterns
CREATE OR REPLACE VIEW public.active_high_value_patterns AS
SELECT *
FROM public.high_value_patterns
WHERE is_active = true AND expires_at > now()
ORDER BY discovered_at DESC;
