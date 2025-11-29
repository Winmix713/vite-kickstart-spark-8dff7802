---
title: "Admin Teljes Jogkör Útmutató"
description: "Consolidated admin guide merging access guide and setup documentation"
category: "03-admin-guides"
language: "hu"
version: "2.0.0"
last_updated: "2025-11-27"
author: "WinMix Admin Team"
status: "active"
related_docs:
  - "/docs/02-user-guides/ROLE_PERMISSIONS.md"
  - "/docs/07-security/RBAC_IMPLEMENTATION.md"
  - "/docs/06-database/RLS_POLICIES.md"
tags: ["admin", "full-access", "setup", "operations"]
---

# Admin Teljes Jogkör Útmutató

> **English Summary:** Complete admin guide covering full access rights, database permissions, frontend routes, Edge Functions, security implementation, and troubleshooting. Consolidated from ADMIN_ACCESS_GUIDE.md and ADMIN_SETUP_TAKOSADAM.md.

---

## Tartalomjegyzék

1. [Gyors Referencia](#1-gyors-referencia)
2. [Frontend Hozzáférés](#2-frontend-hozzáférés)
3. [Adatbázis Hozzáférés](#3-adatbázis-hozzáférés)
4. [Edge Function Hozzáférés](#4-edge-function-hozzáférés)
5. [Biztonsági Implementáció](#5-biztonsági-implementáció)
6. [Admin Setup (takosadam@gmail.com)](#6-admin-setup-takosodam@gmailcom)
7. [Ellenőrzési Lépések](#7-ellenőrzési-lépések)
8. [Hibaelhárítás](#8-hibaelhárítás)

---

## 1. Gyors Referencia

### Admin Felhasználó Példa

**Email:** takosadam@gmail.com  
**UID:** 838803e7-bc4f-4722-89ac-4c94c923f785  
**Szerepkör:** admin  
**Státusz:** Aktív  
**Jogosultságok:** Teljes hozzáférés minden funkcióhoz

---

## 2. Frontend Hozzáférés

### Admin Útvonalak

Admin felhasználók hozzáférhetnek az összes következő útvonalhoz:

```
✅ /admin                  - Admin Dashboard
✅ /admin/users            - User Management
✅ /admin/jobs             - Job Management
✅ /admin/phase9           - Phase 9 Settings
✅ /admin/health           - Health Dashboard
✅ /admin/stats            - Statistics
✅ /admin/integrations     - Integrations
✅ /admin/model-status     - Model Status
✅ /admin/feedback         - Feedback Inbox
✅ /admin/environment      - Environment Variables
✅ /winmixpro/*            - WinmixPro Premium Features
```

### Általános Útvonalak

```
✅ /dashboard              - Main Dashboard
✅ /predictions            - Predictions (full CRUD)
✅ /analytics              - Analytics
✅ /models                 - Model Management
✅ /monitoring             - System Monitoring
✅ /crossleague            - Cross-League Analysis
✅ /phase9                 - Phase 9 Features
```

---

## 3. Adatbázis Hozzáférés

### Teljes Hozzáférésű Táblák

#### Core Application Tables
- `leagues` - Bajnokságok kezelése
- `teams` - Csapatok kezelése
- `matches` - Mérkőzések kezelése
- `predictions` - Predikciók teljes hozzáférés
- `user_predictions` - Felhasználói predikciók

#### User Management
- `user_profiles` - Felhasználói profilok (teljes hozzáférés)
- `admin_audit_log` - Audit naplók olvasás/írás

#### ML & Analytics
- `model_performance` - Model teljesítmény
- `model_comparison` - Model összehasonlítás
- `model_experiments` - Model kísérletek
- `model_retraining_runs` - Újratanítás futások
- `model_retraining_requests` - Újratanítás kérések

#### Pattern Detection
- `detected_patterns` - Detektált mintázatok
- `team_patterns` - Csapat mintázatok
- `meta_patterns` - Meta mintázatok
- `pattern_accuracy` - Mintázat pontosság

#### System Operations
- `scheduled_jobs` - Háttérfeladatok
- `job_logs` - Feladat naplók
- `system_health` - Rendszer állapot
- `system_logs` - Rendszer naplók
- `performance_metrics` - Teljesítmény metrikák

#### Phase 9 Tables
- `market_odds` - Piaci oddsok
- `collaborative_signals` - Közösségi jelzések
- `temporal_decay_tracking` - Időbeli lemondás követés

#### Configuration & Explainability
- `environment_variables` - Környezeti változók
- `prediction_review_log` - Predikció áttekintési napló
- `retrain_suggestion_log` - Újratanítás javaslat napló
- `feedback` - Felhasználói visszajelzések

---

## 4. Edge Function Hozzáférés

### Admin-Only Functions

```typescript
// Példa: admin-model-analytics
admin-model-analytics
admin-model-status
admin-model-update-champion
admin-model-delete
```

### Admin vagy Analyst Functions

```typescript
jobs-create
jobs-list
jobs-toggle
jobs-trigger
jobs-update
jobs-delete
models-performance
patterns-detect
analyze-match
predictions-track
```

---

## 5. Biztonsági Implementáció

### Hogyan Működik az Admin Hozzáférés

```
1. Felhasználó bejelentkezik: takosadam@gmail.com
         ↓
2. AuthProvider lekéri a profilt user_profiles-ból
         ↓
3. Profil mutatja: role = 'admin'
         ↓
4. RoleGate komponensek engedélyezik a route hozzáférést
         ↓
5. Adatbázis lekérdezések auth.uid()-vel futnak
         ↓
6. RLS policies meghívják is_admin() → TRUE értéket ad vissza
         ↓
7. Teljes hozzáférés biztosítva ✅
```

### Kulcs Komponensek

**Frontend:**
- `AuthProvider` - `src/providers/AuthProvider.tsx`
- `RoleGate` - `src/components/admin/RoleGate.tsx`
- `useAdminAuth` - `src/hooks/admin/useAdminAuth.ts`

**Backend:**
- `public.is_admin()` függvény - Ellenőrzi `user_profiles.role`
- `public.current_app_role()` függvény - Visszaadja a felhasználó szerepét
- RLS policies minden táblán

**Edge Functions:**
- `_shared/auth.ts` - Auth utilities
- `requireAdmin` - Admin-only védelem
- `requireAdminOrAnalyst` - Admin/analyst védelem

---

## 6. Admin Setup (takosadam@gmail.com)

### Migrációs Fájl

**Fájl:** `supabase/migrations/20260115000000_setup_admin_takosadam.sql`

```sql
-- Insert/Update user profile with admin role
INSERT INTO public.user_profiles (id, email, role, is_active)
VALUES (
  '838803e7-bc4f-4722-89ac-4c94c923f785',
  'takosadam@gmail.com',
  'admin',
  true
)
ON CONFLICT (id) DO UPDATE SET
  role = 'admin',
  is_active = true,
  updated_at = NOW();

-- Update auth.users metadata
UPDATE auth.users
SET raw_user_meta_data = jsonb_build_object(
  'is_admin', true,
  'role', 'admin',
  'permissions', ARRAY[
    'admin.access',
    'admin.users.manage',
    'admin.feedback.review',
    'admin.predictions.review',
    'admin.model.status',
    'monitoring.full_access',
    'predictions.full_access'
  ]
)
WHERE id = '838803e7-bc4f-4722-89ac-4c94c923f785';
```

---

## 7. Ellenőrzési Lépések

### Profil Ellenőrzés

```sql
-- Check user_profiles table
SELECT id, email, role::text, is_active 
FROM public.user_profiles 
WHERE email = 'takosadam@gmail.com';

-- Expected result:
-- id: 838803e7-bc4f-4722-89ac-4c94c923f785
-- email: takosadam@gmail.com
-- role: admin
-- is_active: true
```

### Auth Metadata Ellenőrzés

```sql
-- Check auth.users metadata
SELECT 
  id,
  email,
  raw_user_meta_data->'is_admin' as is_admin,
  raw_user_meta_data->'role' as role,
  raw_user_meta_data->'permissions' as permissions
FROM auth.users
WHERE email = 'takosadam@gmail.com';
```

### is_admin() Függvény Test

```sql
-- Test is_admin() function
SELECT public.is_admin();
-- Expected: true (when logged in as takosadam@gmail.com)
```

---

## 8. Hibaelhárítás

### Probléma: Admin útvonalak nem elérhetők

**Ellenőrzés:**
1. Ellenőrizze a bejelentkezési státuszt
2. Győződjön meg róla, hogy a `role = 'admin'` a `user_profiles` táblában
3. Ellenőrizze a `RoleGate` komponens működését
4. Vizsgálja meg a konzol hibákat

**Megoldás:**
```sql
-- Manuális role update, ha szükséges
UPDATE public.user_profiles
SET role = 'admin'
WHERE email = 'your-email@example.com';
```

### Probléma: 403 Forbidden Edge Functions-nél

**Ellenőrzés:**
1. Ellenőrizze a JWT token érvényességét
2. Vizsgálja meg az Edge Function `verify_jwt` beállítását
3. Ellenőrizze a `requireAdmin` helper működését

**Megoldás:**
- Győződjön meg róla, hogy `config.toml`-ban `verify_jwt = true`
- Ellenőrizze a `_shared/auth.ts` implementációt

### Probléma: Adatbázis hozzáférés megtagadva

**Ellenőrzés:**
1. Ellenőrizze RLS policies-t az adott táblán
2. Tesztelje `is_admin()` függvényt
3. Vizsgálja meg `auth.uid()` értékét

**Megoldás:**
```sql
-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'your_table';

-- Manually test policy
SET request.jwt.claims.sub = '838803e7-bc4f-4722-89ac-4c94c923f785';
SELECT * FROM your_table;
```

---

## Kapcsolódó Dokumentumok

- [Role Permissions](../02-user-guides/ROLE_PERMISSIONS.md) - Teljes jogosultsági mátrix
- [RBAC Implementation](../07-security/RBAC_IMPLEMENTATION.md) - RBAC részletek
- [RLS Policies](../06-database/RLS_POLICIES.md) - Adatbázis biztonsági szabályzatok
- [Security Overview](../07-security/SECURITY_OVERVIEW.md) - Biztonsági áttekintés

---

**Verzió:** 2.0.0  
**Utolsó frissítés:** 2025-11-27  
**Karbantartó:** WinMix Admin & Security Team

---

**English Summary:**  
This consolidated admin guide provides complete documentation for admin access rights, including frontend routes, database permissions, Edge Function access, security implementation, and specific setup for takosadam@gmail.com admin user. Includes verification steps and troubleshooting guides.
