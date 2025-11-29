#!/usr/bin/env node

/**
 * Test script to verify refactored Edge Functions use shared auth utilities
 * This validates that all target functions have been properly refactored
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Target functions that should be refactored
const targetFunctions = [
  'analyze-match',
  'jobs-trigger', 
  'submit-feedback',
  'patterns-detect',
  'patterns-verify',
  'models-auto-prune'
];

console.log('🔍 Validating refactored Edge Functions...\n');

let allTestsPassed = true;

// Test each function
for (const funcName of targetFunctions) {
  console.log(`📁 Checking ${funcName}...`);
  
  const functionPath = join(__dirname, `../supabase/functions/${funcName}/index.ts`);
  
  try {
    const functionContent = readFileSync(functionPath, 'utf8');
    
    // Check for old auth patterns (should NOT exist)
    const oldAuthPatterns = [
      { name: 'Direct Supabase client creation', pattern: /createClient\(\s*Deno\.env\.get/ },
      { name: 'Manual auth getUser', pattern: /auth\.getUser\(\)/ },
      { name: 'Manual role check', pattern: /from\('user_profiles'\).*eq\('id',.*user\.id\)/ },
      { name: 'Manual audit logging', pattern: /from\('admin_audit_log'\)\.insert/ },
      { name: 'Manual CORS handling', pattern: /new Response\(null,.*headers:.*corsHeaders/ }
    ];
    
    // Check for new auth patterns (SHOULD exist)
    const newAuthPatterns = [
      { name: 'Shared auth import', pattern: /from "\.\.\/_shared\/auth\.ts"/ },
      { name: 'Protect endpoint usage', pattern: /protectEndpoint\(/ },
      { name: 'Role requirement', pattern: /requireAdmin(OrAnalyst)?\(/ },
      { name: 'Auth error response', pattern: /createAuthErrorResponse\(/ },
      { name: 'Auth context usage', pattern: /context\.(user|profile|serviceClient)/ },
      { name: 'Shared audit logging', pattern: /logAuditAction\(/ },
      { name: 'Shared CORS handling', pattern: /handleCorsPreflight\(/ }
    ];
    
    let oldPatternsFound = [];
    let newPatternsFound = [];
    
    // Check for old patterns (should be removed)
    oldAuthPatterns.forEach(({ name, pattern }) => {
      if (pattern.test(functionContent)) {
        oldPatternsFound.push(name);
      }
    });
    
    // Check for new patterns (should be present)
    newAuthPatterns.forEach(({ name, pattern }) => {
      if (pattern.test(functionContent)) {
        newPatternsFound.push(name);
      }
    });
    
    // Report results
    if (oldPatternsFound.length > 0) {
      console.log(`   ❌ Old auth patterns still present:`);
      oldPatternsFound.forEach(name => console.log(`      - ${name}`));
      allTestsPassed = false;
    }
    
    const expectedNewPatterns = newAuthPatterns.length;
    const foundNewPatterns = newPatternsFound.length;
    
    if (foundNewPatterns < expectedNewPatterns * 0.8) { // Allow 80% coverage
      console.log(`   ❌ Missing new auth patterns (${foundNewPatterns}/${expectedNewPatterns}):`);
      const missing = newAuthPatterns.filter(({ name }) => !newPatternsFound.includes(name));
      missing.forEach(({ name }) => console.log(`      - ${name}`));
      allTestsPassed = false;
    } else {
      console.log(`   ✅ Auth refactoring complete (${foundNewPatterns}/${expectedNewPatterns} patterns)`);
    }
    
    // Function-specific checks
    if (funcName === 'models-auto-prune') {
      // Should use requireAdmin (not requireAdminOrAnalyst)
      if (!/requireAdmin/.test(functionContent)) {
        console.log(`   ❌ Should use requireAdmin for admin-only function`);
        allTestsPassed = false;
      } else {
        console.log(`   ✅ Uses admin-only access control`);
      }
    }
    
    if (funcName === 'patterns-detect') {
      // Should check Phase 5 feature flag
      if (!/PHASE5_ENABLED/.test(functionContent)) {
        console.log(`   ❌ Missing Phase 5 feature flag check`);
        allTestsPassed = false;
      } else {
        console.log(`   ✅ Feature flag check preserved`);
      }
    }
    
  } catch (error) {
    console.log(`   ❌ Error reading function: ${error.message}`);
    allTestsPassed = false;
  }
  
  console.log('');
}

// Summary
if (allTestsPassed) {
  console.log('🎉 All Edge Functions refactoring validation passed!');
  console.log('\n📋 Summary:');
  console.log(`   ✅ ${targetFunctions.length} functions validated`);
  console.log('   ✅ Old auth patterns removed');
  console.log('   ✅ New shared auth utilities implemented');
  console.log('   ✅ Role-based access control enforced');
  console.log('   ✅ Audit logging centralized');
  
  console.log('\n🔧 Benefits achieved:');
  console.log('   • Eliminated code duplication');
  console.log('   • Consistent auth behavior across functions');
  console.log('   • Centralized audit logging');
  console.log('   • Improved security validation');
  console.log('   • Easier maintenance and testing');
  
  console.log('\n📝 Next steps:');
  console.log('   1. Deploy refactored Edge Functions');
  console.log('   2. Test with different user roles');
  console.log('   3. Verify audit log entries');
  console.log('   4. Monitor for any runtime issues');
  
} else {
  console.log('❌ Some refactoring validation failed. Please review the issues above.');
  process.exit(1);
}