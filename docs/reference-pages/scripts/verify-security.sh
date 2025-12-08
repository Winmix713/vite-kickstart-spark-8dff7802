#!/bin/bash

# Security Verification Script
# Checks for hardcoded credentials and verifies security configurations

echo "🔒 WinMix TipsterHub - Security Verification"
echo "============================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check 1: Frontend environment variables (should only contain public keys)
echo -e "\n📋 Check 1: Frontend Environment Variables"
if [ -f ".env" ]; then
    if grep -q "SUPABASE_SERVICE_ROLE_KEY\|DATABASE_URL\|POSTGRES_PASSWORD" .env; then
        echo -e "${RED}❌ FAIL: Found secret keys in frontend .env file${NC}"
        echo "   Frontend .env should only contain VITE_* public keys"
        exit 1
    else
        echo -e "${GREEN}✅ PASS: Frontend .env contains only public keys${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  WARN: No .env file found${NC}"
fi

# Check 2: Edge Functions config
echo -e "\n🔧 Check 2: Edge Functions JWT Verification"
if [ -f "supabase/config.toml" ]; then
    # Check if critical functions have JWT verification enabled
    protected_functions=("analyze-match" "submit-feedback" "patterns-detect" "patterns-team" "patterns-verify")
    all_protected=true
    
    for func in "${protected_functions[@]}"; do
        if grep -q "\[functions\.$func\]" supabase/config.toml; then
            if grep -A1 "\[functions\.$func\]" supabase/config.toml | grep -q "verify_jwt = false"; then
                echo -e "${RED}❌ FAIL: Function $func has JWT verification disabled${NC}"
                all_protected=false
            fi
        fi
    done
    
    if [ "$all_protected" = true ]; then
        echo -e "${GREEN}✅ PASS: Protected functions have JWT verification enabled${NC}"
    fi
else
    echo -e "${RED}❌ FAIL: supabase/config.toml not found${NC}"
    exit 1
fi

# Check 3: Hardcoded credentials in source code
echo -e "\n🔍 Check 3: Hardcoded Credentials Scan"
echo "   Scanning for database URLs, passwords, and service role keys..."

# Exclude documentation and test files from the scan
find src supabase/functions -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | grep -v test | grep -v __tests__ | while read file; do
    if grep -q "postgresql://.*@.*\|password.*=\s*['\"][^'\"]*['\"]\|eyJ.*service.*role" "$file"; then
        echo -e "${RED}❌ FAIL: Found potential hardcoded credentials in $file${NC}"
        grep -n "postgresql://.*@.*\|password.*=\s*['\"][^'\"]*['\"]\|eyJ.*service.*role" "$file"
        exit 1
    fi
done

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ PASS: No hardcoded credentials found in source files${NC}"
fi

# Check 4: Supabase client usage
echo -e "\n📱 Check 4: Frontend Supabase Client Configuration"
if [ -f "src/integrations/supabase/client.ts" ]; then
    if grep -q "SUPABASE_SERVICE_ROLE_KEY\|DATABASE_URL" src/integrations/supabase/client.ts; then
        echo -e "${RED}❌ FAIL: Frontend client uses service role key or database URL${NC}"
        exit 1
    else
        echo -e "${GREEN}✅ PASS: Frontend client uses only anon key${NC}"
    fi
else
    echo -e "${RED}❌ FAIL: Frontend Supabase client not found${NC}"
    exit 1
fi

# Check 5: .gitignore for sensitive files
echo -e "\n🚫 Check 5: .gitignore Configuration"
if [ -f ".gitignore" ]; then
    if grep -q "\.env" .gitignore; then
        echo -e "${GREEN}✅ PASS: .env is in .gitignore${NC}"
    else
        echo -e "${YELLOW}⚠️  WARN: .env not in .gitignore${NC}"
    fi
    
    if grep -q "\.env.local\|\.env.production" .gitignore; then
        echo -e "${GREEN}✅ PASS: Environment variants are ignored${NC}"
    else
        echo -e "${YELLOW}⚠️  WARN: Consider adding .env.local, .env.production to .gitignore${NC}"
    fi
else
    echo -e "${RED}❌ FAIL: No .gitignore file found${NC}"
    exit 1
fi

echo -e "\n🎉 Security Verification Complete!"
echo -e "\n📝 Next Steps:"
echo "   1. Set up Edge Functions secrets in Supabase Dashboard"
echo "   2. Deploy functions with: supabase functions deploy"
echo "   3. Test authentication flows"
echo "   4. Run: npm run build to verify everything works"

echo -e "\n📚 For detailed setup, see: docs/CONFIGURATION_REFERENCE.md#4-edge-functions-secrets"