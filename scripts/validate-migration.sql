-- =====================================================
-- Migration Validation Script
-- 
-- This SQL script validates that the comprehensive database migration
-- has been applied correctly and all components are working as expected.
-- =====================================================

-- Create a temporary table for validation results
CREATE TEMP TABLE IF NOT EXISTS validation_results (
    test_name TEXT PRIMARY KEY,
    status TEXT CHECK (status IN ('PASS', 'FAIL', 'WARN')),
    details TEXT
);

-- Helper function to log validation results
CREATE OR REPLACE FUNCTION log_validation(test_name TEXT, status TEXT, details TEXT DEFAULT NULL)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO validation_results (test_name, status, details)
    VALUES (test_name, status, details)
    ON CONFLICT (test_name) DO UPDATE SET
        status = EXCLUDED.status,
        details = EXCLUDED.details;
END;
$$;

-- =====================================================
-- 1. Table Existence Validation
-- =====================================================

DO $$
DECLARE
    table_record RECORD;
    table_list TEXT[] := ARRAY[
        'user_profiles', 'leagues', 'teams', 'matches', 
        'pattern_templates', 'detected_patterns', 'predictions',
        'pattern_accuracy', 'user_predictions', 'crowd_wisdom'
    ];
BEGIN
    FOREACH table_name IN ARRAY table_list
    LOOP
        IF EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = table_name
        ) THEN
            PERFORM log_validation(
                'Table exists: ' || table_name,
                'PASS',
                'Table ' || table_name || ' exists in public schema'
            );
        ELSE
            PERFORM log_validation(
                'Table exists: ' || table_name,
                'FAIL',
                'Table ' || table_name || ' does not exist'
            );
        END IF;
    END LOOP;
END $$;

-- =====================================================
-- 2. Column Validation
-- =====================================================

DO $$
DECLARE
    column_exists BOOLEAN;
BEGIN
    -- Check user_profiles columns
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'role'
    ) INTO column_exists;
    
    PERFORM log_validation(
        'Column exists: user_profiles.role',
        CASE WHEN column_exists THEN 'PASS' ELSE 'FAIL' END,
        CASE WHEN column_exists THEN 'role column exists in user_profiles' ELSE 'role column missing in user_profiles' END
    );
    
    -- Check predicted_outcome constraint in predictions
    SELECT EXISTS (
        SELECT 1 FROM information_schema.check_constraints cc
        JOIN information_schema.table_constraints tc ON cc.constraint_name = tc.constraint_name
        WHERE tc.table_schema = 'public' AND tc.table_name = 'predictions' 
        AND cc.check_clause LIKE '%predicted_outcome%'
    ) INTO column_exists;
    
    PERFORM log_validation(
        'Constraint exists: predictions.predicted_outcome',
        CASE WHEN column_exists THEN 'PASS' ELSE 'WARN' END,
        CASE WHEN column_exists THEN 'predicted_outcome constraint exists' ELSE 'predicted_outcome constraint may be missing' END
    );
END $$;

-- =====================================================
-- 3. Index Validation
-- =====================================================

DO $$
DECLARE
    index_count INTEGER;
BEGIN
    -- Count indexes on matches table
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes 
    WHERE schemaname = 'public' AND tablename = 'matches';
    
    PERFORM log_validation(
        'Indexes on matches table',
        CASE WHEN index_count >= 5 THEN 'PASS' ELSE 'WARN' END,
        'Found ' || index_count || ' indexes on matches table (expected at least 5)'
    );
    
    -- Check for specific important indexes
    IF EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE schemaname = 'public' AND tablename = 'matches' AND indexname = 'idx_matches_date'
    ) THEN
        PERFORM log_validation('Index exists: idx_matches_date', 'PASS', 'Date index on matches exists');
    ELSE
        PERFORM log_validation('Index exists: idx_matches_date', 'WARN', 'Date index on matches missing');
    END IF;
END $$;

-- =====================================================
-- 4. RLS Validation
-- =====================================================

DO $$
DECLARE
    rls_enabled BOOLEAN;
    policy_count INTEGER;
BEGIN
    -- Check RLS is enabled on sensitive tables
    FOREACH table_name IN ARRAY ARRAY['user_profiles', 'predictions', 'user_predictions']
    LOOP
        SELECT rowsecurity INTO rls_enabled
        FROM pg_tables 
        WHERE schemaname = 'public' AND tablename = table_name;
        
        PERFORM log_validation(
            'RLS enabled on ' || table_name,
            CASE WHEN rls_enabled THEN 'PASS' ELSE 'FAIL' END,
            'RLS is ' || CASE WHEN rls_enabled THEN 'enabled' ELSE 'disabled' END || ' on ' || table_name
        );
    END LOOP;
    
    -- Check for policies on user_profiles
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'user_profiles';
    
    PERFORM log_validation(
        'RLS policies on user_profiles',
        CASE WHEN policy_count > 0 THEN 'PASS' ELSE 'FAIL' END,
        'Found ' || policy_count || ' RLS policies on user_profiles'
    );
END $$;

-- =====================================================
-- 5. Function Validation
-- =====================================================

DO $$
DECLARE
    function_exists BOOLEAN;
    function_list TEXT[] := ARRAY[
        'get_current_user_id', 'get_user_role', 'is_admin', 
        'is_analyst', 'calculate_win_probability'
    ];
BEGIN
    FOREACH func_name IN ARRAY function_list
    LOOP
        SELECT EXISTS (
            SELECT 1 FROM information_schema.routines 
            WHERE routine_schema = 'public' AND routine_name = func_name
        ) INTO function_exists;
        
        PERFORM log_validation(
            'Function exists: ' || func_name,
            CASE WHEN function_exists THEN 'PASS' ELSE 'FAIL' END,
            'Function ' || func_name || ' ' || CASE WHEN function_exists THEN 'exists' ELSE 'missing' END
        );
    END LOOP;
END $$;

-- =====================================================
-- 6. View Validation
-- =====================================================

DO $$
DECLARE
    view_exists BOOLEAN;
    view_list TEXT[] := ARRAY[
        'upcoming_matches_with_predictions', 
        'user_prediction_leaderboard', 
        'pattern_performance_summary'
    ];
BEGIN
    FOREACH view_name IN ARRAY view_list
    LOOP
        SELECT EXISTS (
            SELECT 1 FROM information_schema.views 
            WHERE table_schema = 'public' AND table_name = view_name
        ) INTO view_exists;
        
        PERFORM log_validation(
            'View exists: ' || view_name,
            CASE WHEN view_exists THEN 'PASS' ELSE 'FAIL' END,
            'View ' || view_name || ' ' || CASE WHEN view_exists THEN 'exists' ELSE 'missing' END
        );
    END LOOP;
END $$;

-- =====================================================
-- 7. Seed Data Validation
-- =====================================================

DO $$
DECLARE
    seed_count INTEGER;
BEGIN
    -- Check leagues seed data
    SELECT COUNT(*) INTO seed_count FROM public.leagues;
    PERFORM log_validation(
        'Seed data: leagues',
        CASE WHEN seed_count > 0 THEN 'PASS' ELSE 'WARN' END,
        'Found ' || seed_count || ' leagues in seed data'
    );
    
    -- Check teams seed data
    SELECT COUNT(*) INTO seed_count FROM public.teams;
    PERFORM log_validation(
        'Seed data: teams',
        CASE WHEN seed_count > 0 THEN 'PASS' ELSE 'WARN' END,
        'Found ' || seed_count || ' teams in seed data'
    );
    
    -- Check pattern templates seed data
    SELECT COUNT(*) INTO seed_count FROM public.pattern_templates;
    PERFORM log_validation(
        'Seed data: pattern_templates',
        CASE WHEN seed_count > 0 THEN 'PASS' ELSE 'WARN' END,
        'Found ' || seed_count || ' pattern templates in seed data'
    );
END $$;

-- =====================================================
-- 8. Trigger Validation
-- =====================================================

DO $$
DECLARE
    trigger_count INTEGER;
BEGIN
    -- Count triggers on user_profiles table
    SELECT COUNT(*) INTO trigger_count
    FROM information_schema.triggers 
    WHERE trigger_schema = 'public' AND event_object_table = 'user_profiles';
    
    PERFORM log_validation(
        'Triggers on user_profiles',
        CASE WHEN trigger_count > 0 THEN 'PASS' ELSE 'WARN' END,
        'Found ' || trigger_count || ' triggers on user_profiles table'
    );
    
    -- Check for specific important triggers
    IF EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_schema = 'public' AND event_object_table = 'user_profiles' 
        AND trigger_name = 'trg_user_profiles_updated_at'
    ) THEN
        PERFORM log_validation('Trigger exists: trg_user_profiles_updated_at', 'PASS', 'Updated_at trigger exists');
    ELSE
        PERFORM log_validation('Trigger exists: trg_user_profiles_updated_at', 'WARN', 'Updated_at trigger missing');
    END IF;
END $$;

-- =====================================================
-- 9. Data Integrity Tests
-- =====================================================

DO $$
DECLARE
    integrity_ok BOOLEAN;
BEGIN
    -- Test foreign key relationships
    BEGIN
        -- Try to insert invalid data (should fail)
        INSERT INTO public.teams (name, league_id) 
        VALUES ('Test Team', '00000000-0000-0000-0000-000000000000'::UUID);
        
        -- If we get here, FK constraint is missing
        PERFORM log_validation('Foreign key: teams.league_id', 'FAIL', 'Foreign key constraint not enforced');
        ROLLBACK;
    EXCEPTION WHEN foreign_key_violation OR insert_or_update_on_item_referenced_in_foreign_key_constraint THEN
        PERFORM log_validation('Foreign key: teams.league_id', 'PASS', 'Foreign key constraint working correctly');
        ROLLBACK;
    END;
    
    -- Test check constraints
    BEGIN
        INSERT INTO public.predictions (
            match_id, predicted_outcome, confidence_score
        ) VALUES (
            gen_random_uuid(), 'invalid_outcome', 50.0
        );
        
        PERFORM log_validation('Check constraint: predictions.predicted_outcome', 'FAIL', 'Check constraint not enforced');
        ROLLBACK;
    EXCEPTION WHEN check_violation THEN
        PERFORM log_validation('Check constraint: predictions.predicted_outcome', 'PASS', 'Check constraint working correctly');
        ROLLBACK;
    END;
END $$;

-- =====================================================
-- 10. Security Validation
-- =====================================================

DO $$
DECLARE
    role_exists BOOLEAN;
BEGIN
    -- Check if custom roles exist
    FOREACH role_name IN ARRAY ARRAY['winmix_admin', 'winmix_analyst', 'winmix_viewer']
    LOOP
        SELECT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = role_name) INTO role_exists;
        
        PERFORM log_validation(
            'Role exists: ' || role_name,
            CASE WHEN role_exists THEN 'PASS' ELSE 'WARN' END,
            'Role ' || role_name || ' ' || CASE WHEN role_exists THEN 'exists' ELSE 'missing' END
        );
    END LOOP;
END $$;

-- =====================================================
-- Validation Results Summary
-- =====================================================

SELECT 
    status,
    COUNT(*) as count,
    STRING_AGG(test_name, ', ' ORDER BY test_name) as tests
FROM validation_results
GROUP BY status
ORDER BY 
    CASE status 
        WHEN 'FAIL' THEN 1 
        WHEN 'WARN' THEN 2 
        WHEN 'PASS' THEN 3 
    END;

-- Detailed results
SELECT 
    status,
    test_name,
    details
FROM validation_results
ORDER BY 
    CASE status 
        WHEN 'FAIL' THEN 1 
        WHEN 'WARN' THEN 2 
        WHEN 'PASS' THEN 3 
    END,
    test_name;

-- Overall validation summary
SELECT 
    'Validation Summary' as metric,
    (SELECT COUNT(*) FROM validation_results WHERE status = 'PASS') as passed,
    (SELECT COUNT(*) FROM validation_results WHERE status = 'FAIL') as failed,
    (SELECT COUNT(*) FROM validation_results WHERE status = 'WARN') as warnings,
    CASE 
        WHEN (SELECT COUNT(*) FROM validation_results WHERE status = 'FAIL') = 0 
        THEN 'SUCCESS' 
        ELSE 'FAILED' 
    END as overall_status;

-- Clean up
DROP FUNCTION IF EXISTS log_validation(TEXT, TEXT, TEXT);
DROP TABLE IF EXISTS validation_results;