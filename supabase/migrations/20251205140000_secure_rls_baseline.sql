-- Secure RLS Baseline Migration
-- This migration establishes proper row-level security foundations
-- NOTE 2025-12-20: The user_profiles table definition introduced on 2025-12-05
-- is now consolidated in migration 20251220120000_consolidate_user_profiles.sql.
-- The guarded block below prevents re-creation of the table when it already exists.

DO $create_user_profiles$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'user_profiles'
  ) THEN
    RAISE NOTICE 'public.user_profiles already exists - skipping legacy CREATE TABLE.';
  ELSE
    EXECUTE $sql$
      CREATE TABLE public.user_profiles (
        id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
        email TEXT NOT NULL,
        full_name TEXT,
        role TEXT NOT NULL DEFAULT 'user',
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        CONSTRAINT unique_user_email UNIQUE (email)
      );
    $sql$;
  END IF;
END
$create_user_profiles$;

COMMENT ON TABLE public.user_profiles IS 'User profile information for role-based access control.';
COMMENT ON COLUMN public.user_profiles.role IS 'User role: admin (full access), analyst (read analytics + write experiments), viewer (read-only), demo (limited read-only)';
COMMENT ON COLUMN public.user_profiles.is_active IS 'Whether this user profile is active';

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

UPDATE public.user_profiles
SET is_active = true
WHERE is_active IS NULL;

ALTER TABLE public.user_profiles
  ALTER COLUMN is_active SET NOT NULL,
  ALTER COLUMN is_active SET DEFAULT true;

ALTER TABLE public.user_profiles
  DROP CONSTRAINT IF EXISTS user_profiles_role_check;

ALTER TABLE public.user_profiles
  ADD CONSTRAINT user_profiles_role_check CHECK (role IN ('admin', 'analyst', 'user', 'viewer', 'demo'));

CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_active ON public.user_profiles(is_active) WHERE is_active = true;

-- 2. Add created_by columns to user-owned tables that lack them
ALTER TABLE public.detected_patterns 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.team_patterns 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Note: user_predictions already has user_id TEXT column, we'll add created_by UUID for consistency
ALTER TABLE public.user_predictions 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 3. Create triggers for automatic created_by population
CREATE OR REPLACE FUNCTION public.set_created_by()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Set created_by to current user if not provided
  IF NEW.created_by IS NULL AND auth.uid() IS NOT NULL THEN
    NEW.created_by := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

-- Apply triggers to tables with created_by columns
CREATE TRIGGER trg_set_created_by_detected_patterns
  BEFORE INSERT OR UPDATE ON public.detected_patterns
  FOR EACH ROW EXECUTE FUNCTION public.set_created_by();

CREATE TRIGGER trg_set_created_by_team_patterns
  BEFORE INSERT OR UPDATE ON public.team_patterns
  FOR EACH ROW EXECUTE FUNCTION public.set_created_by();

CREATE TRIGGER trg_set_created_by_user_predictions
  BEFORE INSERT OR UPDATE ON public.user_predictions
  FOR EACH ROW EXECUTE FUNCTION public.set_created_by();

-- 4. Backfill existing data with service role ownership
-- For existing detected_patterns without created_by, set to NULL (service data)
UPDATE public.detected_patterns 
SET created_by = NULL 
WHERE created_by IS NULL;

-- For existing team_patterns without created_by, set to NULL (service data)
UPDATE public.team_patterns 
SET created_by = NULL 
WHERE created_by IS NULL;

-- For existing user_predictions, map user_id TEXT to created_by UUID if possible
-- This is a best-effort migration - in production this would need proper user mapping
UPDATE public.user_predictions 
SET created_by = NULL 
WHERE created_by IS NULL;

-- 5. Create security helper functions
CREATE OR REPLACE FUNCTION public.current_app_role()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Check if user is authenticated
  IF auth.uid() IS NULL THEN
    RETURN 'anonymous';
  END IF;
  
  -- Get user role from user_profiles (active profiles take precedence)
  SELECT role::text INTO user_role 
  FROM public.user_profiles 
  WHERE id = auth.uid() AND is_active = true;
  
  -- Return role or default to 'viewer'
  RETURN COALESCE(user_role, 'viewer');
END;
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN public.current_app_role() = 'admin';
END;
$$;

CREATE OR REPLACE FUNCTION public.is_analyst()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN public.current_app_role() IN ('admin', 'analyst');
END;
$$;

CREATE OR REPLACE FUNCTION public.is_service_role()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if the current role is a service role (postgres, authenticated, service_role)
  RETURN current_setting('request.jwt.claims', true)::jsonb->>'role' IN ('service_role', 'postgres');
END;
$$;

-- 6. Enable RLS on user_profiles table
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles FORCE ROW LEVEL SECURITY;

-- 7. Create policies for user_profiles table
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can insert profiles" ON public.user_profiles;
CREATE POLICY "Admins can insert profiles" ON public.user_profiles
  FOR INSERT WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete profiles" ON public.user_profiles;
CREATE POLICY "Admins can delete profiles" ON public.user_profiles
  FOR DELETE USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;
CREATE POLICY "Admins can view all profiles" ON public.user_profiles
  FOR SELECT USING (public.is_admin());

-- 8. Seed default user profiles
WITH seed_profiles AS (
  SELECT * FROM (VALUES
    ('00000000-0000-0000-0000-000000000000'::uuid, 'demo'),
    ('00000000-0000-0000-0000-000000000001'::uuid, 'viewer'),
    ('00000000-0000-0000-0000-000000000002'::uuid, 'analyst'),
    ('00000000-0000-0000-0000-000000000003'::uuid, 'admin')
  ) AS s(id, role)
)
INSERT INTO public.user_profiles (id, email, full_name, role, is_active)
SELECT 
  s.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'full_name', u.email),
  s.role,
  true
FROM seed_profiles s
JOIN auth.users u ON u.id = s.id
ON CONFLICT (id) DO NOTHING;

-- 9. Grant minimal privileges to service roles
-- Revoke default permissions from public
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM public;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM public;

-- Grant essential permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;

-- Grant essential permissions to service role
GRANT USAGE ON SCHEMA public TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO service_role;

-- Grant sequence usage
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- 10. Create updated_at trigger for user_profiles
CREATE OR REPLACE FUNCTION public.touch_user_profiles_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_touch_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_user_profiles_updated_at();
