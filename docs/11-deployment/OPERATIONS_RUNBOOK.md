---
title: "Operations Runbook"
description: "Complete guide for build, run, deploy, and troubleshoot operations"
category: "11-deployment"
language: "en"
version: "1.0.0"
last_updated: "2025-11-27"
status: "active"
tags: ["deployment", "operations", "devops", "troubleshooting", "runbook"]
---

# Operations Runbook
**WinMix TipsterHub – Build, Run, Deploy, Troubleshoot**

## Table of Contents
1. [Local Development](#1-local-development)
2. [Building & Testing](#2-building--testing)
3. [Database Operations](#3-database-operations)
4. [Edge Functions Management](#4-edge-functions-management)
5. [Deployment](#5-deployment)
6. [Monitoring & Observability](#6-monitoring--observability)
7. [Troubleshooting](#7-troubleshooting)

## 1. Local Development

### 1.1 Initial Setup

**Prerequisites:**
- Node.js 18+ (`node --version`)
- npm 8+ or bun 1+ (`npm --version`)
- Supabase CLI (optional): `npm install -g supabase`
- Git (`git --version`)

**Clone Repository:**
```bash
git clone <repository-url>
cd winmix-tipsterhub
```

**Install Dependencies:**
```bash
npm ci  # Clean install (recommended)
```

**Configure Environment:**
```bash
cp .env.example .env
# Edit .env with your Supabase credentials
```

**Required `.env` values:**
```bash
VITE_SUPABASE_PROJECT_ID="wclutzbojatqtxwlvtab"
VITE_SUPABASE_URL="https://wclutzbojatqtxwlvtab.supabase.co"
VITE_SUPABASE_ANON_KEY="<your_anon_key>"
```

### 1.2 Start Development Server

```bash
npm run dev
```

Access at: `http://localhost:5173`

**Common Ports:**
- Frontend (Vite): `5173`
- Supabase Local API: `54321`
- Postgres: `54322`

## 2. Building & Testing

### 2.1 Linting
```bash
npm run lint
npx eslint . --fix  # Auto-fix
```

### 2.2 Type Checking
```bash
npx tsc --noEmit
```

### 2.3 Building
```bash
npm run build      # Production
npm run build:dev  # Development
npm run preview    # Preview build locally
```

### 2.4 Testing
```bash
npm test                    # All tests
npm test -- --watch         # Watch mode
npm test -- --coverage      # With coverage
npm run test:security       # Security tests
```

## 3. Database Operations

### 3.1 Migrations
```bash
supabase migration list --project-ref wclutzbojatqtxwlvtab
supabase db push --project-ref wclutzbojatqtxwlvtab
supabase migration new add_new_feature
```

### 3.2 Backup & Restore
```bash
supabase db dump --project-ref wclutzbojatqtxwlvtab > backup.sql
```

## 4. Edge Functions Management

### 4.1 List Functions
```bash
supabase functions list --project-ref wclutzbojatqtxwlvtab
```

### 4.2 Local Testing
```bash
supabase functions serve <function-name> --no-verify-jwt
```

### 4.3 Deploying
```bash
supabase functions deploy --project-ref wclutzbojatqtxwlvtab
supabase functions deploy <function-name> --project-ref wclutzbojatqtxwlvtab
```

### 4.4 Managing Secrets
```bash
supabase secrets list --project-ref wclutzbojatqtxwlvtab
supabase secrets set API_KEY=value --project-ref wclutzbojatqtxwlvtab
```

### 4.5 Viewing Logs
```bash
supabase functions logs <function-name> --project-ref wclutzbojatqtxwlvtab
```

## 5. Deployment

### 5.1 Pre-Deployment Checklist

**Code Quality:**
- [ ] `npm run lint` passes
- [ ] `npm run build` succeeds
- [ ] `npx tsc --noEmit` passes
- [ ] All tests pass
- [ ] Code reviewed

**Configuration:**
- [ ] `.env` updated with production values
- [ ] Supabase secrets configured
- [ ] JWT verification enabled
- [ ] CORS configured
- [ ] RLS policies enabled

**Security:**
- [ ] `./scripts/verify-jwt-config.sh` passes
- [ ] No hardcoded secrets
- [ ] All sensitive endpoints protected

## 6. Monitoring & Observability

### Key Metrics
- Response times
- Error rates
- Database connections
- Edge function invocations

### Log Locations
- Frontend: Browser console
- Edge Functions: Supabase Dashboard > Functions > Logs
- Database: Supabase Dashboard > Logs

## 7. Troubleshooting

### Common Issues

**Build fails:**
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

**Edge function 500 error:**
```bash
supabase functions logs <function-name> --project-ref wclutzbojatqtxwlvtab
```

**Database connection issues:**
- Check connection pooling settings
- Verify RLS policies
- Check secrets configuration

## Related Documentation

- [Testing Guide](../10-testing/TESTING_GUIDE.md)
- [Security Overview](../07-security/SECURITY_OVERVIEW.md)
- [Development Guide](../12-development/README.md)
