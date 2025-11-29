#!/usr/bin/env node

/**
 * Simple test runner for auth utilities
 * This validates the basic structure and exports of the auth module
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read the auth.ts file and check for key exports
const authFilePath = join(__dirname, '../supabase/functions/_shared/auth.ts');
const authContent = readFileSync(authFilePath, 'utf8');

console.log('🔍 Validating auth utilities...\n');

// Check for required exports
const requiredExports = [
  'createServiceClient',
  'createUserClient', 
  'authenticateRequest',
  'requireRole',
  'requireAdmin',
  'requireAdminOrAnalyst',
  'requireAuthenticatedUser',
  'protectEndpoint',
  'logAuditAction',
  'createAuthErrorResponse',
  'handleCorsPreflight',
  'corsHeaders'
];

let missingExports = [];

requiredExports.forEach(exportName => {
  const exportRegex = new RegExp(`export\\s+(?:async\\s+)?(?:const|function)\\s+${exportName}`, 'i');
  if (!exportRegex.test(authContent)) {
    missingExports.push(exportName);
  }
});

if (missingExports.length > 0) {
  console.log('❌ Missing exports:');
  missingExports.forEach(exp => console.log(`   - ${exp}`));
  process.exit(1);
} else {
  console.log('✅ All required exports found');
}

// Check for key function implementations
const keyFunctions = [
  { name: 'authenticateRequest', pattern: /export async function authenticateRequest/ },
  { name: 'requireRole', pattern: /export function requireRole\(/ },
  { name: 'protectEndpoint', pattern: /export async function protectEndpoint/ },
  { name: 'logAuditAction', pattern: /export async function logAuditAction/ }
];

let missingFunctions = [];

keyFunctions.forEach(func => {
  if (!func.pattern.test(authContent)) {
    missingFunctions.push(func.name);
  }
});

if (missingFunctions.length > 0) {
  console.log('\n❌ Missing function implementations:');
  missingFunctions.forEach(func => console.log(`   - ${func}`));
  process.exit(1);
} else {
  console.log('✅ All key function implementations found');
}

// Check for error handling patterns
const errorHandlingPatterns = [
  { name: 'Auth error handling', pattern: /code: 'UNAUTHORIZED'/ },
  { name: 'Forbidden error handling', pattern: /code: 'FORBIDDEN'/ },
  { name: 'Role validation', pattern: /allowedRoles\.includes/ }
];

let missingPatterns = [];

errorHandlingPatterns.forEach(pattern => {
  if (!pattern.pattern.test(authContent)) {
    missingPatterns.push(pattern.name);
  }
});

if (missingPatterns.length > 0) {
  console.log('\n❌ Missing error handling patterns:');
  missingPatterns.forEach(pat => console.log(`   - ${pat}`));
  process.exit(1);
} else {
  console.log('✅ Error handling patterns found');
}

// Check for security best practices
const securityPatterns = [
  { name: 'Environment variable validation', pattern: /Deno\.env\.get/ },
  { name: 'JWT verification', pattern: /getUser\(\)/ },
  { name: 'Profile fetching', pattern: /user_profiles/ },
  { name: 'Audit logging', pattern: /admin_audit_log/ }
];

let missingSecurity = [];

securityPatterns.forEach(pattern => {
  if (!pattern.pattern.test(authContent)) {
    missingSecurity.push(pattern.name);
  }
});

if (missingSecurity.length > 0) {
  console.log('\n❌ Missing security patterns:');
  missingSecurity.forEach(pat => console.log(`   - ${pat}`));
  process.exit(1);
} else {
  console.log('✅ Security patterns found');
}

console.log('\n🎉 Auth utilities validation passed!');
console.log('\n📋 Summary:');
console.log(`   - ${requiredExports.length} exports verified`);
console.log(`   - ${keyFunctions.length} function implementations verified`);
console.log(`   - ${errorHandlingPatterns.length} error handling patterns verified`);
console.log(`   - ${securityPatterns.length} security patterns verified`);

console.log('\n🔧 Next steps:');
console.log('   1. Deploy Edge Functions to test runtime behavior');
console.log('   2. Test with real JWT tokens and user profiles');
console.log('   3. Verify audit logging in admin_audit_log table');
console.log('   4. Test role-based access control with different user roles');