---
title: "Authentication & Authorization Guide"
description: "Complete guide for authentication and authorization in WinMix TipsterHub"
category: "07-security"
language: "en"
version: "1.0.0"
last_updated: "2025-11-27"
status: "active"
tags: ["security", "authentication", "authorization", "supabase", "rbac"]
---

# Authentication & Authorization Guide

This document provides detailed information about the authentication and authorization system implemented in WinMix TipsterHub.

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Setup Guide](#setup-guide)
4. [User Roles](#user-roles)
5. [Protected Routes](#protected-routes)
6. [API Integration](#api-integration)
7. [Testing](#testing)
8. [Security Best Practices](#security-best-practices)

## Overview

WinMix TipsterHub uses **Supabase Authentication** to provide secure user authentication and role-based access control (RBAC). The system supports:

- ✅ Email/password authentication
- ✅ Automatic session management with token refresh
- ✅ Role-based access control (Admin, Analyst, User)
- ✅ Protected routes with AuthGate component
- ✅ Public demo access for read-only views
- ✅ OAuth hooks for future integration (Google, GitHub, etc.)

## Architecture

### Components

```
src/
├── providers/
│   └── AuthProvider.tsx          # Central auth state management
├── hooks/
│   └── useAuth.tsx               # Hook for accessing auth context
├── components/
│   └── AuthGate.tsx              # Route protection component
├── pages/Auth/
│   ├── Login.tsx                 # Sign-in page
│   └── Signup.tsx                # Registration page
└── integrations/supabase/
    └── client.ts                 # Supabase client with auth config
```

### Database Schema

**Table: `user_profiles`**
```sql
CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'analyst', 'user')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## User Roles

### Admin
- **Permissions**: Full system access
- **Can Access**: All dashboards, scheduled jobs, model evaluation, user management

### Analyst
- **Permissions**: Read/write predictions, analytics access
- **Can Access**: Predictions, analytics dashboards, models, scheduled jobs

### User (Default)
- **Permissions**: Read-only access
- **Can Access**: View predictions, browse matches, teams, leagues

### Promoting Users

```sql
-- Promote to admin
UPDATE user_profiles SET role = 'admin' WHERE email = 'user@example.com';

-- Promote to analyst
UPDATE user_profiles SET role = 'analyst' WHERE email = 'user@example.com';
```

## Protected Routes

### Public Routes (No Authentication Required)
- `/` - Home page
- `/login` - Sign-in page
- `/signup` - Registration page

### Demo Routes (Read-Only for Unauthenticated)
- `/predictions` - View public predictions
- `/matches` - Browse matches
- `/teams` - Team directory
- `/leagues` - League directory

### Protected Routes (Authentication Required)
- `/dashboard` - Main dashboard (all roles)
- `/analytics` - Analytics dashboard (all roles)
- `/jobs` - Scheduled jobs (admin, analyst only)

### Route Configuration

```tsx
// Public route
<Route path="/" element={
  <AuthGate requireAuth={false}>
    <Index />
  </AuthGate>
} />

// Protected route (all authenticated users)
<Route path="/dashboard" element={
  <AuthGate>
    <Dashboard />
  </AuthGate>
} />

// Role-restricted route
<Route path="/jobs" element={
  <AuthGate allowedRoles={['admin', 'analyst']}>
    <ScheduledJobs />
  </AuthGate>
} />
```

## API Integration

### Automatic Token Injection

```typescript
import { supabase } from '@/integrations/supabase/client';

// Token is automatically included
const { data, error } = await supabase
  .from('predictions')
  .select('*');
```

### Edge Function Calls

```typescript
const { data, error } = await supabase.functions.invoke('my-function', {
  body: { /* your data */ }
});
// User session is automatically passed via Authorization header
```

## Security Best Practices

### ✅ Implemented

1. **Environment Variables**: Sensitive keys stored in `.env`
2. **Row Level Security (RLS)**: Enabled on `user_profiles` table
3. **Token Storage**: Secure storage with automatic refresh
4. **Password Requirements**: Minimum 6 characters
5. **Session Timeout**: Automatic token refresh
6. **HTTPS Only**: Production uses HTTPS

### 🔒 Recommendations

1. **Enable Email Verification** in Supabase Dashboard
2. **Configure Password Policy** (8-12 characters, complexity)
3. **Rate Limiting** to prevent brute-force attacks
4. **Two-Factor Authentication** for admin accounts
5. **OAuth Integration** for production (Google, GitHub)

## Troubleshooting

### Issue: "User already registered" error
**Solution**: Check if email exists in auth.users table. Use password reset or delete user.

### Issue: Session not persisting
**Solution**: Check `persistSession: true` in Supabase client. Verify localStorage access.

### Issue: Profile not created on signup
**Solution**: Verify `on_auth_user_created` trigger exists and is enabled.

### Issue: Edge functions return 401 Unauthorized
**Solution**: Ensure Authorization header is passed. Verify Supabase client initialization.

## Related Documentation

- [Security Overview](./SECURITY_OVERVIEW.md)
- [RBAC Implementation](./RBAC_IMPLEMENTATION.md)
- [JWT Enforcement](./JWT_ENFORCEMENT.md)
- [Role Permissions](../02-user-guides/ROLE_PERMISSIONS.md)
