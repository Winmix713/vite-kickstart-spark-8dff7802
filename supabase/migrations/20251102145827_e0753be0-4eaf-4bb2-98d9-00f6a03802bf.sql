-- Add halftime score columns to matches table
ALTER TABLE public.matches
ADD COLUMN halftime_home_score integer,
ADD COLUMN halftime_away_score integer;

-- Add comment for documentation
COMMENT ON COLUMN public.matches.halftime_home_score IS 'Halftime score for the home team';
COMMENT ON COLUMN public.matches.halftime_away_score IS 'Halftime score for the away team';
