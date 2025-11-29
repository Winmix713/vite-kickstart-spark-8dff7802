-- Enable Row Level Security minden táblán
ALTER TABLE public.leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pattern_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detected_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pattern_accuracy ENABLE ROW LEVEL SECURITY;

-- Public access policy-k (prototípushoz, authentication nélkül)
-- Leagues table policies
CREATE POLICY "Enable read access for all users" ON public.leagues
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON public.leagues
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON public.leagues
  FOR UPDATE USING (true);

CREATE POLICY "Enable delete for all users" ON public.leagues
  FOR DELETE USING (true);

-- Teams table policies
CREATE POLICY "Enable read access for all users" ON public.teams
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON public.teams
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON public.teams
  FOR UPDATE USING (true);

CREATE POLICY "Enable delete for all users" ON public.teams
  FOR DELETE USING (true);

-- Matches table policies
CREATE POLICY "Enable read access for all users" ON public.matches
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON public.matches
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON public.matches
  FOR UPDATE USING (true);

CREATE POLICY "Enable delete for all users" ON public.matches
  FOR DELETE USING (true);

-- Pattern templates table policies
CREATE POLICY "Enable read access for all users" ON public.pattern_templates
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON public.pattern_templates
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON public.pattern_templates
  FOR UPDATE USING (true);

CREATE POLICY "Enable delete for all users" ON public.pattern_templates
  FOR DELETE USING (true);

-- Detected patterns table policies
CREATE POLICY "Enable read access for all users" ON public.detected_patterns
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON public.detected_patterns
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON public.detected_patterns
  FOR UPDATE USING (true);

CREATE POLICY "Enable delete for all users" ON public.detected_patterns
  FOR DELETE USING (true);

-- Predictions table policies
CREATE POLICY "Enable read access for all users" ON public.predictions
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON public.predictions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON public.predictions
  FOR UPDATE USING (true);

CREATE POLICY "Enable delete for all users" ON public.predictions
  FOR DELETE USING (true);

-- Pattern accuracy table policies
CREATE POLICY "Enable read access for all users" ON public.pattern_accuracy
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON public.pattern_accuracy
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON public.pattern_accuracy
  FOR UPDATE USING (true);

CREATE POLICY "Enable delete for all users" ON public.pattern_accuracy
  FOR DELETE USING (true);