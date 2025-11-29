-- Harmonize existing La Liga team names to align with demo UI labels
UPDATE public.teams SET name = 'FC Barcelona' WHERE name = 'Barcelona';
UPDATE public.teams SET name = 'Real Madrid CF' WHERE name = 'Real Madrid';
UPDATE public.teams SET name = 'Sevilla FC' WHERE name = 'Sevilla';

-- Ensure full Premier League team coverage for the demo
WITH premier_league AS (
  SELECT id FROM public.leagues WHERE name = 'Premier League' LIMIT 1
)
INSERT INTO public.teams (name, league_id)
SELECT team_name, (SELECT id FROM premier_league)
FROM (
  VALUES
    ('Aston Villa'),
    ('Manchester United'),
    ('Tottenham Hotspur'),
    ('Newcastle United'),
    ('West Ham United'),
    ('Brentford'),
    ('Brighton & Hove Albion'),
    ('Crystal Palace'),
    ('Fulham'),
    ('Everton'),
    ('Nottingham Forest'),
    ('Wolverhampton Wanderers')
) AS t(team_name)
WHERE NOT EXISTS (
  SELECT 1 FROM public.teams
  WHERE name = t.team_name
);

-- Ensure full La Liga team coverage for the demo
WITH la_liga AS (
  SELECT id FROM public.leagues WHERE name = 'La Liga' LIMIT 1
)
INSERT INTO public.teams (name, league_id)
SELECT team_name, (SELECT id FROM la_liga)
FROM (
  VALUES
    ('Real Betis'),
    ('Valencia CF'),
    ('Villarreal CF'),
    ('Real Sociedad'),
    ('Athletic Club'),
    ('CA Osasuna'),
    ('Girona FC'),
    ('RCD Mallorca'),
    ('Celta Vigo'),
    ('Getafe CF'),
    ('UD Las Palmas'),
    ('Deportivo Alaves')
) AS t(team_name)
WHERE NOT EXISTS (
  SELECT 1 FROM public.teams
  WHERE name = t.team_name
);
