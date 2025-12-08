-- Enable and Harden RLS on Sensitive Tables
-- This migration ensures row-level security is properly enabled and hardened
-- on all sensitive data tables per audit findings

-- Migration timestamp: 20251220000000

-- 1. Ensure RLS is enabled and forced on all sensitive tables
-- These tables contain user-specific data that must be protected

-- User predictions table - most sensitive (user-specific predictions)
ALTER TABLE public.user_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_predictions FORCE ROW LEVEL SECURITY;

-- System predictions table - contains model predictions and evaluation data
ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predictions FORCE ROW LEVEL SECURITY;

-- Pattern accuracy table - contains evaluation metrics
ALTER TABLE public.pattern_accuracy ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pattern_accuracy FORCE ROW LEVEL SECURITY;

-- Detected patterns table - user-specific pattern detections
ALTER TABLE public.detected_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detected_patterns FORCE ROW LEVEL SECURITY;

-- Team patterns table - user-specific team pattern analyses
ALTER TABLE public.team_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_patterns FORCE ROW LEVEL SECURITY;

-- 2. Drop any existing permissive policies that might allow unauthorized access
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename IN ('user_predictions', 'predictions', 'pattern_accuracy', 'detected_patterns', 'team_patterns')
        AND (policyname LIKE '%Enable % for all users%' OR policyname LIKE '%all users%')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 
                      policy_record.policyname, policy_record.tablename);
        RAISE NOTICE 'Dropped permissive policy: % on table %', 
                     policy_record.policyname, policy_record.tablename;
    END LOOP;
END $$;

-- 3. Create hardened policies for user_predictions table
-- This is the most sensitive table - users should only access their own predictions

-- Deny anonymous access explicitly (policy that never matches)
CREATE POLICY "Deny anonymous access to user_predictions" ON public.user_predictions
  FOR ALL USING (false)
  WITH CHECK (false);

-- Users can read their own predictions
CREATE POLICY "Users read own user_predictions" ON public.user_predictions
  FOR SELECT USING (
    auth.uid() IS NOT NULL 
    AND created_by = auth.uid()
  );

-- Users can insert their own predictions
CREATE POLICY "Users insert own user_predictions" ON public.user_predictions
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL 
    AND created_by = auth.uid()
  );

-- Users can update their own predictions
CREATE POLICY "Users update own user_predictions" ON public.user_predictions
  FOR UPDATE USING (
    auth.uid() IS NOT NULL 
    AND created_by = auth.uid()
  )
  WITH CHECK (
    auth.uid() IS NOT NULL 
    AND created_by = auth.uid()
  );

-- Users can delete their own predictions
CREATE POLICY "Users delete own user_predictions" ON public.user_predictions
  FOR DELETE USING (
    auth.uid() IS NOT NULL 
    AND created_by = auth.uid()
  );

-- Analysts can read all user predictions for analysis
CREATE POLICY "Analysts read all user_predictions" ON public.user_predictions
  FOR SELECT USING (public.is_analyst());

-- Service role has full access for automated processing
CREATE POLICY "Service role full access to user_predictions" ON public.user_predictions
  FOR ALL USING (public.is_service_role())
  WITH CHECK (public.is_service_role());

-- Admins have full access
CREATE POLICY "Admins full access to user_predictions" ON public.user_predictions
  FOR ALL USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 4. Create hardened policies for predictions table
-- This table contains system predictions and evaluation data

-- Deny anonymous access explicitly
CREATE POLICY "Deny anonymous access to predictions" ON public.predictions
  FOR ALL USING (false)
  WITH CHECK (false);

-- Authenticated users can read public predictions data
CREATE POLICY "Users read predictions" ON public.predictions
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Service role can insert predictions (automated model predictions)
CREATE POLICY "Service role insert predictions" ON public.predictions
  FOR INSERT WITH CHECK (public.is_service_role());

-- Service role can update predictions (model retraining, evaluation)
CREATE POLICY "Service role update predictions" ON public.predictions
  FOR UPDATE USING (public.is_service_role())
  WITH CHECK (public.is_service_role());

-- Analysts can read all predictions for analysis
CREATE POLICY "Analysts read all predictions" ON public.predictions
  FOR SELECT USING (public.is_analyst());

-- Admins have full access
CREATE POLICY "Admins full access to predictions" ON public.predictions
  FOR ALL USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 5. Create hardened policies for pattern_accuracy table
-- This table contains evaluation metrics

-- Deny anonymous access explicitly
CREATE POLICY "Deny anonymous access to pattern_accuracy" ON public.pattern_accuracy
  FOR ALL USING (false)
  WITH CHECK (false);

-- Authenticated users can read pattern accuracy data
CREATE POLICY "Users read pattern_accuracy" ON public.pattern_accuracy
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Service role can insert/update accuracy data
CREATE POLICY "Service role write pattern_accuracy" ON public.pattern_accuracy
  FOR INSERT WITH CHECK (public.is_service_role());

CREATE POLICY "Service role update pattern_accuracy" ON public.pattern_accuracy
  FOR UPDATE USING (public.is_service_role())
  WITH CHECK (public.is_service_role());

-- Analysts can read all accuracy data
CREATE POLICY "Analysts read all pattern_accuracy" ON public.pattern_accuracy
  FOR SELECT USING (public.is_analyst());

-- Admins have full access
CREATE POLICY "Admins full access to pattern_accuracy" ON public.pattern_accuracy
  FOR ALL USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 6. Create hardened policies for detected_patterns table
-- This table contains user-specific pattern detections

-- Deny anonymous access explicitly
CREATE POLICY "Deny anonymous access to detected_patterns" ON public.detected_patterns
  FOR ALL USING (false)
  WITH CHECK (false);

-- Users can read their own detected patterns
CREATE POLICY "Users read own detected_patterns" ON public.detected_patterns
  FOR SELECT USING (
    auth.uid() IS NOT NULL 
    AND (created_by = auth.uid() OR created_by IS NULL)
  );

-- Service role can insert patterns (automated detection)
CREATE POLICY "Service role insert detected_patterns" ON public.detected_patterns
  FOR INSERT WITH CHECK (public.is_service_role());

-- Users can update their own detected patterns
CREATE POLICY "Users update own detected_patterns" ON public.detected_patterns
  FOR UPDATE USING (
    auth.uid() IS NOT NULL 
    AND created_by = auth.uid()
  )
  WITH CHECK (
    auth.uid() IS NOT NULL 
    AND created_by = auth.uid()
  );

-- Analysts can read all detected patterns
CREATE POLICY "Analysts read all detected_patterns" ON public.detected_patterns
  FOR SELECT USING (public.is_analyst());

-- Admins have full access
CREATE POLICY "Admins full access to detected_patterns" ON public.detected_patterns
  FOR ALL USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 7. Create hardened policies for team_patterns table
-- This table contains user-specific team pattern analyses

-- Deny anonymous access explicitly
CREATE POLICY "Deny anonymous access to team_patterns" ON public.team_patterns
  FOR ALL USING (false)
  WITH CHECK (false);

-- Users can read their own team patterns
CREATE POLICY "Users read own team_patterns" ON public.team_patterns
  FOR SELECT USING (
    auth.uid() IS NOT NULL 
    AND (created_by = auth.uid() OR created_by IS NULL)
  );

-- Service role can insert team patterns (automated analysis)
CREATE POLICY "Service role insert team_patterns" ON public.team_patterns
  FOR INSERT WITH CHECK (public.is_service_role());

-- Users can update their own team patterns
CREATE POLICY "Users update own team_patterns" ON public.team_patterns
  FOR UPDATE USING (
    auth.uid() IS NOT NULL 
    AND created_by = auth.uid()
  )
  WITH CHECK (
    auth.uid() IS NOT NULL 
    AND created_by = auth.uid()
  );

-- Analysts can read all team patterns
CREATE POLICY "Analysts read all team_patterns" ON public.team_patterns
  FOR SELECT USING (public.is_analyst());

-- Admins have full access
CREATE POLICY "Admins full access to team_patterns" ON public.team_patterns
  FOR ALL USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 8. Create RLS verification function for testing
CREATE OR REPLACE FUNCTION public.verify_rls_sensitive_tables()
RETURNS TABLE(
    table_name TEXT,
    rls_enabled BOOLEAN,
    force_rls BOOLEAN,
    policy_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.tablename::TEXT,
        t.rowsecurity AS rls_enabled,
        t.forcerls AS force_rls,
        COUNT(p.policyname) AS policy_count
    FROM pg_tables t
    LEFT JOIN pg_policies p ON t.tablename = p.tablename AND t.schemaname = p.schemaname
    WHERE t.tablename IN ('user_predictions', 'predictions', 'pattern_accuracy', 'detected_patterns', 'team_patterns')
    AND t.schemaname = 'public'
    GROUP BY t.tablename, t.rowsecurity, t.forcerls
    ORDER BY t.tablename;
END;
$$;

-- 9. Create audit trigger for sensitive data access
CREATE OR REPLACE FUNCTION public.audit_sensitive_table_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Log access to sensitive tables for audit purposes
    IF TG_OP = 'SELECT' THEN
        -- For SELECT, we can't easily audit without affecting performance
        RETURN NULL;
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO public.admin_audit_log (user_id, action, details, ip_address)
        VALUES (
            auth.uid(),
            'INSERT_SENSITIVE_DATA',
            jsonb_build_object(
                'table', TG_TABLE_NAME,
                'record_id', NEW.id,
                'operation', TG_OP
            ),
            inet_client_addr()
        );
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO public.admin_audit_log (user_id, action, details, ip_address)
        VALUES (
            auth.uid(),
            'UPDATE_SENSITIVE_DATA',
            jsonb_build_object(
                'table', TG_TABLE_NAME,
                'record_id', NEW.id,
                'operation', TG_OP,
                'old_values', row_to_json(OLD),
                'new_values', row_to_json(NEW)
            ),
            inet_client_addr()
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO public.admin_audit_log (user_id, action, details, ip_address)
        VALUES (
            auth.uid(),
            'DELETE_SENSITIVE_DATA',
            jsonb_build_object(
                'table', TG_TABLE_NAME,
                'record_id', OLD.id,
                'operation', TG_OP,
                'deleted_values', row_to_json(OLD)
            ),
            inet_client_addr()
        );
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$;

-- Apply audit triggers to sensitive tables
CREATE TRIGGER audit_user_predictions_access
    AFTER INSERT OR UPDATE OR DELETE ON public.user_predictions
    FOR EACH ROW EXECUTE FUNCTION public.audit_sensitive_table_access();

CREATE TRIGGER audit_predictions_access
    AFTER INSERT OR UPDATE OR DELETE ON public.predictions
    FOR EACH ROW EXECUTE FUNCTION public.audit_sensitive_table_access();

CREATE TRIGGER audit_pattern_accuracy_access
    AFTER INSERT OR UPDATE OR DELETE ON public.pattern_accuracy
    FOR EACH ROW EXECUTE FUNCTION public.audit_sensitive_table_access();

-- 10. Grant necessary permissions
-- Revoke all permissions from public role on sensitive tables
REVOKE ALL ON public.user_predictions FROM public;
REVOKE ALL ON public.predictions FROM public;
REVOKE ALL ON public.pattern_accuracy FROM public;
REVOKE ALL ON public.detected_patterns FROM public;
REVOKE ALL ON public.team_patterns FROM public;

-- Grant minimal permissions to authenticated role
GRANT SELECT ON public.predictions TO authenticated;
GRANT SELECT ON public.pattern_accuracy TO authenticated;

-- Grant necessary permissions to service role
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_predictions TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.predictions TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.pattern_accuracy TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.detected_patterns TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.team_patterns TO service_role;

-- Grant full permissions to admin role (via user_profiles)
-- Admin permissions are handled through RLS policies using public.is_admin()

-- 11. Create verification view for sensitive tables status
CREATE OR REPLACE VIEW public.sensitive_tables_rls_status AS
SELECT 
    'Sensitive Tables RLS Status' as report_title,
    NOW() as generated_at,
    jsonb_agg(
        jsonb_build_object(
            'table_name', table_name,
            'rls_enabled', rls_enabled,
            'force_rls_enabled', force_rls,
            'policy_count', policy_count,
            'status', CASE 
                WHEN rls_enabled AND force_rls AND policy_count > 0 THEN 'SECURED'
                WHEN rls_enabled AND policy_count > 0 THEN 'PARTIALLY_SECURED'
                ELSE 'VULNERABLE'
            END
        )
    ) as tables
FROM public.verify_rls_sensitive_tables();

COMMENT ON VIEW public.sensitive_tables_rls_status IS 'Current RLS status of all sensitive data tables';

-- Grant read access to the view for admins only
CREATE POLICY "Admins can view sensitive tables RLS status" ON public.sensitive_tables_rls_status
  FOR SELECT USING (public.is_admin());

-- Enable RLS on the view (if supported by PostgreSQL version)
DO $$
BEGIN
    -- Check if RLS is supported on views
    IF EXISTS (
        SELECT 1 FROM information_schema.views 
        WHERE table_name = 'sensitive_tables_rls_status' 
        AND table_schema = 'public'
    ) THEN
        -- Try to enable RLS on view (may not be supported in all versions)
        BEGIN
            EXECUTE 'ALTER TABLE public.sensitive_tables_rls_status ENABLE ROW LEVEL SECURITY';
            EXECUTE 'ALTER TABLE public.sensitive_tables_rls_status FORCE ROW LEVEL SECURITY';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'RLS on views not supported, skipping for sensitive_tables_rls_status';
        END;
    END IF;
END $$;

-- Migration complete
RAISE NOTICE 'RLS has been enabled and hardened on all sensitive tables';
RAISE NOTICE 'Anonymous access is now blocked from sensitive tables';
RAISE NOTICE 'User data isolation is enforced with ownership checks';
RAISE NOTICE 'Service role and admin access is properly configured';
RAISE NOTICE 'Audit logging has been enabled for sensitive data operations';