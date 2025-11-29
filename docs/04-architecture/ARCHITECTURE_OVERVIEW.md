---
title: "WinMix TipsterHub Architecture Overview"
description: "System architecture, technology stack, and design patterns for WinMix TipsterHub"
category: "04-architecture"
language: "en"
version: "1.0.0"
last_updated: "2025-11-27"
author: "WinMix Architecture Team"
status: "active"
related_docs:
  - "/docs/04-architecture/CP6TLX8W_SYSTEM_BRIEF.md"
  - "/docs/04-architecture/FRONTEND_FOUNDATION.md"
  - "/docs/06-database/SUPABASE_ALLAPOT_2026_HU.md"
tags: ["architecture", "design", "technology-stack"]
---

# WinMix TipsterHub Architecture Overview

> **Magyar Összefoglaló:** A WinMix TipsterHub háromrétegű architektúrája: React SPA frontend, Supabase backend (PostgreSQL + Edge Functions), és Python ML pipeline. A rendszer moduláris, skálázható, és fázis-alapú feature gate-ekkel rendelkezik.

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT LAYER                         │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │         React 18 + Vite SPA                      │  │
│  │  - TypeScript (strict mode)                      │  │
│  │  - Tailwind CSS + shadcn-ui                      │  │
│  │  - TanStack Query (state management)             │  │
│  │  - React Router DOM (routing)                    │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────┬───────────────────────────────────┘
                      │
                      │ REST API / WebSocket / RPC
                      │
┌─────────────────────▼───────────────────────────────────┐
│                   BACKEND LAYER                         │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │            Supabase Platform                     │  │
│  │  ┌────────────────────────────────────────────┐ │  │
│  │  │  PostgreSQL 15 Database                   │ │  │
│  │  │  - 50+ tables with RLS policies           │ │  │
│  │  │  - Complex indexes and constraints        │ │  │
│  │  │  - Full-text search capabilities          │ │  │
│  │  └────────────────────────────────────────────┘ │  │
│  │                                                  │  │
│  │  ┌────────────────────────────────────────────┐ │  │
│  │  │  Edge Functions (Deno Runtime)            │ │  │
│  │  │  - 30+ serverless functions               │ │  │
│  │  │  - JWT verification                        │ │  │
│  │  │  - RBAC enforcement                        │ │  │
│  │  └────────────────────────────────────────────┘ │  │
│  │                                                  │  │
│  │  ┌────────────────────────────────────────────┐ │  │
│  │  │  Supabase Auth                            │ │  │
│  │  │  - Email/password authentication          │ │  │
│  │  │  - JWT token management                   │ │  │
│  │  │  - User session handling                  │ │  │
│  │  └────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────┬───────────────────────────────────┘
                      │
                      │ CSV Export / Model Files / REST API
                      │
┌─────────────────────▼───────────────────────────────────┐
│                  ML PIPELINE LAYER                      │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │         Python 3.11+ ML Pipeline                 │  │
│  │  - scikit-learn (ML models)                      │  │
│  │  - pandas + numpy (data processing)              │  │
│  │  - joblib (model serialization)                  │  │
│  │  - Supabase Python client                        │  │
│  │                                                  │  │
│  │  Modules:                                        │  │
│  │  - train_model.py (training orchestration)      │  │
│  │  - data_loader.py (data preprocessing)          │  │
│  │  - auto_reinforcement.py (self-improvement)     │  │
│  │  - ensemble_predictor.py (model ensemble)       │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## Technology Stack

### Frontend Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 18.3.1 | UI framework |
| **Vite** | 5.x | Build tool and dev server |
| **TypeScript** | 5.x | Type safety |
| **Tailwind CSS** | 3.x | Styling framework |
| **shadcn-ui** | Latest | Component library |
| **TanStack Query** | 5.x | Server state management |
| **React Router DOM** | 6.x | Client-side routing |
| **Recharts** | 2.x | Data visualization |
| **Lucide React** | Latest | Icon library |

### Backend Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **Supabase** | Latest | Backend platform |
| **PostgreSQL** | 15 | Relational database |
| **Deno** | Latest | Edge function runtime |
| **Row Level Security** | Native | Data security |

### ML Pipeline Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **Python** | 3.11+ | ML language |
| **scikit-learn** | 1.3+ | Machine learning |
| **pandas** | 2.x | Data manipulation |
| **numpy** | 1.24+ | Numerical computing |
| **joblib** | 1.3+ | Model persistence |

### Testing & QA Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **Vitest** | Latest | Unit testing |
| **Playwright** | Latest | E2E testing |
| **MSW** | Latest | API mocking |
| **ESLint** | 8.x | Linting |
| **Prettier** | 3.x | Code formatting |

---

## Frontend Architecture

### Directory Structure

```
src/
├── components/          # React components
│   ├── admin/           # Admin-specific components
│   ├── analytics/       # Analytics dashboards
│   ├── crossleague/     # Cross-league features
│   ├── jobs/            # Job management
│   ├── models/          # Model management
│   ├── monitoring/      # System monitoring
│   ├── patterns/        # Pattern detection
│   ├── phase9/          # Phase 9 features
│   └── ui/              # shadcn-ui components
├── data/                # Mock data for demos
├── hooks/               # Custom React hooks
├── lib/                 # Utility libraries
├── pages/               # Route pages
├── providers/           # Context providers
└── winmixpro/           # WinmixPro premium features
```

### State Management Strategy

**TanStack Query for Server State:**
```typescript
const jobsQuery = useQuery({
  queryKey: ["scheduled-jobs"],
  queryFn: fetchJobs,
  refetchInterval: 30000, // 30s auto-refresh
});
```

**React Context for Global State:**
- `AuthProvider` - Authentication state
- `ThemeProvider` - UI theme
- `FeatureFlagsProvider` - Feature gates

### Routing Architecture

**Phase-Gated Routes:**
```typescript
// Phase 6: Models
{
  path: "/models",
  element: <PhaseGate phase={6}><ModelsPage /></PhaseGate>,
  lazy: () => import("./pages/ModelsPage")
}
```

**Role-Protected Routes:**
```typescript
// Admin-only
{
  path: "/admin/*",
  element: <RoleGate roles={["admin"]}><AdminRoutes /></RoleGate>
}
```

---

## Backend Architecture

### Database Design Principles

1. **Normalization**: 3NF for core tables
2. **Denormalization**: Strategic for analytics
3. **Indexing**: B-tree for lookups, GIN for JSONB
4. **Partitioning**: Time-based for logs/metrics

### RLS Strategy

**Pattern: Role-Based Policies**
```sql
CREATE POLICY "Admins bypass RLS"
  ON predictions
  FOR ALL
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Users see own predictions"
  ON user_predictions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
```

### Edge Functions Architecture

**Shared Authentication Module:**
```typescript
// supabase/functions/_shared/auth.ts
export const requireAdmin = requireRole(['admin']);
export const requireAdminOrAnalyst = requireRole(['admin', 'analyst']);

// Usage in Edge Function
const authResult = await protectEndpoint(authHeader, requireAdmin);
if ('error' in authResult) {
  return createAuthErrorResponse(authResult.error);
}
```

---

## ML Pipeline Architecture

### Training Workflow

```
1. Data Export (PostgreSQL → CSV)
         ↓
2. Preprocessing (pandas)
         ↓
3. Feature Engineering
         ↓
4. Model Training (scikit-learn)
         ↓
5. Validation & Evaluation
         ↓
6. Model Registration (JSON + joblib)
         ↓
7. Performance Logging (PostgreSQL)
```

### Auto-Reinforcement Loop

```python
# Triggered daily via cron
1. Check model accuracy (last 7 days)
2. If accuracy < 70% threshold:
   a. Extract error patterns
   b. Generate retraining dataset
   c. Trigger model retraining
   d. Log results to model_retraining_runs
```

---

## Integration Points

### Frontend ↔ Backend

**Direct Database Access:**
```typescript
const { data } = await supabase
  .from('predictions')
  .select('*')
  .eq('match_id', matchId);
```

**Edge Function Invocation:**
```typescript
const { data } = await supabase.functions.invoke('models-performance', {
  body: { period: 'last_30_days' }
});
```

### Backend ↔ ML Pipeline

**Scheduled Training:**
```toml
# supabase/config.toml
[cron.daily-model-retrain]
schedule = "0 2 * * *"  # 2 AM daily
command = "python ml_pipeline/train_model.py"
```

**Performance Logging:**
```python
# Python to Supabase
supabase.table('model_performance').insert({
  'model_version': 'v2.3',
  'accuracy_overall': 0.742,
  'period_start': '2025-11-01',
  'period_end': '2025-11-27'
}).execute()
```

---

## Security Architecture

### Multi-Layer Security

1. **Authentication Layer**: JWT tokens via Supabase Auth
2. **Authorization Layer**: RLS policies + RBAC in Edge Functions
3. **Data Layer**: Encrypted at rest, TLS in transit
4. **Audit Layer**: Admin actions logged to `admin_audit_log`

### JWT Verification

```toml
# supabase/config.toml
[functions.models-performance]
verify_jwt = true  # Enforces authentication

[functions.get-predictions]
verify_jwt = false  # Public endpoint
```

---

## Scalability Considerations

### Horizontal Scaling

- **Frontend**: Static hosting (Vercel/Netlify) with global CDN
- **Backend**: Supabase auto-scales database connections
- **Edge Functions**: Serverless, auto-scaling by nature

### Performance Optimization

- **Database**: 
  - Materialized views for complex analytics
  - Connection pooling
  - Query result caching
- **Frontend**:
  - Code splitting with lazy loading
  - Image optimization
  - React Query caching strategy

---

## Monitoring & Observability

### System Health Monitoring

- **Frontend**: User session tracking, error boundaries
- **Backend**: Database metrics, Edge Function logs
- **ML Pipeline**: Training metrics, prediction accuracy

### Logging Strategy

- **Application Logs**: `system_logs` table
- **Audit Logs**: `admin_audit_log` table
- **Job Logs**: `job_logs` table
- **Performance Metrics**: `performance_metrics` table

---

## Related Documentation

- **[System Brief](./CP6TLX8W_SYSTEM_BRIEF.md)** - Detailed integration guide
- **[Frontend Foundation](./FRONTEND_FOUNDATION.md)** - UI/UX architecture
- **[Database State](../06-database/SUPABASE_ALLAPOT_2026_HU.md)** - Complete DB documentation
- **[ML Pipeline](../08-ml-pipeline/ML_OVERVIEW.md)** - Machine learning architecture

---

**Version**: 1.0.0  
**Last Updated**: 2025-11-27  
**Maintainer**: Architecture Team
