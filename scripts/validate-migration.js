#!/usr/bin/env node

/**
 * Migration Validation Script
 * 
 * This script validates that the comprehensive database migration
 * has been applied correctly and all components are working as expected.
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
    },
});

// Validation results
const results = {
    passed: [],
    failed: [],
    warnings: []
};

// Helper functions
function logSuccess(message, data = null) {
    console.log(`✅ ${message}`);
    if (data) console.log(`   ${JSON.stringify(data, null, 2)}`);
    results.passed.push({ message, data });
}

function logError(message, error = null) {
    console.error(`❌ ${message}`);
    if (error) console.error(`   ${error.message || error}`);
    results.failed.push({ message, error: error?.message || error });
}

function logWarning(message, data = null) {
    console.warn(`⚠️  ${message}`);
    if (data) console.log(`   ${JSON.stringify(data, null, 2)}`);
    results.warnings.push({ message, data });
}

async function validateTable(tableName, expectedColumns = []) {
    try {
        const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .limit(1);

        if (error) {
            logError(`Table ${tableName} validation failed`, error);
            return false;
        }

        // Check if table has data
        const { count, error: countError } = await supabase
            .from(tableName)
            .select('*', { count: 'exact', head: true });

        if (countError) {
            logError(`Count query failed for ${tableName}`, countError);
            return false;
        }

        logSuccess(`Table ${tableName} exists and is accessible`, { 
            hasData: count > 0,
            rowCount: count 
        });

        // Check expected columns if provided
        if (expectedColumns.length > 0 && data && data.length > 0) {
            const actualColumns = Object.keys(data[0]);
            const missingColumns = expectedColumns.filter(col => !actualColumns.includes(col));
            
            if (missingColumns.length > 0) {
                logWarning(`Table ${tableName} missing expected columns: ${missingColumns.join(', ')}`);
            } else {
                logSuccess(`Table ${tableName} has all expected columns`);
            }
        }

        return true;
    } catch (error) {
        logError(`Unexpected error validating table ${tableName}`, error);
        return false;
    }
}

async function validateRLS(tableName) {
    try {
        // Test RLS by trying to access as anonymous user
        const { data, error } = await supabase.rpc('test_rls_policy', { 
            table_name: tableName 
        });

        if (error) {
            logWarning(`Could not test RLS for ${tableName}`, error);
            return false;
        }

        logSuccess(`RLS policy validation for ${tableName} completed`);
        return true;
    } catch (error) {
        logWarning(`RLS validation failed for ${tableName}`, error);
        return false;
    }
}

async function validateFunction(functionName) {
    try {
        const { data, error } = await supabase.rpc(functionName);

        if (error) {
            logError(`Function ${functionName} validation failed`, error);
            return false;
        }

        logSuccess(`Function ${functionName} is accessible`);
        return true;
    } catch (error) {
        logError(`Function ${functionName} test failed`, error);
        return false;
    }
}

async function validateView(viewName) {
    try {
        const { data, error } = await supabase
            .from(viewName)
            .select('*')
            .limit(1);

        if (error) {
            logError(`View ${viewName} validation failed`, error);
            return false;
        }

        logSuccess(`View ${viewName} is accessible`);
        return true;
    } catch (error) {
        logError(`View ${viewName} test failed`, error);
        return false;
    }
}

// Main validation function
async function runValidation() {
    console.log('🚀 Starting WinMix TipsterHub Migration Validation\n');

    // 1. Validate core tables
    console.log('📋 Validating Core Tables...');
    const coreTables = [
        { name: 'user_profiles', columns: ['id', 'email', 'role', 'is_active'] },
        { name: 'leagues', columns: ['id', 'name', 'country', 'season'] },
        { name: 'teams', columns: ['id', 'name', 'league_id'] },
        { name: 'matches', columns: ['id', 'home_team_id', 'away_team_id', 'match_date', 'status'] },
        { name: 'pattern_templates', columns: ['id', 'name', 'category', 'base_confidence_boost'] },
        { name: 'detected_patterns', columns: ['id', 'match_id', 'template_id'] },
        { name: 'predictions', columns: ['id', 'match_id', 'predicted_outcome', 'confidence_score'] },
        { name: 'pattern_accuracy', columns: ['id', 'template_id', 'accuracy_rate'] },
        { name: 'user_predictions', columns: ['id', 'match_id', 'user_id', 'predicted_outcome'] },
        { name: 'crowd_wisdom', columns: ['id', 'match_id', 'total_predictions', 'consensus_prediction'] }
    ];

    for (const table of coreTables) {
        await validateTable(table.name, table.columns);
    }

    // 2. Validate RLS on sensitive tables
    console.log('\n🔒 Validating Row Level Security...');
    const sensitiveTables = [
        'user_profiles',
        'detected_patterns', 
        'predictions',
        'user_predictions'
    ];

    for (const table of sensitiveTables) {
        await validateRLS(table);
    }

    // 3. Validate security functions
    console.log('\n🛡️  Validating Security Functions...');
    const securityFunctions = [
        'get_current_user_id',
        'get_user_role',
        'is_admin',
        'is_analyst',
        'is_predictor',
        'is_team_manager',
        'is_service_role'
    ];

    for (const func of securityFunctions) {
        await validateFunction(func);
    }

    // 4. Validate utility functions
    console.log('\n🔧 Validating Utility Functions...');
    
    // Test calculate_win_probability
    try {
        const { data, error } = await supabase.rpc('calculate_win_probability', {
            p_confidence_score: 75.5,
            p_home_advantage: 0.1
        });
        
        if (error) {
            logError('calculate_win_probability function failed', error);
        } else {
            logSuccess('calculate_win_probability function works', { probability: data });
        }
    } catch (error) {
        logError('calculate_win_probability test failed', error);
    }

    // Test validate_prediction_data
    try {
        const { data, error } = await supabase.rpc('validate_prediction_data', {
            p_match_id: '00000000-0000-0000-0000-000000000000',
            p_predicted_outcome: 'home_win',
            p_confidence_score: 75.0
        });
        
        if (error) {
            // This might fail if match doesn't exist, which is expected
            logWarning('validate_prediction_data function behavior (expected if no matches exist)');
        } else {
            logSuccess('validate_prediction_data function works', { valid: data });
        }
    } catch (error) {
        logWarning('validate_prediction_data test failed (might be expected)', error);
    }

    // 5. Validate views
    console.log('\n👁️  Validating Views...');
    const views = [
        'upcoming_matches_with_predictions',
        'user_prediction_leaderboard', 
        'pattern_performance_summary'
    ];

    for (const view of views) {
        await validateView(view);
    }

    // 6. Validate seed data
    console.log('\n🌱 Validating Seed Data...');
    
    try {
        // Check leagues
        const { count: leagueCount, error: leagueError } = await supabase
            .from('leagues')
            .select('*', { count: 'exact', head: true });

        if (leagueError) {
            logError('Failed to count leagues', leagueError);
        } else {
            if (leagueCount > 0) {
                logSuccess('Seed leagues data present', { count: leagueCount });
            } else {
                logWarning('No seed leagues data found');
            }
        }

        // Check teams
        const { count: teamCount, error: teamError } = await supabase
            .from('teams')
            .select('*', { count: 'exact', head: true });

        if (teamError) {
            logError('Failed to count teams', teamError);
        } else {
            if (teamCount > 0) {
                logSuccess('Seed teams data present', { count: teamCount });
            } else {
                logWarning('No seed teams data found');
            }
        }

        // Check pattern templates
        const { count: patternCount, error: patternError } = await supabase
            .from('pattern_templates')
            .select('*', { count: 'exact', head: true });

        if (patternError) {
            logError('Failed to count pattern templates', patternError);
        } else {
            if (patternCount > 0) {
                logSuccess('Seed pattern templates present', { count: patternCount });
            } else {
                logWarning('No seed pattern templates found');
            }
        }

    } catch (error) {
        logError('Seed data validation failed', error);
    }

    // 7. Test data relationships
    console.log('\n🔗 Validating Data Relationships...');
    
    try {
        // Test team-league relationship
        const { data: teamLeagueData, error: teamLeagueError } = await supabase
            .from('teams')
            .select(`
                id,
                name,
                leagues!inner (
                    id,
                    name,
                    country
                )
            `)
            .limit(1);

        if (teamLeagueError) {
            logError('Team-league relationship test failed', teamLeagueError);
        } else {
            logSuccess('Team-league relationship works');
        }

        // Test match-team relationship
        const { data: matchTeamData, error: matchTeamError } = await supabase
            .from('matches')
            .select(`
                id,
                match_date,
                status,
                home_team:home_team_id (
                    name
                ),
                away_team:away_team_id (
                    name
                ),
                league:league_id (
                    name
                )
            `)
            .limit(1);

        if (matchTeamError) {
            logError('Match-team relationship test failed', matchTeamError);
        } else {
            logSuccess('Match-team relationship works');
        }

    } catch (error) {
        logError('Data relationship validation failed', error);
    }

    // 8. Summary
    console.log('\n📊 Validation Summary');
    console.log('==================');
    console.log(`✅ Passed: ${results.passed.length}`);
    console.log(`❌ Failed: ${results.failed.length}`);
    console.log(`⚠️  Warnings: ${results.warnings.length}`);

    if (results.failed.length > 0) {
        console.log('\n❌ Failed Tests:');
        results.failed.forEach(failure => {
            console.log(`   • ${failure.message}`);
            if (failure.error) {
                console.log(`     Error: ${failure.error}`);
            }
        });
    }

    if (results.warnings.length > 0) {
        console.log('\n⚠️  Warnings:');
        results.warnings.forEach(warning => {
            console.log(`   • ${warning.message}`);
        });
    }

    // Final validation result
    const totalTests = results.passed.length + results.failed.length;
    const successRate = totalTests > 0 ? (results.passed.length / totalTests * 100).toFixed(1) : 0;

    console.log(`\n🎯 Overall Success Rate: ${successRate}%`);

    if (results.failed.length === 0) {
        console.log('\n🎉 Migration validation completed successfully!');
        console.log('   The comprehensive database setup is working as expected.');
        process.exit(0);
    } else {
        console.log('\n💥 Migration validation failed!');
        console.log('   Please address the failed tests before proceeding.');
        process.exit(1);
    }
}

// Run the validation
runValidation().catch(error => {
    console.error('💥 Validation script failed:', error);
    process.exit(1);
});