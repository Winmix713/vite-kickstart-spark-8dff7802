-- Setup Admin Full Privileges for takosadam@gmail.com
-- UID: 838803e7-bc4f-4722-89ac-4c94c923f785
-- This migration grants full admin access to the specified user

SET search_path = public;

-- 1. Ensure the user profile exists with admin role
INSERT INTO public.user_profiles (
  id,
  email,
  full_name,
  role,
  is_active,
  created_at,
  updated_at
)
VALUES (
  '838803e7-bc4f-4722-89ac-4c94c923f785'::uuid,
  'takosadam@gmail.com',
  'Takos Adam',
  'admin'::public.user_role,
  true,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE
SET 
  email = EXCLUDED.email,
  role = 'admin'::public.user_role,
  is_active = true,
  updated_at = NOW();

-- 2. Update auth.users metadata to include admin flags and permissions
-- Note: This uses auth schema which requires proper permissions
DO $$
BEGIN
  -- Update raw_user_meta_data for the admin user
  UPDATE auth.users
  SET raw_user_meta_data = jsonb_set(
    jsonb_set(
      jsonb_set(
        COALESCE(raw_user_meta_data, '{}'::jsonb),
        '{is_admin}',
        'true'::jsonb
      ),
      '{roles}',
      '["admin", "moderator", "analyst", "user"]'::jsonb
    ),
    '{permissions}',
    '[
      "admin.access",
      "admin.users.manage",
      "admin.feedback.review",
      "admin.predictions.review",
      "admin.model.status",
      "admin.analytics",
      "admin.health",
      "admin.integrations",
      "admin.jobs",
      "admin.phase9.settings",
      "monitoring.full_access",
      "predictions.full_access",
      "models.full_access",
      "patterns.full_access",
      "teams.full_access",
      "analytics.full_access"
    ]'::jsonb
  )
  WHERE id = '838803e7-bc4f-4722-89ac-4c94c923f785'::uuid;
  
  -- Also set email_verified flag
  UPDATE auth.users
  SET raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data, '{}'::jsonb),
    '{email_verified}',
    'true'::jsonb
  )
  WHERE id = '838803e7-bc4f-4722-89ac-4c94c923f785'::uuid;
  
  RAISE NOTICE 'Admin privileges granted to takosadam@gmail.com (UID: 838803e7-bc4f-4722-89ac-4c94c923f785)';
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Could not update auth.users metadata: %', SQLERRM;
END;
$$;

-- 3. Verify the admin setup
DO $$
DECLARE
  v_profile_role TEXT;
  v_profile_active BOOLEAN;
BEGIN
  -- Check user_profiles
  SELECT role::text, is_active INTO v_profile_role, v_profile_active
  FROM public.user_profiles
  WHERE id = '838803e7-bc4f-4722-89ac-4c94c923f785'::uuid;
  
  IF v_profile_role = 'admin' AND v_profile_active THEN
    RAISE NOTICE '✓ Admin profile verified: role=%, is_active=%', v_profile_role, v_profile_active;
  ELSE
    RAISE WARNING '✗ Admin profile check failed: role=%, is_active=%', v_profile_role, v_profile_active;
  END IF;
END;
$$;

COMMENT ON TABLE public.user_profiles IS 'User profiles with role-based access control. Admin: takosadam@gmail.com (838803e7-bc4f-4722-89ac-4c94c923f785) has full access.';
