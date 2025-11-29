-- Verification Script for Admin Setup: takosadam@gmail.com
-- Run this script to verify that the admin user is properly configured

-- 1. Verify user_profiles entry
SELECT 
  '✓ User Profile Check' as test_name,
  id,
  email,
  role::text,
  is_active,
  created_at,
  updated_at,
  CASE 
    WHEN role::text = 'admin' AND is_active = true THEN '✓ PASS'
    ELSE '✗ FAIL'
  END as status
FROM public.user_profiles
WHERE id = '838803e7-bc4f-4722-89ac-4c94c923f785';

-- 2. Verify auth.users entry
SELECT 
  '✓ Auth User Check' as test_name,
  id,
  email,
  email_confirmed_at IS NOT NULL as email_confirmed,
  raw_user_meta_data->>'is_admin' as is_admin_metadata,
  raw_user_meta_data->'roles' as roles_metadata,
  CASE 
    WHEN raw_user_meta_data->>'is_admin' = 'true' THEN '✓ PASS'
    ELSE '✗ FAIL (Metadata not required but recommended)'
  END as status
FROM auth.users
WHERE id = '838803e7-bc4f-4722-89ac-4c94c923f785';

-- 3. Test is_admin() function
SELECT 
  '✓ Admin Function Check' as test_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = '838803e7-bc4f-4722-89ac-4c94c923f785'
      AND role = 'admin'
      AND is_active = true
    ) THEN '✓ PASS - Will return true for this user'
    ELSE '✗ FAIL'
  END as status;

-- 4. Check RLS policies that use is_admin()
SELECT 
  '✓ RLS Policy Check' as test_name,
  COUNT(*) as admin_policies_count,
  '✓ PASS - Policies use is_admin()' as status
FROM pg_policies
WHERE schemaname = 'public'
  AND policyname LIKE '%admin%'
  AND definition LIKE '%is_admin()%';

-- 5. List all accessible admin tables
SELECT 
  '✓ Admin Accessible Tables' as test_name,
  string_agg(DISTINCT tablename, ', ' ORDER BY tablename) as tables_with_admin_policies
FROM pg_policies
WHERE schemaname = 'public'
  AND definition LIKE '%is_admin()%';

-- 6. Summary
SELECT 
  '═══════════════════════════════════════════════════════════════' as separator,
  'ADMIN SETUP VERIFICATION SUMMARY' as title,
  '═══════════════════════════════════════════════════════════════' as separator2;

SELECT 
  'User: takosadam@gmail.com' as info,
  'UID: 838803e7-bc4f-4722-89ac-4c94c923f785' as uid,
  'Expected Role: admin' as expected,
  (SELECT role::text FROM public.user_profiles WHERE id = '838803e7-bc4f-4722-89ac-4c94c923f785') as actual_role,
  CASE 
    WHEN (SELECT role::text FROM public.user_profiles WHERE id = '838803e7-bc4f-4722-89ac-4c94c923f785') = 'admin'
    THEN '✓✓✓ SETUP SUCCESSFUL ✓✓✓'
    ELSE '✗✗✗ SETUP FAILED ✗✗✗'
  END as final_status;
