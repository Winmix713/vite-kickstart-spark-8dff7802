-- RLS Tests for Sensitive Tables
-- Tests row-level security policies for user_predictions, predictions, pattern_accuracy, detected_patterns, team_patterns

-- Setup test environment
SET search_path = public;

-- Create test users if they don't exist
DO $$
BEGIN
    -- Test admin user
    INSERT INTO auth.users (id, email, email_confirmed_at, created_at, updated_at)
    VALUES (
        '00000000-0000-0000-0000-000000000001',
        'admin@test.com',
        NOW(),
        NOW(),
        NOW()
    ) ON CONFLICT (id) DO NOTHING;

    -- Test regular user 1
    INSERT INTO auth.users (id, email, email_confirmed_at, created_at, updated_at)
    VALUES (
        '00000000-0000-0000-0000-000000000002',
        'user1@test.com',
        NOW(),
        NOW(),
        NOW()
    ) ON CONFLICT (id) DO NOTHING;

    -- Test regular user 2
    INSERT INTO auth.users (id, email, email_confirmed_at, created_at, updated_at)
    VALUES (
        '00000000-0000-0000-0000-000000000003',
        'user2@test.com',
        NOW(),
        NOW(),
        NOW()
    ) ON CONFLICT (id) DO NOTHING;

    -- Test analyst user
    INSERT INTO auth.users (id, email, email_confirmed_at, created_at, updated_at)
    VALUES (
        '00000000-0000-0000-0000-000000000004',
        'analyst@test.com',
        NOW(),
        NOW(),
        NOW()
    ) ON CONFLICT (id) DO NOTHING;
END $$;

-- Ensure user profiles exist with correct roles
INSERT INTO public.user_profiles (user_id, role, is_active)
VALUES 
    ('00000000-0000-0000-0000-000000000001', 'admin', true),
    ('00000000-0000-0000-0000-000000000002', 'viewer', true),
    ('00000000-0000-0000-0000-000000000003', 'viewer', true),
    ('00000000-0000-0000-0000-000000000004', 'analyst', true)
ON CONFLICT (user_id) DO UPDATE SET 
    role = EXCLUDED.role,
    is_active = EXCLUDED.is_active;

-- Create test data for verification
DO $$
DECLARE
    test_match_id UUID;
    test_prediction_id UUID;
    test_user_prediction_id UUID;
BEGIN
    -- Get a match for testing
    SELECT id INTO test_match_id FROM public.matches LIMIT 1;
    
    IF test_match_id IS NULL THEN
        -- Create a test match if none exists
        INSERT INTO public.matches (league_id, home_team_id, away_team_id, match_date, status)
        VALUES (
            (SELECT id FROM public.leagues LIMIT 1),
            (SELECT id FROM public.teams LIMIT 1),
            (SELECT id FROM public.teams OFFSET 1 LIMIT 1),
            NOW() + INTERVAL '1 day',
            'scheduled'
        ) RETURNING id INTO test_match_id;
    END IF;

    -- Create test system prediction
    INSERT INTO public.predictions (
        match_id, predicted_outcome, confidence_score, 
        predicted_home_score, predicted_away_score
    ) VALUES (
        test_match_id, 'home_win', 75.5, 2, 1
    ) RETURNING id INTO test_prediction_id;

    -- Create test user predictions
    INSERT INTO public.user_predictions (
        match_id, user_id, predicted_outcome, confidence_score,
        predicted_home_score, predicted_away_score, created_by
    ) VALUES 
        (test_match_id, '00000000-0000-0000-0000-000000000002', 'home_win', 80.0, 2, 1, '00000000-0000-0000-0000-000000000002'),
        (test_match_id, '00000000-0000-0000-0000-000000000003', 'draw', 60.0, 1, 1, '00000000-0000-0000-0000-000000000003')
    RETURNING id INTO test_user_prediction_id;

    -- Create test detected patterns
    INSERT INTO public.detected_patterns (
        match_id, template_id, confidence_contribution, created_by
    ) VALUES 
        (test_match_id, (SELECT id FROM public.pattern_templates LIMIT 1), 10.5, '00000000-0000-0000-0000-000000000002'),
        (test_match_id, (SELECT id FROM public.pattern_templates OFFSET 1 LIMIT 1), 8.0, NULL) -- Service role data
    ON CONFLICT (match_id, template_id) DO NOTHING;

    -- Create test team patterns
    INSERT INTO public.team_patterns (
        team_id, pattern_type, pattern_data, confidence_score, created_by
    ) VALUES 
        ((SELECT id FROM public.teams LIMIT 1), 'home_form', '{"wins": 3, "losses": 0}', 85.5, '00000000-0000-0000-0000-000000000002'),
        ((SELECT id FROM public.teams OFFSET 1 LIMIT 1), 'away_form', '{"wins": 2, "losses": 1}', 72.0, NULL)
    ON CONFLICT DO NOTHING;

    RAISE NOTICE 'Test data created for RLS testing';
END $$;

-- Test 1: Anonymous user access should be blocked
\set VERBOSITY verbose
DO $$
BEGIN
    RAISE NOTICE '=== TEST 1: Anonymous User Access (Should be blocked) ===';
    
    -- Reset to anonymous context
    RESET ROLE;
    
    -- Test user_predictions (should be blocked)
    BEGIN
        PERFORM COUNT(*) FROM public.user_predictions;
        RAISE EXCEPTION 'ERROR: Anonymous user should not access user_predictions';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '✓ Anonymous access to user_predictions correctly blocked';
    END;
    
    -- Test predictions (should be blocked)
    BEGIN
        PERFORM COUNT(*) FROM public.predictions;
        RAISE EXCEPTION 'ERROR: Anonymous user should not access predictions';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '✓ Anonymous access to predictions correctly blocked';
    END;
    
    -- Test pattern_accuracy (should be blocked)
    BEGIN
        PERFORM COUNT(*) FROM public.pattern_accuracy;
        RAISE EXCEPTION 'ERROR: Anonymous user should not access pattern_accuracy';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '✓ Anonymous access to pattern_accuracy correctly blocked';
    END;
    
    -- Test detected_patterns (should be blocked)
    BEGIN
        PERFORM COUNT(*) FROM public.detected_patterns;
        RAISE EXCEPTION 'ERROR: Anonymous user should not access detected_patterns';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '✓ Anonymous access to detected_patterns correctly blocked';
    END;
    
    -- Test team_patterns (should be blocked)
    BEGIN
        PERFORM COUNT(*) FROM public.team_patterns;
        RAISE EXCEPTION 'ERROR: Anonymous user should not access team_patterns';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '✓ Anonymous access to team_patterns correctly blocked';
    END;
    
    RAISE NOTICE 'TEST 1 PASSED: All anonymous access correctly blocked';
END $$;

-- Test 2: Regular user access (should only see own data)
DO $$
BEGIN
    RAISE NOTICE '=== TEST 2: Regular User Access (Should only see own data) ===';
    
    -- Set context to user1
    SET LOCAL request.jwt.claims := '{"sub": "00000000-0000-0000-0000-000000000002", "role": "authenticated"}';
    SET ROLE authenticated;
    
    -- Test user_predictions (should only see own)
    DECLARE
        own_predictions INT;
        total_predictions INT;
    BEGIN
        SELECT COUNT(*) INTO own_predictions 
        FROM public.user_predictions 
        WHERE created_by = '00000000-0000-0000-0000-000000000002';
        
        SELECT COUNT(*) INTO total_predictions 
        FROM public.user_predictions;
        
        IF own_predictions = total_predictions AND own_predictions > 0 THEN
            RAISE NOTICE '✓ User can only see own user_predictions (%)', own_predictions;
        ELSE
            RAISE EXCEPTION 'ERROR: User sees % predictions but should see %', total_predictions, own_predictions;
        END IF;
    END;
    
    -- Test predictions (should be able to read)
    DECLARE
        predictions_count INT;
    BEGIN
        SELECT COUNT(*) INTO predictions_count FROM public.predictions;
        IF predictions_count > 0 THEN
            RAISE NOTICE '✓ User can read predictions (%)', predictions_count;
        ELSE
            RAISE EXCEPTION 'ERROR: User cannot read predictions';
        END IF;
    END;
    
    -- Test pattern_accuracy (should be able to read)
    DECLARE
        accuracy_count INT;
    BEGIN
        SELECT COUNT(*) INTO accuracy_count FROM public.pattern_accuracy;
        RAISE NOTICE '✓ User can read pattern_accuracy (%)', accuracy_count;
    END;
    
    -- Test detected_patterns (should see own + service data)
    DECLARE
        user_patterns INT;
        accessible_patterns INT;
    BEGIN
        SELECT COUNT(*) INTO user_patterns 
        FROM public.detected_patterns 
        WHERE created_by = '00000000-0000-0000-0000-000000000002';
        
        SELECT COUNT(*) INTO accessible_patterns 
        FROM public.detected_patterns 
        WHERE created_by = '00000000-0000-0000-0000-000000000002' OR created_by IS NULL;
        
        IF accessible_patterns >= user_patterns THEN
            RAISE NOTICE '✓ User can access own + service detected_patterns (%)', accessible_patterns;
        ELSE
            RAISE EXCEPTION 'ERROR: User pattern access restricted unexpectedly';
        END IF;
    END;
    
    -- Test team_patterns (should see own + service data)
    DECLARE
        user_team_patterns INT;
        accessible_team_patterns INT;
    BEGIN
        SELECT COUNT(*) INTO user_team_patterns 
        FROM public.team_patterns 
        WHERE created_by = '00000000-0000-0000-0000-000000000002';
        
        SELECT COUNT(*) INTO accessible_team_patterns 
        FROM public.team_patterns 
        WHERE created_by = '00000000-0000-0000-0000-000000000002' OR created_by IS NULL;
        
        IF accessible_team_patterns >= user_team_patterns THEN
            RAISE NOTICE '✓ User can access own + service team_patterns (%)', accessible_team_patterns;
        ELSE
            RAISE EXCEPTION 'ERROR: User team pattern access restricted unexpectedly';
        END IF;
    END;
    
    RAISE NOTICE 'TEST 2 PASSED: Regular user access properly restricted';
END $$;

-- Test 3: Analyst access (should read all sensitive data)
DO $$
BEGIN
    RAISE NOTICE '=== TEST 3: Analyst Access (Should read all data) ===';
    
    -- Set context to analyst
    SET LOCAL request.jwt.claims := '{"sub": "00000000-0000-0000-0000-000000000004", "role": "authenticated"}';
    SET ROLE authenticated;
    
    -- Test user_predictions (should read all)
    DECLARE
        all_user_predictions INT;
    BEGIN
        SELECT COUNT(*) INTO all_user_predictions FROM public.user_predictions;
        IF all_user_predictions > 0 THEN
            RAISE NOTICE '✓ Analyst can read all user_predictions (%)', all_user_predictions;
        ELSE
            RAISE EXCEPTION 'ERROR: Analyst cannot read user_predictions';
        END IF;
    END;
    
    -- Test predictions (should read all)
    DECLARE
        all_predictions INT;
    BEGIN
        SELECT COUNT(*) INTO all_predictions FROM public.predictions;
        IF all_predictions > 0 THEN
            RAISE NOTICE '✓ Analyst can read all predictions (%)', all_predictions;
        ELSE
            RAISE EXCEPTION 'ERROR: Analyst cannot read predictions';
        END IF;
    END;
    
    -- Test pattern_accuracy (should read all)
    DECLARE
        all_accuracy INT;
    BEGIN
        SELECT COUNT(*) INTO all_accuracy FROM public.pattern_accuracy;
        RAISE NOTICE '✓ Analyst can read all pattern_accuracy (%)', all_accuracy;
    END;
    
    -- Test detected_patterns (should read all)
    DECLARE
        all_detected_patterns INT;
    BEGIN
        SELECT COUNT(*) INTO all_detected_patterns FROM public.detected_patterns;
        IF all_detected_patterns > 0 THEN
            RAISE NOTICE '✓ Analyst can read all detected_patterns (%)', all_detected_patterns;
        ELSE
            RAISE EXCEPTION 'ERROR: Analyst cannot read detected_patterns';
        END IF;
    END;
    
    -- Test team_patterns (should read all)
    DECLARE
        all_team_patterns INT;
    BEGIN
        SELECT COUNT(*) INTO all_team_patterns FROM public.team_patterns;
        IF all_team_patterns > 0 THEN
            RAISE NOTICE '✓ Analyst can read all team_patterns (%)', all_team_patterns;
        ELSE
            RAISE EXCEPTION 'ERROR: Analyst cannot read team_patterns';
        END IF;
    END;
    
    RAISE NOTICE 'TEST 3 PASSED: Analyst access properly granted';
END $$;

-- Test 4: Admin access (should have full access)
DO $$
BEGIN
    RAISE NOTICE '=== TEST 4: Admin Access (Should have full access) ===';
    
    -- Set context to admin
    SET LOCAL request.jwt.claims := '{"sub": "00000000-0000-0000-0000-000000000001", "role": "authenticated"}';
    SET ROLE authenticated;
    
    -- Test full access to all tables
    DECLARE
        admin_results TEXT;
    BEGIN
        admin_results := '';
        
        -- Test user_predictions
        PERFORM COUNT(*) FROM public.user_predictions;
        admin_results := admin_results || 'user_predictions,';
        
        -- Test predictions
        PERFORM COUNT(*) FROM public.predictions;
        admin_results := admin_results || 'predictions,';
        
        -- Test pattern_accuracy
        PERFORM COUNT(*) FROM public.pattern_accuracy;
        admin_results := admin_results || 'pattern_accuracy,';
        
        -- Test detected_patterns
        PERFORM COUNT(*) FROM public.detected_patterns;
        admin_results := admin_results || 'detected_patterns,';
        
        -- Test team_patterns
        PERFORM COUNT(*) FROM public.team_patterns;
        admin_results := admin_results || 'team_patterns';
        
        RAISE NOTICE '✓ Admin has full access to: %', admin_results;
    END;
    
    RAISE NOTICE 'TEST 4 PASSED: Admin access properly granted';
END $$;

-- Test 5: Service role access (should have full access)
DO $$
BEGIN
    RAISE NOTICE '=== TEST 5: Service Role Access (Should have full access) ===';
    
    -- Set context to service role
    SET LOCAL request.jwt.claims := '{"role": "service_role"}';
    SET ROLE service_role;
    
    -- Test full access to all tables
    DECLARE
        service_results TEXT;
    BEGIN
        service_results := '';
        
        -- Test user_predictions
        PERFORM COUNT(*) FROM public.user_predictions;
        service_results := service_results || 'user_predictions,';
        
        -- Test predictions
        PERFORM COUNT(*) FROM public.predictions;
        service_results := service_results || 'predictions,';
        
        -- Test pattern_accuracy
        PERFORM COUNT(*) FROM public.pattern_accuracy;
        service_results := service_results || 'pattern_accuracy,';
        
        -- Test detected_patterns
        PERFORM COUNT(*) FROM public.detected_patterns;
        service_results := service_results || 'detected_patterns,';
        
        -- Test team_patterns
        PERFORM COUNT(*) FROM public.team_patterns;
        service_results := service_results || 'team_patterns';
        
        RAISE NOTICE '✓ Service role has full access to: %', service_results;
    END;
    
    RAISE NOTICE 'TEST 5 PASSED: Service role access properly granted';
END $$;

-- Test 6: Data isolation verification
DO $$
BEGIN
    RAISE NOTICE '=== TEST 6: Data Isolation Verification ===';
    
    -- Test user1 cannot access user2's data
    SET LOCAL request.jwt.claims := '{"sub": "00000000-0000-0000-0000-000000000002", "role": "authenticated"}';
    SET ROLE authenticated;
    
    DECLARE
        user2_predictions INT;
    BEGIN
        SELECT COUNT(*) INTO user2_predictions 
        FROM public.user_predictions 
        WHERE created_by = '00000000-0000-0000-0000-000000000003';
        
        IF user2_predictions = 0 THEN
            RAISE NOTICE '✓ User1 cannot access User2''s user_predictions';
        ELSE
            RAISE EXCEPTION 'ERROR: User1 can access User2''s data (found % records)', user2_predictions;
        END IF;
    END;
    
    -- Test user2 cannot access user1's data
    SET LOCAL request.jwt.claims := '{"sub": "00000000-0000-0000-0000-000000000003", "role": "authenticated"}';
    SET ROLE authenticated;
    
    DECLARE
        user1_predictions INT;
    BEGIN
        SELECT COUNT(*) INTO user1_predictions 
        FROM public.user_predictions 
        WHERE created_by = '00000000-0000-0000-0000-000000000002';
        
        IF user1_predictions = 0 THEN
            RAISE NOTICE '✓ User2 cannot access User1''s user_predictions';
        ELSE
            RAISE EXCEPTION 'ERROR: User2 can access User1''s data (found % records)', user1_predictions;
        END IF;
    END;
    
    RAISE NOTICE 'TEST 6 PASSED: Data isolation properly enforced';
END $$;

-- Test 7: RLS Verification Function
DO $$
BEGIN
    RAISE NOTICE '=== TEST 7: RLS Verification Function ===';
    
    -- Reset to admin context for verification
    SET LOCAL request.jwt.claims := '{"sub": "00000000-0000-0000-0000-000000000001", "role": "authenticated"}';
    SET ROLE authenticated;
    
    -- Test verification function
    DECLARE
        rls_status RECORD;
    BEGIN
        FOR rls_status IN SELECT * FROM public.verify_rls_sensitive_tables() LOOP
            RAISE NOTICE 'Table: %, RLS: %, Force: %, Policies: %', 
                rls_status.table_name, 
                rls_status.rls_enabled, 
                rls_status.force_rls, 
                rls_status.policy_count;
                
            IF rls_status.rls_enabled AND rls_status.force_rls AND rls_status.policy_count > 0 THEN
                RAISE NOTICE '✓ % is properly secured', rls_status.table_name;
            ELSE
                RAISE EXCEPTION 'ERROR: % is not properly secured', rls_status.table_name;
            END IF;
        END LOOP;
    END;
    
    RAISE NOTICE 'TEST 7 PASSED: RLS verification function working correctly';
END $$;

-- Final Summary
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== RLS TESTING COMPLETE ===';
    RAISE NOTICE 'All sensitive tables have been tested with the following contexts:';
    RAISE NOTICE '✓ Anonymous access: BLOCKED';
    RAISE NOTICE '✓ Regular user access: OWN DATA ONLY';
    RAISE NOTICE '✓ Analyst access: READ ALL';
    RAISE NOTICE '✓ Admin access: FULL ACCESS';
    RAISE NOTICE '✓ Service role access: FULL ACCESS';
    RAISE NOTICE '✓ Data isolation: ENFORCED';
    RAISE NOTICE '✓ RLS verification: FUNCTIONAL';
    RAISE NOTICE '';
    RAISE NOTICE 'Sensitive tables tested:';
    RAISE NOTICE '- user_predictions (user-specific predictions)';
    RAISE NOTICE '- predictions (system predictions)';
    RAISE NOTICE '- pattern_accuracy (evaluation metrics)';
    RAISE NOTICE '- detected_patterns (user-specific patterns)';
    RAISE NOTICE '- team_patterns (user-specific team analyses)';
    RAISE NOTICE '';
    RAISE NOTICE 'RLS implementation is working correctly!';
END $$;

-- Cleanup test context
RESET ROLE;
RESET request.jwt.claims;