-- =====================================================
-- WinMix TipsterHub - Comprehensive Database Setup
-- Migration Version: 20260120000000
-- Description: Complete database schema with RBAC, functions, triggers, RLS, and seed data
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- 1. ROLE-BASED ACCESS CONTROL (RBAC) SYSTEM
-- =====================================================

-- Create custom roles for the application
DO $$
BEGIN
    -- Create custom roles if they don't exist
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'winmix_admin') THEN
        CREATE ROLE winmix_admin;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'winmix_analyst') THEN
        CREATE ROLE winmix_analyst;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'winmix_predictor') THEN
        CREATE ROLE winmix_predictor;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'winmix_team_manager') THEN
        CREATE ROLE winmix_team_manager;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'winmix_viewer') THEN
        CREATE ROLE winmix_viewer;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'winmix_service') THEN
        CREATE ROLE winmix_service;
    END IF;
END $$;

-- Create role hierarchy (admin inherits all lower roles)
GRANT winmix_viewer TO winmix_predictor;
GRANT winmix_predictor TO winmix_team_manager;
GRANT winmix_team_manager TO winmix_analyst;
GRANT winmix_analyst TO winmix_admin;

-- =====================================================
-- 2. SECURITY HELPER FUNCTIONS
-- =====================================================

-- Get current user ID with error handling
CREATE OR REPLACE FUNCTION public.get_current_user_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::UUID);
END;
$$;

-- Get user role from user profiles
CREATE OR REPLACE FUNCTION public.get_user_role(p_user_id UUID DEFAULT NULL)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID := COALESCE(p_user_id, auth.uid());
    v_role TEXT;
BEGIN
    -- Get user role from user_profiles
    SELECT role INTO v_role 
    FROM public.user_profiles 
    WHERE id = v_user_id AND is_active = true;
    
    RETURN COALESCE(v_role, 'viewer');
END;
$$;

-- Role checking functions
CREATE OR REPLACE FUNCTION public.is_admin(p_user_id UUID DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN public.get_user_role(p_user_id) = 'admin';
END;
$$;

CREATE OR REPLACE FUNCTION public.is_analyst(p_user_id UUID DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN public.get_user_role(p_user_id) IN ('admin', 'analyst');
END;
$$;

CREATE OR REPLACE FUNCTION public.is_predictor(p_user_id UUID DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN public.get_user_role(p_user_id) IN ('admin', 'analyst', 'predictor');
END;
$$;

CREATE OR REPLACE FUNCTION public.is_team_manager(p_user_id UUID DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN public.get_user_role(p_user_id) IN ('admin', 'analyst', 'predictor', 'team_manager');
END;
$$;

CREATE OR REPLACE FUNCTION public.is_service_role()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Check if the current role is a service role
    RETURN current_setting('request.jwt.claims', true)::jsonb->>'role' IN ('service_role', 'postgres');
END;
$$;

-- =====================================================
-- 3. CORE DATABASE SCHEMA
-- =====================================================

-- User profiles table for role management
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'analyst', 'predictor', 'team_manager', 'viewer', 'demo')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    avatar_url TEXT,
    bio TEXT,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_email UNIQUE (email)
);

COMMENT ON TABLE public.user_profiles IS 'User profile information for role-based access control.';
COMMENT ON COLUMN public.user_profiles.preferences IS 'User preferences stored as JSON (e.g., theme, notifications)';

-- Leagues table
CREATE TABLE IF NOT EXISTS public.leagues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    country TEXT NOT NULL,
    season TEXT NOT NULL,
    avg_goals_per_match DECIMAL(5,2) DEFAULT 2.5 CHECK (avg_goals_per_match >= 0),
    home_win_percentage DECIMAL(5,2) DEFAULT 45.0 CHECK (home_win_percentage >= 0 AND home_win_percentage <= 100),
    btts_percentage DECIMAL(5,2) DEFAULT 50.0 CHECK (btts_percentage >= 0 AND btts_percentage <= 100),
    over_2_5_percentage DECIMAL(5,2) DEFAULT 50.0 CHECK (over_2_5_percentage >= 0 AND over_2_5_percentage <= 100),
    is_active BOOLEAN DEFAULT true,
    logo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_league_season UNIQUE (name, season)
);

COMMENT ON TABLE public.leagues IS 'Football leagues with statistical metrics';
COMMENT ON COLUMN public.leagues.btts_percentage IS 'Both Teams To Score percentage';

-- Teams table
CREATE TABLE IF NOT EXISTS public.teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    league_id UUID NOT NULL REFERENCES public.leagues(id) ON DELETE CASCADE,
    short_name TEXT,
    founded_year INTEGER,
    stadium_name TEXT,
    stadium_capacity INTEGER,
    logo_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_team_league UNIQUE (name, league_id)
);

COMMENT ON TABLE public.teams IS 'Football teams with league associations';

-- Matches table
CREATE TABLE IF NOT EXISTS public.matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    league_id UUID NOT NULL REFERENCES public.leagues(id) ON DELETE CASCADE,
    home_team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    away_team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    match_date TIMESTAMPTZ NOT NULL,
    home_score INTEGER,
    away_score INTEGER,
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'finished', 'postponed', 'cancelled')),
    match_week INTEGER,
    venue TEXT,
    attendance INTEGER,
    referee TEXT,
    weather_conditions TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_scheduled_match UNIQUE (home_team_id, away_team_id, match_date) WHERE status = 'scheduled',
    CONSTRAINT valid_scores CHECK (
        (status = 'finished' AND home_score IS NOT NULL AND away_score IS NOT NULL) OR
        (status != 'finished')
    ),
    CONSTRAINT different_teams CHECK (home_team_id != away_team_id)
);

COMMENT ON TABLE public.matches IS 'Football matches with scores and status';

-- Pattern templates table
CREATE TABLE IF NOT EXISTS public.pattern_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    category TEXT NOT NULL CHECK (category IN ('form', 'h2h', 'league', 'team_stats', 'external')),
    base_confidence_boost DECIMAL(5,2) DEFAULT 5.0 CHECK (base_confidence_boost >= 0),
    is_active BOOLEAN DEFAULT true,
    required_data JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.pattern_templates IS 'Predefined pattern types for prediction analysis';
COMMENT ON COLUMN public.pattern_templates.required_data IS 'JSON schema of required data for this pattern';

-- Detected patterns table
CREATE TABLE IF NOT EXISTS public.detected_patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
    template_id UUID NOT NULL REFERENCES public.pattern_templates(id) ON DELETE CASCADE,
    confidence_contribution DECIMAL(5,2) NOT NULL CHECK (confidence_contribution >= 0),
    pattern_data JSONB NOT NULL DEFAULT '{}',
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    detected_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_match_template UNIQUE (match_id, template_id)
);

COMMENT ON TABLE public.detected_patterns IS 'Specific patterns detected for matches';
COMMENT ON COLUMN public.detected_patterns.pattern_data IS 'Pattern-specific data (e.g., streak length, H2H stats)';

-- Predictions table
CREATE TABLE IF NOT EXISTS public.predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
    predicted_outcome TEXT NOT NULL CHECK (predicted_outcome IN ('home_win', 'draw', 'away_win')),
    confidence_score DECIMAL(5,2) NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 100),
    predicted_home_score INTEGER CHECK (predicted_home_score >= 0),
    predicted_away_score INTEGER CHECK (predicted_away_score >= 0),
    btts_prediction BOOLEAN,
    over_under_prediction TEXT CHECK (over_under_prediction IN ('over_2.5', 'under_2.5')),
    model_version TEXT DEFAULT 'v1.0',
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Feedback fields (filled after match completion)
    actual_outcome TEXT CHECK (actual_outcome IN ('home_win', 'draw', 'away_win')),
    was_correct BOOLEAN,
    evaluation_confidence DECIMAL(5,2) CHECK (evaluation_confidence >= 0 AND evaluation_confidence <= 100),
    evaluated_at TIMESTAMPTZ,
    
    CONSTRAINT unique_match_prediction UNIQUE (match_id),
    CONSTRAINT valid_score_prediction CHECK (
        (predicted_home_score IS NOT NULL AND predicted_away_score IS NOT NULL) OR
        (predicted_home_score IS NULL AND predicted_away_score IS NULL)
    )
);

COMMENT ON TABLE public.predictions IS 'Match predictions with evaluation feedback';

-- Pattern accuracy tracking
CREATE TABLE IF NOT EXISTS public.pattern_accuracy (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES public.pattern_templates(id) ON DELETE CASCADE,
    total_predictions INTEGER NOT NULL DEFAULT 0 CHECK (total_predictions >= 0),
    correct_predictions INTEGER NOT NULL DEFAULT 0 CHECK (correct_predictions >= 0),
    accuracy_rate DECIMAL(5,2) DEFAULT 0.0 CHECK (accuracy_rate >= 0 AND accuracy_rate <= 100),
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_template_accuracy UNIQUE (template_id),
    CONSTRAINT valid_accuracy CHECK (correct_predictions <= total_predictions)
);

COMMENT ON TABLE public.pattern_accuracy IS 'Accuracy tracking for pattern templates';

-- User predictions table for collaborative intelligence
CREATE TABLE IF NOT EXISTS public.user_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    predicted_outcome TEXT NOT NULL CHECK (predicted_outcome IN ('home_win', 'draw', 'away_win')),
    confidence_score DECIMAL(5,2) NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 100),
    predicted_home_score INTEGER CHECK (predicted_home_score >= 0),
    predicted_away_score INTEGER CHECK (predicted_away_score >= 0),
    btts_prediction BOOLEAN,
    over_under_prediction TEXT CHECK (over_under_prediction IN ('over_2.5', 'under_2.5')),
    reasoning TEXT,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_match_prediction UNIQUE (match_id, user_id)
);

COMMENT ON TABLE public.user_predictions IS 'User-submitted predictions for collaborative intelligence';

-- Crowd wisdom aggregation table
CREATE TABLE IF NOT EXISTS public.crowd_wisdom (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
    total_predictions INTEGER NOT NULL DEFAULT 0 CHECK (total_predictions >= 0),
    home_win_predictions INTEGER NOT NULL DEFAULT 0 CHECK (home_win_predictions >= 0),
    draw_predictions INTEGER NOT NULL DEFAULT 0 CHECK (draw_predictions >= 0),
    away_win_predictions INTEGER NOT NULL DEFAULT 0 CHECK (away_win_predictions >= 0),
    average_confidence DECIMAL(5,2) NOT NULL DEFAULT 0.0 CHECK (average_confidence >= 0 AND average_confidence <= 100),
    consensus_prediction TEXT CHECK (consensus_prediction IN ('home_win', 'draw', 'away_win')),
    consensus_confidence DECIMAL(5,2) DEFAULT 0.0 CHECK (consensus_confidence >= 0 AND consensus_confidence <= 100),
    model_vs_crowd_divergence DECIMAL(5,2) DEFAULT 0.0,
    last_calculated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_match_crowd_wisdom UNIQUE (match_id),
    CONSTRAINT valid_prediction_counts CHECK (
        home_win_predictions + draw_predictions + away_win_predictions = total_predictions
    )
);

COMMENT ON TABLE public.crowd_wisdom IS 'Aggregated crowd wisdom compared against model predictions';

-- =====================================================
-- 4. INDEXES FOR PERFORMANCE
-- =====================================================

-- User profiles indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_active ON public.user_profiles(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);

-- Leagues indexes
CREATE INDEX IF NOT EXISTS idx_leagues_active ON public.leagues(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_leagues_country ON public.leagues(country);

-- Teams indexes
CREATE INDEX IF NOT EXISTS idx_teams_league ON public.teams(league_id);
CREATE INDEX IF NOT EXISTS idx_teams_active ON public.teams(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_teams_name ON public.teams(name);

-- Matches indexes
CREATE INDEX IF NOT EXISTS idx_matches_date ON public.matches(match_date);
CREATE INDEX IF NOT EXISTS idx_matches_status ON public.matches(status);
CREATE INDEX IF NOT EXISTS idx_matches_league ON public.matches(league_id);
CREATE INDEX IF NOT EXISTS idx_matches_home_team ON public.matches(home_team_id);
CREATE INDEX IF NOT EXISTS idx_matches_away_team ON public.matches(away_team_id);
CREATE INDEX IF NOT EXISTS idx_matches_upcoming ON public.matches(match_date) WHERE status IN ('scheduled', 'live');

-- Pattern templates indexes
CREATE INDEX IF NOT EXISTS idx_pattern_templates_category ON public.pattern_templates(category);
CREATE INDEX IF NOT EXISTS idx_pattern_templates_active ON public.pattern_templates(is_active) WHERE is_active = true;

-- Detected patterns indexes
CREATE INDEX IF NOT EXISTS idx_detected_patterns_match ON public.detected_patterns(match_id);
CREATE INDEX IF NOT EXISTS idx_detected_patterns_template ON public.detected_patterns(template_id);
CREATE INDEX IF NOT EXISTS idx_detected_patterns_created_by ON public.detected_patterns(created_by);
CREATE INDEX IF NOT EXISTS idx_detected_patterns_detected_at ON public.detected_patterns(detected_at DESC);

-- Predictions indexes
CREATE INDEX IF NOT EXISTS idx_predictions_match ON public.predictions(match_id);
CREATE INDEX IF NOT EXISTS idx_predictions_evaluated ON public.predictions(evaluated_at) WHERE evaluated_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_predictions_created_by ON public.predictions(created_by);
CREATE INDEX IF NOT EXISTS idx_predictions_confidence ON public.predictions(confidence_score DESC);

-- Pattern accuracy indexes
CREATE INDEX IF NOT EXISTS idx_pattern_accuracy_template ON public.pattern_accuracy(template_id);
CREATE INDEX IF NOT EXISTS idx_pattern_accuracy_rate ON public.pattern_accuracy(accuracy_rate DESC);

-- User predictions indexes
CREATE INDEX IF NOT EXISTS idx_user_predictions_match ON public.user_predictions(match_id);
CREATE INDEX IF NOT EXISTS idx_user_predictions_user ON public.user_predictions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_predictions_created_at ON public.user_predictions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_predictions_public ON public.user_predictions(is_public) WHERE is_public = true;

-- Crowd wisdom indexes
CREATE INDEX IF NOT EXISTS idx_crowd_wisdom_match ON public.crowd_wisdom(match_id);
CREATE INDEX IF NOT EXISTS idx_crowd_wisdom_last_calculated ON public.crowd_wisdom(last_calculated_at DESC);

-- =====================================================
-- 5. TRIGGERS FOR DATA INTEGRITY
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Apply updated_at triggers to relevant tables
CREATE TRIGGER trg_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_leagues_updated_at
    BEFORE UPDATE ON public.leagues
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_teams_updated_at
    BEFORE UPDATE ON public.teams
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_matches_updated_at
    BEFORE UPDATE ON public.matches
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_pattern_templates_updated_at
    BEFORE UPDATE ON public.pattern_templates
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_user_predictions_updated_at
    BEFORE UPDATE ON public.user_predictions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_crowd_wisdom_updated_at
    BEFORE UPDATE ON public.crowd_wisdom
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to set created_by automatically
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

-- Apply created_by triggers
CREATE TRIGGER trg_set_created_by_detected_patterns
    BEFORE INSERT OR UPDATE ON public.detected_patterns
    FOR EACH ROW EXECUTE FUNCTION public.set_created_by();

CREATE TRIGGER trg_set_created_by_predictions
    BEFORE INSERT OR UPDATE ON public.predictions
    FOR EACH ROW EXECUTE FUNCTION public.set_created_by();

-- Function to update pattern accuracy
CREATE OR REPLACE FUNCTION public.update_pattern_accuracy()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Update pattern accuracy when a prediction is evaluated
    IF TG_OP = 'UPDATE' AND OLD.evaluated_at IS NULL AND NEW.evaluated_at IS NOT NULL THEN
        UPDATE public.pattern_accuracy
        SET 
            total_predictions = total_predictions + 1,
            correct_predictions = CASE 
                WHEN NEW.was_correct = true THEN correct_predictions + 1 
                ELSE correct_predictions 
            END,
            accuracy_rate = ROUND(
                (CASE 
                    WHEN NEW.was_correct = true THEN correct_predictions + 1 
                    ELSE correct_predictions 
                END * 100.0 / (total_predictions + 1))::NUMERIC, 2
            ),
            last_updated = NOW()
        WHERE template_id IN (
            SELECT template_id FROM public.detected_patterns WHERE match_id = NEW.match_id
        );
    END IF;
    
    RETURN NEW;
END;
$$;

-- Apply pattern accuracy trigger
CREATE TRIGGER trg_update_pattern_accuracy
    AFTER UPDATE ON public.predictions
    FOR EACH ROW EXECUTE FUNCTION public.update_pattern_accuracy();

-- Function to update crowd wisdom
CREATE OR REPLACE FUNCTION public.update_crowd_wisdom()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Update crowd wisdom when user predictions change
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' OR TG_OP = 'DELETE' THEN
        INSERT INTO public.crowd_wisdom (
            match_id, total_predictions, home_win_predictions, draw_predictions, 
            away_win_predictions, average_confidence, consensus_prediction, 
            consensus_confidence, last_calculated_at
        )
        SELECT 
            COALESCE(NEW.match_id, OLD.match_id),
            COUNT(*),
            COUNT(*) FILTER (WHERE predicted_outcome = 'home_win'),
            COUNT(*) FILTER (WHERE predicted_outcome = 'draw'),
            COUNT(*) FILTER (WHERE predicted_outcome = 'away_win'),
            ROUND(AVG(confidence_score), 2),
            (CASE 
                WHEN COUNT(*) FILTER (WHERE predicted_outcome = 'home_win') > 
                     COUNT(*) FILTER (WHERE predicted_outcome = 'draw') AND
                     COUNT(*) FILTER (WHERE predicted_outcome = 'home_win') > 
                     COUNT(*) FILTER (WHERE predicted_outcome = 'away_win') 
                THEN 'home_win'
                WHEN COUNT(*) FILTER (WHERE predicted_outcome = 'draw') > 
                     COUNT(*) FILTER (WHERE predicted_outcome = 'home_win') AND
                     COUNT(*) FILTER (WHERE predicted_outcome = 'draw') > 
                     COUNT(*) FILTER (WHERE predicted_outcome = 'away_win') 
                THEN 'draw'
                ELSE 'away_win'
            END),
            ROUND(
                (CASE 
                    WHEN COUNT(*) FILTER (WHERE predicted_outcome = 'home_win') > 
                         COUNT(*) FILTER (WHERE predicted_outcome = 'draw') AND
                         COUNT(*) FILTER (WHERE predicted_outcome = 'home_win') > 
                         COUNT(*) FILTER (WHERE predicted_outcome = 'away_win') 
                    THEN COUNT(*) FILTER (WHERE predicted_outcome = 'home_win')
                    WHEN COUNT(*) FILTER (WHERE predicted_outcome = 'draw') > 
                         COUNT(*) FILTER (WHERE predicted_outcome = 'home_win') AND
                         COUNT(*) FILTER (WHERE predicted_outcome = 'draw') > 
                         COUNT(*) FILTER (WHERE predicted_outcome = 'away_win') 
                    THEN COUNT(*) FILTER (WHERE predicted_outcome = 'draw')
                    ELSE COUNT(*) FILTER (WHERE predicted_outcome = 'away_win')
                END * 100.0 / COUNT(*))::NUMERIC, 2
            ),
            NOW()
        FROM public.user_predictions
        WHERE match_id = COALESCE(NEW.match_id, OLD.match_id)
        ON CONFLICT (match_id) DO UPDATE SET
            total_predictions = EXCLUDED.total_predictions,
            home_win_predictions = EXCLUDED.home_win_predictions,
            draw_predictions = EXCLUDED.draw_predictions,
            away_win_predictions = EXCLUDED.away_win_predictions,
            average_confidence = EXCLUDED.average_confidence,
            consensus_prediction = EXCLUDED.consensus_prediction,
            consensus_confidence = EXCLUDED.consensus_confidence,
            last_calculated_at = EXCLUDED.last_calculated_at,
            updated_at = NOW();
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Apply crowd wisdom triggers
CREATE TRIGGER trg_update_crowd_wisdom_insert
    AFTER INSERT ON public.user_predictions
    FOR EACH ROW EXECUTE FUNCTION public.update_crowd_wisdom();

CREATE TRIGGER trg_update_crowd_wisdom_update
    AFTER UPDATE ON public.user_predictions
    FOR EACH ROW EXECUTE FUNCTION public.update_crowd_wisdom();

CREATE TRIGGER trg_update_crowd_wisdom_delete
    AFTER DELETE ON public.user_predictions
    FOR EACH ROW EXECUTE FUNCTION public.update_crowd_wisdom();

-- =====================================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pattern_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detected_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pattern_accuracy ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crowd_wisdom ENABLE ROW LEVEL SECURITY;

-- Force RLS on sensitive tables
ALTER TABLE public.user_profiles FORCE ROW LEVEL SECURITY;
ALTER TABLE public.detected_patterns FORCE ROW LEVEL SECURITY;
ALTER TABLE public.predictions FORCE ROW LEVEL SECURITY;
ALTER TABLE public.user_predictions FORCE ROW LEVEL SECURITY;

-- User profiles policies
CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins full access to user profiles" ON public.user_profiles
    FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Analysts can view user profiles" ON public.user_profiles
    FOR SELECT USING (public.is_analyst());

-- Leagues policies (public read, admin write)
CREATE POLICY "Public read access to leagues" ON public.leagues
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins full access to leagues" ON public.leagues
    FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Analysts can read all leagues" ON public.leagues
    FOR SELECT USING (public.is_analyst());

-- Teams policies (public read, admin write)
CREATE POLICY "Public read access to teams" ON public.teams
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins full access to teams" ON public.teams
    FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Analysts can read all teams" ON public.teams
    FOR SELECT USING (public.is_analyst());

-- Matches policies (public read, admin write)
CREATE POLICY "Public read access to matches" ON public.matches
    FOR SELECT USING (true);

CREATE POLICY "Admins full access to matches" ON public.matches
    FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Analysts can read all matches" ON public.matches
    FOR SELECT USING (public.is_analyst());

-- Pattern templates policies (public read, admin write)
CREATE POLICY "Public read access to pattern templates" ON public.pattern_templates
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins full access to pattern templates" ON public.pattern_templates
    FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Analysts can read all pattern templates" ON public.pattern_templates
    FOR SELECT USING (public.is_analyst());

-- Detected patterns policies (user-owned)
CREATE POLICY "Users read own detected patterns" ON public.detected_patterns
    FOR SELECT USING (created_by = auth.uid() OR created_by IS NULL);

CREATE POLICY "Users create own detected patterns" ON public.detected_patterns
    FOR INSERT WITH CHECK (created_by = auth.uid() OR public.is_service_role());

CREATE POLICY "Users update own detected patterns" ON public.detected_patterns
    FOR UPDATE USING (created_by = auth.uid()) WITH CHECK (created_by = auth.uid());

CREATE POLICY "Analysts read all detected patterns" ON public.detected_patterns
    FOR SELECT USING (public.is_analyst());

CREATE POLICY "Service role full access to detected patterns" ON public.detected_patterns
    FOR ALL USING (public.is_service_role()) WITH CHECK (public.is_service_role());

CREATE POLICY "Admins full access to detected patterns" ON public.detected_patterns
    FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Predictions policies (public read, service write)
CREATE POLICY "Public read access to predictions" ON public.predictions
    FOR SELECT USING (true);

CREATE POLICY "Service role write access to predictions" ON public.predictions
    FOR INSERT WITH CHECK (public.is_service_role());

CREATE POLICY "Service role update access to predictions" ON public.predictions
    FOR UPDATE USING (public.is_service_role()) WITH CHECK (public.is_service_role());

CREATE POLICY "Analysts read all predictions" ON public.predictions
    FOR SELECT USING (public.is_analyst());

CREATE POLICY "Admins full access to predictions" ON public.predictions
    FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Pattern accuracy policies (public read, service write)
CREATE POLICY "Public read access to pattern accuracy" ON public.pattern_accuracy
    FOR SELECT USING (true);

CREATE POLICY "Service role write access to pattern accuracy" ON public.pattern_accuracy
    FOR ALL USING (public.is_service_role()) WITH CHECK (public.is_service_role());

CREATE POLICY "Admins full access to pattern accuracy" ON public.pattern_accuracy
    FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- User predictions policies (user-owned with public option)
CREATE POLICY "Users read own user predictions" ON public.user_predictions
    FOR SELECT USING (user_id = auth.uid() OR is_public = true);

CREATE POLICY "Users create own user predictions" ON public.user_predictions
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users update own user predictions" ON public.user_predictions
    FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users delete own user predictions" ON public.user_predictions
    FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "Analysts read all user predictions" ON public.user_predictions
    FOR SELECT USING (public.is_analyst());

CREATE POLICY "Admins full access to user predictions" ON public.user_predictions
    FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Crowd wisdom policies (public read, service write)
CREATE POLICY "Public read access to crowd wisdom" ON public.crowd_wisdom
    FOR SELECT USING (true);

CREATE POLICY "Service role write access to crowd wisdom" ON public.crowd_wisdom
    FOR ALL USING (public.is_service_role()) WITH CHECK (public.is_service_role());

CREATE POLICY "Admins full access to crowd wisdom" ON public.crowd_wisdom
    FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- =====================================================
-- 7. UTILITY FUNCTIONS
-- =====================================================

-- Function to calculate win probability
CREATE OR REPLACE FUNCTION public.calculate_win_probability(
    p_confidence_score DECIMAL,
    p_home_advantage DECIMAL DEFAULT 0.0
)
RETURNS DECIMAL
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_base_probability DECIMAL;
BEGIN
    -- Convert confidence score to probability (0-100 to 0-1)
    v_base_probability := p_confidence_score / 100.0;
    
    -- Apply home advantage if applicable
    v_base_probability := v_base_probability + p_home_advantage;
    
    -- Ensure probability stays within bounds
    RETURN GREATEST(0.01, LEAST(0.99, v_base_probability));
END;
$$;

-- Function to validate prediction data
CREATE OR REPLACE FUNCTION public.validate_prediction_data(
    p_match_id UUID,
    p_predicted_outcome TEXT,
    p_confidence_score DECIMAL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_match_exists BOOLEAN;
    v_match_status TEXT;
BEGIN
    -- Check if match exists
    SELECT EXISTS(SELECT 1 FROM public.matches WHERE id = p_match_id) INTO v_match_exists;
    
    IF NOT v_match_exists THEN
        RAISE EXCEPTION 'Match does not exist';
        RETURN FALSE;
    END IF;
    
    -- Check match status (can't predict finished matches)
    SELECT status INTO v_match_status FROM public.matches WHERE id = p_match_id;
    
    IF v_match_status = 'finished' THEN
        RAISE EXCEPTION 'Cannot predict finished matches';
        RETURN FALSE;
    END IF;
    
    -- Validate confidence score
    IF p_confidence_score < 0 OR p_confidence_score > 100 THEN
        RAISE EXCEPTION 'Confidence score must be between 0 and 100';
        RETURN FALSE;
    END IF;
    
    -- Validate outcome
    IF p_predicted_outcome NOT IN ('home_win', 'draw', 'away_win') THEN
        RAISE EXCEPTION 'Invalid predicted outcome';
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$;

-- Function to get user statistics
CREATE OR REPLACE FUNCTION public.get_user_statistics(p_user_id UUID DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID := COALESCE(p_user_id, auth.uid());
    v_stats JSONB;
BEGIN
    SELECT jsonb_build_object(
        'total_predictions', COUNT(*),
        'correct_predictions', COUNT(*) FILTER (WHERE was_correct = true),
        'accuracy_rate', CASE 
            WHEN COUNT(*) > 0 THEN ROUND((COUNT(*) FILTER (WHERE was_correct = true) * 100.0 / COUNT(*))::NUMERIC, 2)
            ELSE 0
        END,
        'average_confidence', ROUND(AVG(confidence_score), 2),
        'last_prediction_date', MAX(created_at)
    ) INTO v_stats
    FROM public.predictions
    WHERE created_by = v_user_id AND evaluated_at IS NOT NULL;
    
    RETURN v_stats;
END;
$$;

-- Function to get match prediction summary
CREATE OR REPLACE FUNCTION public.get_match_prediction_summary(p_match_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_summary JSONB;
BEGIN
    SELECT jsonb_build_object(
        'match_id', p_match_id,
        'system_prediction', (
            SELECT jsonb_build_object(
                'predicted_outcome', predicted_outcome,
                'confidence_score', confidence_score,
                'predicted_home_score', predicted_home_score,
                'predicted_away_score', predicted_away_score,
                'btts_prediction', btts_prediction,
                'over_under_prediction', over_under_prediction
            )
            FROM public.predictions WHERE match_id = p_match_id
        ),
        'crowd_wisdom', (
            SELECT jsonb_build_object(
                'total_predictions', total_predictions,
                'consensus_prediction', consensus_prediction,
                'consensus_confidence', consensus_confidence,
                'average_confidence', average_confidence
            )
            FROM public.crowd_wisdom WHERE match_id = p_match_id
        ),
        'user_predictions_count', (
            SELECT COUNT(*) FROM public.user_predictions WHERE match_id = p_match_id
        )
    ) INTO v_summary;
    
    RETURN v_summary;
END;
$$;

-- =====================================================
-- 8. VIEWS FOR EASY ACCESS
-- =====================================================

-- View for upcoming matches with predictions
CREATE OR REPLACE VIEW public.upcoming_matches_with_predictions AS
SELECT 
    m.id,
    m.match_date,
    ht.name as home_team_name,
    at.name as away_team_name,
    l.name as league_name,
    p.predicted_outcome,
    p.confidence_score,
    cw.consensus_prediction,
    cw.consensus_confidence,
    cw.total_predictions as crowd_predictions_count
FROM public.matches m
JOIN public.teams ht ON m.home_team_id = ht.id
JOIN public.teams at ON m.away_team_id = at.id
JOIN public.leagues l ON m.league_id = l.id
LEFT JOIN public.predictions p ON m.id = p.match_id
LEFT JOIN public.crowd_wisdom cw ON m.id = cw.match_id
WHERE m.status IN ('scheduled', 'live')
ORDER BY m.match_date ASC;

COMMENT ON VIEW public.upcoming_matches_with_predictions IS 'Upcoming matches with system and crowd predictions';

-- View for user prediction leaderboard
CREATE OR REPLACE VIEW public.user_prediction_leaderboard AS
SELECT 
    up.user_id,
    up.full_name,
    up.avatar_url,
    COUNT(*) as total_predictions,
    COUNT(*) FILTER (WHERE p.was_correct = true) as correct_predictions,
    CASE 
        WHEN COUNT(*) > 0 THEN ROUND((COUNT(*) FILTER (WHERE p.was_correct = true) * 100.0 / COUNT(*))::NUMERIC, 2)
        ELSE 0
    END as accuracy_rate,
    AVG(p.confidence_score) as average_confidence,
    MAX(p.created_at) as last_prediction_date
FROM public.user_profiles up
JOIN public.predictions p ON up.id = p.created_by
WHERE p.evaluated_at IS NOT NULL
GROUP BY up.user_id, up.full_name, up.avatar_url
HAVING COUNT(*) >= 5  -- Minimum predictions to qualify
ORDER BY accuracy_rate DESC, total_predictions DESC;

COMMENT ON VIEW public.user_prediction_leaderboard IS 'Leaderboard of users based on prediction accuracy';

-- View for pattern performance
CREATE OR REPLACE VIEW public.pattern_performance_summary AS
SELECT 
    pt.id,
    pt.name,
    pt.category,
    pa.total_predictions,
    pa.correct_predictions,
    pa.accuracy_rate,
    pa.last_updated,
    COUNT(dp.id) as recent_detections,
    AVG(dp.confidence_contribution) as avg_confidence_contribution
FROM public.pattern_templates pt
LEFT JOIN public.pattern_accuracy pa ON pt.id = pa.template_id
LEFT JOIN public.detected_patterns dp ON pt.id = dp.template_id 
    AND dp.detected_at > NOW() - INTERVAL '30 days'
WHERE pt.is_active = true
GROUP BY pt.id, pt.name, pt.category, pa.total_predictions, pa.correct_predictions, pa.accuracy_rate, pa.last_updated
ORDER BY pa.accuracy_rate DESC NULLS LAST;

COMMENT ON VIEW public.pattern_performance_summary IS 'Summary of pattern template performance';

-- =====================================================
-- 9. SEED DATA
-- =====================================================

-- Insert pattern templates
INSERT INTO public.pattern_templates (name, description, category, base_confidence_boost, required_data) VALUES
('home_winning_streak', 'Home team won last 3+ home matches', 'form', 8.0, '{"min_streak": 3, "venue": "home"}'),
('away_winning_streak', 'Away team won last 3+ away matches', 'form', 7.0, '{"min_streak": 3, "venue": "away"}'),
('h2h_dominance', 'One team won 3+ of last 5 H2H matches', 'h2h', 10.0, '{"min_wins": 3, "last_matches": 5}'),
('recent_form_advantage', 'Team has 2+ more wins in last 5 matches', 'form', 6.0, '{"form_window": 5, "min_difference": 2}'),
('high_scoring_league', 'League avg goals > 3.0 per match', 'league', 3.0, '{"min_avg_goals": 3.0}'),
('low_scoring_league', 'League avg goals < 2.0 per match', 'league', 2.5, '{"max_avg_goals": 2.0}'),
('home_advantage_strong', 'Team has >70% home win rate', 'team_stats', 5.0, '{"min_home_win_rate": 70}'),
('goal_scoring_form', 'Team scored 2+ goals in last 3 matches', 'form', 4.0, '{"min_goals": 2, "last_matches": 3}'),
('defensive_struggle', 'Team failed to score in last 2 matches', 'form', 3.5, '{"last_matches": 2, "goals_scored": 0}'),
('derby_match', 'Local rivalry match', 'external', 6.0, '{"is_derby": true}')
ON CONFLICT (name) DO NOTHING;

-- Initialize pattern accuracy records
INSERT INTO public.pattern_accuracy (template_id, total_predictions, correct_predictions, accuracy_rate)
SELECT id, 0, 0, 0.0 FROM public.pattern_templates
ON CONFLICT (template_id) DO NOTHING;

-- Insert leagues
INSERT INTO public.leagues (name, country, season, avg_goals_per_match, home_win_percentage, btts_percentage, over_2_5_percentage) VALUES
('Premier League', 'England', '2024/25', 2.8, 46.5, 52.0, 55.0),
('La Liga', 'Spain', '2024/25', 2.6, 44.0, 48.0, 50.0),
('Serie A', 'Italy', '2024/25', 2.9, 42.5, 51.5, 53.0),
('Bundesliga', 'Germany', '2024/25', 3.2, 49.0, 58.0, 65.0),
('Ligue 1', 'France', '2024/25', 2.5, 41.0, 45.0, 47.0),
('Eredivisie', 'Netherlands', '2024/25', 3.1, 47.5, 60.0, 62.0),
('Primeira Liga', 'Portugal', '2024/25', 2.7, 45.5, 49.5, 52.0)
ON CONFLICT (name, season) DO NOTHING;

-- Insert teams for major leagues
WITH league_ids AS (
    SELECT id, name FROM public.leagues 
    WHERE name IN ('Premier League', 'La Liga', 'Serie A', 'Bundesliga', 'Ligue 1')
),
team_data AS (
    SELECT 
        team_name,
        league_name,
        short_name,
        founded_year,
        stadium_name,
        stadium_capacity
    FROM (VALUES
        -- Premier League
        ('Manchester City', 'Premier League', 'MCI', 1880, 'Etihad Stadium', 55097),
        ('Arsenal', 'Premier League', 'ARS', 1886, 'Emirates Stadium', 60704),
        ('Liverpool', 'Premier League', 'LIV', 1892, 'Anfield', 53994),
        ('Chelsea', 'Premier League', 'CHE', 1905, 'Stamford Bridge', 40834),
        ('Manchester United', 'Premier League', 'MUN', 1878, 'Old Trafford', 81957),
        ('Tottenham', 'Premier League', 'TOT', 1882, 'Tottenham Hotspur Stadium', 62850),
        ('Newcastle United', 'Premier League', 'NEW', 1892, 'St James'' Park', 52305),
        ('Brighton', 'Premier League', 'BHA', 1901, 'Falmer Stadium', 31700),
        
        -- La Liga
        ('Real Madrid', 'La Liga', 'RMA', 1902, 'Santiago Bernabéu', 81044),
        ('Barcelona', 'La Liga', 'BAR', 1899, 'Camp Nou', 99354),
        ('Atletico Madrid', 'La Liga', 'ATM', 1903, 'Metropolitano', 70460),
        ('Sevilla', 'La Liga', 'SEV', 1890, 'Ramón Sánchez Pizjuán', 43753),
        ('Real Sociedad', 'La Liga', 'RSO', 1909, 'Reale Arena', 39329),
        ('Villarreal', 'La Liga', 'VIL', 1923, 'Estadio de la Cerámica', 24890),
        ('Athletic Bilbao', 'La Liga', 'ATH', 1898, 'San Mamés', 53289),
        ('Valencia', 'La Liga', 'VAL', 1919, 'Mestalla', 55000),
        
        -- Serie A
        ('Inter', 'Serie A', 'INT', 1908, 'San Siro', 80018),
        ('AC Milan', 'Serie A', 'MIL', 1899, 'San Siro', 80018),
        ('Juventus', 'Serie A', 'JUV', 1897, 'Allianz Stadium', 41507),
        ('Napoli', 'Serie A', 'NAP', 1926, 'Stadio Diego Armando Maradona', 54000),
        ('Roma', 'Serie A', 'ROM', 1927, 'Stadio Olimpico', 70634),
        ('Lazio', 'Serie A', 'LAZ', 1900, 'Stadio Olimpico', 70634),
        ('Fiorentina', 'Serie A', 'FIO', 1926, 'Stadio Artemio Franchi', 43147),
        ('Atalanta', 'Serie A', 'ATA', 1907, 'Gewiss Stadium', 25626),
        
        -- Bundesliga
        ('Bayern Munich', 'Bundesliga', 'FCB', 1900, 'Allianz Arena', 75000),
        ('Borussia Dortmund', 'Bundesliga', 'BVB', 1909, 'Signal Iduna Park', 81365),
        ('RB Leipzig', 'Bundesliga', 'RBL', 2009, 'Red Bull Arena', 47429),
        ('Bayer Leverkusen', 'Bundesliga', 'LEV', 1904, 'BayArena', 30210),
        ('Eintracht Frankfurt', 'Bundesliga', 'SGE', 1899, 'Deutsche Bank Park', 58000),
        ('Borussia Mönchengladbach', 'Bundesliga', 'BMG', 1900, 'Borussia-Park', 54022),
        ('VfL Wolfsburg', 'Bundesliga', 'WOB', 1945, 'Volkswagen Arena', 30000),
        ('SC Freiburg', 'Bundesliga', 'SCF', 1904, 'Europa-Park Stadion', 34700),
        
        -- Ligue 1
        ('PSG', 'Ligue 1', 'PSG', 1970, 'Parc des Princes', 47929),
        ('Marseille', 'Ligue 1', 'OM', 1899, 'Stade Vélodrome', 67394),
        ('Lyon', 'Ligue 1', 'OL', 1950, 'Groupama Stadium', 59186),
        ('Monaco', 'Ligue 1', 'ASM', 1924, 'Stade Louis II', 18523),
        ('Lille', 'Ligue 1', 'LOS', 1944, 'Stade Pierre-Mauroy', 50186),
        ('Nice', 'Ligue 1', 'OGC', 1904, 'Allianz Riviera', 35624),
        ('Rennes', 'Ligue 1', 'SRH', 1902, 'Roazhon Park', 29778),
        ('Strasbourg', 'Ligue 1', 'STR', 1906, 'Stade de la Meinau', 26109)
    ) AS t(team_name, league_name, short_name, founded_year, stadium_name, stadium_capacity)
)
INSERT INTO public.teams (name, league_id, short_name, founded_year, stadium_name, stadium_capacity)
SELECT 
    td.team_name,
    li.id,
    td.short_name,
    td.founded_year,
    td.stadium_name,
    td.stadium_capacity
FROM team_data td
JOIN league_ids li ON td.league_name = li.name
ON CONFLICT (name, league_id) DO NOTHING;

-- Create sample matches for the next 30 days
WITH league_teams AS (
    SELECT 
        l.id as league_id,
        l.name as league_name,
        t.id as team_id,
        t.name as team_name
    FROM public.leagues l
    JOIN public.teams t ON l.id = t.league_id
    WHERE l.name IN ('Premier League', 'La Liga', 'Serie A', 'Bundesliga', 'Ligue 1')
),
team_pairs AS (
    -- Create team pairs for each league
    SELECT 
        lt1.league_id,
        lt1.team_id as home_team_id,
        lt2.team_id as away_team_id,
        ROW_NUMBER() OVER (PARTITION BY lt1.league_id ORDER BY RANDOM()) as match_num
    FROM league_teams lt1
    JOIN league_teams lt2 ON lt1.league_id = lt2.league_id AND lt1.team_id < lt2.team_id
),
match_schedule AS (
    SELECT 
        tp.league_id,
        tp.home_team_id,
        tp.away_team_id,
        NOW() + (tp.match_num * INTERVAL '2 days') + (FLOOR(RANDOM() * 24) * INTERVAL '1 hour') as match_date
    FROM team_pairs tp
    WHERE tp.match_num <= 20  -- Limit to 20 matches per league
)
INSERT INTO public.matches (league_id, home_team_id, away_team_id, match_date, status, match_week)
SELECT 
    ms.league_id,
    ms.home_team_id,
    ms.away_team_id,
    ms.match_date,
    'scheduled',
    CEIL(ROW_NUMBER() OVER (PARTITION BY ms.league_id ORDER BY ms.match_date) / 10) as match_week
FROM match_schedule ms
ON CONFLICT (home_team_id, away_team_id, match_date) WHERE status = 'scheduled' DO NOTHING;

-- =====================================================
-- 10. PERMISSIONS AND SECURITY
-- =====================================================

-- Revoke default permissions from public
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM public;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM public;

-- Grant essential permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;

-- Grant permissions to service role
GRANT USAGE ON SCHEMA public TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO service_role;

-- Grant sequence usage
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Grant permissions on views
GRANT SELECT ON public.upcoming_matches_with_predictions TO authenticated;
GRANT SELECT ON public.user_prediction_leaderboard TO authenticated;
GRANT SELECT ON public.pattern_performance_summary TO authenticated;

-- =====================================================
-- 11. FINAL VALIDATION AND CLEANUP
-- =====================================================

-- Ensure all constraints are properly set
DO $$
BEGIN
    -- Update pattern accuracy for any templates without records
    INSERT INTO public.pattern_accuracy (template_id, total_predictions, correct_predictions, accuracy_rate)
    SELECT pt.id, 0, 0, 0.0
    FROM public.pattern_templates pt
    LEFT JOIN public.pattern_accuracy pa ON pt.id = pa.template_id
    WHERE pa.template_id IS NULL
    ON CONFLICT (template_id) DO NOTHING;
    
    -- Update crowd wisdom for matches that have user predictions but no wisdom record
    INSERT INTO public.crowd_wisdom (match_id, total_predictions, home_win_predictions, draw_predictions, away_win_predictions, average_confidence)
    SELECT 
        up.match_id,
        COUNT(*),
        COUNT(*) FILTER (WHERE up.predicted_outcome = 'home_win'),
        COUNT(*) FILTER (WHERE up.predicted_outcome = 'draw'),
        COUNT(*) FILTER (WHERE up.predicted_outcome = 'away_win'),
        AVG(up.confidence_score)
    FROM public.user_predictions up
    LEFT JOIN public.crowd_wisdom cw ON up.match_id = cw.match_id
    WHERE cw.match_id IS NULL
    GROUP BY up.match_id
    ON CONFLICT (match_id) DO NOTHING;
END $$;

-- Create admin user profile if it doesn't exist
INSERT INTO public.user_profiles (id, email, full_name, role, is_active)
SELECT 
    '00000000-0000-0000-0000-000000000000'::UUID,
    'admin@winmix.com',
    'System Administrator',
    'admin',
    true
WHERE NOT EXISTS (SELECT 1 FROM public.user_profiles WHERE id = '00000000-0000-0000-0000-000000000000'::UUID)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Log migration completion
DO $$
BEGIN
    RAISE NOTICE 'WinMix TipsterHub comprehensive database setup completed successfully at %', NOW();
    RAISE NOTICE 'Migration includes: schema, RBAC, functions, triggers, RLS policies, indexes, views, and seed data';
END $$;