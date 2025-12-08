#!/bin/bash

# JWT Configuration Verification Script
# Verifies that all Edge Functions have explicit JWT verification settings

set -e

echo "=================================================="
echo "JWT Configuration Verification"
echo "=================================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track results
ERRORS=0
WARNINGS=0

# Get project root
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

echo "Project root: $PROJECT_ROOT"
echo ""

# Check if config.toml exists
if [ ! -f "supabase/config.toml" ]; then
    echo -e "${RED}❌ ERROR: supabase/config.toml not found${NC}"
    exit 1
fi

# Get list of all functions (excluding _shared)
echo "📋 Checking Edge Functions..."
echo ""

FUNCTION_DIRS=($(ls -1 supabase/functions | grep -v "^_shared$" | sort))
FUNCTION_COUNT=${#FUNCTION_DIRS[@]}

echo "Found $FUNCTION_COUNT Edge Functions"
echo ""

# Get list of functions in config.toml
CONFIG_FUNCTIONS=($(grep "^\[functions\." supabase/config.toml | sed 's/\[functions\.//;s/\]//' | sort))
CONFIG_COUNT=${#CONFIG_FUNCTIONS[@]}

echo "Found $CONFIG_COUNT function configurations in config.toml"
echo ""

# Check if counts match
if [ $FUNCTION_COUNT -ne $CONFIG_COUNT ]; then
    echo -e "${RED}❌ ERROR: Function count mismatch!${NC}"
    echo "   Functions in directory: $FUNCTION_COUNT"
    echo "   Functions in config: $CONFIG_COUNT"
    ERRORS=$((ERRORS + 1))
fi

# Check each function directory has a config entry
echo "🔍 Verifying all functions are configured..."
echo ""

MISSING_FUNCTIONS=()
for func in "${FUNCTION_DIRS[@]}"; do
    if ! grep -q "^\[functions\.$func\]" supabase/config.toml; then
        MISSING_FUNCTIONS+=("$func")
        echo -e "${RED}❌ Missing config for: $func${NC}"
        ERRORS=$((ERRORS + 1))
    fi
done

if [ ${#MISSING_FUNCTIONS[@]} -eq 0 ]; then
    echo -e "${GREEN}✅ All functions have config entries${NC}"
else
    echo -e "${RED}❌ ${#MISSING_FUNCTIONS[@]} functions missing from config${NC}"
fi
echo ""

# Check each function has explicit verify_jwt setting
echo "🔐 Verifying JWT verification settings..."
echo ""

PUBLIC_FUNCTIONS=()
PROTECTED_FUNCTIONS=()
MISSING_JWT_CONFIG=()

for func in "${FUNCTION_DIRS[@]}"; do
    # Check if verify_jwt is explicitly set
    if grep -A 1 "^\[functions\.$func\]" supabase/config.toml | grep -q "verify_jwt"; then
        # Check if it's true or false
        if grep -A 1 "^\[functions\.$func\]" supabase/config.toml | grep -q "verify_jwt = false"; then
            PUBLIC_FUNCTIONS+=("$func")
        elif grep -A 1 "^\[functions\.$func\]" supabase/config.toml | grep -q "verify_jwt = true"; then
            PROTECTED_FUNCTIONS+=("$func")
        fi
    else
        MISSING_JWT_CONFIG+=("$func")
        echo -e "${RED}❌ Missing verify_jwt setting for: $func${NC}"
        ERRORS=$((ERRORS + 1))
    fi
done

if [ ${#MISSING_JWT_CONFIG[@]} -eq 0 ]; then
    echo -e "${GREEN}✅ All functions have explicit verify_jwt settings${NC}"
else
    echo -e "${RED}❌ ${#MISSING_JWT_CONFIG[@]} functions missing verify_jwt setting${NC}"
fi
echo ""

# Report summary
echo "=================================================="
echo "SUMMARY"
echo "=================================================="
echo ""
echo "📊 Function Statistics:"
echo "   Total Functions: $FUNCTION_COUNT"
echo "   Public (verify_jwt = false): ${#PUBLIC_FUNCTIONS[@]}"
echo "   Protected (verify_jwt = true): ${#PROTECTED_FUNCTIONS[@]}"
echo ""

if [ ${#PUBLIC_FUNCTIONS[@]} -gt 0 ]; then
    echo "🌐 Public Functions:"
    for func in "${PUBLIC_FUNCTIONS[@]}"; do
        echo "   - $func"
    done
    echo ""
fi

if [ ${#PUBLIC_FUNCTIONS[@]} -gt 1 ]; then
    echo -e "${YELLOW}⚠️  WARNING: Multiple public functions detected${NC}"
    echo "   Expected: Only 'get-predictions' should be public"
    WARNINGS=$((WARNINGS + 1))
    echo ""
fi

if [ ${#PUBLIC_FUNCTIONS[@]} -eq 1 ] && [ "${PUBLIC_FUNCTIONS[0]}" != "get-predictions" ]; then
    echo -e "${YELLOW}⚠️  WARNING: Unexpected public function${NC}"
    echo "   Expected: get-predictions"
    echo "   Found: ${PUBLIC_FUNCTIONS[0]}"
    WARNINGS=$((WARNINGS + 1))
    echo ""
fi

# Final result
echo "=================================================="
if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✅ JWT CONFIGURATION VERIFICATION PASSED${NC}"
    echo ""
    echo "All Edge Functions are properly configured with explicit JWT verification settings."
    echo "Security posture: ✅ EXCELLENT"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠️  JWT CONFIGURATION VERIFICATION PASSED WITH WARNINGS${NC}"
    echo ""
    echo "Warnings: $WARNINGS"
    echo "Please review the warnings above."
    exit 0
else
    echo -e "${RED}❌ JWT CONFIGURATION VERIFICATION FAILED${NC}"
    echo ""
    echo "Errors: $ERRORS"
    echo "Warnings: $WARNINGS"
    echo ""
    echo "Please fix the errors above before deploying."
    exit 1
fi
