-- Consolidate public.user_profiles schema across conflicting migrations
-- This migration reconciles the November 6 and December 5 definitions so that
-- every environment converges on a single canonical structure (id references auth.users).

SET search_path = public;

-- 1. Ensure foundational columns exist (email, full_name, timestamps, activity flag)
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS email TEXT;

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS full_name TEXT;

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

UPDATE public.user_profiles
SET is_active = true
WHERE is_active IS NULL;

ALTER TABLE public.user_profiles
  ALTER COLUMN is_active SET DEFAULT true,
  ALTER COLUMN is_active SET NOT NULL;

UPDATE public.user_profiles
SET created_at = COALESCE(created_at, NOW()),
    updated_at = COALESCE(updated_at, NOW());

-- 2. Preserve legacy identifiers and prepare canonical ids
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS legacy_id UUID;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS new_id UUID;

UPDATE public.user_profiles
SET legacy_id = id
WHERE legacy_id IS NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'user_profiles'
      AND column_name = 'user_id'
  ) THEN
    UPDATE public.user_profiles
    SET new_id = user_id
    WHERE new_id IS DISTINCT FROM user_id;
  ELSE
    UPDATE public.user_profiles
    SET new_id = id
    WHERE new_id IS DISTINCT FROM id;
  END IF;
END;
$$;

UPDATE public.user_profiles
SET new_id = id
WHERE new_id IS NULL;

-- 3. Remove legacy uniqueness/FK constraints on user_id if they exist
ALTER TABLE public.user_profiles DROP CONSTRAINT IF EXISTS unique_user_profile;
ALTER TABLE public.user_profiles DROP CONSTRAINT IF EXISTS user_profiles_user_id_fkey;

-- 4. Temporarily drop downstream foreign keys that reference public.user_profiles(id)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'environment_variables'
  ) THEN
    EXECUTE 'ALTER TABLE public.environment_variables DROP CONSTRAINT IF EXISTS environment_variables_created_by_fkey';
  END IF;
END;
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'audit_log'
  ) THEN
    EXECUTE 'ALTER TABLE public.audit_log DROP CONSTRAINT IF EXISTS audit_log_user_id_fkey';
  END IF;
END;
$$;

-- 5. Align primary identifiers with auth.users(id)
ALTER TABLE public.user_profiles ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.user_profiles DROP CONSTRAINT IF EXISTS user_profiles_pkey;
ALTER TABLE public.user_profiles DROP CONSTRAINT IF EXISTS user_profiles_id_fkey;

UPDATE public.user_profiles
SET id = new_id
WHERE id IS DISTINCT FROM new_id;

ALTER TABLE public.user_profiles ADD CONSTRAINT user_profiles_pkey PRIMARY KEY (id);
ALTER TABLE public.user_profiles ALTER COLUMN id SET NOT NULL;
ALTER TABLE public.user_profiles ADD CONSTRAINT user_profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 6. Propagate identifier changes to referencing tables (using legacy_id mapping)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'environment_variables'
  ) THEN
    EXECUTE $sql$
      UPDATE public.environment_variables ev
      SET created_by = up.id
      FROM public.user_profiles up
      WHERE ev.created_by = up.legacy_id
        AND up.id IS NOT NULL
        AND (ev.created_by IS DISTINCT FROM up.id OR ev.created_by IS NULL);
    $sql$;

    EXECUTE 'ALTER TABLE public.environment_variables ADD CONSTRAINT environment_variables_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.user_profiles(id) ON DELETE SET NULL';
  END IF;
END;
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'audit_log'
  ) THEN
    EXECUTE $sql$
      UPDATE public.audit_log al
      SET user_id = up.id
      FROM public.user_profiles up
      WHERE al.user_id = up.legacy_id
        AND up.id IS NOT NULL
        AND (al.user_id IS DISTINCT FROM up.id OR al.user_id IS NULL);
    $sql$;

    EXECUTE 'ALTER TABLE public.audit_log ADD CONSTRAINT audit_log_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user_profiles(id) ON DELETE SET NULL';
  END IF;
END;
$$;

-- 7. Drop transitional columns and obsolete user_id
ALTER TABLE public.user_profiles DROP COLUMN IF EXISTS user_id;
ALTER TABLE public.user_profiles DROP COLUMN IF EXISTS legacy_id;
ALTER TABLE public.user_profiles DROP COLUMN IF EXISTS new_id;

-- 8. Ensure email and full_name data integrity
UPDATE public.user_profiles up
SET email = COALESCE(email, u.email)
FROM auth.users u
WHERE u.id = up.id AND up.email IS NULL;

UPDATE public.user_profiles
SET email = CONCAT('unknown-', id::text, '@placeholder.local')
WHERE email IS NULL;

ALTER TABLE public.user_profiles ALTER COLUMN email SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.user_profiles'::regclass
      AND conname = 'unique_user_email'
  ) THEN
    ALTER TABLE public.user_profiles
      ADD CONSTRAINT unique_user_email UNIQUE (email);
  END IF;
END;
$$;

DROP INDEX IF EXISTS idx_user_profiles_email;

UPDATE public.user_profiles up
SET full_name = COALESCE(NULLIF(full_name, ''), u.raw_user_meta_data->>'full_name', u.email)
FROM auth.users u
WHERE u.id = up.id AND (up.full_name IS NULL OR up.full_name = '');

-- 9. Normalize role column via dedicated enum
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'user_role'
  ) THEN
    CREATE TYPE public.user_role AS ENUM ('admin', 'analyst', 'user', 'viewer', 'demo');
  END IF;
END;
$$;

DO $$
DECLARE
  label TEXT;
BEGIN
  FOR label IN SELECT unnest(ARRAY['admin','analyst','user','viewer','demo']) LOOP
    IF NOT EXISTS (
      SELECT 1
      FROM pg_enum
      WHERE enumtypid = 'public.user_role'::regtype
        AND enumlabel = label
    ) THEN
      EXECUTE format('ALTER TYPE public.user_role ADD VALUE %L', label);
    END IF;
  END LOOP;
END;
$$;

ALTER TABLE public.user_profiles DROP CONSTRAINT IF EXISTS user_profiles_role_check;
ALTER TABLE public.user_profiles ALTER COLUMN role DROP DEFAULT;

ALTER TABLE public.user_profiles
  ALTER COLUMN role TYPE public.user_role
  USING CASE
    WHEN role IN ('admin', 'analyst', 'user', 'viewer', 'demo')
      THEN role::public.user_role
    ELSE 'user'::public.user_role
  END;

ALTER TABLE public.user_profiles
  ALTER COLUMN role SET DEFAULT 'user',
  ALTER COLUMN role SET NOT NULL;

-- 10. Refresh supporting indexes
DROP INDEX IF EXISTS idx_user_profiles_role;
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);

DROP INDEX IF EXISTS idx_user_profiles_active;
DROP INDEX IF EXISTS idx_user_profiles_is_active;
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_active ON public.user_profiles(is_active) WHERE is_active = true;

-- 11. Rebuild triggers and automate profile creation on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inferred_role public.user_role := 'user';
  requested_role TEXT;
  preferred_name TEXT;
BEGIN
  requested_role := NEW.raw_user_meta_data->>'role';
  IF requested_role IN ('admin', 'analyst', 'user', 'viewer', 'demo') THEN
    inferred_role := requested_role::public.user_role;
  END IF;

  preferred_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name');

  INSERT INTO public.user_profiles (id, email, full_name, role, is_active)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NULLIF(preferred_name, ''), NEW.email),
    inferred_role,
    true
  )
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), public.user_profiles.full_name),
        is_active = true,
        updated_at = NOW();

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 12. Normalize updated_at trigger to reuse shared helper
DROP TRIGGER IF EXISTS trg_touch_user_profiles_updated_at ON public.user_profiles;
DROP FUNCTION IF EXISTS public.touch_user_profiles_updated_at();
DROP TRIGGER IF EXISTS trg_user_profiles_updated_at ON public.user_profiles;

CREATE TRIGGER trg_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 13. Re-establish RLS policies with canonical semantics
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON public.user_profiles;

CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.user_profiles
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can insert profiles" ON public.user_profiles
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update profiles" ON public.user_profiles
  FOR UPDATE USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete profiles" ON public.user_profiles
  FOR DELETE USING (public.is_admin());

-- 14. Final data hygiene to ensure updated_at reflects canonical structure
UPDATE public.user_profiles
SET updated_at = NOW()
WHERE updated_at IS NULL;

COMMENT ON COLUMN public.user_profiles.role IS 'User role enforced by the user_role enum (admin, analyst, user, viewer, demo)';
COMMENT ON COLUMN public.user_profiles.is_active IS 'Active flag consolidated across migrations (defaults true)';
