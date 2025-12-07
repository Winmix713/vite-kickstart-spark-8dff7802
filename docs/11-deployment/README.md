---
title: "Deployment Documentation"
description: "Deployment procedures, operations runbook, and production workflows"
category: "11-deployment"
language: "en"
version: "1.0.0"
last_updated: "2025-11-27"
status: "active"
tags: ["deployment", "operations", "devops", "production"]
---

# Deployment Documentation

This category covers deployment procedures, operational guidelines, error handling, and production workflows.

## Contents

- **OPERATIONS_RUNBOOK.md** - Operations and maintenance procedures
- **COPY_WORKFLOWS.md** - Workflow copying and replication
- **SUPABASE_TO_NEON_MIGRATION.md** - Database migration guide
- **ERROR_HANDLING.md** - Error handling strategies
- **FEATURE_FLAGS.md** - Feature flag management

## Deployment Workflow

```
Development → Staging → Production
     ↓           ↓          ↓
  Testing    Testing    Monitoring
```

## Production Checklist

- [ ] Database migrations applied
- [ ] Environment variables configured
- [ ] Feature flags set
- [ ] Monitoring enabled
- [ ] Rollback plan ready

## Quick Links

- [Testing Guide](/docs/10-testing/)
- [Security Overview](/docs/07-security/)
- [Database Setup](/docs/06-database/)
