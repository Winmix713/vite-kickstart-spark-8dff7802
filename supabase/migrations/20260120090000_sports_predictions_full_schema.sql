-- =========================================================================
-- Migration: 20260120090000 Sports Predictions Platform Foundational Schema
-- Description: Comprehensive schema, RBAC, functions, triggers, RLS, and seed
--              data for the WinMix TipsterHub sports prediction platform.
-- Generated: 2026-01-20 09:00 UTC
-- Rollback instructions:
--   * Drop RLS policies, triggers, and grants introduced in this file.
--   * Delete seed data starting with child tables (predictions, matches, etc.).
--   * Drop dependent functions, views, and finally the tables and enum types in
--     reverse order of creation to maintain referential integrity.
--   * Remove the custom database roles if they are not reused elsewhere.
-- NOTE: Execute the rollback within a single transaction to prevent partial
--       teardown when running in production.
-- =========================================================================

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';

BEGIN;

-- ================================================================
-- Section 1. Prerequisites & Extensions
-- ================================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA public;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;

-- ================================================================
-- Section 2. Enumerations & Domain Definitions
-- ================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'user_role'
  ) THEN
    CREATE TYPE public.user_role AS ENUM (
      'admin',
      'analyst',
      'predictor',
      'team_manager',
      'viewer'
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'match_status'
  ) THEN
    CREATE TYPE public.match_status AS ENUM (
      'scheduled',
      'in_progress',
      'completed',
      'postponed',
      'cancelled'
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'prediction_status'
  ) THEN
    CREATE TYPE public.prediction_status AS ENUM (
      'pending',
      'locked',
      'won',
      'lost',
      'void',
      'cancelled'
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'feedback_status'
  ) THEN
    CREATE TYPE public.feedback_status AS ENUM (
      'new',
      'reviewing',
      'resolved',
      'dismissed'
    );
  END IF;
END $$;

-- ================================================================
-- Section 3. Core Table Definitions
-- ================================================================
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE CHECK (position('@' IN email) > 1),
  role public.user_role NOT NULL DEFAULT 'viewer',
  display_name text NOT NULL,
  preferred_language text NOT NULL DEFAULT 'en',
  timezone text NOT NULL DEFAULT 'UTC',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'invited', 'disabled')),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_login_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT fk_users_auth FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
);
COMMENT ON TABLE public.users IS 'Application-specific user metadata mapped 1:1 with auth.users entries.';

CREATE TABLE IF NOT EXISTS public.sports_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  description text,
  popularity_score numeric(5,2) NOT NULL DEFAULT 0 CHECK (popularity_score BETWEEN 0 AND 100),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);
COMMENT ON TABLE public.sports_types IS 'High-level reference list that keeps sports specific metadata (soccer, basketball, etc.).';

CREATE TABLE IF NOT EXISTS public.leagues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sports_type_id uuid NOT NULL REFERENCES public.sports_types(id) ON DELETE RESTRICT,
  name text NOT NULL,
  code text NOT NULL UNIQUE,
  region text,
  tier smallint NOT NULL DEFAULT 1 CHECK (tier > 0),
  season text NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('preseason', 'active', 'completed', 'archived')),
  start_date date,
  end_date date,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT leagues_name_season_unique UNIQUE (name, season)
);
COMMENT ON TABLE public.leagues IS 'Professional leagues and tournaments tracked by the prediction engine.';

CREATE TABLE IF NOT EXISTS public.teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id uuid NOT NULL REFERENCES public.leagues(id) ON DELETE CASCADE,
  sports_type_id uuid NOT NULL REFERENCES public.sports_types(id) ON DELETE RESTRICT,
  name text NOT NULL,
  code text NOT NULL UNIQUE,
  city text,
  founded_year integer CHECK (founded_year BETWEEN 1850 AND date_part('year', timezone('utc', now()))::integer + 1),
  colors text[] NOT NULL DEFAULT ARRAY[]::text[],
  manager_user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  is_active boolean NOT NULL DEFAULT true,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT teams_name_league_unique UNIQUE (league_id, name)
);
COMMENT ON TABLE public.teams IS 'Teams competing inside leagues with optional system-assigned managers.';

CREATE TABLE IF NOT EXISTS public.team_manager_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  is_primary boolean NOT NULL DEFAULT true,
  assigned_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT team_manager_unique UNIQUE (team_id, user_id)
);
COMMENT ON TABLE public.team_manager_assignments IS 'Defines which application users can administer individual teams.';

CREATE TABLE IF NOT EXISTS public.players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES public.teams(id) ON DELETE SET NULL,
  league_id uuid REFERENCES public.leagues(id) ON DELETE SET NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  position text NOT NULL,
  jersey_number smallint CHECK (jersey_number BETWEEN 0 AND 99),
  date_of_birth date CHECK (date_of_birth <= current_date),
  nationality text,
  height_cm numeric(5,2) CHECK (height_cm IS NULL OR height_cm BETWEEN 100 AND 250),
  weight_kg numeric(5,2) CHECK (weight_kg IS NULL OR weight_kg BETWEEN 40 AND 160),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'injured', 'suspended', 'retired')),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);
COMMENT ON TABLE public.players IS 'Roster players mapped to teams and leagues for performance analytics.';

CREATE TABLE IF NOT EXISTS public.prediction_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sports_type_id uuid NOT NULL REFERENCES public.sports_types(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  is_public boolean NOT NULL DEFAULT true,
  min_confidence numeric(5,2) NOT NULL DEFAULT 20 CHECK (min_confidence BETWEEN 0 AND 100),
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT prediction_categories_unique UNIQUE (sports_type_id, name)
);
COMMENT ON TABLE public.prediction_categories IS 'Reference list for grouping user and system level predictions.';

CREATE TABLE IF NOT EXISTS public.matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id uuid NOT NULL REFERENCES public.leagues(id) ON DELETE CASCADE,
  sports_type_id uuid NOT NULL REFERENCES public.sports_types(id) ON DELETE RESTRICT,
  season text NOT NULL,
  match_day integer NOT NULL CHECK (match_day > 0),
  reference_code text NOT NULL UNIQUE,
  home_team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE RESTRICT,
  away_team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE RESTRICT,
  venue text,
  status public.match_status NOT NULL DEFAULT 'scheduled',
  scheduled_at timestamptz NOT NULL,
  started_at timestamptz,
  completed_at timestamptz,
  home_score smallint CHECK (home_score IS NULL OR home_score BETWEEN 0 AND 200),
  away_score smallint CHECK (away_score IS NULL OR away_score BETWEEN 0 AND 200),
  extra_time boolean NOT NULL DEFAULT false,
  weather jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT matches_distinct_teams CHECK (home_team_id <> away_team_id)
);
COMMENT ON TABLE public.matches IS 'Scheduled and completed fixtures tracked for predictions and analytics.';

CREATE TABLE IF NOT EXISTS public.team_rankings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id uuid NOT NULL REFERENCES public.leagues(id) ON DELETE CASCADE,
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  wins integer NOT NULL DEFAULT 0 CHECK (wins >= 0),
  losses integer NOT NULL DEFAULT 0 CHECK (losses >= 0),
  draws integer NOT NULL DEFAULT 0 CHECK (draws >= 0),
  points integer NOT NULL DEFAULT 0 CHECK (points >= 0),
  form text[] NOT NULL DEFAULT ARRAY[]::text[],
  last_calculated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT team_rankings_unique UNIQUE (league_id, team_id)
);
COMMENT ON TABLE public.team_rankings IS 'Materialised ranking table maintained via triggers for quick leaderboard lookups.';

CREATE TABLE IF NOT EXISTS public.predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  match_id uuid NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  category_id uuid REFERENCES public.prediction_categories(id) ON DELETE SET NULL,
  predicted_winner_team_id uuid REFERENCES public.teams(id) ON DELETE SET NULL,
  predicted_home_score smallint CHECK (predicted_home_score IS NULL OR predicted_home_score BETWEEN 0 AND 200),
  predicted_away_score smallint CHECK (predicted_away_score IS NULL OR predicted_away_score BETWEEN 0 AND 200),
  confidence_score numeric(5,2) NOT NULL DEFAULT 50 CHECK (confidence_score BETWEEN 0 AND 100),
  win_probability numeric(5,2) NOT NULL DEFAULT 50 CHECK (win_probability BETWEEN 0 AND 100),
  status public.prediction_status NOT NULL DEFAULT 'pending',
  accuracy_score numeric(5,2) NOT NULL DEFAULT 0 CHECK (accuracy_score BETWEEN 0 AND 100),
  locked_at timestamptz,
  visibility text NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'private', 'team_only')),
  notes text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT predictions_user_match_unique UNIQUE (user_id, match_id, coalesce(category_id, uuid_nil()))
);
COMMENT ON TABLE public.predictions IS 'User generated or model generated match predictions.';

CREATE TABLE IF NOT EXISTS public.feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prediction_id uuid NOT NULL REFERENCES public.predictions(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  rating smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  sentiment text NOT NULL DEFAULT 'neutral' CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  notes text,
  status public.feedback_status NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);
COMMENT ON TABLE public.feedback IS 'User feedback about prediction accuracy and usefulness.';

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  table_name text NOT NULL,
  record_id uuid,
  action text NOT NULL,
  changes jsonb NOT NULL DEFAULT '{}'::jsonb,
  severity text NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warn', 'critical')),
  request_id uuid,
  ip_address inet,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);
COMMENT ON TABLE public.audit_logs IS 'Immutable audit trail for privileged data operations.';

CREATE TABLE IF NOT EXISTS public.analysis_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  analyst_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  league_id uuid REFERENCES public.leagues(id) ON DELETE SET NULL,
  match_id uuid REFERENCES public.matches(id) ON DELETE SET NULL,
  summary text NOT NULL,
  detail jsonb NOT NULL DEFAULT '{}'::jsonb,
  impact_score numeric(5,2) NOT NULL DEFAULT 50 CHECK (impact_score BETWEEN 0 AND 100),
  tags text[] NOT NULL DEFAULT ARRAY[]::text[],
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);
COMMENT ON TABLE public.analysis_insights IS 'Curated analyst notes referenced by dashboards and alerting rules.';

-- ================================================================
-- Section 4. Strategic Indexes for Query Performance
-- ================================================================
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON public.users(status);
CREATE INDEX IF NOT EXISTS idx_teams_league_active ON public.teams(league_id, is_active);
CREATE INDEX IF NOT EXISTS idx_teams_manager ON public.teams(manager_user_id);
CREATE INDEX IF NOT EXISTS idx_team_manager_user ON public.team_manager_assignments(user_id, team_id);
CREATE INDEX IF NOT EXISTS idx_players_team_position ON public.players(team_id, position);
CREATE INDEX IF NOT EXISTS idx_prediction_categories_sport ON public.prediction_categories(sports_type_id);
CREATE INDEX IF NOT EXISTS idx_matches_league_schedule ON public.matches(league_id, scheduled_at DESC);
CREATE INDEX IF NOT EXISTS idx_matches_status ON public.matches(status, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_matches_created_by ON public.matches(created_by);
CREATE INDEX IF NOT EXISTS idx_predictions_match_status ON public.predictions(match_id, status);
CREATE INDEX IF NOT EXISTS idx_predictions_user_status ON public.predictions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_feedback_prediction_status ON public.feedback(prediction_id, status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON public.audit_logs(actor_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_action ON public.audit_logs(table_name, action);
CREATE INDEX IF NOT EXISTS idx_analysis_insights_league ON public.analysis_insights(league_id, impact_score DESC);
CREATE INDEX IF NOT EXISTS idx_analysis_insights_match ON public.analysis_insights(match_id);
CREATE INDEX IF NOT EXISTS idx_team_rankings_points ON public.team_rankings(league_id, points DESC);

-- ================================================================
-- Section 5. Custom Role Initialization (Hierarchy Definition)
-- ================================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'viewer') THEN
    CREATE ROLE viewer NOINHERIT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'team_manager') THEN
    CREATE ROLE team_manager NOINHERIT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'predictor') THEN
    CREATE ROLE predictor NOINHERIT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'analyst') THEN
    CREATE ROLE analyst NOINHERIT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'admin') THEN
    CREATE ROLE admin NOINHERIT;
  END IF;
END $$;

-- Establish hierarchical inheritance (admin > analyst > predictor > team_manager > viewer).
GRANT viewer TO team_manager;
GRANT team_manager TO predictor;
GRANT predictor TO analyst;
GRANT analyst TO admin;
SQL}
cat <<'SQL' >> /home/engine/project/supabase/migrations/20260120090000_sports_predictions_full_schema.sql

-- ================================================================
-- Section 6. Helper, Authentication, Validation, and Business Logic Functions
-- ================================================================

-- ------------------------------------------------
-- 6.1 Authentication & Context Helpers
-- ------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_service_role()
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
  v_claims jsonb;
BEGIN
  BEGIN
    v_claims := current_setting('request.jwt.claims', true)::jsonb;
  EXCEPTION
    WHEN others THEN
      RETURN false;
  END;

  RETURN coalesce(v_claims->>'role', '') = 'service_role';
END;
$$;
COMMENT ON FUNCTION public.is_service_role() IS 'Detects if the caller uses the Supabase service_role key.';

CREATE OR REPLACE FUNCTION public.get_current_user_id()
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  v_auth_id uuid := auth.uid();
  v_exists boolean;
BEGIN
  IF v_auth_id IS NULL THEN
    IF public.is_service_role() THEN
      RETURN NULL;
    END IF;
    RAISE EXCEPTION USING MESSAGE = 'No authenticated user in context', ERRCODE = '42501';
  END IF;

  SELECT true INTO v_exists FROM public.users WHERE id = v_auth_id;
  IF NOT coalesce(v_exists, false) THEN
    RAISE EXCEPTION USING MESSAGE = format('Authenticated user %s is not provisioned in public.users', v_auth_id), ERRCODE = '42883';
  END IF;

  RETURN v_auth_id;
END;
$$;
COMMENT ON FUNCTION public.get_current_user_id() IS 'Returns the application user id (public.users.id) for the active session.';

CREATE OR REPLACE FUNCTION public.get_user_role(p_user_id uuid DEFAULT NULL)
RETURNS public.user_role
LANGUAGE plpgsql
AS $$
DECLARE
  v_target uuid := coalesce(p_user_id, public.get_current_user_id());
  v_role public.user_role;
BEGIN
  IF v_target IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT role INTO v_role FROM public.users WHERE id = v_target;
  RETURN v_role;
END;
$$;
COMMENT ON FUNCTION public.get_user_role(uuid) IS 'Fetches the business role for a supplied or current user.';

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN coalesce(public.get_user_role(), 'viewer') = 'admin';
EXCEPTION
  WHEN others THEN
    RETURN false;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_analyst()
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN coalesce(public.get_user_role(), 'viewer') IN ('analyst', 'admin');
EXCEPTION
  WHEN others THEN
    RETURN false;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_predictor()
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN coalesce(public.get_user_role(), 'viewer') IN ('predictor', 'analyst', 'admin');
EXCEPTION
  WHEN others THEN
    RETURN false;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_team_manager()
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN coalesce(public.get_user_role(), 'viewer') IN ('team_manager', 'predictor', 'analyst', 'admin');
EXCEPTION
  WHEN others THEN
    RETURN false;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_viewer()
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN coalesce(public.get_user_role(), 'viewer') IN ('viewer', 'team_manager', 'predictor', 'analyst', 'admin');
EXCEPTION
  WHEN others THEN
    RETURN false;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_team_manager_for_team(p_team_id uuid)
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
  v_user uuid := auth.uid();
BEGIN
  IF v_user IS NULL THEN
    RETURN false;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.team_manager_assignments tma
    WHERE tma.team_id = p_team_id
      AND tma.user_id = v_user
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.can_team_manager_access_match(p_match_id uuid)
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
  v_user uuid := auth.uid();
BEGIN
  IF v_user IS NULL THEN
    RETURN false;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.matches m
    WHERE m.id = p_match_id
      AND (
        EXISTS (
          SELECT 1 FROM public.team_manager_assignments tma
          WHERE tma.team_id = m.home_team_id AND tma.user_id = v_user
        )
        OR EXISTS (
          SELECT 1 FROM public.team_manager_assignments tma
          WHERE tma.team_id = m.away_team_id AND tma.user_id = v_user
        )
      )
  );
END;
$$;

-- ------------------------------------------------
-- 6.2 Validation Functions
-- ------------------------------------------------
CREATE OR REPLACE FUNCTION public.validate_match_score(
  p_home_score smallint,
  p_away_score smallint,
  p_status public.match_status
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  IF p_status IN ('completed', 'in_progress') THEN
    IF p_home_score IS NULL OR p_away_score IS NULL THEN
      RAISE EXCEPTION 'Scores must be provided for % matches', p_status;
    END IF;
  END IF;

  IF p_home_score IS NOT NULL AND (p_home_score < 0 OR p_home_score > 200) THEN
    RAISE EXCEPTION 'Home score % is out of range 0-200', p_home_score;
  END IF;

  IF p_away_score IS NOT NULL AND (p_away_score < 0 OR p_away_score > 200) THEN
    RAISE EXCEPTION 'Away score % is out of range 0-200', p_away_score;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_prediction_data(
  p_user_id uuid,
  p_match_id uuid,
  p_predicted_home_score smallint,
  p_predicted_away_score smallint,
  p_confidence numeric,
  p_category_id uuid
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_match record;
  v_category_sport uuid;
  v_now timestamptz := timezone('utc', now());
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'Predictions must reference a user id';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'User % does not exist for prediction creation', p_user_id;
  END IF;

  SELECT id, status, scheduled_at, sports_type_id INTO v_match
  FROM public.matches
  WHERE id = p_match_id;

  IF v_match.id IS NULL THEN
    RAISE EXCEPTION 'Match % does not exist', p_match_id;
  END IF;

  IF v_match.status IN ('completed', 'cancelled') THEN
    RAISE EXCEPTION 'Match % is % and cannot accept predictions', p_match_id, v_match.status;
  END IF;

  IF v_match.scheduled_at < v_now - interval '7 days' THEN
    RAISE EXCEPTION 'Match % is too far in the past for new predictions', p_match_id;
  END IF;

  IF p_predicted_home_score IS NOT NULL AND (p_predicted_home_score < 0 OR p_predicted_home_score > 200) THEN
    RAISE EXCEPTION 'Predicted home score must be between 0 and 200';
  END IF;

  IF p_predicted_away_score IS NOT NULL AND (p_predicted_away_score < 0 OR p_predicted_away_score > 200) THEN
    RAISE EXCEPTION 'Predicted away score must be between 0 and 200';
  END IF;

  IF p_confidence IS NULL OR p_confidence < 0 OR p_confidence > 100 THEN
    RAISE EXCEPTION 'Confidence must be between 0 and 100';
  END IF;

  IF p_category_id IS NOT NULL THEN
    SELECT sports_type_id INTO v_category_sport
    FROM public.prediction_categories
    WHERE id = p_category_id;

    IF v_category_sport IS NULL THEN
      RAISE EXCEPTION 'Prediction category % not found', p_category_id;
    END IF;

    IF v_category_sport <> v_match.sports_type_id THEN
      RAISE EXCEPTION 'Prediction category sport mismatch for match %', p_match_id;
    END IF;
  END IF;
END;
$$;

-- ------------------------------------------------
-- 6.3 Calculation Functions
-- ------------------------------------------------
CREATE OR REPLACE FUNCTION public.calculate_confidence_score(p_prediction_id uuid)
RETURNS numeric(5,2)
LANGUAGE plpgsql
AS $$
DECLARE
  v_prediction record;
  v_win_rate numeric(7,4);
  v_recent numeric(7,4);
  v_value numeric(7,4);
BEGIN
  SELECT p.id,
         p.user_id,
         p.win_probability,
         p.confidence_score
    INTO v_prediction
  FROM public.predictions p
  WHERE p.id = p_prediction_id;

  IF v_prediction.id IS NULL THEN
    RAISE EXCEPTION 'Prediction % not found for confidence computation', p_prediction_id;
  END IF;

  SELECT COALESCE(AVG(CASE WHEN status = 'won' THEN 1.0 WHEN status = 'lost' THEN 0.0 ELSE NULL END), 0.5)
    INTO v_win_rate
  FROM public.predictions
  WHERE user_id = v_prediction.user_id
    AND status IN ('won', 'lost');

  SELECT COALESCE(AVG(confidence_score / 100.0), 0.5)
    INTO v_recent
  FROM public.predictions
  WHERE user_id = v_prediction.user_id
  ORDER BY created_at DESC
  LIMIT 10;

  v_value := (v_win_rate * 0.6 + v_recent * 0.2 + (v_prediction.win_probability / 100.0) * 0.2) * 100;
  RETURN round(least(100, greatest(0, v_value)), 2);
END;
$$;
COMMENT ON FUNCTION public.calculate_confidence_score(uuid) IS 'Produces a blended confidence figure based on historical win rate and input win probability.';

CREATE OR REPLACE FUNCTION public.calculate_win_probability(
  p_match_id uuid,
  p_team_id uuid DEFAULT NULL
)
RETURNS numeric(5,2)
LANGUAGE plpgsql
AS $$
DECLARE
  v_match record;
  v_team_id uuid;
  v_opponent_id uuid;
  v_team_rank record;
  v_opponent_rank record;
  v_points_diff numeric;
  v_total numeric;
BEGIN
  SELECT * INTO v_match FROM public.matches WHERE id = p_match_id;
  IF v_match.id IS NULL THEN
    RAISE EXCEPTION 'Match % not found for probability calculation', p_match_id;
  END IF;

  v_team_id := coalesce(p_team_id, v_match.home_team_id);
  v_opponent_id := CASE WHEN v_team_id = v_match.home_team_id THEN v_match.away_team_id ELSE v_match.home_team_id END;

  SELECT * INTO v_team_rank FROM public.team_rankings WHERE league_id = v_match.league_id AND team_id = v_team_id;
  SELECT * INTO v_opponent_rank FROM public.team_rankings WHERE league_id = v_match.league_id AND team_id = v_opponent_id;

  v_points_diff := coalesce(v_team_rank.points, 0) - coalesce(v_opponent_rank.points, 0);
  v_total := greatest(1, abs(v_points_diff))::numeric;

  RETURN round(least(100, greatest(0, 50 + (v_points_diff / (v_total * 2)) * 100)), 2);
END;
$$;
COMMENT ON FUNCTION public.calculate_win_probability(uuid, uuid) IS 'Heuristic probability derived from ranking differentials and match context.';

-- ------------------------------------------------
-- 6.4 Administrative Functions
-- ------------------------------------------------
CREATE OR REPLACE FUNCTION public.promote_user_role(
  p_target_user_id uuid,
  p_new_role public.user_role
)
RETURNS public.users
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated public.users;
BEGIN
  IF NOT (public.is_admin() OR public.is_service_role()) THEN
    RAISE EXCEPTION 'Only admins may modify roles';
  END IF;

  IF p_new_role IS NULL THEN
    RAISE EXCEPTION 'New role cannot be null';
  END IF;

  UPDATE public.users
     SET role = p_new_role,
         updated_at = timezone('utc', now())
   WHERE id = p_target_user_id
   RETURNING * INTO v_updated;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Target user % not found', p_target_user_id;
  END IF;

  RETURN v_updated;
END;
$$;
COMMENT ON FUNCTION public.promote_user_role(uuid, public.user_role) IS 'Admin-only helper to elevate or demote a user role.';

CREATE OR REPLACE FUNCTION public.bulk_update_matches(
  p_match_ids uuid[],
  p_new_status public.match_status,
  p_new_scheduled_at timestamptz DEFAULT NULL
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  IF p_match_ids IS NULL OR array_length(p_match_ids, 1) IS NULL THEN
    RAISE EXCEPTION 'Match id array cannot be empty';
  END IF;

  IF p_new_status IS NULL THEN
    RAISE EXCEPTION 'New status is required';
  END IF;

  IF NOT (public.is_admin() OR public.is_service_role()) THEN
    RAISE EXCEPTION 'Only admins or service role may bulk update matches';
  END IF;

  UPDATE public.matches
     SET status = p_new_status,
         scheduled_at = coalesce(p_new_scheduled_at, scheduled_at),
         updated_at = timezone('utc', now())
   WHERE id = ANY(p_match_ids);

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;
COMMENT ON FUNCTION public.bulk_update_matches(uuid[], public.match_status, timestamptz) IS 'Performs administrative bulk state transitions for fixtures.';

-- ------------------------------------------------
-- 6.5 Analytics Functions
-- ------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_user_prediction_stats(p_user_id uuid DEFAULT NULL)
RETURNS TABLE (
  user_id uuid,
  total_predictions bigint,
  pending bigint,
  won bigint,
  lost bigint,
  win_rate numeric(5,2),
  avg_confidence numeric(5,2)
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_target uuid := coalesce(p_user_id, public.get_current_user_id());
  v_requestor uuid := auth.uid();
  v_allowed boolean;
BEGIN
  IF v_target IS NULL THEN
    RAISE EXCEPTION 'Target user id is required';
  END IF;

  v_allowed := public.is_admin() OR public.is_analyst() OR public.is_service_role() OR v_requestor = v_target;
  IF NOT v_allowed THEN
    RAISE EXCEPTION 'Caller is not allowed to view stats for user %', v_target;
  END IF;

  RETURN QUERY
  WITH base AS (
    SELECT
      user_id,
      COUNT(*) AS total_predictions,
      COUNT(*) FILTER (WHERE status = 'pending') AS pending,
      COUNT(*) FILTER (WHERE status = 'won') AS won,
      COUNT(*) FILTER (WHERE status = 'lost') AS lost,
      COALESCE(AVG(confidence_score), 0) AS avg_confidence
    FROM public.predictions
    WHERE user_id = v_target
  )
  SELECT
    v_target,
    COALESCE(base.total_predictions, 0) AS total_predictions,
    COALESCE(base.pending, 0) AS pending,
    COALESCE(base.won, 0) AS won,
    COALESCE(base.lost, 0) AS lost,
    CASE
      WHEN COALESCE(base.won, 0) + COALESCE(base.lost, 0) = 0 THEN NULL
      ELSE round((COALESCE(base.won, 0)::numeric / NULLIF(COALESCE(base.won, 0) + COALESCE(base.lost, 0), 0)) * 100, 2)
    END AS win_rate,
    round(COALESCE(base.avg_confidence, 0)::numeric, 2) AS avg_confidence
  FROM base;
END;
$$;
COMMENT ON FUNCTION public.get_user_prediction_stats(uuid) IS 'Aggregates prediction stats per user for dashboards.';

CREATE OR REPLACE FUNCTION public.get_league_performance(p_league_id uuid)
RETURNS TABLE (
  league_id uuid,
  team_id uuid,
  team_name text,
  wins integer,
  losses integer,
  draws integer,
  points integer,
  current_rank integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role public.user_role;
BEGIN
  IF p_league_id IS NULL THEN
    RAISE EXCEPTION 'League id is required';
  END IF;

  BEGIN
    v_role := public.get_user_role();
  EXCEPTION
    WHEN others THEN
      IF NOT public.is_service_role() THEN
        RAISE EXCEPTION 'Authentication required for league performance';
      END IF;
  END;

  IF NOT (public.is_viewer() OR public.is_service_role()) THEN
    RAISE EXCEPTION 'Caller does not have permission to view league data';
  END IF;

  RETURN QUERY
  SELECT
    tr.league_id,
    tr.team_id,
    t.name AS team_name,
    tr.wins,
    tr.losses,
    tr.draws,
    tr.points,
    ROW_NUMBER() OVER (PARTITION BY tr.league_id ORDER BY tr.points DESC, tr.wins DESC, tr.updated_at DESC) AS current_rank
  FROM public.team_rankings tr
  JOIN public.teams t ON t.id = tr.team_id
  WHERE tr.league_id = p_league_id
  ORDER BY current_rank;
END;
$$;
COMMENT ON FUNCTION public.get_league_performance(uuid) IS 'Returns ordered leaderboard rows per league for analytics consumers.';

-- ------------------------------------------------
-- 6.6 Trigger Helper Functions & Supabase Automation
-- ------------------------------------------------
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.auto_create_app_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_display text := coalesce(NEW.raw_user_meta_data->>'full_name', split_part(coalesce(NEW.email, 'unknown@localhost'), '@', 1));
  v_metadata jsonb := coalesce(NEW.raw_user_meta_data, '{}'::jsonb);
BEGIN
  INSERT INTO public.users (id, email, display_name, metadata, status)
  VALUES (NEW.id, NEW.email, v_display, v_metadata, 'active')
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        display_name = EXCLUDED.display_name,
        metadata = EXCLUDED.metadata,
        updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.enforce_match_business_rules()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_home_league uuid;
  v_away_league uuid;
BEGIN
  PERFORM public.validate_match_score(NEW.home_score, NEW.away_score, NEW.status);

  SELECT league_id INTO v_home_league FROM public.teams WHERE id = NEW.home_team_id;
  SELECT league_id INTO v_away_league FROM public.teams WHERE id = NEW.away_team_id;

  IF v_home_league IS NULL OR v_away_league IS NULL THEN
    RAISE EXCEPTION 'Both teams must exist before scheduling matches';
  END IF;

  IF v_home_league <> v_away_league THEN
    RAISE EXCEPTION 'Home (%s) and away (%s) teams must belong to same league', NEW.home_team_id, NEW.away_team_id;
  END IF;

  IF v_home_league <> NEW.league_id THEN
    RAISE EXCEPTION 'Match league_id (%s) does not match team league (%s)', NEW.league_id, v_home_league;
  END IF;

  IF NEW.started_at IS NOT NULL AND NEW.started_at < NEW.scheduled_at - interval '3 hours' THEN
    RAISE EXCEPTION 'Start time (%s) is inconsistent with scheduled time (%s)', NEW.started_at, NEW.scheduled_at;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.before_prediction_validate()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_match public.matches%ROWTYPE;
BEGIN
  PERFORM public.validate_prediction_data(
    NEW.user_id,
    NEW.match_id,
    NEW.predicted_home_score,
    NEW.predicted_away_score,
    NEW.confidence_score,
    NEW.category_id
  );

  SELECT * INTO v_match FROM public.matches WHERE id = NEW.match_id;

  IF NEW.win_probability IS NULL THEN
    NEW.win_probability := public.calculate_win_probability(NEW.match_id, NEW.predicted_winner_team_id);
  END IF;

  IF NEW.locked_at IS NULL AND v_match.scheduled_at - interval '15 minutes' <= timezone('utc', now()) THEN
    NEW.locked_at := timezone('utc', now());
    NEW.status := 'locked';
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.log_audit_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_payload jsonb;
  v_record uuid;
BEGIN
  IF TG_TABLE_NAME = 'audit_logs' THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  IF TG_OP = 'INSERT' THEN
    v_payload := to_jsonb(NEW);
    v_record := NEW.id;
  ELSIF TG_OP = 'UPDATE' THEN
    v_payload := jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW));
    v_record := NEW.id;
  ELSE
    v_payload := jsonb_build_object('old', to_jsonb(OLD));
    v_record := OLD.id;
  END IF;

  INSERT INTO public.audit_logs (actor_user_id, table_name, record_id, action, changes, severity, request_id)
  VALUES (
    auth.uid(),
    TG_TABLE_NAME,
    v_record,
    TG_OP,
    v_payload,
    CASE WHEN TG_OP = 'DELETE' THEN 'critical' ELSE 'info' END,
    gen_random_uuid()
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE OR REPLACE FUNCTION public.recalculate_prediction_metrics_for_match(p_match_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_match public.matches%ROWTYPE;
  v_winner uuid;
BEGIN
  SELECT * INTO v_match FROM public.matches WHERE id = p_match_id;
  IF v_match.id IS NULL THEN
    RETURN;
  END IF;

  IF v_match.status = 'completed' THEN
    IF v_match.home_score > v_match.away_score THEN
      v_winner := v_match.home_team_id;
    ELSIF v_match.home_score < v_match.away_score THEN
      v_winner := v_match.away_team_id;
    ELSE
      v_winner := NULL;
    END IF;

    UPDATE public.predictions p
       SET status = CASE
                      WHEN v_winner IS NULL THEN 'void'
                      WHEN p.predicted_winner_team_id = v_winner THEN 'won'
                      ELSE 'lost'
                    END,
           accuracy_score = CASE
                      WHEN v_winner IS NULL THEN 0
                      WHEN p.predicted_winner_team_id = v_winner THEN 100
                      ELSE greatest(0,
                        100 - abs(coalesce(p.predicted_home_score, v_match.home_score) - v_match.home_score) * 10
                            - abs(coalesce(p.predicted_away_score, v_match.away_score) - v_match.away_score) * 10)
                    END,
           updated_at = timezone('utc', now())
     WHERE p.match_id = p_match_id;
  ELSE
    UPDATE public.predictions p
       SET win_probability = public.calculate_win_probability(p.match_id, p.predicted_winner_team_id),
           updated_at = timezone('utc', now())
     WHERE p.match_id = p_match_id
       AND p.status IN ('pending', 'locked');
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.after_match_update_prediction_metrics()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM public.recalculate_prediction_metrics_for_match(NEW.id);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.recalculate_rankings_for_league(p_league_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_now timestamptz := timezone('utc', now());
BEGIN
  DELETE FROM public.team_rankings WHERE league_id = p_league_id;

  INSERT INTO public.team_rankings (id, league_id, team_id, wins, losses, draws, points, form, last_calculated_at, created_at, updated_at)
  SELECT
    gen_random_uuid() AS id,
    p_league_id,
    t.id,
    COALESCE(stats.wins, 0) AS wins,
    COALESCE(stats.losses, 0) AS losses,
    COALESCE(stats.draws, 0) AS draws,
    COALESCE(stats.wins, 0) * 3 + COALESCE(stats.draws, 0) AS points,
    COALESCE(stats.form, ARRAY[]::text[]) AS form,
    v_now,
    v_now,
    v_now
  FROM public.teams t
  LEFT JOIN LATERAL (
    SELECT
      SUM(CASE WHEN (m.home_team_id = t.id AND m.home_score > m.away_score) OR (m.away_team_id = t.id AND m.away_score > m.home_score) THEN 1 ELSE 0 END) AS wins,
      SUM(CASE WHEN (m.home_team_id = t.id AND m.home_score < m.away_score) OR (m.away_team_id = t.id AND m.away_score < m.home_score) THEN 1 ELSE 0 END) AS losses,
      SUM(CASE WHEN m.home_score = m.away_score THEN 1 ELSE 0 END) AS draws,
      ARRAY(
        SELECT CASE
                 WHEN (m2.home_team_id = t.id AND m2.home_score > m2.away_score) OR (m2.away_team_id = t.id AND m2.away_score > m2.home_score) THEN 'W'
                 WHEN m2.home_score = m2.away_score THEN 'D'
                 ELSE 'L'
               END
        FROM public.matches m2
        WHERE m2.league_id = p_league_id
          AND m2.status = 'completed'
          AND (m2.home_team_id = t.id OR m2.away_team_id = t.id)
        ORDER BY m2.completed_at DESC NULLS LAST
        LIMIT 5
      ) AS form
    FROM public.matches m
    WHERE m.league_id = p_league_id
      AND m.status = 'completed'
      AND (m.home_team_id = t.id OR m.away_team_id = t.id)
  ) stats ON TRUE
  WHERE t.league_id = p_league_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.refresh_team_rankings()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status = 'completed' OR (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
    PERFORM public.recalculate_rankings_for_league(NEW.league_id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.ensure_team_manager_assignment()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.users WHERE id = NEW.user_id AND role IN ('team_manager', 'predictor', 'analyst', 'admin')
  ) THEN
    RAISE EXCEPTION 'User % must hold a team_manager-compatible role before assignment', NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$;

-- ================================================================
-- Section 7. Trigger Wiring
-- ================================================================
DROP TRIGGER IF EXISTS trg_auth_users_to_app_users ON auth.users;
CREATE TRIGGER trg_auth_users_to_app_users
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.auto_create_app_user();

CREATE TRIGGER trg_users_updated BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_sports_types_updated BEFORE UPDATE ON public.sports_types FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_leagues_updated BEFORE UPDATE ON public.leagues FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_teams_updated BEFORE UPDATE ON public.teams FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_team_manager_assignments_updated BEFORE UPDATE ON public.team_manager_assignments FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_players_updated BEFORE UPDATE ON public.players FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_prediction_categories_updated BEFORE UPDATE ON public.prediction_categories FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_matches_updated BEFORE UPDATE ON public.matches FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_team_rankings_updated BEFORE UPDATE ON public.team_rankings FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_predictions_updated BEFORE UPDATE ON public.predictions FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_feedback_updated BEFORE UPDATE ON public.feedback FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_audit_logs_updated BEFORE UPDATE ON public.audit_logs FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_analysis_insights_updated BEFORE UPDATE ON public.analysis_insights FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TRIGGER trg_matches_enforce_rules
  BEFORE INSERT OR UPDATE ON public.matches
  FOR EACH ROW EXECUTE FUNCTION public.enforce_match_business_rules();

CREATE TRIGGER trg_predictions_validate
  BEFORE INSERT OR UPDATE ON public.predictions
  FOR EACH ROW EXECUTE FUNCTION public.before_prediction_validate();

CREATE TRIGGER trg_match_prediction_metrics
  AFTER INSERT OR UPDATE ON public.matches
  FOR EACH ROW EXECUTE FUNCTION public.after_match_update_prediction_metrics();

CREATE TRIGGER trg_match_rankings_refresh
  AFTER INSERT OR UPDATE ON public.matches
  FOR EACH ROW EXECUTE FUNCTION public.refresh_team_rankings();

CREATE TRIGGER trg_team_manager_assignment_guard
  BEFORE INSERT OR UPDATE ON public.team_manager_assignments
  FOR EACH ROW EXECUTE FUNCTION public.ensure_team_manager_assignment();

CREATE TRIGGER trg_users_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_change();
CREATE TRIGGER trg_matches_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.matches
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_change();
CREATE TRIGGER trg_teams_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.teams
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_change();
CREATE TRIGGER trg_predictions_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.predictions
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_change();
CREATE TRIGGER trg_feedback_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.feedback
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_change();
CREATE TRIGGER trg_analysis_insights_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.analysis_insights
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_change();

-- ================================================================
-- Section 8. Grants & RBAC Privileges
-- ================================================================
GRANT USAGE ON SCHEMA public TO admin, analyst, predictor, team_manager, viewer;
GRANT USAGE ON TYPE public.user_role TO PUBLIC;

-- Admin: full control.
GRANT SELECT, INSERT, UPDATE, DELETE ON
  public.users,
  public.sports_types,
  public.leagues,
  public.teams,
  public.team_manager_assignments,
  public.players,
  public.prediction_categories,
  public.matches,
  public.team_rankings,
  public.predictions,
  public.feedback,
  public.audit_logs,
  public.analysis_insights
TO admin;

-- Analyst: read everything, manage analysis insights.
GRANT SELECT ON
  public.users,
  public.sports_types,
  public.leagues,
  public.teams,
  public.team_manager_assignments,
  public.players,
  public.prediction_categories,
  public.matches,
  public.team_rankings,
  public.predictions,
  public.feedback,
  public.audit_logs,
  public.analysis_insights
TO analyst;
GRANT INSERT, UPDATE, DELETE ON public.analysis_insights TO analyst;

-- Predictor: maintain own predictions & feedback, view public match data.
GRANT SELECT ON
  public.sports_types,
  public.leagues,
  public.teams,
  public.players,
  public.prediction_categories,
  public.matches,
  public.team_rankings,
  public.analysis_insights
TO predictor;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.predictions TO predictor;
GRANT SELECT, INSERT, UPDATE ON public.feedback TO predictor;

-- Team manager: manage team + roster data, view related predictions.
GRANT SELECT ON
  public.sports_types,
  public.leagues,
  public.teams,
  public.players,
  public.prediction_categories,
  public.matches,
  public.team_rankings,
  public.predictions,
  public.analysis_insights
TO team_manager;
GRANT INSERT, UPDATE, DELETE ON public.players TO team_manager;
GRANT UPDATE ON public.teams TO team_manager;

-- Viewer: read-only public context.
GRANT SELECT ON
  public.sports_types,
  public.leagues,
  public.teams,
  public.players,
  public.prediction_categories,
  public.matches,
  public.team_rankings
TO viewer;

-- Service role: background jobs with unrestricted DML.
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Function execution privileges
GRANT EXECUTE ON FUNCTION public.get_current_user_id()
TO admin, analyst, predictor, team_manager, viewer;
GRANT EXECUTE ON FUNCTION public.get_user_role(uuid)
TO admin, analyst, predictor, team_manager;
GRANT EXECUTE ON FUNCTION public.calculate_confidence_score(uuid)
TO admin, analyst, predictor;
GRANT EXECUTE ON FUNCTION public.calculate_win_probability(uuid, uuid)
TO admin, analyst, predictor, team_manager, viewer;
GRANT EXECUTE ON FUNCTION public.get_user_prediction_stats(uuid)
TO admin, analyst, predictor;
GRANT EXECUTE ON FUNCTION public.get_league_performance(uuid)
TO admin, analyst, predictor, team_manager, viewer;
GRANT EXECUTE ON FUNCTION public.promote_user_role(uuid, public.user_role)
TO admin;
GRANT EXECUTE ON FUNCTION public.bulk_update_matches(uuid[], public.match_status, timestamptz)
TO admin;
GRANT EXECUTE ON FUNCTION public.get_user_prediction_stats(uuid)
TO service_role;
GRANT EXECUTE ON FUNCTION public.get_league_performance(uuid)
TO service_role;
GRANT EXECUTE ON FUNCTION public.calculate_confidence_score(uuid)
TO service_role;
GRANT EXECUTE ON FUNCTION public.calculate_win_probability(uuid, uuid)
TO service_role;
GRANT EXECUTE ON FUNCTION public.promote_user_role(uuid, public.user_role)
TO service_role;
GRANT EXECUTE ON FUNCTION public.bulk_update_matches(uuid[], public.match_status, timestamptz)
TO service_role;

-- ================================================================
-- Section 9. Seed Data (Users)
-- ================================================================
WITH insert_auth AS (
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    invited_at,
    confirmation_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    created_at,
    updated_at,
    aud,
    role
  ) VALUES
    (
      '00000000-0000-0000-0000-00000000a001',
      '00000000-0000-0000-0000-000000000000',
      'admin@sportshub.demo',
      crypt('SupabaseAdmin#123', gen_salt('bf')),
      timezone('utc', now()),
      timezone('utc', now()),
      timezone('utc', now()),
      timezone('utc', now()),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"System Admin","preferred_language":"en"}'::jsonb,
      true,
      timezone('utc', now()),
      timezone('utc', now()),
      'authenticated',
      'authenticated'
    ),
    (
      '00000000-0000-0000-0000-00000000a002',
      '00000000-0000-0000-0000-000000000000',
      'analyst@sportshub.demo',
      crypt('Analyst#123', gen_salt('bf')),
      timezone('utc', now()),
      timezone('utc', now()),
      timezone('utc', now()),
      timezone('utc', now()),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Marta Analyst","preferred_language":"en"}'::jsonb,
      false,
      timezone('utc', now()),
      timezone('utc', now()),
      'authenticated',
      'authenticated'
    ),
    (
      '00000000-0000-0000-0000-00000000a003',
      '00000000-0000-0000-0000-000000000000',
      'predictor@sportshub.demo',
      crypt('Predictor#123', gen_salt('bf')),
      timezone('utc', now()),
      timezone('utc', now()),
      timezone('utc', now()),
      timezone('utc', now()),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Diego Predictor","preferred_language":"es"}'::jsonb,
      false,
      timezone('utc', now()),
      timezone('utc', now()),
      'authenticated',
      'authenticated'
    ),
    (
      '00000000-0000-0000-0000-00000000a004',
      '00000000-0000-0000-0000-000000000000',
      'manager@sportshub.demo',
      crypt('Manager#123', gen_salt('bf')),
      timezone('utc', now()),
      timezone('utc', now()),
      timezone('utc', now()),
      timezone('utc', now()),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Kendra Manager","preferred_language":"en"}'::jsonb,
      false,
      timezone('utc', now()),
      timezone('utc', now()),
      'authenticated',
      'authenticated'
    ),
    (
      '00000000-0000-0000-0000-00000000a005',
      '00000000-0000-0000-0000-000000000000',
      'viewer@sportshub.demo',
      crypt('Viewer#123', gen_salt('bf')),
      timezone('utc', now()),
      timezone('utc', now()),
      timezone('utc', now()),
      timezone('utc', now()),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Veronica Viewer","preferred_language":"fr"}'::jsonb,
      false,
      timezone('utc', now()),
      timezone('utc', now()),
      'authenticated',
      'authenticated'
    )
  ON CONFLICT (id) DO NOTHING
  RETURNING id
)
SELECT COUNT(*) FROM insert_auth;

-- Align application roles and metadata
UPDATE public.users
SET role = 'admin', display_name = 'System Admin', timezone = 'UTC', status = 'active'
WHERE id = '00000000-0000-0000-0000-00000000a001';

UPDATE public.users
SET role = 'analyst', display_name = 'Marta Analyst', timezone = 'Europe/Budapest'
WHERE id = '00000000-0000-0000-0000-00000000a002';

UPDATE public.users
SET role = 'predictor', display_name = 'Diego Predictor', timezone = 'Europe/Madrid'
WHERE id = '00000000-0000-0000-0000-00000000a003';

UPDATE public.users
SET role = 'team_manager', display_name = 'Kendra Manager', timezone = 'America/New_York'
WHERE id = '00000000-0000-0000-0000-00000000a004';

UPDATE public.users
SET role = 'viewer', display_name = 'Veronica Viewer', timezone = 'Europe/Paris'
WHERE id = '00000000-0000-0000-0000-00000000a005';

-- ================================================================
-- Section 9. Seed Data (Sports Types, Leagues, Categories)
-- ================================================================
INSERT INTO public.sports_types (name, slug, description, popularity_score)
VALUES
  ('Association Football', 'soccer', 'Global football competitions with promotion and relegation.', 95),
  ('Basketball', 'basketball', 'Professional basketball competitions.', 88),
  ('American Football', 'american-football', 'Gridiron style football leagues.', 76),
  ('Esports', 'esports', 'Professional competitive gaming leagues.', 60)
ON CONFLICT (slug) DO UPDATE
SET name = EXCLUDED.name,
    description = EXCLUDED.description,
    is_active = true,
    popularity_score = EXCLUDED.popularity_score;

INSERT INTO public.leagues (sports_type_id, name, code, region, tier, season, status, start_date, end_date, metadata)
VALUES
  ((SELECT id FROM public.sports_types WHERE slug = 'soccer'), 'North Atlantic Premier League', 'NAPL', 'UK', 1, '2024/2025', 'active', '2024-08-10', '2025-05-18', '{"country":"England"}'::jsonb),
  ((SELECT id FROM public.sports_types WHERE slug = 'soccer'), 'Baltic Superliga', 'BSL', 'Eastern Europe', 1, '2024', 'active', '2024-03-01', '2024-11-15', '{"country":"Baltics"}'::jsonb),
  ((SELECT id FROM public.sports_types WHERE slug = 'basketball'), 'Continental Hoops League', 'CHL', 'Europe', 1, '2024/2025', 'active', '2024-10-05', '2025-04-30', '{"format":"round_robin"}'::jsonb),
  ((SELECT id FROM public.sports_types WHERE slug = 'american-football'), 'Gridiron Elite Conference', 'GEC', 'USA', 1, '2024', 'active', '2024-09-07', '2025-01-18', '{"playoffs":"single_elim"}'::jsonb)
ON CONFLICT (code) DO UPDATE
SET season = EXCLUDED.season,
    status = EXCLUDED.status,
    metadata = EXCLUDED.metadata;

INSERT INTO public.prediction_categories (sports_type_id, name, slug, description, min_confidence)
VALUES
  ((SELECT id FROM public.sports_types WHERE slug = 'soccer'), 'Full Time Result', 'full_time_result', 'Predict the team that wins the match.', 30),
  ((SELECT id FROM public.sports_types WHERE slug = 'soccer'), 'Both Teams To Score', 'btts', 'Whether both sides score at least once.', 35),
  ((SELECT id FROM public.sports_types WHERE slug = 'soccer'), 'Over 2.5 Goals', 'over_2_5', 'Predict total goals over 2.5.', 40),
  ((SELECT id FROM public.sports_types WHERE slug = 'basketball'), 'Total Points', 'total_points', 'Predict combined score window.', 25),
  ((SELECT id FROM public.sports_types WHERE slug = 'basketball'), 'Spread Cover', 'spread_cover', 'Predict whether favourite covers spread.', 35),
  ((SELECT id FROM public.sports_types WHERE slug = 'american-football'), 'Moneyline', 'moneyline', 'Predict outright winner.', 30),
  ((SELECT id FROM public.sports_types WHERE slug = 'american-football'), 'Passing Yards Prop', 'passing_yards', 'Quarterback passing yards over threshold.', 45)
ON CONFLICT (slug) DO UPDATE
SET description = EXCLUDED.description,
    min_confidence = EXCLUDED.min_confidence;

-- ================================================================
-- Section 9. Seed Data (Teams & Assignments)
-- ================================================================
WITH team_seed (code, name, league_code, sports_slug, city, founded_year, primary_color, secondary_color) AS (
  VALUES
    ('NAPL-NOR', 'Northport Rovers', 'NAPL', 'soccer', 'Northport', 1892, 'navy', 'white'),
    ('NAPL-SFC', 'Seaside FC', 'NAPL', 'soccer', 'Brighton', 1904, 'aqua', 'white'),
    ('NAPL-HCF', 'Harbor City FC', 'NAPL', 'soccer', 'Liverpool', 1889, 'red', 'black'),
    ('NAPL-ACM', 'Academy Mariners', 'NAPL', 'soccer', 'London', 1911, 'blue', 'gold'),
    ('NAPL-RYD', 'Rydell United', 'NAPL', 'soccer', 'Manchester', 1878, 'maroon', 'gold'),
    ('NAPL-BRG', 'Bridgeview Guardians', 'NAPL', 'soccer', 'Newcastle', 1897, 'black', 'white'),
    ('NAPL-VAL', 'Valeshire Athletic', 'NAPL', 'soccer', 'Sheffield', 1908, 'green', 'white'),
    ('NAPL-LYN', 'Lighthouse 87', 'NAPL', 'soccer', 'Southampton', 1885, 'yellow', 'blue'),
    ('BSL-RIG', 'Riga Kings', 'BSL', 'soccer', 'Riga', 1946, 'burgundy', 'silver'),
    ('BSL-TLN', 'Tallinn Arrows', 'BSL', 'soccer', 'Tallinn', 1952, 'blue', 'white'),
    ('BSL-VNO', 'Vilnius Thunder', 'BSL', 'soccer', 'Vilnius', 1948, 'gold', 'black'),
    ('BSL-KLP', 'Klaipeda Sailors', 'BSL', 'soccer', 'Klaipeda', 1938, 'teal', 'white'),
    ('BSL-TAR', 'Tartu Scholars', 'BSL', 'soccer', 'Tartu', 1950, 'purple', 'white'),
    ('BSL-KAU', 'Kaunas Forge', 'BSL', 'soccer', 'Kaunas', 1936, 'orange', 'black'),
    ('BSL-LIE', 'Liepaja Baltic', 'BSL', 'soccer', 'Liepaja', 1944, 'red', 'white'),
    ('BSL-PSK', 'Pärnu Sandstorm', 'BSL', 'soccer', 'Pärnu', 1951, 'sand', 'navy'),
    ('CHL-LYN', 'Lakeside Lynx', 'CHL', 'basketball', 'Geneva', 1993, 'turquoise', 'purple'),
    ('CHL-ALP', 'Alpine Peaks', 'CHL', 'basketball', 'Zurich', 1989, 'white', 'blue'),
    ('CHL-OWL', 'Capital Owls', 'CHL', 'basketball', 'Vienna', 1995, 'black', 'gold'),
    ('CHL-BOR', 'Bordeaux Giants', 'CHL', 'basketball', 'Bordeaux', 1992, 'wine', 'black'),
    ('CHL-VAL', 'Valencia Comets', 'CHL', 'basketball', 'Valencia', 1998, 'orange', 'white'),
    ('CHL-AMS', 'Amsterdam Circuit', 'CHL', 'basketball', 'Amsterdam', 1990, 'navy', 'orange'),
    ('CHL-MIL', 'Milan Stars', 'CHL', 'basketball', 'Milan', 1984, 'red', 'white'),
    ('CHL-BER', 'Berlin Flux', 'CHL', 'basketball', 'Berlin', 1988, 'teal', 'black'),
    ('GEC-HWK', 'Harbor Hawks', 'GEC', 'american-football', 'Seattle', 1976, 'emerald', 'blue'),
    ('GEC-ATL', 'Atlas Guardians', 'GEC', 'american-football', 'Atlanta', 1982, 'red', 'black'),
    ('GEC-SOL', 'Solaris Blaze', 'GEC', 'american-football', 'Phoenix', 1986, 'orange', 'red'),
    ('GEC-ICE', 'Icecap Titans', 'GEC', 'american-football', 'Minneapolis', 1979, 'blue', 'silver'),
    ('GEC-RIV', 'River City Rampage', 'GEC', 'american-football', 'Cincinnati', 1980, 'black', 'orange'),
    ('GEC-BLU', 'Blue Ridge Sentinels', 'GEC', 'american-football', 'Denver', 1974, 'blue', 'orange'),
    ('GEC-LIB', 'Liberty Stallions', 'GEC', 'american-football', 'New York', 1972, 'navy', 'silver'),
    ('GEC-GUL', 'Gulf Monarchs', 'GEC', 'american-football', 'Houston', 1977, 'teal', 'white')
)
INSERT INTO public.teams (name, code, league_id, sports_type_id, city, founded_year, colors, manager_user_id, metadata)
SELECT
  ts.name,
  ts.code,
  (SELECT id FROM public.leagues WHERE code = ts.league_code),
  (SELECT id FROM public.sports_types WHERE slug = ts.sports_slug),
  ts.city,
  ts.founded_year,
  ARRAY[ts.primary_color, ts.secondary_color],
  CASE WHEN ts.code IN ('NAPL-NOR', 'BSL-RIG', 'CHL-LYN', 'GEC-HWK') THEN '00000000-0000-0000-0000-00000000a004'::uuid END,
  jsonb_build_object('short_code', ts.code)
FROM team_seed ts
ON CONFLICT (code) DO UPDATE
SET city = EXCLUDED.city,
    manager_user_id = EXCLUDED.manager_user_id,
    metadata = EXCLUDED.metadata;

INSERT INTO public.team_manager_assignments (team_id, user_id, is_primary)
SELECT t.id, '00000000-0000-0000-0000-00000000a004'::uuid, true
FROM public.teams t
WHERE t.code IN ('NAPL-NOR', 'BSL-RIG', 'CHL-LYN', 'GEC-HWK')
ON CONFLICT (team_id, user_id) DO NOTHING;

-- ================================================================
-- Section 9. Seed Data (Players)
-- ================================================================
WITH player_seed (team_code, first_name, last_name, position, jersey_number, dob, nationality) AS (
  VALUES
    ('NAPL-NOR','Luka','Moretti','Goalkeeper',1,'1992-04-11','Italy'),
    ('NAPL-NOR','Aaron','Flynn','Defender',3,'1994-06-21','Scotland'),
    ('NAPL-NOR','Mateo','Cardozo','Midfielder',8,'1997-09-02','Argentina'),
    ('NAPL-NOR','Jonas','Whitaker','Forward',11,'1996-01-15','England'),
    ('NAPL-SFC','Leo','Baptiste','Goalkeeper',1,'1991-02-19','France'),
    ('NAPL-SFC','Declan','Matthews','Defender',4,'1995-12-08','Ireland'),
    ('NAPL-SFC','Kai','Watanabe','Midfielder',7,'1998-03-23','Japan'),
    ('NAPL-SFC','Sergio','Carrillo','Forward',10,'1993-05-14','Spain'),
    ('NAPL-HCF','Victor','Mensah','Defender',5,'1996-08-30','Ghana'),
    ('NAPL-HCF','Ben','Silvers','Midfielder',6,'1999-04-27','England'),
    ('NAPL-HCF','Eduardo','Saez','Forward',9,'1995-11-09','Chile'),
    ('NAPL-ACM','Noah','Fraser','Goalkeeper',13,'1992-07-04','Australia'),
    ('NAPL-ACM','Felix','Orlova','Midfielder',14,'1997-01-18','Ukraine'),
    ('NAPL-RYD','Marcus','Ngata','Forward',17,'1994-05-06','Kenya'),
    ('NAPL-BRG','Louis','Carmichael','Defender',2,'1993-10-25','England'),
    ('NAPL-VAL','Iago','Santos','Midfielder',16,'1998-02-01','Portugal'),
    ('NAPL-LYN','Carlos','Ribeiro','Forward',19,'1996-09-29','Brazil'),
    ('BSL-RIG','Darius','Kalnins','Goalkeeper',1,'1991-12-17','Latvia'),
    ('BSL-RIG','Marek','Vasiliev','Defender',4,'1995-07-13','Estonia'),
    ('BSL-RIG','Oleg','Milinski','Midfielder',8,'1999-06-09','Lithuania'),
    ('BSL-RIG','Andrejs','Petersons','Forward',11,'1993-10-12','Latvia'),
    ('BSL-TLN','Sven','Paulus','Goalkeeper',12,'1992-03-31','Estonia'),
    ('BSL-TLN','Ragnar','Kask','Defender',5,'1996-05-22','Estonia'),
    ('BSL-TLN','Martin','Sillaste','Midfielder',6,'1998-07-30','Estonia'),
    ('BSL-TLN','Karl','Mets','Forward',10,'1995-01-27','Estonia'),
    ('BSL-VNO','Justas','Petrauskas','Defender',3,'1994-09-19','Lithuania'),
    ('BSL-VNO','Dominykas','Valeika','Midfielder',15,'1997-04-09','Lithuania'),
    ('BSL-VNO','Paulius','Jurkunas','Forward',18,'1995-02-10','Lithuania'),
    ('BSL-KLP','Mindaugas','Pavlis','Goalkeeper',23,'1992-08-05','Lithuania'),
    ('BSL-KLP','Viktor','Grazis','Midfielder',21,'1998-11-16','Latvia'),
    ('BSL-TAR','Henri','Karu','Forward',9,'1996-05-02','Estonia'),
    ('BSL-KAU','Aidas','Zubrus','Defender',2,'1993-06-18','Lithuania'),
    ('BSL-LIE','Armands','Ozolins','Midfielder',13,'1998-01-04','Latvia'),
    ('BSL-PSK','Tomas','Lill','Forward',7,'1997-10-21','Estonia'),
    ('CHL-LYN','Oskar','Heinrich','Guard',2,'1995-04-24','Germany'),
    ('CHL-LYN','Mateo','Sierra','Forward',11,'1997-12-13','Spain'),
    ('CHL-LYN','Anthony','Carver','Center',33,'1993-03-02','USA'),
    ('CHL-LYN','Pavel','Dusek','Guard',7,'1998-07-11','Czech Republic'),
    ('CHL-ALP','Jonas','Gruber','Forward',9,'1996-05-19','Austria'),
    ('CHL-ALP','Liam','Donnelly','Guard',4,'1999-02-28','Ireland'),
    ('CHL-ALP','Tobias','Hoff','Center',55,'1994-11-05','Germany'),
    ('CHL-OWL','Nico','Rossi','Guard',5,'1997-03-30','Italy'),
    ('CHL-OWL','Marco','Bellucci','Forward',15,'1995-06-08','Italy'),
    ('CHL-OWL','Robert','Schmidt','Center',50,'1993-01-09','Austria'),
    ('CHL-BOR','Yann','Gauthier','Forward',14,'1996-09-01','France'),
    ('CHL-BOR','Louis','Delacroix','Guard',8,'1998-12-16','France'),
    ('CHL-BOR','Caleb','Morris','Center',44,'1994-04-05','USA'),
    ('CHL-VAL','Pablo','Navarro','Guard',3,'1999-05-12','Spain'),
    ('CHL-VAL','Carlos','Benitez','Forward',13,'1995-07-07','Spain'),
    ('CHL-AMS','Daan','Visser','Guard',6,'1997-08-28','Netherlands'),
    ('CHL-MIL','Alessio','Ventura','Forward',24,'1996-10-22','Italy'),
    ('CHL-BER','Jan','Schuster','Center',42,'1993-02-14','Germany'),
    ('GEC-HWK','Evan','Brooks','Quarterback',12,'1992-06-03','USA'),
    ('GEC-HWK','Miles','Turnbull','Wide Receiver',80,'1995-09-17','USA'),
    ('GEC-HWK','Caleb','Harmon','Linebacker',52,'1994-12-20','USA'),
    ('GEC-HWK','Isaiah','Keller','Running Back',26,'1996-08-08','USA'),
    ('GEC-ATL','Jamal','Reed','Quarterback',9,'1993-03-14','USA'),
    ('GEC-ATL','Tariq','Sanders','Wide Receiver',17,'1996-05-26','USA'),
    ('GEC-ATL','Nolan','Price','Linebacker',54,'1992-11-01','USA'),
    ('GEC-SOL','Logan','Michaels','Quarterback',7,'1994-04-19','USA'),
    ('GEC-SOL','Andre','Palmer','Running Back',33,'1995-12-03','USA'),
    ('GEC-SOL','Owen','Grayson','Defensive Back',23,'1997-09-25','USA'),
    ('GEC-ICE','Lars','Hansen','Quarterback',15,'1992-01-30','USA'),
    ('GEC-ICE','Tyler','Braun','Wide Receiver',19,'1994-07-16','USA'),
    ('GEC-ICE','Noah','Shaw','Linebacker',57,'1996-02-04','USA'),
    ('GEC-RIV','Carter','Dalton','Quarterback',10,'1993-10-18','USA'),
    ('GEC-RIV','Riley','Cole','Wide Receiver',84,'1995-06-27','USA'),
    ('GEC-BLU','Devin','Hunter','Running Back',22,'1994-09-04','USA'),
    ('GEC-LIB','Julian','Banks','Quarterback',5,'1992-11-29','USA'),
    ('GEC-LIB','Andre','Lewis','Wide Receiver',88,'1996-03-07','USA'),
    ('GEC-GUL','Mason','Griffin','Quarterback',16,'1993-08-12','USA'),
    ('GEC-GUL','Darius','Moore','Linebacker',58,'1995-01-25','USA')
)
INSERT INTO public.players (team_id, league_id, first_name, last_name, position, jersey_number, date_of_birth, nationality, status)
SELECT
  t.id,
  t.league_id,
  ps.first_name,
  ps.last_name,
  ps.position,
  ps.jersey_number,
  ps.dob::date,
  ps.nationality,
  'active'
FROM player_seed ps
JOIN public.teams t ON t.code = ps.team_code
ON CONFLICT DO NOTHING;

-- ================================================================
-- Section 9. Seed Data (Matches)
-- ================================================================
WITH match_seed (
  reference_code,
  league_code,
  home_code,
  away_code,
  season,
  match_day,
  status,
  home_score,
  away_score,
  scheduled_at,
  completed_at,
  venue,
  extra_time,
  weather
) AS (
  VALUES
    ('MCH-NAPL-001','NAPL','NAPL-NOR','NAPL-SFC','2024/2025',1,'completed',2,1,'2024-08-12 17:30+00','2024-08-12 19:25+00','Northport Arena',false,'{"temperature_c":15,"conditions":"clear"}'::jsonb),
    ('MCH-NAPL-002','NAPL','NAPL-HCF','NAPL-ACM','2024/2025',1,'completed',1,1,'2024-08-13 18:00+00','2024-08-13 19:55+00','Harbor City Ground',false,'{"temperature_c":13,"conditions":"rain"}'::jsonb),
    ('MCH-NAPL-003','NAPL','NAPL-RYD','NAPL-BRG','2024/2025',2,'completed',3,2,'2024-08-20 19:00+00','2024-08-20 20:58+00','Rydell Park',false,'{"temperature_c":16,"conditions":"cloudy"}'::jsonb),
    ('MCH-NAPL-004','NAPL','NAPL-VAL','NAPL-LYN','2024/2025',2,'scheduled',NULL,NULL,'2024-09-05 16:30+00',NULL,'Valeshire Stadium',false,'{"forecast":"wind"}'::jsonb),
    ('MCH-NAPL-005','NAPL','NAPL-NOR','NAPL-HCF','2024/2025',3,'scheduled',NULL,NULL,'2024-09-12 19:45+00',NULL,'Northport Arena',false,'{"forecast":"rain"}'::jsonb),
    ('MCH-NAPL-006','NAPL','NAPL-SFC','NAPL-RYD','2024/2025',3,'completed',0,2,'2024-09-14 14:00+00','2024-09-14 15:58+00','Seaside Docks Park',false,'{"temperature_c":19,"conditions":"sunny"}'::jsonb),
    ('MCH-NAPL-007','NAPL','NAPL-VAL','NAPL-NOR','2024/2025',4,'completed',1,2,'2024-09-28 18:00+00','2024-09-28 19:52+00','Valeshire Stadium',false,'{"temperature_c":12,"conditions":"fog"}'::jsonb),
    ('MCH-BSL-001','BSL','BSL-RIG','BSL-TLN','2024',5,'completed',1,0,'2024-05-04 15:00+00','2024-05-04 16:55+00','Daugava Park',false,'{"temperature_c":11,"conditions":"overcast"}'::jsonb),
    ('MCH-BSL-002','BSL','BSL-VNO','BSL-KLP','2024',5,'completed',2,2,'2024-05-05 17:00+00','2024-05-05 18:56+00','Vilnius Dome',false,'{"temperature_c":13,"conditions":"rain"}'::jsonb),
    ('MCH-BSL-003','BSL','BSL-TAR','BSL-KAU','2024',6,'scheduled',NULL,NULL,'2024-06-10 18:30+00',NULL,'Tartu Field',false,'{"forecast":"clear"}'::jsonb),
    ('MCH-BSL-004','BSL','BSL-LIE','BSL-PSK','2024',6,'completed',3,1,'2024-06-12 17:15+00','2024-06-12 19:05+00','Liepaja Arena',false,'{"temperature_c":18,"conditions":"sunny"}'::jsonb),
    ('MCH-BSL-005','BSL','BSL-RIG','BSL-VNO','2024',7,'scheduled',NULL,NULL,'2024-07-20 16:00+00',NULL,'Daugava Park',false,'{"forecast":"storms"}'::jsonb),
    ('MCH-CHL-001','CHL','CHL-LYN','CHL-ALP','2024/2025',1,'completed',96,90,'2024-10-08 19:00+00','2024-10-08 21:05+00','Lakeside Arena',false,'{"attendance":9300}'::jsonb),
    ('MCH-CHL-002','CHL','CHL-OWL','CHL-BOR','2024/2025',1,'completed',101,94,'2024-10-09 20:00+00','2024-10-09 22:10+00','Capital Pavilion',false,'{"attendance":10400}'::jsonb),
    ('MCH-CHL-003','CHL','CHL-VAL','CHL-AMS','2024/2025',2,'scheduled',NULL,NULL,'2024-10-16 19:30+00',NULL,'Valencia Center',false,'{"promo":"heritage-night"}'::jsonb),
    ('MCH-CHL-004','CHL','CHL-MIL','CHL-BER','2024/2025',2,'completed',87,88,'2024-10-17 20:00+00','2024-10-17 22:05+00','Milano Forum',false,'{"attendance":8450}'::jsonb),
    ('MCH-CHL-005','CHL','CHL-LYN','CHL-OWL','2024/2025',3,'completed',102,98,'2024-10-25 19:30+00','2024-10-25 21:33+00','Lakeside Arena',false,'{"attendance":9700}'::jsonb),
    ('MCH-GEC-001','GEC','GEC-HWK','GEC-ATL','2024',1,'completed',27,20,'2024-09-08 21:25+00','2024-09-08 23:54+00','Harbor Field',false,'{"temperature_c":21,"conditions":"clear"}'::jsonb),
    ('MCH-GEC-002','GEC','GEC-SOL','GEC-ICE','2024',1,'completed',31,28,'2024-09-09 20:10+00','2024-09-09 23:05+00','Solaris Stadium',false,'{"temperature_c":34,"conditions":"hot"}'::jsonb),
    ('MCH-GEC-003','GEC','GEC-RIV','GEC-BLU','2024',2,'scheduled',NULL,NULL,'2024-09-15 18:05+00',NULL,'River City Bowl',false,'{"forecast":"rain"}'::jsonb),
    ('MCH-GEC-004','GEC','GEC-LIB','GEC-GUL','2024',2,'completed',24,17,'2024-09-15 21:25+00','2024-09-15 23:58+00','Liberty Field',false,'{"temperature_c":20,"conditions":"cloudy"}'::jsonb),
    ('MCH-GEC-005','GEC','GEC-ATL','GEC-SOL','2024',3,'scheduled',NULL,NULL,'2024-09-29 21:05+00',NULL,'Atlas Dome',false,'{"forecast":"humid"}'::jsonb)
)
INSERT INTO public.matches (
  id,
  league_id,
  sports_type_id,
  season,
  match_day,
  reference_code,
  home_team_id,
  away_team_id,
  venue,
  status,
  scheduled_at,
  started_at,
  completed_at,
  home_score,
  away_score,
  extra_time,
  weather,
  created_by
)
SELECT
  gen_random_uuid(),
  l.id,
  l.sports_type_id,
  ms.season,
  ms.match_day,
  ms.reference_code,
  th.id,
  ta.id,
  ms.venue,
  ms.status::public.match_status,
  ms.scheduled_at,
  CASE WHEN ms.status = 'completed' THEN ms.scheduled_at + interval '10 minutes' ELSE NULL END,
  ms.completed_at,
  ms.home_score,
  ms.away_score,
  ms.extra_time,
  ms.weather,
  '00000000-0000-0000-0000-00000000a001'::uuid
FROM match_seed ms
JOIN public.leagues l ON l.code = ms.league_code
JOIN public.teams th ON th.code = ms.home_code
JOIN public.teams ta ON ta.code = ms.away_code
ON CONFLICT (reference_code) DO UPDATE
SET status = EXCLUDED.status,
    home_score = EXCLUDED.home_score,
    away_score = EXCLUDED.away_score,
    scheduled_at = EXCLUDED.scheduled_at,
    completed_at = EXCLUDED.completed_at;

-- ================================================================
-- Section 9. Seed Data (Predictions, Feedback, Insights)
-- ================================================================
WITH prediction_seed AS (
  SELECT * FROM (VALUES
    ('predictor@sportshub.demo','MCH-NAPL-001','full_time_result','NAPL-NOR',2,1,78,72,'public','Confident in Rovers pressing.','seed-pred-001'),
    ('predictor@sportshub.demo','MCH-NAPL-005','full_time_result','NAPL-NOR',2,0,74,68,'team_only','Expecting a dominant away win.','seed-pred-002'),
    ('analyst@sportshub.demo','MCH-NAPL-002','btts',NULL,1,1,66,55,'public','Both sides aggressive midfield transition.','seed-pred-003'),
    ('analyst@sportshub.demo','MCH-CHL-001','total_points',NULL,NULL,NULL,62,58,'public','Projected pace above league average.','seed-pred-004'),
    ('analyst@sportshub.demo','MCH-CHL-002','spread_cover','CHL-OWL',NULL,NULL,65,60,'public','Owls depth at forward positions.','seed-pred-005'),
    ('manager@sportshub.demo','MCH-NAPL-004','full_time_result','NAPL-VAL',1,0,69,64,'team_only','Home advantage with narrow margin.','seed-pred-006'),
    ('manager@sportshub.demo','MCH-GEC-001','moneyline','GEC-HWK',NULL,NULL,71,67,'team_only','Ground control with Hawks run game.','seed-pred-007'),
    ('admin@sportshub.demo','MCH-GEC-002','moneyline','GEC-SOL',NULL,NULL,80,73,'public','Solaris tempo in the desert heat.','seed-pred-008'),
    ('predictor@sportshub.demo','MCH-BSL-001','full_time_result','BSL-RIG',1,0,70,63,'public','Kings look sharp after training camp.','seed-pred-009'),
    ('predictor@sportshub.demo','MCH-CHL-004','total_points',NULL,NULL,NULL,60,52,'public','Expect a defensive slugfest.','seed-pred-010')
  ) AS t(user_email, match_ref, category_slug, winner_code, phs, pas, confidence, probability, visibility, notes, seed_ref)
)
INSERT INTO public.predictions (
  user_id,
  match_id,
  category_id,
  predicted_winner_team_id,
  predicted_home_score,
  predicted_away_score,
  confidence_score,
  win_probability,
  status,
  visibility,
  notes,
  metadata
)
SELECT
  pu.id,
  m.id,
  pc.id,
  wt.id,
  ps.phs,
  ps.pas,
  ps.confidence,
  ps.probability,
  'pending',
  ps.visibility,
  ps.notes,
  jsonb_build_object('seed_ref', ps.seed_ref)
FROM prediction_seed ps
JOIN public.users pu ON pu.email = ps.user_email
JOIN public.matches m ON m.reference_code = ps.match_ref
LEFT JOIN public.prediction_categories pc ON pc.slug = ps.category_slug
LEFT JOIN public.teams wt ON wt.code = ps.winner_code
ON CONFLICT (user_id, match_id, coalesce(category_id, uuid_nil())) DO UPDATE
SET notes = EXCLUDED.notes,
    confidence_score = EXCLUDED.confidence_score,
    win_probability = EXCLUDED.win_probability;

-- Seed feedback for completed predictions
WITH feedback_seed AS (
  SELECT * FROM (VALUES
    ('predictor@sportshub.demo','MCH-NAPL-001','full_time_result','predictor@sportshub.demo',5,'positive','Loved the match breakdown.','resolved'),
    ('analyst@sportshub.demo','MCH-CHL-001','total_points','manager@sportshub.demo',4,'positive','Spot on pace projection!','resolved'),
    ('admin@sportshub.demo','MCH-GEC-002','moneyline','predictor@sportshub.demo',3,'neutral','Surprised by defensive adjustments.','reviewing')
  ) AS f(pred_user_email, match_ref, category_slug, feedback_user_email, rating, sentiment, notes, status)
)
INSERT INTO public.feedback (prediction_id, user_id, rating, sentiment, notes, status)
SELECT
  p.id,
  fu.id,
  fs.rating,
  fs.sentiment,
  fs.notes,
  fs.status::public.feedback_status
FROM feedback_seed fs
JOIN public.users fu ON fu.email = fs.feedback_user_email
JOIN public.users pu ON pu.email = fs.pred_user_email
JOIN public.matches m ON m.reference_code = fs.match_ref
LEFT JOIN public.prediction_categories pc ON pc.slug = fs.category_slug
JOIN public.predictions p ON p.user_id = pu.id AND p.match_id = m.id AND coalesce(p.category_id, uuid_nil()) = coalesce(pc.id, uuid_nil())
ON CONFLICT DO NOTHING;

-- Analyst insights backing dashboards
INSERT INTO public.analysis_insights (
  analyst_user_id,
  league_id,
  match_id,
  summary,
  detail,
  impact_score,
  tags
)
VALUES
  (
    (SELECT id FROM public.users WHERE email = 'analyst@sportshub.demo'),
    (SELECT id FROM public.leagues WHERE code = 'NAPL'),
    (SELECT id FROM public.matches WHERE reference_code = 'MCH-NAPL-005'),
    'Northport high press fatigue risk',
    '{"key_findings":["Need rotation on wings","Monitor late match drop"]}'::jsonb,
    82,
    ARRAY['fatigue','rotation']
  ),
  (
    (SELECT id FROM public.users WHERE email = 'analyst@sportshub.demo'),
    (SELECT id FROM public.leagues WHERE code = 'CHL'),
    (SELECT id FROM public.matches WHERE reference_code = 'MCH-CHL-003'),
    'Valencia depth chart reshuffle',
    '{"bench_usage":"expanded","matchup_focus":"switch defense"}'::jsonb,
    75,
    ARRAY['depth','defense']
  ),
  (
    (SELECT id FROM public.users WHERE email = 'analyst@sportshub.demo'),
    (SELECT id FROM public.leagues WHERE code = 'GEC'),
    (SELECT id FROM public.matches WHERE reference_code = 'MCH-GEC-003'),
    'River City weather contingency',
    '{"rain_adjustment":"higher rush share"}'::jsonb,
    68,
    ARRAY['weather','contingency']
  )
ON CONFLICT DO NOTHING;

-- ================================================================
-- Section 10. Derived Metric Backfills
-- ================================================================
SELECT public.recalculate_prediction_metrics_for_match(id)
FROM public.matches
WHERE status = 'completed';

SELECT public.recalculate_rankings_for_league(id)
FROM public.leagues;

-- ================================================================
-- Section 11. Row Level Security Policies
-- ================================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sports_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_manager_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prediction_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_insights ENABLE ROW LEVEL SECURITY;

-- Users
CREATE POLICY "Users read own profile" ON public.users
  FOR SELECT USING (id = auth.uid());
CREATE POLICY "Analysts read users" ON public.users
  FOR SELECT USING (public.is_analyst());
CREATE POLICY "Admins manage users" ON public.users
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Service role users" ON public.users
  FOR ALL USING (public.is_service_role()) WITH CHECK (public.is_service_role());

-- Sports types (public read)
CREATE POLICY "Public read sports types" ON public.sports_types
  FOR SELECT USING (true);
CREATE POLICY "Admins write sports types" ON public.sports_types
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Service role sports types" ON public.sports_types
  FOR ALL USING (public.is_service_role()) WITH CHECK (public.is_service_role());

-- Leagues
CREATE POLICY "Public read leagues" ON public.leagues
  FOR SELECT USING (true);
CREATE POLICY "Admins write leagues" ON public.leagues
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Service role leagues" ON public.leagues
  FOR ALL USING (public.is_service_role()) WITH CHECK (public.is_service_role());

-- Teams
CREATE POLICY "Public read teams" ON public.teams
  FOR SELECT USING (true);
CREATE POLICY "Team managers update teams" ON public.teams
  FOR UPDATE USING (public.is_team_manager_for_team(id))
  WITH CHECK (public.is_team_manager_for_team(id));
CREATE POLICY "Admins write teams" ON public.teams
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Service role teams" ON public.teams
  FOR ALL USING (public.is_service_role()) WITH CHECK (public.is_service_role());

-- Team manager assignments
CREATE POLICY "Team managers view assignments" ON public.team_manager_assignments
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admins manage assignments" ON public.team_manager_assignments
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Service role assignments" ON public.team_manager_assignments
  FOR ALL USING (public.is_service_role()) WITH CHECK (public.is_service_role());

-- Players
CREATE POLICY "Public read players" ON public.players
  FOR SELECT USING (true);
CREATE POLICY "Team managers manage players" ON public.players
  FOR ALL USING (public.is_team_manager_for_team(coalesce(team_id, uuid_nil())))
  WITH CHECK (public.is_team_manager_for_team(coalesce(team_id, uuid_nil())));
CREATE POLICY "Admins manage players" ON public.players
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Service role players" ON public.players
  FOR ALL USING (public.is_service_role()) WITH CHECK (public.is_service_role());

-- Prediction categories
CREATE POLICY "Public read categories" ON public.prediction_categories
  FOR SELECT USING (true);
CREATE POLICY "Admins write categories" ON public.prediction_categories
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Service role categories" ON public.prediction_categories
  FOR ALL USING (public.is_service_role()) WITH CHECK (public.is_service_role());

-- Matches
CREATE POLICY "Public read matches" ON public.matches
  FOR SELECT USING (true);
CREATE POLICY "Team managers adjust matches" ON public.matches
  FOR UPDATE USING (public.can_team_manager_access_match(id))
  WITH CHECK (public.can_team_manager_access_match(id));
CREATE POLICY "Admins write matches" ON public.matches
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Service role matches" ON public.matches
  FOR ALL USING (public.is_service_role()) WITH CHECK (public.is_service_role());

-- Team rankings
CREATE POLICY "Public read rankings" ON public.team_rankings
  FOR SELECT USING (true);
CREATE POLICY "Service role maintain rankings" ON public.team_rankings
  FOR ALL USING (public.is_service_role()) WITH CHECK (public.is_service_role());
CREATE POLICY "Admins read rankings" ON public.team_rankings
  FOR SELECT USING (public.is_admin());

-- Predictions
CREATE POLICY "Users read own predictions" ON public.predictions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users write own predictions" ON public.predictions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own predictions" ON public.predictions
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own predictions" ON public.predictions
  FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Analysts read all predictions" ON public.predictions
  FOR SELECT USING (public.is_analyst());
CREATE POLICY "Team managers view team predictions" ON public.predictions
  FOR SELECT USING (public.can_team_manager_access_match(match_id));
CREATE POLICY "Admins manage predictions" ON public.predictions
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Service role predictions" ON public.predictions
  FOR ALL USING (public.is_service_role()) WITH CHECK (public.is_service_role());

-- Feedback
CREATE POLICY "Users manage own feedback" ON public.feedback
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Analysts read feedback" ON public.feedback
  FOR SELECT USING (public.is_analyst());
CREATE POLICY "Admins manage feedback" ON public.feedback
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Service role feedback" ON public.feedback
  FOR ALL USING (public.is_service_role()) WITH CHECK (public.is_service_role());

-- Audit logs
CREATE POLICY "Admins read audits" ON public.audit_logs
  FOR SELECT USING (public.is_admin());
CREATE POLICY "Analysts read audits" ON public.audit_logs
  FOR SELECT USING (public.is_analyst());
CREATE POLICY "Service role audits" ON public.audit_logs
  FOR ALL USING (public.is_service_role()) WITH CHECK (public.is_service_role());

-- Analysis insights
CREATE POLICY "Analysts read insights" ON public.analysis_insights
  FOR SELECT USING (public.is_analyst());
CREATE POLICY "Analysts manage own insights" ON public.analysis_insights
  FOR ALL USING (auth.uid() = analyst_user_id)
  WITH CHECK (auth.uid() = analyst_user_id);
CREATE POLICY "Admins manage insights" ON public.analysis_insights
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Service role insights" ON public.analysis_insights
  FOR ALL USING (public.is_service_role()) WITH CHECK (public.is_service_role());

-- ================================================================
-- Section 12. Analyze Tables for Planner Statistics
-- ================================================================
ANALYZE public.users;
ANALYZE public.teams;
ANALYZE public.matches;
ANALYZE public.predictions;
ANALYZE public.team_rankings;
ANALYZE public.players;

-- ================================================================
-- Section 13. Validation Queries (Read-Only Diagnostics)
-- ================================================================
SELECT 'users' AS entity, role, COUNT(*) AS total
FROM public.users
GROUP BY role
ORDER BY role;

SELECT 'leagues' AS entity, code, COUNT(*) AS teams
FROM public.leagues l
JOIN public.teams t ON t.league_id = l.id
GROUP BY code
ORDER BY code;

SELECT 'matches_completed' AS metric, COUNT(*)
FROM public.matches
WHERE status = 'completed';

SELECT 'predictions' AS entity, status, COUNT(*)
FROM public.predictions
GROUP BY status;

SELECT 'feedback' AS entity, status, COUNT(*)
FROM public.feedback
GROUP BY status;

COMMIT;
