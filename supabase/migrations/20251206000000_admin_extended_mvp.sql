-- Admin Panel Extended MVP Migration
-- This migration adds support for environment variables and audit logging

-- 1. Environment Variables Table
CREATE TABLE public.environment_variables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  description TEXT,
  is_secret BOOLEAN DEFAULT false,
  category TEXT DEFAULT 'general',
  created_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.environment_variables IS 'Stores environment variables and configuration with support for secret masking';
COMMENT ON COLUMN public.environment_variables.key IS 'Unique environment variable key';
COMMENT ON COLUMN public.environment_variables.value IS 'Environment variable value (masked if is_secret=true)';
COMMENT ON COLUMN public.environment_variables.description IS 'Human-readable description of the variable';
COMMENT ON COLUMN public.environment_variables.is_secret IS 'Whether this variable contains sensitive data';
COMMENT ON COLUMN public.environment_variables.category IS 'Category for grouping variables (e.g., database, api, external)';

CREATE INDEX idx_environment_variables_key ON public.environment_variables(key);
CREATE INDEX idx_environment_variables_category ON public.environment_variables(category);
CREATE INDEX idx_environment_variables_is_secret ON public.environment_variables(is_secret);

-- 2. Audit Log Table
CREATE TABLE public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  table_name TEXT,
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.audit_log IS 'Audit trail for all admin actions and data changes';
COMMENT ON COLUMN public.audit_log.action IS 'Action performed (CREATE, UPDATE, DELETE, ACTIVATE, DEACTIVATE, etc.)';
COMMENT ON COLUMN public.audit_log.table_name IS 'Table that was affected';
COMMENT ON COLUMN public.audit_log.record_id IS 'Primary key of the affected record';
COMMENT ON COLUMN public.audit_log.old_values IS 'Previous values before the change';
COMMENT ON COLUMN public.audit_log.new_values IS 'New values after the change';
COMMENT ON COLUMN public.audit_log.ip_address IS 'IP address of the user';
COMMENT ON COLUMN public.audit_log.user_agent IS 'Browser user agent';

CREATE INDEX idx_audit_log_user_id ON public.audit_log(user_id);
CREATE INDEX idx_audit_log_action ON public.audit_log(action);
CREATE INDEX idx_audit_log_table_name ON public.audit_log(table_name);
CREATE INDEX idx_audit_log_created_at ON public.audit_log(created_at DESC);

-- 3. Updated trigger function for updated_at
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Add updated_at trigger to environment_variables
CREATE TRIGGER trg_touch_environment_variables_updated_at
BEFORE UPDATE ON public.environment_variables
FOR EACH ROW
EXECUTE FUNCTION public.touch_updated_at();

-- 4. Audit logging function
CREATE OR REPLACE FUNCTION public.log_audit_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_action TEXT;
  v_old_values JSONB;
  v_new_values JSONB;
BEGIN
  -- Determine action type
  IF TG_OP = 'INSERT' THEN
    v_action := 'CREATE';
    v_old_values := NULL;
    v_new_values := to_jsonb(NEW);
  ELSIF TG_OP = 'UPDATE' THEN
    v_action := 'UPDATE';
    v_old_values := to_jsonb(OLD);
    v_new_values := to_jsonb(NEW);
  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'DELETE';
    v_old_values := to_jsonb(OLD);
    v_new_values := NULL;
  END IF;

  -- Insert audit log entry
  INSERT INTO public.audit_log (
    user_id,
    action,
    table_name,
    record_id,
    old_values,
    new_values,
    ip_address,
    user_agent
  ) VALUES (
    auth.uid(),
    v_action,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    v_old_values,
    v_new_values,
    inet_client_addr(),
    current_setting('request.headers')::json->>'user-agent'
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- 5. Add audit triggers to admin tables
-- Environment variables
CREATE TRIGGER trg_audit_environment_variables
AFTER INSERT OR UPDATE OR DELETE ON public.environment_variables
FOR EACH ROW EXECUTE FUNCTION public.log_audit_change();

-- Scheduled jobs
CREATE TRIGGER trg_audit_scheduled_jobs
AFTER INSERT OR UPDATE OR DELETE ON public.scheduled_jobs
FOR EACH ROW EXECUTE FUNCTION public.log_audit_change();

-- Model registry (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'model_registry') THEN
    CREATE TRIGGER trg_audit_model_registry
    AFTER INSERT OR UPDATE OR DELETE ON public.model_registry
    FOR EACH ROW EXECUTE FUNCTION public.log_audit_change();
  END IF;
END $$;

-- Matches
CREATE TRIGGER trg_audit_matches
AFTER INSERT OR UPDATE OR DELETE ON public.matches
FOR EACH ROW EXECUTE FUNCTION public.log_audit_change();

-- 6. RLS Policies for Environment Variables
ALTER TABLE public.environment_variables ENABLE ROW LEVEL SECURITY;

-- Only admins can manage environment variables
CREATE POLICY "Admins full access to environment variables" ON public.environment_variables
  FOR ALL USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Service role can read environment variables
CREATE POLICY "Service read access to environment variables" ON public.environment_variables
  FOR SELECT USING (public.is_service_role() OR public.is_admin());

-- 7. RLS Policies for Audit Log
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins full access to audit log" ON public.audit_log
  FOR ALL USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Service role can insert audit logs
CREATE POLICY "Service insert access to audit log" ON public.audit_log
  FOR INSERT WITH CHECK (public.is_service_role());

-- 8. Seed default environment variables
INSERT INTO public.environment_variables (key, value, description, is_secret, category)
VALUES
  ('APP_NAME', 'WinMix TipsterHub', 'Application name', false, 'general'),
  ('APP_VERSION', '1.0.0', 'Current application version', false, 'general'),
  ('LOG_LEVEL', 'info', 'Logging level (debug, info, warn, error)', false, 'logging'),
  ('MAX_PREDICTIONS_PER_DAY', '100', 'Maximum predictions allowed per user per day', false, 'limits'),
  ('PREDICTION_CONFIDENCE_THRESHOLD', '0.7', 'Minimum confidence threshold for predictions', false, 'ai'),
  ('DATA_REFRESH_INTERVAL', '3600', 'Data refresh interval in seconds', false, 'data'),
  ('API_RATE_LIMIT', '1000', 'API rate limit per hour', false, 'api'),
  ('SMTP_HOST', 'smtp.example.com', 'SMTP server host', false, 'email'),
  ('SMTP_PORT', '587', 'SMTP server port', false, 'email'),
  ('SMTP_USERNAME', 'noreply@winmix.com', 'SMTP username', false, 'email'),
  ('SMTP_PASSWORD', 'your_smtp_password', 'SMTP password', true, 'email'),
  ('DATABASE_URL', 'postgresql://user:pass@host:port/db', 'Database connection string', true, 'database'),
  ('REDIS_URL', 'redis://localhost:6379', 'Redis connection URL', true, 'cache'),
  ('SECRET_KEY', 'your_secret_key_here', 'Application secret key', true, 'security');

-- 9. Helper function to mask secret values
CREATE OR REPLACE FUNCTION public.mask_secret_value(
  p_value TEXT,
  p_is_secret BOOLEAN
)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF p_is_secret THEN
    RETURN '••••••••';
  ELSE
    RETURN p_value;
  END IF;
END;
$$;

-- 10. View for safe environment variable access
CREATE OR REPLACE VIEW public.environment_variables_safe AS
SELECT 
  id,
  key,
  CASE 
    WHEN is_secret THEN '••••••••'
    ELSE value 
  END as value,
  description,
  is_secret,
  category,
  created_by,
  created_at,
  updated_at
FROM public.environment_variables;

COMMENT ON VIEW public.environment_variables_safe IS 'Safe view of environment variables with secrets masked';

-- Grant access to safe view
GRANT SELECT ON public.environment_variables_safe TO authenticated;
GRANT SELECT ON public.environment_variables_safe TO service_role;