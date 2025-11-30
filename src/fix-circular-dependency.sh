
#!/bin/bash

echo "🔍 Circular Dependency Fix Script"
echo "=================================="
echo ""

# Step 1: Verify and remove client.tsx if it exists
echo "Step 1: Checking for client.tsx..."
if [ -f "integrations/supabase/client.tsx" ]; then
  echo "⚠️  Found client.tsx - DELETING NOW"
  rm -f integrations/supabase/client.tsx
  echo "✅ Deleted client.tsx"
else
  echo "✅ client.tsx already deleted"
fi

# Step 2: Verify correct file structure
echo ""
echo "Step 2: Verifying file structure..."
echo "Files in integrations/supabase/:"
ls -la integrations/supabase/ | grep -E "\.(ts|tsx)$"

# Step 3: Clean all caches
echo ""
echo "Step 3: Cleaning build caches..."

if [ -d "node_modules/.vite" ]; then
  echo "  Removing node_modules/.vite..."
  rm -rf node_modules/.vite
fi

if [ -d "dist" ]; then
  echo "  Removing dist..."
  rm -rf dist
fi

if [ -d ".next" ]; then
  echo "  Removing .next..."
  rm -rf .next
fi

if [ -d "node_modules/.cache" ]; then
  echo "  Removing node_modules/.cache..."
  rm -rf node_modules/.cache
fi

if [ -d ".cache" ]; then
  echo "  Removing .cache..."
  rm -rf .cache
fi

echo "✅ All caches cleared"

# Step 4: Verify imports
echo ""
echo "Step 4: Checking for problematic imports..."
if grep -r "from ['\"]supabase['\"]" --include="*.ts" --include="*.tsx" . 2>/dev/null | grep -v node_modules | grep -v ".git"; then
  echo "⚠️  Found bare 'supabase' imports - these should use '@/integrations/supabase/client'"
else
  echo "✅ No bare 'supabase' imports found"
fi

echo ""
echo "=================================="
echo "✅ Cleanup Complete!"
echo ""
echo "Next steps:"
echo "1. Start your dev server: npm run dev"
echo "2. If errors persist, run: rm -rf node_modules && npm install && npm run dev"
echo ""
