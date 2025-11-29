-- Comprehensive RLS Policies Migration
-- This migration implements proper row-level security for all tables

-- 1. FORCE ROW LEVEL SECURITY on all tables
ALTER TABLE public.leagues FORCE ROW LEVEL SECURITY;
ALTER TABLE public.teams FORCE ROW LEVEL SECURITY;
ALTER TABLE public.matches FORCE ROW LEVEL SECURITY;
ALTER TABLE public.pattern_templates FORCE ROW LEVEL SECURITY;
ALTER TABLE public.detected_patterns FORCE ROW LEVEL SECURITY;
ALTER TABLE public.predictions FORCE ROW LEVEL SECURITY;
ALTER TABLE public.pattern_accuracy FORCE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_jobs FORCE ROW LEVEL SECURITY;
ALTER TABLE public.job_execution_logs FORCE ROW LEVEL SECURITY;
ALTER TABLE public.model_performance FORCE ROW LEVEL SECURITY;
ALTER TABLE public.model_comparison FORCE ROW LEVEL SECURITY;
ALTER TABLE public.team_patterns FORCE ROW LEVEL SECURITY;
ALTER TABLE public.pattern_definitions FORCE ROW LEVEL SECURITY;
ALTER TABLE public.cross_league_correlations FORCE ROW LEVEL SECURITY;
ALTER TABLE public.meta_patterns FORCE ROW LEVEL SECURITY;
ALTER TABLE public.league_characteristics FORCE ROW LEVEL SECURITY;
ALTER TABLE public.system_health FORCE ROW LEVEL SECURITY;
ALTER TABLE public.performance_metrics FORCE ROW LEVEL SECURITY;
ALTER TABLE public.computation_graph FORCE ROW LEVEL SECURITY;
ALTER TABLE public.user_predictions FORCE ROW LEVEL SECURITY;
ALTER TABLE public.crowd_wisdom FORCE ROW LEVEL SECURITY;
ALTER TABLE public.market_odds FORCE ROW LEVEL SECURITY;
ALTER TABLE public.value_bets FORCE ROW LEVEL SECURITY;
ALTER TABLE public.information_freshness FORCE ROW LEVEL SECURITY;
ALTER TABLE public.feature_experiments FORCE ROW LEVEL SECURITY;

-- 2. Drop all existing permissive policies
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND policyname LIKE 'Enable % for all users'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 
                      policy_record.policyname, policy_record.tablename);
    END LOOP;
END $$;

-- 3. Public Reference Data Tables (leagues, teams, pattern_templates)
-- Leagues table policies
CREATE POLICY "Public read access to leagues" ON public.leagues
  FOR SELECT USING (true);

CREATE POLICY "Admin full access to leagues" ON public.leagues
  FOR ALL USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Teams table policies  
CREATE POLICY "Public read access to teams" ON public.teams
  FOR SELECT USING (true);

CREATE POLICY "Admin full access to teams" ON public.teams
  FOR ALL USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Pattern templates table policies
CREATE POLICY "Public read access to pattern templates" ON public.pattern_templates
  FOR SELECT USING (true);

CREATE POLICY "Admin full access to pattern templates" ON public.pattern_templates
  FOR ALL USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Pattern definitions table policies (analysts can read, admins full)
CREATE POLICY "Analysts read access to pattern definitions" ON public.pattern_definitions
  FOR SELECT USING (public.is_analyst());

CREATE POLICY "Admin full access to pattern definitions" ON public.pattern_definitions
  FOR ALL USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 4. Match Data Tables
-- Matches table policies (public read, admin write)
CREATE POLICY "Public read access to matches" ON public.matches
  FOR SELECT USING (true);

CREATE POLICY "Admin full access to matches" ON public.matches
  FOR ALL USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 5. User-Owned Data Tables (with row-level security)
-- Detected patterns table policies
CREATE POLICY "Users read own detected patterns" ON public.detected_patterns
  FOR SELECT USING (created_by = auth.uid() OR created_by IS NULL);

CREATE POLICY "Analysts read all detected patterns" ON public.detected_patterns
  FOR SELECT USING (public.is_analyst());

CREATE POLICY "Service write access to detected patterns" ON public.detected_patterns
  FOR INSERT WITH CHECK (public.is_service_role() OR created_by = auth.uid());

CREATE POLICY "Users update own detected patterns" ON public.detected_patterns
  FOR UPDATE USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Analysts update detected patterns" ON public.detected_patterns
  FOR UPDATE USING (public.is_analyst())
  WITH CHECK (public.is_analyst());

CREATE POLICY "Admins delete detected patterns" ON public.detected_patterns
  FOR DELETE USING (public.is_admin());

-- Team patterns table policies
CREATE POLICY "Users read own team patterns" ON public.team_patterns
  FOR SELECT USING (created_by = auth.uid() OR created_by IS NULL);

CREATE POLICY "Analysts read all team patterns" ON public.team_patterns
  FOR SELECT USING (public.is_analyst());

CREATE POLICY "Service write access to team patterns" ON public.team_patterns
  FOR INSERT WITH CHECK (public.is_service_role() OR created_by = auth.uid());

CREATE POLICY "Users update own team patterns" ON public.team_patterns
  FOR UPDATE USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Analysts update team patterns" ON public.team_patterns
  FOR UPDATE USING (public.is_analyst())
  WITH CHECK (public.is_analyst());

CREATE POLICY "Admins delete team patterns" ON public.team_patterns
  FOR DELETE USING (public.is_admin());

-- User predictions table policies
CREATE POLICY "Users full access to own predictions" ON public.user_predictions
  FOR ALL USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Analysts read all user predictions" ON public.user_predictions
  FOR SELECT USING (public.is_analyst());

CREATE POLICY "Admins full access to user predictions" ON public.user_predictions
  FOR ALL USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 6. System Prediction Data Tables
-- Predictions table policies (public read, service write)
CREATE POLICY "Public read access to predictions" ON public.predictions
  FOR SELECT USING (true);

CREATE POLICY "Service write access to predictions" ON public.predictions
  FOR INSERT WITH CHECK (public.is_service_role());

CREATE POLICY "Service update access to predictions" ON public.predictions
  FOR UPDATE USING (public.is_service_role())
  WITH CHECK (public.is_service_role());

CREATE POLICY "Admins full access to predictions" ON public.predictions
  FOR ALL USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Pattern accuracy table policies (public read, service write)
CREATE POLICY "Public read access to pattern accuracy" ON public.pattern_accuracy
  FOR SELECT USING (true);

CREATE POLICY "Service write access to pattern accuracy" ON public.pattern_accuracy
  FOR INSERT WITH CHECK (public.is_service_role());

CREATE POLICY "Service update access to pattern accuracy" ON public.pattern_accuracy
  FOR UPDATE USING (public.is_service_role())
  WITH CHECK (public.is_service_role());

CREATE POLICY "Admins full access to pattern accuracy" ON public.pattern_accuracy
  FOR ALL USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 7. System Operational Tables (Service/Admin only)
-- Scheduled jobs table policies
CREATE POLICY "Service read access to scheduled jobs" ON public.scheduled_jobs
  FOR SELECT USING (public.is_service_role() OR public.is_admin());

CREATE POLICY "Service full access to scheduled jobs" ON public.scheduled_jobs
  FOR INSERT WITH CHECK (public.is_service_role() OR public.is_admin());

CREATE POLICY "Service update access to scheduled jobs" ON public.scheduled_jobs
  FOR UPDATE USING (public.is_service_role() OR public.is_admin())
  WITH CHECK (public.is_service_role() OR public.is_admin());

CREATE POLICY "Admins delete scheduled jobs" ON public.scheduled_jobs
  FOR DELETE USING (public.is_admin());

-- Job execution logs table policies
CREATE POLICY "Service read access to job execution logs" ON public.job_execution_logs
  FOR SELECT USING (public.is_service_role() OR public.is_admin());

CREATE POLICY "Service write access to job execution logs" ON public.job_execution_logs
  FOR INSERT WITH CHECK (public.is_service_role() OR public.is_admin());

CREATE POLICY "Admins full access to job execution logs" ON public.job_execution_logs
  FOR ALL USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 8. Analytics Tables (Analyst read, Admin full)
-- Model performance table policies
CREATE POLICY "Analysts read model performance" ON public.model_performance
  FOR SELECT USING (public.is_analyst());

CREATE POLICY "Admins full access to model performance" ON public.model_performance
  FOR ALL USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Model comparison table policies
CREATE POLICY "Analysts read model comparison" ON public.model_comparison
  FOR SELECT USING (public.is_analyst());

CREATE POLICY "Admins full access to model comparison" ON public.model_comparison
  FOR ALL USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Cross league correlations table policies
CREATE POLICY "Analysts read cross league correlations" ON public.cross_league_correlations
  FOR SELECT USING (public.is_analyst());

CREATE POLICY "Admins full access to cross league correlations" ON public.cross_league_correlations
  FOR ALL USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Meta patterns table policies
CREATE POLICY "Analysts read meta patterns" ON public.meta_patterns
  FOR SELECT USING (public.is_analyst());

CREATE POLICY "Admins full access to meta patterns" ON public.meta_patterns
  FOR ALL USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- League characteristics table policies
CREATE POLICY "Analysts read league characteristics" ON public.league_characteristics
  FOR SELECT USING (public.is_analyst());

CREATE POLICY "Admins full access to league characteristics" ON public.league_characteristics
  FOR ALL USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 9. Monitoring Tables (Analyst read, Admin full)
-- System health table policies
CREATE POLICY "Analysts read system health" ON public.system_health
  FOR SELECT USING (public.is_analyst());

CREATE POLICY "Service write access to system health" ON public.system_health
  FOR INSERT WITH CHECK (public.is_service_role() OR public.is_admin());

CREATE POLICY "Admins full access to system health" ON public.system_health
  FOR ALL USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Performance metrics table policies
CREATE POLICY "Analysts read performance metrics" ON public.performance_metrics
  FOR SELECT USING (public.is_analyst());

CREATE POLICY "Service write access to performance metrics" ON public.performance_metrics
  FOR INSERT WITH CHECK (public.is_service_role() OR public.is_admin());

CREATE POLICY "Admins full access to performance metrics" ON public.performance_metrics
  FOR ALL USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Computation graph table policies (admin only)
CREATE POLICY "Admins full access to computation graph" ON public.computation_graph
  FOR ALL USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 10. Phase 9 Advanced Features Tables
-- Crowd wisdom table policies (public read, service write)
CREATE POLICY "Public read access to crowd wisdom" ON public.crowd_wisdom
  FOR SELECT USING (true);

CREATE POLICY "Service write access to crowd wisdom" ON public.crowd_wisdom
  FOR INSERT WITH CHECK (public.is_service_role());

CREATE POLICY "Service update access to crowd wisdom" ON public.crowd_wisdom
  FOR UPDATE USING (public.is_service_role())
  WITH CHECK (public.is_service_role());

CREATE POLICY "Admins full access to crowd wisdom" ON public.crowd_wisdom
  FOR ALL USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Market odds table policies (public read, service write)
CREATE POLICY "Public read access to market odds" ON public.market_odds
  FOR SELECT USING (true);

CREATE POLICY "Service write access to market odds" ON public.market_odds
  FOR INSERT WITH CHECK (public.is_service_role());

CREATE POLICY "Service update access to market odds" ON public.market_odds
  FOR UPDATE USING (public.is_service_role())
  WITH CHECK (public.is_service_role());

CREATE POLICY "Admins full access to market odds" ON public.market_odds
  FOR ALL USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Value bets table policies (public read, service write)
CREATE POLICY "Public read access to value bets" ON public.value_bets
  FOR SELECT USING (true);

CREATE POLICY "Service write access to value bets" ON public.value_bets
  FOR INSERT WITH CHECK (public.is_service_role());

CREATE POLICY "Service update access to value bets" ON public.value_bets
  FOR UPDATE USING (public.is_service_role())
  WITH CHECK (public.is_service_role());

CREATE POLICY "Admins full access to value bets" ON public.value_bets
  FOR ALL USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Information freshness table policies (service/admin only)
CREATE POLICY "Service read access to information freshness" ON public.information_freshness
  FOR SELECT USING (public.is_service_role() OR public.is_admin());

CREATE POLICY "Service write access to information freshness" ON public.information_freshness
  FOR INSERT WITH CHECK (public.is_service_role() OR public.is_admin());

CREATE POLICY "Service update access to information freshness" ON public.information_freshness
  FOR UPDATE USING (public.is_service_role() OR public.is_admin())
  WITH CHECK (public.is_service_role() OR public.is_admin());

CREATE POLICY "Admins full access to information freshness" ON public.information_freshness
  FOR ALL USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Feature experiments table policies (analysts read/write, admins full)
CREATE POLICY "Analysts read feature experiments" ON public.feature_experiments
  FOR SELECT USING (public.is_analyst());

CREATE POLICY "Analysts write feature experiments" ON public.feature_experiments
  FOR INSERT WITH CHECK (public.is_analyst());

CREATE POLICY "Analysts update feature experiments" ON public.feature_experiments
  FOR UPDATE USING (public.is_analyst())
  WITH CHECK (public.is_analyst());

CREATE POLICY "Admins full access to feature experiments" ON public.feature_experiments
  FOR ALL USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 11. Create comprehensive security views for easier access control
-- Create a view for public data that anonymous users can access
CREATE OR REPLACE VIEW public.public_data AS
SELECT 
  'leagues' as table_name, id, name, country, season, created_at 
FROM public.leagues
UNION ALL
SELECT 
  'teams' as table_name, id, name, league_id::text, created_at, NULL::text
FROM public.teams
UNION ALL
SELECT 
  'matches' as table_name, id, league_id::text, home_team_id::text, created_at, away_team_id::text
FROM public.matches;

COMMENT ON VIEW public.public_data IS 'Aggregated view of public data for anonymous access';

-- Grant public access to the view
GRANT SELECT ON public.public_data TO anon;

-- 12. Create security audit function
CREATE OR REPLACE FUNCTION public.audit_access(
  p_table_name TEXT,
  p_operation TEXT,
  p_user_id UUID DEFAULT auth.uid()
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log access attempt for audit purposes
  -- This would typically insert into an audit_log table
  -- For now, we'll just raise a notice for debugging
  RAISE NOTICE 'Security Audit: User % attempted % on table % at %', 
    p_user_id, p_operation, p_table_name, NOW();
END;
$$;