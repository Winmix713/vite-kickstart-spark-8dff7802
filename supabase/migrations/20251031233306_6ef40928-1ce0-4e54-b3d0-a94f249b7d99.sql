-- WinMix Prototípus Adatbázis Séma
-- 1. Ligák tábla (liga metrikák)
CREATE TABLE public.leagues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  country TEXT NOT NULL,
  season TEXT NOT NULL,
  avg_goals_per_match DECIMAL(3,2) DEFAULT 2.5,
  home_win_percentage DECIMAL(5,2) DEFAULT 45.0,
  btts_percentage DECIMAL(5,2) DEFAULT 50.0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_league_season UNIQUE (name, season)
);

-- 2. Csapatok tábla
CREATE TABLE public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  league_id UUID REFERENCES public.leagues(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Mérkőzések tábla
CREATE TABLE public.matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id UUID REFERENCES public.leagues(id) ON DELETE CASCADE,
  home_team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  away_team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  match_date TIMESTAMPTZ NOT NULL,
  home_score INTEGER,
  away_score INTEGER,
  status TEXT DEFAULT 'scheduled', -- scheduled, finished
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexek a gyorsabb query-khez
CREATE INDEX idx_matches_date ON public.matches(match_date);
CREATE INDEX idx_matches_status ON public.matches(status);
CREATE INDEX idx_matches_home_team ON public.matches(home_team_id);
CREATE INDEX idx_matches_away_team ON public.matches(away_team_id);

-- 4. Pattern template-ek (előre definiált pattern típusok)
CREATE TABLE public.pattern_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  category TEXT NOT NULL, -- 'form', 'h2h', 'league'
  base_confidence_boost DECIMAL(5,2) DEFAULT 5.0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Detektált pattern-ek konkrét mérkőzésekhez
CREATE TABLE public.detected_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES public.matches(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.pattern_templates(id) ON DELETE CASCADE,
  confidence_contribution DECIMAL(5,2) NOT NULL,
  pattern_data JSONB, -- specifikus adatok (pl. streak length, h2h wins)
  detected_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_match_template UNIQUE (match_id, template_id)
);

CREATE INDEX idx_detected_patterns_match ON public.detected_patterns(match_id);

-- 6. Predikciók tábla
CREATE TABLE public.predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES public.matches(id) ON DELETE CASCADE,
  predicted_outcome TEXT NOT NULL, -- 'home_win', 'draw', 'away_win'
  confidence_score DECIMAL(5,2) NOT NULL,
  predicted_home_score INTEGER,
  predicted_away_score INTEGER,
  btts_prediction BOOLEAN,
  over_under_prediction TEXT, -- 'over_2.5', 'under_2.5'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Feedback mezők (meccs után töltődnek ki)
  actual_outcome TEXT,
  was_correct BOOLEAN,
  evaluated_at TIMESTAMPTZ,
  
  CONSTRAINT unique_match_prediction UNIQUE (match_id)
);

CREATE INDEX idx_predictions_match ON public.predictions(match_id);
CREATE INDEX idx_predictions_evaluated ON public.predictions(evaluated_at) WHERE evaluated_at IS NOT NULL;

-- 7. Pattern accuracy tracking
CREATE TABLE public.pattern_accuracy (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES public.pattern_templates(id) ON DELETE CASCADE,
  total_predictions INTEGER DEFAULT 0,
  correct_predictions INTEGER DEFAULT 0,
  accuracy_rate DECIMAL(5,2) DEFAULT 50.0,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_template_accuracy UNIQUE (template_id)
);

-- 8. Helper function: Pattern template confidence adjustment
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
  UPDATE public.pattern_templates
  SET base_confidence_boost = GREATEST(1.0, base_confidence_boost + p_adjustment)
  WHERE id = p_template_id;
END;
$$;

-- 9. Seed Data: Pattern template-ek beszúrása
INSERT INTO public.pattern_templates (name, description, category, base_confidence_boost) VALUES
('home_winning_streak', 'Home team won last 3+ home matches', 'form', 8.0),
('away_winning_streak', 'Away team won last 3+ away matches', 'form', 7.0),
('h2h_dominance', 'One team won 3+ of last 5 H2H matches', 'h2h', 10.0),
('recent_form_advantage', 'Team has 2+ more wins in last 5 matches', 'form', 6.0),
('high_scoring_league', 'League avg goals > 3.0 per match', 'league', 3.0);

-- 10. Pattern accuracy inicializálása
INSERT INTO public.pattern_accuracy (template_id, total_predictions, correct_predictions, accuracy_rate)
SELECT id, 0, 0, 50.0 FROM public.pattern_templates;

-- 11. Seed Data: Példa liga (Premier League)
INSERT INTO public.leagues (name, country, season, avg_goals_per_match, home_win_percentage, btts_percentage) VALUES
('Premier League', 'England', '2024/25', 2.8, 46.5, 52.0),
('La Liga', 'Spain', '2024/25', 2.6, 44.0, 48.0);

-- 12. Seed Data: Csapatok beszúrása
WITH premier_league AS (SELECT id FROM public.leagues WHERE name = 'Premier League' LIMIT 1),
     la_liga AS (SELECT id FROM public.leagues WHERE name = 'La Liga' LIMIT 1)
INSERT INTO public.teams (name, league_id) 
SELECT name, league_id FROM (
  SELECT 'Manchester City' AS name, (SELECT id FROM premier_league) AS league_id UNION ALL
  SELECT 'Arsenal', (SELECT id FROM premier_league) UNION ALL
  SELECT 'Liverpool', (SELECT id FROM premier_league) UNION ALL
  SELECT 'Chelsea', (SELECT id FROM premier_league) UNION ALL
  SELECT 'Real Madrid', (SELECT id FROM la_liga) UNION ALL
  SELECT 'Barcelona', (SELECT id FROM la_liga) UNION ALL
  SELECT 'Atletico Madrid', (SELECT id FROM la_liga) UNION ALL
  SELECT 'Sevilla', (SELECT id FROM la_liga)
) AS teams;

-- 13. Seed Data: Példa mérkőzések (teszteléshez)
WITH premier_league AS (SELECT id FROM public.leagues WHERE name = 'Premier League' LIMIT 1),
     mancity AS (SELECT id FROM public.teams WHERE name = 'Manchester City' LIMIT 1),
     arsenal AS (SELECT id FROM public.teams WHERE name = 'Arsenal' LIMIT 1),
     liverpool AS (SELECT id FROM public.teams WHERE name = 'Liverpool' LIMIT 1),
     chelsea AS (SELECT id FROM public.teams WHERE name = 'Chelsea' LIMIT 1)
INSERT INTO public.matches (league_id, home_team_id, away_team_id, match_date, status, home_score, away_score) VALUES
  -- Jövőbeli mérkőzések (scheduled)
  ((SELECT id FROM premier_league), (SELECT id FROM mancity), (SELECT id FROM arsenal), NOW() + INTERVAL '3 days', 'scheduled', NULL, NULL),
  ((SELECT id FROM premier_league), (SELECT id FROM liverpool), (SELECT id FROM chelsea), NOW() + INTERVAL '5 days', 'scheduled', NULL, NULL),
  ((SELECT id FROM premier_league), (SELECT id FROM arsenal), (SELECT id FROM liverpool), NOW() + INTERVAL '7 days', 'scheduled', NULL, NULL),
  
  -- Befejezett mérkőzések (feedback teszteléshez)
  ((SELECT id FROM premier_league), (SELECT id FROM mancity), (SELECT id FROM chelsea), NOW() - INTERVAL '7 days', 'finished', 3, 1),
  ((SELECT id FROM premier_league), (SELECT id FROM arsenal), (SELECT id FROM mancity), NOW() - INTERVAL '14 days', 'finished', 2, 2),
  ((SELECT id FROM premier_league), (SELECT id FROM liverpool), (SELECT id FROM arsenal), NOW() - INTERVAL '21 days', 'finished', 4, 2);