-- Admin MVP settings panel foundational schema
SET search_path = public;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1) Audit log for administrative actions
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address TEXT
);

COMMENT ON TABLE public.admin_audit_log IS 'Tracks critical administrative actions for auditing purposes.';
COMMENT ON COLUMN public.admin_audit_log.action IS 'Machine-readable action identifier.';
COMMENT ON COLUMN public.admin_audit_log.details IS 'JSON payload describing the action context.';

CREATE INDEX IF NOT EXISTS admin_audit_log_created_at_idx ON public.admin_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS admin_audit_log_action_idx ON public.admin_audit_log(action);

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Audit log - insert own entries" ON public.admin_audit_log
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Audit log - view own entries" ON public.admin_audit_log
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Audit log - admins can view all" ON public.admin_audit_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid() AND up.role = 'admin'
    )
  );

CREATE POLICY "Audit log - service role full access" ON public.admin_audit_log
  FOR ALL
  USING (public.is_service_role())
  WITH CHECK (public.is_service_role());

-- 2) Phase 9 settings singleton table
CREATE TABLE IF NOT EXISTS public.phase9_settings (
  id INT PRIMARY KEY DEFAULT 1,
  collaborative_intelligence_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  temporal_decay_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  temporal_decay_rate NUMERIC NOT NULL DEFAULT 0.1,
  freshness_check_seconds INT NOT NULL DEFAULT 60,
  staleness_threshold_days INT NOT NULL DEFAULT 7,
  market_integration_mode TEXT NOT NULL DEFAULT 'test',
  market_api_key TEXT,
  cross_league_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  cross_league_league_count INT NOT NULL DEFAULT 5,
  cross_league_depth TEXT NOT NULL DEFAULT 'medium',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.phase9_settings IS 'Singleton configuration record for Phase 9 collaborative intelligence settings.';

CREATE OR REPLACE FUNCTION public.ensure_phase9_settings_singleton()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.id := 1;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.touch_phase9_settings_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_phase9_settings_singleton
  BEFORE INSERT ON public.phase9_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_phase9_settings_singleton();

CREATE TRIGGER trg_phase9_settings_updated_at
  BEFORE UPDATE ON public.phase9_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_phase9_settings_updated_at();

INSERT INTO public.phase9_settings (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.phase9_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Phase9 settings - select admin or analyst" ON public.phase9_settings
  FOR SELECT
  USING (public.current_app_role() IN ('admin', 'analyst'));

CREATE POLICY "Phase9 settings - update admin or analyst" ON public.phase9_settings
  FOR UPDATE
  USING (public.current_app_role() IN ('admin', 'analyst'))
  WITH CHECK (public.current_app_role() IN ('admin', 'analyst'));

CREATE POLICY "Phase9 settings - insert admin" ON public.phase9_settings
  FOR INSERT
  WITH CHECK (public.current_app_role() = 'admin');

-- 3) Admin invites table for onboarding
CREATE TABLE IF NOT EXISTS public.admin_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'analyst', 'user')),
  token TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.admin_invites IS 'Stores pending administrative invitations awaiting acceptance.';

CREATE INDEX IF NOT EXISTS admin_invites_status_idx ON public.admin_invites(status);

ALTER TABLE public.admin_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin invites - admin manage" ON public.admin_invites
  FOR ALL
  USING (public.current_app_role() = 'admin')
  WITH CHECK (public.current_app_role() = 'admin');
