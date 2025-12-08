#!/bin/bash

# Feature Flags Setup Script
# This script sets up feature flags for Phase 5-9 in Supabase Edge Functions

set -e

PROJECT_REF="wclutzbojatqtxwlvtab"

echo "🚀 Setting up Phase 5-9 Feature Flags"
echo "====================================="

# Default to false (disabled) for all phases
PHASE5_ENABLED=${PHASE5_ENABLED:-false}
PHASE6_ENABLED=${PHASE6_ENABLED:-false}
PHASE7_ENABLED=${PHASE7_ENABLED:-false}
PHASE8_ENABLED=${PHASE8_ENABLED:-false}
PHASE9_ENABLED=${PHASE9_ENABLED:-false}

echo "Setting Edge Function secrets..."
echo "Phase 5 (Pattern Detection): $PHASE5_ENABLED"
echo "Phase 6 (Model Evaluation): $PHASE6_ENABLED"
echo "Phase 7 (Cross-League): $PHASE7_ENABLED"
echo "Phase 8 (Monitoring): $PHASE8_ENABLED"
echo "Phase 9 (Collaborative): $PHASE9_ENABLED"
echo ""

# Check if supabase CLI is available
if ! command -v supabase &> /dev/null; then
    echo "❌ Error: supabase CLI not found"
    echo "Please install it: npm install -g supabase"
    exit 1
fi

# Set secrets
echo "🔧 Setting secrets..."
supabase secrets set PHASE5_ENABLED="$PHASE5_ENABLED" --project-ref "$PROJECT_REF"
supabase secrets set PHASE6_ENABLED="$PHASE6_ENABLED" --project-ref "$PROJECT_REF"
supabase secrets set PHASE7_ENABLED="$PHASE7_ENABLED" --project-ref "$PROJECT_REF"
supabase secrets set PHASE8_ENABLED="$PHASE8_ENABLED" --project-ref "$PROJECT_REF"
supabase secrets set PHASE9_ENABLED="$PHASE9_ENABLED" --project-ref "$PROJECT_REF"

echo ""
echo "✅ Feature flags set successfully!"
echo ""
echo "📋 Current secrets:"
supabase secrets list --project-ref "$PROJECT_REF" | grep PHASE

echo ""
echo "💡 To enable features locally, update your .env file:"
echo "VITE_FEATURE_PHASE5=$PHASE5_ENABLED"
echo "VITE_FEATURE_PHASE6=$PHASE6_ENABLED"
echo "VITE_FEATURE_PHASE7=$PHASE7_ENABLED"
echo "VITE_FEATURE_PHASE8=$PHASE8_ENABLED"
echo "VITE_FEATURE_PHASE9=$PHASE9_ENABLED"
echo ""
echo "🔄 To change flags:"
echo "PHASE5_ENABLED=true ./scripts/setup-feature-flags.sh"
echo "PHASE9_ENABLED=true ./scripts/setup-feature-flags.sh"