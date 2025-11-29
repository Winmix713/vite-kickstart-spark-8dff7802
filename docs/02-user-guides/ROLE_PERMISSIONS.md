---
title: "Role Permissions Matrix"
description: "Complete role-based access control (RBAC) permissions matrix for WinMix TipsterHub"
category: "02-user-guides"
language: "en"
version: "1.1.0"
last_updated: "2025-11-27"
author: "WinMix TipsterHub Security Team"
status: "active"
related_docs:
  - "/docs/07-security/RBAC_IMPLEMENTATION.md"
  - "/docs/07-security/SECURITY_OVERVIEW.md"
  - "/docs/03-admin-guides/ADMIN_OVERVIEW_HU.md"
tags: ["rbac", "permissions", "security", "roles"]
---

# Role Permissions Matrix

> **Magyar Összefoglaló:** Teljes jogosultsági mátrix az Admin, Analyst és User szerepkörökhöz. Részletezi az egyes szerepkörök hozzáférési jogait az összes funkcióhoz és API endpoint-hoz.

---

## Role Overview

| Role | Description | Typical Use Case |
|------|-------------|------------------|
| **Admin** | Full system access | System administration, user management, configuration |
| **Analyst** | Prediction creation & analysis | Data analysis, model evaluation, job management |
| **User** | Read-only access | Viewing predictions, analytics, and reports |
| **Viewer** | Guest access | Demo mode, limited viewing |
| **Demo** | Trial access | Evaluation purposes |

---

## Frontend Access Matrix

### Dashboard & Navigation

| Feature | Admin | Analyst | User | Viewer |
|---------|-------|---------|------|--------|
| `/dashboard` | ✅ Full | ✅ Full | ✅ View | ✅ View |
| `/predictions` (list) | ✅ Full | ✅ Full | ✅ View | ✅ View |
| `/predictions/new` | ✅ Create | ✅ Create | ❌ | ❌ |
| `/analytics` | ✅ Full | ✅ Full | ✅ View | ✅ Limited |
| `/models` | ✅ Full | ✅ Manage | ✅ View | ❌ |
| `/jobs` | ✅ Full | ✅ Manage | ❌ | ❌ |
| `/monitoring` | ✅ Full | ✅ View | ❌ | ❌ |
| `/crossleague` | ✅ Full | ✅ Full | ✅ View | ❌ |
| `/phase9` | ✅ Full | ✅ Full | ✅ View | ❌ |
| `/admin/*` | ✅ Full | ❌ | ❌ | ❌ |
| `/winmixpro/*` | ✅ Full | ❌ | ❌ | ❌ |

---

## Database Access (RLS Policies)

### Core Tables

| Table | Admin | Analyst | User | Service Role |
|-------|-------|---------|------|--------------|
| `leagues` | ✅ Full | ✅ Full | ✅ SELECT | ✅ Full |
| `teams` | ✅ Full | ✅ Full | ✅ SELECT | ✅ Full |
| `matches` | ✅ Full | ✅ Full | ✅ SELECT | ✅ Full |
| `predictions` | ✅ Full | ✅ CREATE/SELECT | ✅ SELECT | ✅ Full |
| `user_profiles` | ✅ Full | ✅ Own only | ✅ Own only | ✅ Full |
| `detected_patterns` | ✅ Full | ✅ Full | ✅ Own only | ✅ Full |
| `team_patterns` | ✅ Full | ✅ Full | ✅ SELECT | ✅ Full |
| `model_performance` | ✅ Full | ✅ SELECT | ❌ | ✅ Full |
| `model_comparison` | ✅ Full | ✅ SELECT | ❌ | ✅ Full |
| `scheduled_jobs` | ✅ Full | ✅ Full | ❌ | ✅ Full |
| `system_health` | ✅ Full | ✅ SELECT | ❌ | ✅ Full |
| `admin_audit_log` | ✅ Full | ✅ SELECT | ❌ | ✅ Full |

### Phase 9 Tables

| Table | Admin | Analyst | User | Service Role |
|-------|-------|---------|------|--------------|
| `user_predictions` | ✅ Full | ✅ Own + View | ✅ Own only | ✅ Full |
| `market_odds` | ✅ Full | ✅ Full | ✅ SELECT | ✅ Full |
| `collaborative_signals` | ✅ Full | ✅ Full | ✅ SELECT | ✅ Full |
| `temporal_decay_tracking` | ✅ Full | ✅ SELECT | ❌ | ✅ Full |

---

## Edge Function Access

### Authentication Required

| Function | Admin | Analyst | User | Anonymous |
|----------|-------|---------|------|-----------|
| `jobs-*` | ✅ | ✅ | ❌ | ❌ |
| `models-*` | ✅ | ✅ (read) | ❌ | ❌ |
| `admin-*` | ✅ | ❌ | ❌ | ❌ |
| `patterns-detect` | ✅ | ✅ | ❌ | ❌ |
| `analyze-match` | ✅ | ✅ | ❌ | ❌ |
| `predictions-track` | ✅ | ✅ | ❌ | ❌ |
| `phase9-*` | ✅ | ✅ | ✅ (limited) | ❌ |
| `get-predictions` | ✅ | ✅ | ✅ | ✅ (public) |
| `monitoring-health` | ✅ | ✅ | ❌ | ❌ |

---

## Admin-Specific Permissions

### User Management
- ✅ Create new users
- ✅ Modify user roles
- ✅ Deactivate/activate users
- ✅ View all user profiles
- ✅ Manage user permissions

### System Configuration
- ✅ Modify system settings
- ✅ Configure cron jobs
- ✅ Manage environment variables
- ✅ Update RLS policies
- ✅ Deploy edge functions

### Data Management
- ✅ Bulk data import/export
- ✅ Database migrations
- ✅ Data cleanup operations
- ✅ Backup management
- ✅ Audit log access

---

## Analyst-Specific Permissions

### Prediction Management
- ✅ Create new predictions
- ✅ View all predictions
- ✅ Update own predictions
- ✅ Delete own predictions

### Job Management
- ✅ Create scheduled jobs
- ✅ Trigger job execution
- ✅ View job logs
- ✅ Enable/disable jobs

### Analytics Access
- ✅ View performance metrics
- ✅ Generate reports
- ✅ Export analytics data
- ✅ Configure dashboards

---

## User-Specific Permissions

### Viewing Rights
- ✅ View predictions (public)
- ✅ View analytics (dashboard)
- ✅ View match data
- ✅ View team statistics

### Personal Data
- ✅ View own profile
- ✅ Update own profile
- ✅ View own prediction history
- ✅ Export own data

### Limitations
- ❌ Cannot create predictions
- ❌ Cannot manage jobs
- ❌ Cannot access monitoring
- ❌ Cannot view admin panel

---

## Security Testing

For RLS policy testing, see:
- [RLS Implementation](../07-security/RLS_IMPLEMENTATION_SUMMARY.md)
- [Security Testing Script](../../scripts/test-security.sh)

---

**Version**: 1.1.0  
**Last Updated**: 2025-11-27  
**Maintainer**: Security & Documentation Team
