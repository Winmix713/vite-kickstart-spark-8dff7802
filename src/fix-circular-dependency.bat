
@echo off
echo 🔍 Circular Dependency Fix Script
echo ==================================
echo.

REM Step 1: Verify and remove client.tsx if it exists
echo Step 1: Checking for client.tsx...
if exist "integrations\supabase\client.tsx" (
  echo ⚠️  Found client.tsx - DELETING NOW
  del /f "integrations\supabase\client.tsx"
  echo ✅ Deleted client.tsx
) else (
  echo ✅ client.tsx already deleted
)

REM Step 2: Verify correct file structure
echo.
echo Step 2: Verifying file structure...
echo Files in integrations\supabase\:
dir /b "integrations\supabase\*.ts" "integrations\supabase\*.tsx" 2>nul

REM Step 3: Clean all caches
echo.
echo Step 3: Cleaning build caches...

if exist "node_modules\.vite" (
  echo   Removing node_modules\.vite...
  rmdir /s /q "node_modules\.vite"
)

if exist "dist" (
  echo   Removing dist...
  rmdir /s /q "dist"
)

if exist ".next" (
  echo   Removing .next...
  rmdir /s /q ".next"
)

if exist "node_modules\.cache" (
  echo   Removing node_modules\.cache...
  rmdir /s /q "node_modules\.cache"
)

if exist ".cache" (
  echo   Removing .cache...
  rmdir /s /q ".cache"
)

echo ✅ All caches cleared

echo.
echo ==================================
echo ✅ Cleanup Complete!
echo.
echo Next steps:
echo 1. Start your dev server: npm run dev
echo 2. If errors persist, run: rmdir /s /q node_modules ^&^& npm install ^&^& npm run dev
echo.
pause
