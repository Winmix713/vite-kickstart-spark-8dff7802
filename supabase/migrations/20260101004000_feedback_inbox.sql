-- Feedback inbox table for user suggestions and corrections
-- Migration: 20260101004000_feedback_inbox.sql

-- Create feedback table
CREATE TABLE IF NOT EXISTS public.feedback (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    prediction_id uuid NOT NULL REFERENCES public.predictions(id) ON DELETE CASCADE,
    user_suggestion text NOT NULL,
    submitted_by uuid REFERENCES public.user_profiles(id),
    metadata jsonb DEFAULT '{}',
    resolved boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_feedback_created_at_desc ON public.feedback (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_prediction_id ON public.feedback (prediction_id);
CREATE INDEX IF NOT EXISTS idx_feedback_submitted_by ON public.feedback (submitted_by);
CREATE INDEX IF NOT EXISTS idx_feedback_resolved ON public.feedback (resolved);

-- Enable Row Level Security
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- 1. Authenticated users can insert their own feedback
CREATE POLICY "Users can insert own feedback" ON public.feedback
    FOR INSERT
    TO authenticated
    WITH CHECK (submitted_by = auth.uid());

-- 2. Admins and analysts can select all feedback
CREATE POLICY "Admins and analysts can select all feedback" ON public.feedback
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'analyst')
        )
    );

-- 3. Only admins can update/delete feedback
CREATE POLICY "Admins can update feedback" ON public.feedback
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

CREATE POLICY "Admins can delete feedback" ON public.feedback
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handle_feedback_updated_at
    BEFORE UPDATE ON public.feedback
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Audit logging function for feedback actions
CREATE OR REPLACE FUNCTION public.log_audit_action(
  p_action TEXT,
  p_resource_type TEXT,
  p_resource_id TEXT,
  p_details JSONB DEFAULT '{}'::jsonb
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $func$
BEGIN
  INSERT INTO public.admin_audit_log (
    user_id,
    action,
    details,
    created_at,
    ip_address
  ) VALUES (
    auth.uid(),
    p_action,
    jsonb_build_object(
      'resource_type', p_resource_type,
      'resource_id', p_resource_id,
      'details', p_details
    ),
    NOW(),
    inet_client_addr()
  );
END;
$func$;

-- Grant necessary permissions
GRANT ALL ON public.feedback TO authenticated;
GRANT SELECT ON public.feedback TO anon;
GRANT EXECUTE ON FUNCTION public.log_audit_action TO authenticated;