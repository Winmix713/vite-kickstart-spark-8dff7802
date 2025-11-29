-- ============================================================================
-- Comprehensive SQL Migration: Complete Schema, RBAC, Functions, Triggers, RLS
-- ============================================================================
-- 
-- This migration provides a comprehensive, production-ready implementation of:
-- 1. Complete database schema with all core entities
-- 2. Role-Based Access Control (RBAC) system
-- 3. Helper and computation functions
-- 4. Triggers for data consistency and audit logging
-- 5. Row Level Security (RLS) policies
-- 6. Seed data for initial setup
--
-- Migration Version: 1.0
-- Date: 2026-01-20
-- Database: PostgreSQL 15+ (Supabase)
--
-- ============================================================================

SET search_path = public;
SET statement_timeout = '60s';

-- ============================================================================
-- SECTION 1: DATABASE SCHEMA
-- ============================================================================

-- 1.1 Leagues Table
CREATE TABLE IF NOT EXISTS public.leagues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  country TEXT NOT NULL,
  season TEXT NOT NULL,
  avg_goals_per_match DECIMAL(3,2) DEFAULT 2.5,
  home_win_percentage DECIMAL(5,2) DEFAULT 45.0,
  btts_percentage DECIMAL(5,2) DEFAULT 50.0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_league_season UNIQUE (name, season),
  CONSTRAINT valid_avg_goals CHECK (avg_goals_per_match > 0),
  CONSTRAINT valid_home_win CHECK (home_win_percentage >= 0 AND home_win_percentage <= 100),
  CONSTRAINT valid_btts CHECK (btts_percentage >= 0 AND btts_percentage <= 100)
);

COMMENT ON TABLE public.leagues IS 'Stores league information and aggregate statistics used in predictions';
COMMENT ON COLUMN public.leagues.avg_goals_per_match IS 'Historical average goals per match in this league';

CREATE INDEX IF NOT EXISTS idx_leagues_name ON public.leagues(name);
CREATE INDEX IF NOT EXISTS idx_leagues_season ON public.leagues(season);

-- 1.2 Teams Table
CREATE TABLE IF NOT EXISTS public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  league_id UUID NOT NULL REFERENCES public.leagues(id) ON DELETE CASCADE,
  logo_url TEXT,
  founded_year INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_team_in_league UNIQUE (name, league_id),
  CONSTRAINT valid_founded_year CHECK (founded_year IS NULL OR founded_year > 1800)
);

COMMENT ON TABLE public.teams IS 'Stores team information organized by league';

CREATE INDEX IF NOT EXISTS idx_teams_league_id ON public.teams(league_id);
CREATE INDEX IF NOT EXISTS idx_teams_name ON public.teams(name);

-- 1.3 Matches Table
CREATE TABLE IF NOT EXISTS public.matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id UUID NOT NULL REFERENCES public.leagues(id) ON DELETE CASCADE,
  home_team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  away_team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  match_date TIMESTAMPTZ NOT NULL,
  home_score INTEGER,
  away_score INTEGER,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'finished', 'postponed', 'cancelled')),
  venue TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_scores CHECK (status != 'finished' OR (home_score IS NOT NULL AND away_score IS NOT NULL)),
  CONSTRAINT different_teams CHECK (home_team_id != away_team_id)
);

COMMENT ON TABLE public.matches IS 'Core table storing match information, scores, and status';

CREATE INDEX IF NOT EXISTS idx_matches_date ON public.matches(match_date);
CREATE INDEX IF NOT EXISTS idx_matches_status ON public.matches(status);
CREATE INDEX IF NOT EXISTS idx_matches_league_id ON public.matches(league_id);
CREATE INDEX IF NOT EXISTS idx_matches_home_team ON public.matches(home_team_id);
CREATE INDEX IF NOT EXISTS idx_matches_away_team ON public.matches(away_team_id);
CREATE INDEX IF NOT EXISTS idx_matches_league_status ON public.matches(league_id, status);

-- 1.4 Pattern Templates Table
CREATE TABLE IF NOT EXISTS public.pattern_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('form', 'h2h', 'league', 'team_specific', 'seasonal')),
  base_confidence_boost DECIMAL(5,2) DEFAULT 5.0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_confidence CHECK (base_confidence_boost >= 0)
);

COMMENT ON TABLE public.pattern_templates IS 'Template definitions for pattern types used in prediction models';

CREATE INDEX IF NOT EXISTS idx_pattern_templates_category ON public.pattern_templates(category);
CREATE INDEX IF NOT EXISTS idx_pattern_templates_active ON public.pattern_templates(is_active);

-- 1.5 Detected Patterns Table
CREATE TABLE IF NOT EXISTS public.detected_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES public.pattern_templates(id) ON DELETE CASCADE,
  confidence_contribution DECIMAL(5,2) NOT NULL,
  pattern_data JSONB,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_match_template UNIQUE (match_id, template_id),
  CONSTRAINT valid_confidence_contribution CHECK (confidence_contribution >= 0 AND confidence_contribution <= 100)
);

COMMENT ON TABLE public.detected_patterns IS 'Detected patterns for specific matches, contributing to prediction confidence';

CREATE INDEX IF NOT EXISTS idx_detected_patterns_match ON public.detected_patterns(match_id);
CREATE INDEX IF NOT EXISTS idx_detected_patterns_template ON public.detected_patterns(template_id);
CREATE INDEX IF NOT EXISTS idx_detected_patterns_created_by ON public.detected_patterns(created_by);

-- 1.6 Predictions Table
CREATE TABLE IF NOT EXISTS public.predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  predicted_outcome TEXT NOT NULL CHECK (predicted_outcome IN ('home_win', 'draw', 'away_win')),
  confidence_score DECIMAL(5,2) NOT NULL,
  predicted_home_score INTEGER,
  predicted_away_score INTEGER,
  btts_prediction BOOLEAN,
  over_under_prediction TEXT CHECK (over_under_prediction IN ('over_2.5', 'under_2.5', NULL)),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  actual_outcome TEXT CHECK (actual_outcome IN ('home_win', 'draw', 'away_win', NULL)),
  was_correct BOOLEAN,
  evaluated_at TIMESTAMPTZ,
  CONSTRAINT unique_match_prediction UNIQUE (match_id),
  CONSTRAINT valid_confidence_score CHECK (confidence_score >= 0 AND confidence_score <= 100),
  CONSTRAINT valid_scores CHECK (predicted_home_score IS NULL OR predicted_home_score >= 0),
  CONSTRAINT valid_away_score CHECK (predicted_away_score IS NULL OR predicted_away_score >= 0)
);

COMMENT ON TABLE public.predictions IS 'Main predictions table with confidence scores and feedback';

CREATE INDEX IF NOT EXISTS idx_predictions_match ON public.predictions(match_id);
CREATE INDEX IF NOT EXISTS idx_predictions_evaluated ON public.predictions(evaluated_at) WHERE evaluated_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_predictions_created_by ON public.predictions(created_by);
CREATE INDEX IF NOT EXISTS idx_predictions_confidence ON public.predictions(confidence_score);

-- 1.7 Pattern Accuracy Tracking Table
CREATE TABLE IF NOT EXISTS public.pattern_accuracy (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.pattern_templates(id) ON DELETE CASCADE,
  total_predictions INTEGER DEFAULT 0,
  correct_predictions INTEGER DEFAULT 0,
  accuracy_rate DECIMAL(5,2) DEFAULT 50.0,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_template_accuracy UNIQUE (template_id),
  CONSTRAINT valid_accuracy CHECK (accuracy_rate >= 0 AND accuracy_rate <= 100),
  CONSTRAINT valid_correct CHECK (correct_predictions >= 0 AND correct_predictions <= total_predictions)
);

COMMENT ON TABLE public.pattern_accuracy IS 'Aggregated accuracy statistics for pattern templates';

CREATE INDEX IF NOT EXISTS idx_pattern_accuracy_template ON public.pattern_accuracy(template_id);

-- 1.8 User Profiles Table
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'user',
  is_active BOOLEAN NOT NULL DEFAULT true,
  bio TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,
  CONSTRAINT unique_user_email UNIQUE (email),
  CONSTRAINT valid_role CHECK (role IN ('admin', 'analyst', 'predictor', 'team_manager', 'viewer', 'demo'))
);

COMMENT ON TABLE public.user_profiles IS 'User profile information with role-based access control';

CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_active ON public.user_profiles(is_active) WHERE is_active = true;

-- 1.9 Audit Log Table
CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  record_id UUID,
  action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT audit_requires_values CHECK (old_values IS NOT NULL OR new_values IS NOT NULL)
);

COMMENT ON TABLE public.audit_log IS 'Audit trail of important database changes';

CREATE INDEX IF NOT EXISTS idx_audit_log_table_name ON public.audit_log(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON public.audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON public.audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON public.audit_log(action);

-- 1.10 Feedback Table
CREATE TABLE IF NOT EXISTS public.feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prediction_id UUID REFERENCES public.predictions(id) ON DELETE SET NULL,
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  feedback_type TEXT CHECK (feedback_type IN ('accuracy', 'relevance', 'clarity', 'bug', 'other')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.feedback IS 'User feedback on predictions and system features';

CREATE INDEX IF NOT EXISTS idx_feedback_prediction_id ON public.feedback(prediction_id);
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON public.feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON public.feedback(created_at);

-- 1.11 Scheduled Jobs Table
CREATE TABLE IF NOT EXISTS public.scheduled_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name TEXT NOT NULL UNIQUE,
  job_type TEXT NOT NULL,
  cron_schedule TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.scheduled_jobs IS 'Background job scheduler registry and configuration';

CREATE INDEX IF NOT EXISTS idx_scheduled_jobs_enabled ON public.scheduled_jobs(enabled);
CREATE INDEX IF NOT EXISTS idx_scheduled_jobs_next_run_at ON public.scheduled_jobs(next_run_at);

-- 1.12 Job Execution Logs Table
CREATE TABLE IF NOT EXISTS public.job_execution_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.scheduled_jobs(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL CHECK (status IN ('running', 'success', 'error')),
  duration_ms INTEGER,
  records_processed INTEGER DEFAULT 0,
  error_message TEXT,
  error_stack TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.job_execution_logs IS 'Execution history and performance metrics for scheduled jobs';

CREATE INDEX IF NOT EXISTS idx_job_execution_logs_job_id ON public.job_execution_logs(job_id);
CREATE INDEX IF NOT EXISTS idx_job_execution_logs_status ON public.job_execution_logs(status);
CREATE INDEX IF NOT EXISTS idx_job_execution_logs_started_at ON public.job_execution_logs(started_at DESC);

-- ============================================================================
-- SECTION 2: HELPER FUNCTIONS FOR AUTHENTICATION AND AUTHORIZATION
-- ============================================================================

-- 2.1 Get current user ID
CREATE OR REPLACE FUNCTION public.get_current_user_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN auth.uid();
END;
$$;

COMMENT ON FUNCTION public.get_current_user_id() IS 'Returns the current authenticated user ID, or NULL if anonymous';

-- 2.2 Get current user role
CREATE OR REPLACE FUNCTION public.get_user_role(p_user_id UUID DEFAULT NULL)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_role TEXT;
BEGIN
  v_user_id := COALESCE(p_user_id, auth.uid());
  
  IF v_user_id IS NULL THEN
    RETURN 'anonymous';
  END IF;
  
  SELECT role INTO v_role
  FROM public.user_profiles
  WHERE id = v_user_id AND is_active = true;
  
  RETURN COALESCE(v_role, 'viewer');
END;
$$;

COMMENT ON FUNCTION public.get_user_role(UUID) IS 'Returns the role of specified user, or viewer if not found';

-- 2.3 Check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN public.get_user_role(auth.uid()) = 'admin';
END;
$$;

COMMENT ON FUNCTION public.is_admin() IS 'Returns true if current user has admin role';

-- 2.4 Check if current user is analyst or higher
CREATE OR REPLACE FUNCTION public.is_analyst()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN public.get_user_role(auth.uid()) IN ('admin', 'analyst');
END;
$$;

COMMENT ON FUNCTION public.is_analyst() IS 'Returns true if current user is analyst or admin';

-- 2.5 Check if current user is predictor or higher
CREATE OR REPLACE FUNCTION public.is_predictor()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN public.get_user_role(auth.uid()) IN ('admin', 'analyst', 'predictor');
END;
$$;

COMMENT ON FUNCTION public.is_predictor() IS 'Returns true if current user can create predictions';

-- 2.6 Check if user is service role
CREATE OR REPLACE FUNCTION public.is_service_role()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN current_setting('request.jwt.claims', true)::jsonb->>'role' IN ('service_role', 'postgres');
END;
$$;

COMMENT ON FUNCTION public.is_service_role() IS 'Returns true if current caller is service role or postgres';

-- ============================================================================
-- SECTION 3: DATA VALIDATION AND COMPUTATION FUNCTIONS
-- ============================================================================

-- 3.1 Calculate confidence score from patterns
CREATE OR REPLACE FUNCTION public.calculate_confidence_from_patterns(
  p_match_id UUID
)
RETURNS DECIMAL(5,2)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_confidence DECIMAL(5,2) := 50.0;
BEGIN
  SELECT 
    LEAST(100.0, 50.0 + COALESCE(SUM(confidence_contribution) / 5.0, 0))
  INTO v_total_confidence
  FROM public.detected_patterns
  WHERE match_id = p_match_id;
  
  RETURN COALESCE(v_total_confidence, 50.0);
END;
$$;

COMMENT ON FUNCTION public.calculate_confidence_from_patterns(UUID) IS 'Calculates prediction confidence based on detected patterns';

-- 3.2 Update pattern accuracy metrics
CREATE OR REPLACE FUNCTION public.update_pattern_accuracy(
  p_template_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total INTEGER;
  v_correct INTEGER;
  v_accuracy DECIMAL(5,2);
BEGIN
  SELECT 
    COUNT(*),
    COALESCE(SUM(CASE WHEN p.was_correct = true THEN 1 ELSE 0 END), 0)
  INTO v_total, v_correct
  FROM public.detected_patterns dp
  JOIN public.predictions p ON p.match_id = dp.match_id
  WHERE dp.template_id = p_template_id AND p.evaluated_at IS NOT NULL;
  
  v_accuracy := CASE 
    WHEN v_total > 0 THEN (v_correct::DECIMAL / v_total::DECIMAL) * 100
    ELSE 50.0
  END;
  
  INSERT INTO public.pattern_accuracy (template_id, total_predictions, correct_predictions, accuracy_rate, last_updated)
  VALUES (p_template_id, v_total, v_correct, v_accuracy, NOW())
  ON CONFLICT (template_id) DO UPDATE SET
    total_predictions = EXCLUDED.total_predictions,
    correct_predictions = EXCLUDED.correct_predictions,
    accuracy_rate = EXCLUDED.accuracy_rate,
    last_updated = NOW();
END;
$$;

COMMENT ON FUNCTION public.update_pattern_accuracy(UUID) IS 'Updates accuracy metrics for a pattern template based on prediction outcomes';

-- 3.3 Adjust template confidence boost
CREATE OR REPLACE FUNCTION public.adjust_template_confidence(
  p_template_id UUID,
  p_adjustment DECIMAL(5,2)
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can adjust template confidence';
  END IF;
  
  UPDATE public.pattern_templates
  SET 
    base_confidence_boost = GREATEST(0.0, LEAST(100.0, base_confidence_boost + p_adjustment)),
    updated_at = NOW()
  WHERE id = p_template_id;
END;
$$;

COMMENT ON FUNCTION public.adjust_template_confidence(UUID, DECIMAL) IS 'Adjusts the confidence boost for a pattern template (admin only)';

-- 3.4 Calculate win probability for a team
CREATE OR REPLACE FUNCTION public.calculate_team_win_probability(
  p_team_id UUID,
  p_opponent_id UUID,
  p_is_home BOOLEAN
)
RETURNS DECIMAL(5,2)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_probability DECIMAL(5,2);
  v_league_id UUID;
  v_recent_wins INTEGER := 0;
  v_recent_matches INTEGER := 0;
BEGIN
  SELECT league_id INTO v_league_id
  FROM public.teams
  WHERE id = p_team_id LIMIT 1;
  
  SELECT 
    COUNT(*),
    COALESCE(SUM(CASE 
      WHEN (home_team_id = p_team_id AND home_score > away_score) 
        OR (away_team_id = p_team_id AND away_score > home_score) 
      THEN 1 ELSE 0 END), 0)
  INTO v_recent_matches, v_recent_wins
  FROM public.matches
  WHERE (home_team_id = p_team_id OR away_team_id = p_team_id)
    AND status = 'finished'
    AND match_date >= NOW() - INTERVAL '60 days'
  LIMIT 10;
  
  IF v_recent_matches > 0 THEN
    v_probability := ROUND((v_recent_wins::DECIMAL / v_recent_matches::DECIMAL) * 100, 2);
  ELSE
    SELECT 
      CASE WHEN p_is_home 
        THEN home_win_percentage 
        ELSE (100 - home_win_percentage) / 2 
      END
    INTO v_probability
    FROM public.leagues
    WHERE id = v_league_id;
  END IF;
  
  RETURN COALESCE(v_probability, 45.0);
END;
$$;

COMMENT ON FUNCTION public.calculate_team_win_probability(UUID, UUID, BOOLEAN) IS 'Calculates win probability for a team based on recent form and league stats';

-- 3.5 Validate prediction data
CREATE OR REPLACE FUNCTION public.validate_prediction_data(
  p_match_id UUID,
  p_predicted_outcome TEXT,
  p_confidence DECIMAL(5,2)
)
RETURNS TABLE (
  is_valid BOOLEAN,
  error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_match_status TEXT;
  v_match_count INTEGER;
BEGIN
  SELECT COUNT(*), status INTO v_match_count, v_match_status
  FROM public.matches
  WHERE id = p_match_id;
  
  IF v_match_count = 0 THEN
    RETURN QUERY SELECT false, 'Match not found';
    RETURN;
  END IF;
  
  IF v_match_status = 'finished' THEN
    RETURN QUERY SELECT false, 'Cannot predict on finished match';
    RETURN;
  END IF;
  
  IF p_predicted_outcome NOT IN ('home_win', 'draw', 'away_win') THEN
    RETURN QUERY SELECT false, 'Invalid predicted outcome';
    RETURN;
  END IF;
  
  IF p_confidence < 0 OR p_confidence > 100 THEN
    RETURN QUERY SELECT false, 'Confidence must be between 0 and 100';
    RETURN;
  END IF;
  
  RETURN QUERY SELECT true, NULL::TEXT;
END;
$$;

COMMENT ON FUNCTION public.validate_prediction_data(UUID, TEXT, DECIMAL) IS 'Validates prediction data before insert/update';

-- ============================================================================
-- SECTION 4: TRIGGER FUNCTIONS FOR MAINTAINING DATA CONSISTENCY
-- ============================================================================

-- 4.1 Touch updated_at timestamp
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.touch_updated_at() IS 'Trigger function to automatically update updated_at timestamp';

-- 4.2 Set created_by to current user
CREATE OR REPLACE FUNCTION public.set_created_by()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.created_by IS NULL AND auth.uid() IS NOT NULL THEN
    NEW.created_by := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.set_created_by() IS 'Trigger function to automatically set created_by to current user';

-- 4.3 Create new user profile on auth.users insert
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role TEXT := 'viewer';
BEGIN
  IF (NEW.raw_user_meta_data->>'role') IN ('admin', 'analyst', 'predictor', 'team_manager', 'viewer', 'demo') THEN
    v_role := NEW.raw_user_meta_data->>'role';
  END IF;
  
  INSERT INTO public.user_profiles (
    id, 
    email, 
    full_name, 
    role,
    is_active
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NULLIF(NEW.raw_user_meta_data->>'full_name', ''),
      NULLIF(NEW.raw_user_meta_data->>'name', ''),
      NEW.email
    ),
    v_role,
    true
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    is_active = true,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically creates user profile when new auth user is created';

-- 4.4 Log changes to audit_log table
CREATE OR REPLACE FUNCTION public.audit_log_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_log (table_name, record_id, action, user_id, new_values)
    VALUES (TG_TABLE_NAME, NEW.id, 'INSERT', public.get_current_user_id(), row_to_json(NEW));
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_log (table_name, record_id, action, user_id, old_values, new_values)
    VALUES (TG_TABLE_NAME, NEW.id, 'UPDATE', public.get_current_user_id(), row_to_json(OLD), row_to_json(NEW));
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_log (table_name, record_id, action, user_id, old_values)
    VALUES (TG_TABLE_NAME, OLD.id, 'DELETE', public.get_current_user_id(), row_to_json(OLD));
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

COMMENT ON FUNCTION public.audit_log_trigger() IS 'Audit logging trigger - logs all changes to audit_log table';

-- 4.5 Validate prediction before insert/update
CREATE OR REPLACE FUNCTION public.validate_prediction_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_valid BOOLEAN;
  v_error_message TEXT;
BEGIN
  SELECT is_valid, error_message INTO v_is_valid, v_error_message
  FROM public.validate_prediction_data(NEW.match_id, NEW.predicted_outcome, NEW.confidence_score);
  
  IF NOT v_is_valid THEN
    RAISE EXCEPTION 'Prediction validation failed: %', v_error_message;
  END IF;
  
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.validate_prediction_trigger() IS 'Validates prediction data before insert/update';

-- 4.6 Update match status when scores are set
CREATE OR REPLACE FUNCTION public.update_match_status_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.home_score IS NOT NULL AND NEW.away_score IS NOT NULL AND NEW.status = 'live' THEN
    NEW.status := 'finished';
  END IF;
  
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.update_match_status_trigger() IS 'Automatically updates match status when scores are recorded';

-- 4.7 Update pattern accuracy when prediction is evaluated
CREATE OR REPLACE FUNCTION public.update_pattern_accuracy_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.evaluated_at IS NOT NULL AND OLD.evaluated_at IS NULL THEN
    UPDATE public.pattern_accuracy
    SET last_updated = NOW()
    WHERE template_id IN (
      SELECT template_id FROM public.detected_patterns 
      WHERE match_id = NEW.match_id
    );
  END IF;
  
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.update_pattern_accuracy_trigger() IS 'Updates pattern accuracy metrics when prediction is evaluated';

-- ============================================================================
-- SECTION 5: ATTACH TRIGGERS TO TABLES
-- ============================================================================

-- Updated at triggers
CREATE TRIGGER trg_leagues_updated_at
  BEFORE UPDATE ON public.leagues
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TRIGGER trg_teams_updated_at
  BEFORE UPDATE ON public.teams
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TRIGGER trg_matches_updated_at
  BEFORE UPDATE ON public.matches
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TRIGGER trg_pattern_templates_updated_at
  BEFORE UPDATE ON public.pattern_templates
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TRIGGER trg_predictions_updated_at
  BEFORE UPDATE ON public.predictions
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TRIGGER trg_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TRIGGER trg_scheduled_jobs_updated_at
  BEFORE UPDATE ON public.scheduled_jobs
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TRIGGER trg_feedback_updated_at
  BEFORE UPDATE ON public.feedback
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Created by triggers
CREATE TRIGGER trg_set_created_by_detected_patterns
  BEFORE INSERT ON public.detected_patterns
  FOR EACH ROW EXECUTE FUNCTION public.set_created_by();

CREATE TRIGGER trg_set_created_by_predictions
  BEFORE INSERT ON public.predictions
  FOR EACH ROW EXECUTE FUNCTION public.set_created_by();

-- Audit logging triggers
CREATE TRIGGER trg_audit_leagues
  AFTER INSERT OR UPDATE OR DELETE ON public.leagues
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();

CREATE TRIGGER trg_audit_predictions
  AFTER INSERT OR UPDATE OR DELETE ON public.predictions
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();

CREATE TRIGGER trg_audit_user_profiles
  AFTER INSERT OR UPDATE OR DELETE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();

-- Validation triggers
CREATE TRIGGER trg_validate_prediction
  BEFORE INSERT OR UPDATE ON public.predictions
  FOR EACH ROW EXECUTE FUNCTION public.validate_prediction_trigger();

-- Status update triggers
CREATE TRIGGER trg_update_match_status
  BEFORE UPDATE ON public.matches
  FOR EACH ROW EXECUTE FUNCTION public.update_match_status_trigger();

-- Pattern accuracy update trigger
CREATE TRIGGER trg_update_pattern_accuracy
  AFTER UPDATE ON public.predictions
  FOR EACH ROW EXECUTE FUNCTION public.update_pattern_accuracy_trigger();

-- User creation trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- SECTION 6: ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pattern_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detected_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pattern_accuracy ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_execution_logs ENABLE ROW LEVEL SECURITY;

-- Leagues policies
DROP POLICY IF EXISTS "Leagues public read" ON public.leagues;
CREATE POLICY "Leagues public read"
  ON public.leagues FOR SELECT USING (true);

DROP POLICY IF EXISTS "Leagues admin write" ON public.leagues;
CREATE POLICY "Leagues admin write"
  ON public.leagues FOR INSERT WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Leagues admin update" ON public.leagues;
CREATE POLICY "Leagues admin update"
  ON public.leagues FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Teams policies
DROP POLICY IF EXISTS "Teams public read" ON public.teams;
CREATE POLICY "Teams public read"
  ON public.teams FOR SELECT USING (true);

DROP POLICY IF EXISTS "Teams analyst write" ON public.teams;
CREATE POLICY "Teams analyst write"
  ON public.teams FOR INSERT WITH CHECK (public.is_analyst());

DROP POLICY IF EXISTS "Teams analyst update" ON public.teams;
CREATE POLICY "Teams analyst update"
  ON public.teams FOR UPDATE USING (public.is_analyst()) WITH CHECK (public.is_analyst());

-- Matches policies
DROP POLICY IF EXISTS "Matches public read" ON public.matches;
CREATE POLICY "Matches public read"
  ON public.matches FOR SELECT USING (true);

DROP POLICY IF EXISTS "Matches analyst write" ON public.matches;
CREATE POLICY "Matches analyst write"
  ON public.matches FOR INSERT WITH CHECK (public.is_analyst());

DROP POLICY IF EXISTS "Matches analyst update" ON public.matches;
CREATE POLICY "Matches analyst update"
  ON public.matches FOR UPDATE USING (public.is_analyst()) WITH CHECK (public.is_analyst());

-- Pattern templates policies
DROP POLICY IF EXISTS "Pattern templates public read" ON public.pattern_templates;
CREATE POLICY "Pattern templates public read"
  ON public.pattern_templates FOR SELECT USING (true);

DROP POLICY IF EXISTS "Pattern templates admin write" ON public.pattern_templates;
CREATE POLICY "Pattern templates admin write"
  ON public.pattern_templates FOR INSERT WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Pattern templates admin update" ON public.pattern_templates;
CREATE POLICY "Pattern templates admin update"
  ON public.pattern_templates FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Detected patterns policies
DROP POLICY IF EXISTS "Detected patterns public read" ON public.detected_patterns;
CREATE POLICY "Detected patterns public read"
  ON public.detected_patterns FOR SELECT USING (true);

DROP POLICY IF EXISTS "Detected patterns analyst write" ON public.detected_patterns;
CREATE POLICY "Detected patterns analyst write"
  ON public.detected_patterns FOR INSERT WITH CHECK (public.is_analyst());

DROP POLICY IF EXISTS "Detected patterns creator update" ON public.detected_patterns;
CREATE POLICY "Detected patterns creator update"
  ON public.detected_patterns FOR UPDATE USING (created_by = public.get_current_user_id() OR public.is_admin()) WITH CHECK (created_by = public.get_current_user_id() OR public.is_admin());

-- Predictions policies
DROP POLICY IF EXISTS "Predictions public read" ON public.predictions;
CREATE POLICY "Predictions public read"
  ON public.predictions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Predictions predictor write" ON public.predictions;
CREATE POLICY "Predictions predictor write"
  ON public.predictions FOR INSERT WITH CHECK (public.is_predictor());

DROP POLICY IF EXISTS "Predictions creator update" ON public.predictions;
CREATE POLICY "Predictions creator update"
  ON public.predictions FOR UPDATE USING (created_by = public.get_current_user_id() OR public.is_admin()) WITH CHECK (created_by = public.get_current_user_id() OR public.is_admin());

-- Pattern accuracy policies
DROP POLICY IF EXISTS "Pattern accuracy public read" ON public.pattern_accuracy;
CREATE POLICY "Pattern accuracy public read"
  ON public.pattern_accuracy FOR SELECT USING (true);

DROP POLICY IF EXISTS "Pattern accuracy admin write" ON public.pattern_accuracy;
CREATE POLICY "Pattern accuracy admin write"
  ON public.pattern_accuracy FOR INSERT WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Pattern accuracy admin update" ON public.pattern_accuracy;
CREATE POLICY "Pattern accuracy admin update"
  ON public.pattern_accuracy FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());

-- User profiles policies
DROP POLICY IF EXISTS "User profiles own read" ON public.user_profiles;
CREATE POLICY "User profiles own read"
  ON public.user_profiles FOR SELECT USING (id = public.get_current_user_id());

DROP POLICY IF EXISTS "User profiles admin read all" ON public.user_profiles;
CREATE POLICY "User profiles admin read all"
  ON public.user_profiles FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "User profiles own update" ON public.user_profiles;
CREATE POLICY "User profiles own update"
  ON public.user_profiles FOR UPDATE USING (id = public.get_current_user_id()) WITH CHECK (id = public.get_current_user_id() AND role = (SELECT role FROM public.user_profiles WHERE id = public.get_current_user_id()));

DROP POLICY IF EXISTS "User profiles admin update" ON public.user_profiles;
CREATE POLICY "User profiles admin update"
  ON public.user_profiles FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "User profiles admin insert" ON public.user_profiles;
CREATE POLICY "User profiles admin insert"
  ON public.user_profiles FOR INSERT WITH CHECK (public.is_admin());

-- Audit log policies
DROP POLICY IF EXISTS "Audit log admin read" ON public.audit_log;
CREATE POLICY "Audit log admin read"
  ON public.audit_log FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Audit log system insert" ON public.audit_log;
CREATE POLICY "Audit log system insert"
  ON public.audit_log FOR INSERT WITH CHECK (true);

-- Feedback policies
DROP POLICY IF EXISTS "Feedback user read own" ON public.feedback;
CREATE POLICY "Feedback user read own"
  ON public.feedback FOR SELECT USING (user_id = public.get_current_user_id());

DROP POLICY IF EXISTS "Feedback admin read all" ON public.feedback;
CREATE POLICY "Feedback admin read all"
  ON public.feedback FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Feedback user insert" ON public.feedback;
CREATE POLICY "Feedback user insert"
  ON public.feedback FOR INSERT WITH CHECK (user_id = public.get_current_user_id());

DROP POLICY IF EXISTS "Feedback user update own" ON public.feedback;
CREATE POLICY "Feedback user update own"
  ON public.feedback FOR UPDATE USING (user_id = public.get_current_user_id()) WITH CHECK (user_id = public.get_current_user_id());

-- Scheduled jobs policies
DROP POLICY IF EXISTS "Scheduled jobs admin read" ON public.scheduled_jobs;
CREATE POLICY "Scheduled jobs admin read"
  ON public.scheduled_jobs FOR SELECT USING (public.is_admin() OR public.is_service_role());

DROP POLICY IF EXISTS "Scheduled jobs admin write" ON public.scheduled_jobs;
CREATE POLICY "Scheduled jobs admin write"
  ON public.scheduled_jobs FOR INSERT WITH CHECK (public.is_admin() OR public.is_service_role());

DROP POLICY IF EXISTS "Scheduled jobs admin update" ON public.scheduled_jobs;
CREATE POLICY "Scheduled jobs admin update"
  ON public.scheduled_jobs FOR UPDATE USING (public.is_admin() OR public.is_service_role()) WITH CHECK (public.is_admin() OR public.is_service_role());

-- Job execution logs policies
DROP POLICY IF EXISTS "Job execution logs admin read" ON public.job_execution_logs;
CREATE POLICY "Job execution logs admin read"
  ON public.job_execution_logs FOR SELECT USING (public.is_admin() OR public.is_service_role());

DROP POLICY IF EXISTS "Job execution logs system insert" ON public.job_execution_logs;
CREATE POLICY "Job execution logs system insert"
  ON public.job_execution_logs FOR INSERT WITH CHECK (public.is_service_role());

-- ============================================================================
-- SECTION 7: GRANT PRIVILEGES TO ROLES
-- ============================================================================

REVOKE ALL ON ALL TABLES IN SCHEMA public FROM public;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM public;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM public;

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

GRANT USAGE ON SCHEMA public TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO service_role;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- ============================================================================
-- SECTION 8: SEED DATA
-- ============================================================================

-- Seed pattern templates
INSERT INTO public.pattern_templates (name, description, category, base_confidence_boost, is_active)
VALUES
  ('Home Winning Streak', 'Home team won 3+ of last 5 home matches', 'form', 8.0, true),
  ('Away Winning Streak', 'Away team won 3+ of last 5 away matches', 'form', 7.0, true),
  ('H2H Dominance', 'One team won 3+ of last 5 head-to-head matches', 'h2h', 10.0, true),
  ('Recent Form Advantage', 'Team has 2+ more wins in last 5 matches', 'form', 6.0, true),
  ('High Scoring League', 'League average > 3.0 goals per match', 'league', 3.0, true),
  ('Defensive Strength', 'Team has conceded <1 goal per match recently', 'team_specific', 5.0, true),
  ('Seasonal Trend', 'Team performs better in specific seasons', 'seasonal', 4.0, true)
ON CONFLICT (name) DO NOTHING;

-- Initialize pattern accuracy records
INSERT INTO public.pattern_accuracy (template_id, total_predictions, correct_predictions, accuracy_rate)
SELECT id, 0, 0, 50.0 FROM public.pattern_templates
ON CONFLICT (template_id) DO NOTHING;

-- Seed initial leagues
INSERT INTO public.leagues (name, country, season, avg_goals_per_match, home_win_percentage, btts_percentage)
VALUES
  ('Premier League', 'England', '2024/25', 2.8, 46.5, 52.0),
  ('La Liga', 'Spain', '2024/25', 2.6, 44.0, 48.0),
  ('Serie A', 'Italy', '2024/25', 2.7, 45.0, 50.0),
  ('Bundesliga', 'Germany', '2024/25', 3.2, 47.0, 55.0),
  ('Ligue 1', 'France', '2024/25', 2.9, 45.5, 51.0)
ON CONFLICT (name, season) DO NOTHING;

-- Seed initial teams
WITH premier AS (SELECT id FROM public.leagues WHERE name = 'Premier League' LIMIT 1),
     la_liga AS (SELECT id FROM public.leagues WHERE name = 'La Liga' LIMIT 1)
INSERT INTO public.teams (name, league_id, founded_year)
SELECT * FROM (
  SELECT 'Manchester City', (SELECT id FROM premier), 1880 UNION ALL
  SELECT 'Liverpool', (SELECT id FROM premier), 1892 UNION ALL
  SELECT 'Arsenal', (SELECT id FROM premier), 1886 UNION ALL
  SELECT 'Chelsea', (SELECT id FROM premier), 1905 UNION ALL
  SELECT 'Manchester United', (SELECT id FROM premier), 1878 UNION ALL
  SELECT 'Real Madrid', (SELECT id FROM la_liga), 1902 UNION ALL
  SELECT 'Barcelona', (SELECT id FROM la_liga), 1899 UNION ALL
  SELECT 'Atletico Madrid', (SELECT id FROM la_liga), 1903 UNION ALL
  SELECT 'Valencia', (SELECT id FROM la_liga), 1919 UNION ALL
  SELECT 'Sevilla', (SELECT id FROM la_liga), 1890
) AS teams(name, league_id, founded_year)
ON CONFLICT (name, league_id) DO NOTHING;

-- Seed initial scheduled jobs
INSERT INTO public.scheduled_jobs (job_name, job_type, cron_schedule, enabled, config)
VALUES
  ('Fetch Upcoming Fixtures', 'data_import', '0 2 * * *', true, '{"description": "Update upcoming matches for next 7 days"}'::jsonb),
  ('Run Daily Predictions', 'prediction', '0 3 * * *', true, '{"description": "Generate predictions for next 24 hours of matches", "window_hours": 24}'::jsonb),
  ('Update Team Statistics', 'aggregation', '0 4 * * *', true, '{"description": "Aggregate team performance statistics daily"}'::jsonb),
  ('Cleanup Old Logs', 'maintenance', '0 1 * * 0', true, '{"description": "Remove logs older than 30 days", "retention_days": 30}'::jsonb)
ON CONFLICT (job_name) DO NOTHING;

-- ============================================================================
-- SECTION 9: ADDITIONAL CONFIGURATION AND VALIDATION
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_predictions_match_confidence ON public.predictions(match_id, confidence_score DESC);
CREATE INDEX IF NOT EXISTS idx_detected_patterns_confidence ON public.detected_patterns(match_id, confidence_contribution DESC);
CREATE INDEX IF NOT EXISTS idx_matches_date_status ON public.matches(match_date DESC, status);
CREATE INDEX IF NOT EXISTS idx_feedback_rating ON public.feedback(rating, created_at DESC);

COMMENT ON SCHEMA public IS 'Main application schema containing all core entities, functions, and security policies for the WinMix prediction system';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
