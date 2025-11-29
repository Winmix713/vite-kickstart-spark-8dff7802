---
title: "WinMix TipsterHub Project Overview"
description: "High-level overview of WinMix TipsterHub architecture, features, and technology stack"
category: "01-getting-started"
language: "en"
version: "1.0.0"
last_updated: "2025-11-27"
author: "WinMix TipsterHub Team"
status: "active"
related_docs:
  - "/docs/04-architecture/ARCHITECTURE_OVERVIEW.md"
  - "/docs/04-architecture/CP6TLX8W_SYSTEM_BRIEF.md"
  - "/docs/08-ml-pipeline/ML_OVERVIEW.md"
tags: ["overview", "architecture", "introduction"]
---

# WinMix TipsterHub – Project Overview

> **Hungarian Summary / Magyar Összefoglaló:** A WinMix TipsterHub egy AI-alapú labdarúgás elemzési platform, amely predikciók generálására, valós idejű elemzésekre, és közösségi intelligenciára specializálódott.

## What is WinMix TipsterHub?

WinMix TipsterHub is a **sophisticated football analytics and prediction platform** that combines:
- 🤖 **AI-powered predictions** using machine learning models
- 📊 **Real-time analytics** and performance tracking
- 🔐 **Role-based access control** (Admin, Analyst, User)
- 🌐 **Cross-league intelligence** and pattern detection
- 👥 **Collaborative intelligence** from crowd wisdom
- 📈 **Self-improving systems** with auto-reinforcement loops

---

## Technology Stack

### Frontend
- **Framework**: React 18 + Vite + TypeScript
- **UI Library**: Tailwind CSS + shadcn-ui
- **State Management**: TanStack Query
- **Routing**: React Router DOM v6
- **Charts**: Recharts

### Backend
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth (JWT)
- **Edge Functions**: Deno runtime
- **Row Level Security (RLS)**: PostgreSQL policies

### ML Pipeline
- **Language**: Python 3.11+
- **Framework**: scikit-learn
- **Data Processing**: pandas, numpy
- **Model Storage**: Supabase Storage + JSON registry

### DevOps
- **Testing**: Vitest (unit) + Playwright (e2e)
- **CI/CD**: GitHub Actions
- **Linting**: ESLint + Prettier
- **Deployment**: Vercel/Netlify (frontend) + Supabase (backend)

---

## Key Features

### Phase 3: Scheduled Jobs Management
- Automated data collection
- Scheduled prediction generation
- Job monitoring and logs

### Phase 4: Model Evaluation & Analytics
- Performance tracking dashboards
- Confidence calibration
- Model comparison tools

### Phase 5: Advanced Pattern Detection
- Team pattern recognition
- Historical trend analysis
- Meta-pattern discovery

### Phase 6: Model Management
- Champion/Challenger framework
- A/B testing infrastructure
- Model versioning and rollback

### Phase 7: Cross-League Intelligence
- Multi-league correlation analysis
- Pattern transfer learning
- League similarity scoring

### Phase 8: Monitoring & Visualization
- System health monitoring
- Performance metrics tracking
- Alert management system

### Phase 9: Collaborative Market Intelligence
- User prediction tracking
- Crowd wisdom aggregation
- Market odds integration
- Temporal decay modeling

---

## Architecture Overview

```
┌─────────────────────────────────────────────────┐
│           React SPA (Frontend)                  │
│  - User Interface & Interaction                 │
│  - TanStack Query for State Management          │
└──────────────────┬──────────────────────────────┘
                   │
                   │ REST API / WebSocket
                   │
┌──────────────────▼──────────────────────────────┐
│        Supabase Backend                         │
│  - PostgreSQL Database                          │
│  - Edge Functions (Deno)                        │
│  - Authentication (JWT)                         │
│  - Row Level Security (RLS)                     │
└──────────────────┬──────────────────────────────┘
                   │
                   │ CSV Export / Model Files
                   │
┌──────────────────▼──────────────────────────────┐
│          Python ML Pipeline                     │
│  - Model Training (scikit-learn)                │
│  - Prediction Generation                        │
│  - Performance Evaluation                       │
│  - Auto-Reinforcement Loop                      │
└─────────────────────────────────────────────────┘
```

---

## Data Flow

1. **Data Import** → Matches, teams, leagues imported via scheduled jobs
2. **Model Training** → Python pipeline trains models on historical data
3. **Prediction Generation** → AI models generate predictions with confidence scores
4. **Results Collection** → Actual match results collected and stored
5. **Performance Analysis** → Model accuracy and calibration calculated
6. **Model Improvement** → Auto-reinforcement loop triggers retraining

---

## User Roles & Permissions

| Role | Dashboard | Predictions | Analytics | Models | Jobs | Monitoring |
|------|-----------|-------------|-----------|--------|------|------------|
| **User** | ✅ View | ✅ View | ✅ View | ✅ View | ❌ | ❌ |
| **Analyst** | ✅ Full | ✅ Create | ✅ Full | ✅ View | ✅ Manage | ✅ View |
| **Admin** | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full |

---

## Security Features

- **JWT-based authentication** with Supabase Auth
- **Row Level Security (RLS)** policies on all tables
- **Role-Based Access Control (RBAC)** for Edge Functions
- **Audit logging** for admin actions
- **Explainability safeguards** for AI predictions

---

## Getting Started

1. **Quick Start**: [QUICK_START.md](./QUICK_START.md) - 10-15 minute introduction
2. **User Guide**: [USER_GUIDE.md](../02-user-guides/USER_GUIDE.md) - Complete feature guide
3. **Architecture**: [ARCHITECTURE_OVERVIEW.md](../04-architecture/ARCHITECTURE_OVERVIEW.md) - Technical details

---

## Development Phases

| Phase | Status | Features |
|-------|--------|----------|
| Phase 3 | ✅ Complete | Scheduled Jobs Management |
| Phase 4 | ✅ Complete | Model Evaluation & Analytics |
| Phase 5 | ✅ Complete | Advanced Pattern Detection |
| Phase 6 | ✅ Complete | Model Management |
| Phase 7 | ✅ Complete | Cross-League Intelligence |
| Phase 8 | ✅ Complete | Monitoring & Visualization |
| Phase 9 | ✅ Complete | Collaborative Market Intelligence |

---

## Documentation Structure

- **[00-meta/](../00-meta/)**: Documentation index and guidelines
- **[01-getting-started/](../01-getting-started/)**: Quick start and overview
- **[02-user-guides/](../02-user-guides/)**: User documentation
- **[03-admin-guides/](../03-admin-guides/)**: Admin operations
- **[04-architecture/](../04-architecture/)**: System architecture
- **[05-api-reference/](../05-api-reference/)**: API documentation
- **[06-database/](../06-database/)**: Database and Supabase
- **[07-security/](../07-security/)**: Security implementation
- **[08-ml-pipeline/](../08-ml-pipeline/)**: Machine learning
- **[09-phases/](../09-phases/)**: Development phases
- **[10-testing/](../10-testing/)**: Testing guides
- **[11-deployment/](../11-deployment/)**: Operations
- **[12-development/](../12-development/)**: Developer guides

---

## Support & Resources

- **Documentation**: [README.md](../00-meta/README.md)
- **API Reference**: [API_REFERENCE.md](../05-api-reference/API_REFERENCE.md)
- **Troubleshooting**: [OPERATIONS_RUNBOOK.md](../11-deployment/OPERATIONS_RUNBOOK.md)

---

**Version**: 1.0.0  
**Last Updated**: 2025-11-27  
**Maintainer**: WinMix TipsterHub Documentation Team
