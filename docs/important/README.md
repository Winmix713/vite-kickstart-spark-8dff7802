# WinMix TipsterHub – Integrated Intelligence Platform (Phases 3–9)

WinMix TipsterHub is an end-to-end football analytics and prediction platform that now consolidates every capability delivered across phases 3 through 9 into a single cohesive system. The application blends automated data ingestion, model evaluation, cross-league intelligence, monitoring, and self-improving market collaboration features on top of a modern React + Supabase stack.

---

## 🏗️ Platform Architecture

| Layer | Technologies | Responsibilities |
| --- | --- | --- |
| **Frontend** | React (Vite), TypeScript, Tailwind, shadcn-ui, TanStack Query, React Router | SPA experience with feature-specific dashboards (jobs, analytics, models, cross-league, monitoring, phase 9). Manages routing, state, visualizations, real-time feedback, and user interactions. |
| **Integrations** | Supabase SDK, Supabase Edge Functions | Secure data operations (auth, tables) and custom Edge Functions for jobs, analytics, and phase 9 services. Edge Functions expose REST-like endpoints that the client consumes via the `supabase.functions.invoke` calls. |
| **Domain Logic** | `/src/integrations`, `/src/lib`, `/src/types` | Encapsulates domain-specific contracts (job definitions, model metrics, monitoring KPIs, phase 9 intelligence) and shared utilities that standardize payloads across features. |
| **Analytics & Automation** | Supabase tables, background jobs | Phase 3 cron scheduling, Phase 4 feedback loop aggregation, Champion/Challenger orchestration, temporal decay, and collaborative market learning pipelines. |

Key data flow:
1. **Scheduled Jobs (Phase 3)** wake via Supabase Edge Functions and emit job state/log updates that the frontend consumes via TanStack Query.
2. **Feedback Loop (Phase 4)** pushes prediction outcomes back into Supabase tables, feeding analytics, model comparisons, and dashboards.
3. **Champion / Challenger Framework (Phase 6)** monitors model families, triggering promotions, demotions, and retraining requests.
4. **Cross-League Intelligence (Phase 7)** unifies league feeds to produce correlation heatmaps, radar differentials, and strategic insights.
5. **Monitoring & Visualization (Phase 8)** exposes system health, data freshness, compute loads, and anomaly detection dashboards.
6. **Collaborative Market Intelligence (Phase 9)** layers temporal decay weighting, self-improvement loops, and market blending to enhance predictive precision.

---

## 🚀 Feature Overview by Phase

### Phase 3 – Scheduled Jobs & Automation
- Jobs list, status controls, manual triggers, log viewers (`/jobs`).
- Supabase Edge Functions: `jobs-list`, `jobs-logs`, `jobs-toggle`, `jobs-trigger`.
- UI components: `JobStatusCard`, `JobLogsDialog`, adaptive skeleton loaders.

### Phase 4 – Feedback Loop & Model Evaluation
- Analytics workspace (`/analytics`) with model performance charts, feedback forms, and post-match evaluation flows.
- Integrations for performance snapshots, calibration metrics, automated retraining flags.
- Supabase-driven feedback loop that closes the model refinement process.

### Phase 6 – Champion / Challenger Framework
- Model management hub (`/models`) for champion/challenger insights, promotions, audit history, and feature experiments.
- Domain types under `src/types/models.ts` and service helpers in `src/integrations/models/service.ts`.

### Phase 7 – Cross-League Intelligence
- Cross-league dashboard (`/crossleague`) with correlation heatmaps, league comparison radar charts, and meta-pattern surfacing.
- Smart refetching, league filters, and storyline highlights for analysts.

### Phase 8 – Monitoring & Visualization
- Real-time monitoring center (`/monitoring`) showing compute loads, system health cards, anomaly watchlists, and SLA tracking.
- Visual components under `src/components/monitoring`.

### Phase 9 – Advanced Collaborative Market Intelligence
- Holistic intelligence suite (`/phase9`) combining collaborative analysis, market integration, temporal decay, and self-improving loops.
- Modular components in `src/components/phase9` and API layer in `src/lib/phase9-api.ts`.
- Automated tests in `src/test/phase9.test.ts` covering core behaviors.

### Evaluation Logging & ID Tracking
- **Robust Prediction Tracking**: Every prediction gets a unique UUIDv4 for end-to-end tracking from prediction to result reconciliation.
- **CSV-based Event Sourcing**: Evaluation log stored as `/tmp/evaluation_log.csv` with atomic append operations for data integrity.
- **Schema**: `prediction_id,timestamp,model_version,team_a,team_b,predicted_result,actual_result,confidence`
- **Model Versioning**: Automatic git commit hash tracking or configurable model versions.
- **Result Reconciliation**: Separate workflow for logging actual results, enabling accuracy analysis over time.
- **Testing Suite**: Comprehensive test script (`test-evaluation-logging.ts`) validates logging, validation, and reconciliation workflows.
- **Retention Policy**: Safe to archive/delete rows older than 90 days for performance management.

---

## 🧭 Navigation & Key Routes

| Route | Purpose |
| --- | --- |
| `/` | Landing experience with quick access to prediction workflows. |
| `/predictions/new` | 8-match wizard for generating fresh predictions. |
| `/predictions` | Review existing predictions, confidence scores, and feedback actions. |
| `/dashboard` | Executive summary of KPIs, win rates, and operational status. |
| `/analytics` | Phase 4 analytics & feedback loop cockpit. |
| `/jobs` | Phase 3 scheduler control plane. |
| `/models` | Phase 6 model governance. |
| `/crossleague` | Phase 7 intelligence dashboard. |
| `/monitoring` | Phase 8 observability portal. |
| `/phase9` | Phase 9 collaborative market intelligence hub. |
| `/teams`, `/matches`, `/leagues` | Core domain exploration views. |

The sidebar (`src/components/Sidebar.tsx`) provides quick access to all major workspaces and reflects the expanded navigation after integration.

---

## 📂 Project Structure Highlights

```
src/
  components/         # Feature-specific component suites (jobs, models, monitoring, phase9, etc.)
  integrations/       # Supabase clients, model services, and domain adapters
  lib/                # Shared utilities (phase 9 API client, helpers)
  pages/              # Route-level pages mapped in App.tsx
  types/              # TypeScript domains for jobs, models, monitoring, phase9
  hooks/              # Shared hooks (e.g., useRealtimeSubscription)
supabase/functions/   # Edge Functions powering jobs and analytics orchestration
```

## 📚 Documentation

- Full index: [docs/INDEX.md](docs/INDEX.md)

### User Guides
- **[🛠️ Admin Felület Útmutató (HU)](docs/ADMIN_FELULET_UTMUTATO_HU.md)** – Comprehensive admin interface documentation (Hungarian)
- **[📖 Teljes Felhasználói Útmutató](docs/USER_GUIDE.md)** – Comprehensive end-to-end user guide (Hungarian primary, English summaries)
- **[⚡ Gyors Kezdés](docs/QUICK_START.md)** – 10-15 minute quick start guide (Hungarian)
- **[👥 Szerepkörök és Jogosultságok](docs/ROLE_PERMISSIONS.md)** – Role-based access control matrix (Hungarian)

### Technical Documentation
- [🔐 Auth útmutató](docs/AUTHENTICATION.md) – Authentication & authorization implementation
- [📊 Supabase Állapot 2026 (HU)](docs/SUPABASE_ALLAPOT_2026_HU.md) – Comprehensive Supabase schema, indexes, RLS policies, and pipelines (Hungarian)
- [WinMix_TipsterHub_Phase_3-9_Components_EN.md](docs/WinMix_TipsterHub_Phase_3-9_Components_EN.md) – deep dive into components per phase.
- [PHASE9_IMPLEMENTATION.md](docs/PHASE9_IMPLEMENTATION.md) – architectural notes on the advanced collaborative intelligence layer.
- [PAGES_OLDALAK_BEMUTATASA_HU.md](docs/PAGES_OLDALAK_BEMUTATASA_HU.md) – src/pages oldalak rövid bemutatása (HU).
- [🎨 WinmixPro admin prototípus](docs/winmixpro.md) – mock adatok, localStorage és reszponzív elvárások az 5–15. oldalakhoz.

### Reviews & Roadmaps
- **[🧭 Projekt állapotértékelés és roadmap (HU)](docs/PROJEKT_ERTEKELES_ES_ROADMAP_HU.md)** – Reális értékelés a teljes repo alapján, fókusz: Streak Analysis és Transition Matrix

### Tooling & Dev Environments
- **[🧰 Alternatív online dev eszközök (GitHub + terminál) – HU](docs/ONLINE_DEVTOOLS_ALTERNATIVES_HU.md)** – Lovable.dev helyetti megoldások, GitHub-integráció és böngészős terminál opciók

---

## 🔐 Authentication & Authorization

The platform now includes Supabase Authentication with role-based access control (RBAC).

### User Roles
- **Admin**: Full system access including scheduled jobs and model management.
- **Analyst**: Can create predictions, access analytics, and view all dashboards.
- **User**: Read-only access to public predictions and match data.

### Authentication Features
- **Email/Password Sign-up & Sign-in**: Baseline authentication flow with validation.
- **Session Management**: Automatic token refresh and persistence via localStorage.
- **Protected Routes**: AuthGate component manages access control with configurable role requirements.
- **Public Demo Access**: Unauthenticated users can view matches, teams, leagues, and public predictions (read-only).
- **OAuth Support (Optional)**: Hooks for Google/GitHub authentication can be configured via Supabase dashboard.

### Creating Your First User
1. Start the development server: `npm run dev`
2. Navigate to `http://localhost:5173/signup`
3. Register with email and password
4. Check your email for verification (Supabase sends confirmation emails)
5. Sign in at `http://localhost:5173/login`

The first registered user will be assigned the default 'user' role. To promote to admin:
```sql
-- Run in Supabase SQL Editor
UPDATE user_profiles SET role = 'admin' WHERE email = 'your-email@example.com';
```

### Route Access Control
| Route Category | Authentication Required | Default Roles Allowed |
| --- | --- | --- |
| Public (`/`, `/login`, `/signup`) | ❌ No | All visitors |
| Demo Routes (`/predictions`, `/matches`, `/teams`, `/leagues`) | ❌ No (read-only) | All visitors |
| Protected Dashboards (`/dashboard`, `/analytics`, `/models`, `/monitoring`, `/phase9`) | ✅ Yes | admin, analyst, user |
| Job Management (`/jobs`) | ✅ Yes | admin, analyst |
| Prediction Creation (`/predictions/new`) | ✅ Yes | admin, analyst, user |

### Environment Variables
Configure authentication in your `.env` file (see `.env.example`):
```bash
VITE_SUPABASE_URL="https://your-project-id.supabase.co"
VITE_SUPABASE_ANON_KEY="your_anon_key_here"
```

Optional OAuth providers can be configured in the Supabase dashboard under Authentication > Providers.

---

## 🛠️ Local Development

### Quick Start with Docker (Recommended)

The easiest way to get a fully working local environment is to use the automated bootstrap script with Docker:

```bash
# Make executable (macOS/Linux)
chmod +x scripts/dev/bootstrap.sh

# Run the bootstrap script
scripts/dev/bootstrap.sh

# On Windows (PowerShell)
powershell -ExecutionPolicy Bypass -File scripts/dev/bootstrap.sh
```

This will:
- ✅ Check prerequisites (Docker, Node.js, npm)
- ✅ Set up environment files (`.env.local`, `docker/.env`)
- ✅ Start Docker containers (Postgres, Supabase, pgAdmin)
- ✅ Install npm dependencies
- ✅ Run database migrations and seeds
- ✅ Start the Vite development server

**Services will be available at:**
- Frontend: http://localhost:8080
- Supabase: http://localhost:54321
- Postgres: localhost:5432
- pgAdmin: http://localhost:5050

For detailed setup instructions, troubleshooting, and manual setup steps, see [docs/development/local.md](docs/development/local.md).

### Manual Setup

If you prefer to set up manually or use an existing Supabase project:

**Prerequisites:**
- Node.js 18+
- npm or bun
- Supabase project (hosted or Supabase CLI for local development)

**Steps:**

1. Copy environment template and configure:
   ```bash
   cp .env.local.template .env.local
   ```
   
2. For local Docker-based Supabase, ensure containers are running:
   ```bash
   docker-compose up -d
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Run database migrations and seeds:
   ```bash
   npm run seed:database
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

6. (Optional) Run Edge Functions locally:
   ```bash
   supabase functions serve --no-verify-jwt
   ```

The Vite proxy will automatically route `/functions/v1/*` requests to the local Supabase instance, allowing you to develop and test edge functions without leaving your editor.

### Testing

The project now includes unit, integration, end-to-end, and Supabase backend checks. Key commands:

| Command | Description |
| --- | --- |
| `npm test` | Run Vitest unit and integration suites with coverage reporting (outputs to `coverage/`). |
| `npm run test:watch` | Execute Vitest in watch mode for rapid iteration. |
| `npm run test:e2e` | Launch Playwright browser flows (dev server is started automatically). |
| `npm run test:supabase` | Execute Deno-based validation for shared Supabase schemas and policies. |
| `npm run test:all` | Run Vitest coverage followed by Supabase backend checks. |

Coverage summaries are printed to the console and detailed HTML/LCOV reports land in `coverage/`. Playwright reads Supabase defaults from `playwright.config.ts`; override via environment variables when targeting real backends.

---

## 🛠️ Environment Setup

### Prerequisites

- Node.js 18+ and npm
- Python 3.9+ (for ML pipeline)
- Supabase CLI (for local development)

### Environment Configuration

1. **Copy environment template:**
   ```bash
   cp .env.example .env.local
   ```

2. **Configure Supabase credentials:**
   ```bash
   # Required for all environments
   VITE_SUPABASE_URL="https://your-project.supabase.co"
   VITE_SUPABASE_ANON_KEY="your-anon-key"
   
   # Environment type
   VITE_ENV="development"  # or "staging", "production"
   ```

3. **Enable Phase Features (optional):**
   ```bash
   # Enable specific features by setting to "true"
   VITE_FEATURE_PHASE6="true"    # Model evaluation & feedback loop
   VITE_FEATURE_PHASE8="true"    # Monitoring & visualization
   VITE_FEATURE_PHASE9="true"    # Collaborative market intelligence
   ```

4. **API Origins (optional):**
   ```bash
   # Override default Supabase URLs if needed
   VITE_API_ORIGIN="https://your-api.example.com"
   VITE_EDGE_FUNCTION_ORIGIN="https://your-project.supabase.co/functions/v1"
   ```

### Local Development with Docker Supabase

For local development, you can use the Docker Compose setup:

```bash
# Start local Supabase
docker-compose -f docker-compose.yml up -d

# Update .env.local for local development
VITE_SUPABASE_URL="http://localhost:54321"
VITE_SUPABASE_ANON_KEY="your-local-anon-key"
VITE_ENV="development"
```

### Environment Validation

The application validates all required environment variables at startup. Missing or invalid variables will prevent the app from loading and show detailed error messages in development mode.

### Feature Flags

Phase-based features are controlled by environment variables:

| Phase | Feature | Variable | Description |
|-------|---------|----------|-------------|
| 5 | Pattern Detection | `VITE_FEATURE_PHASE5` | Advanced pattern detection algorithms |
| 6 | Model Evaluation | `VITE_FEATURE_PHASE6` | Model performance and feedback loops |
| 7 | Cross-League | `VITE_FEATURE_PHASE7` | Multi-league intelligence |
| 8 | Monitoring | `VITE_FEATURE_PHASE8` | System monitoring and visualization |
| 9 | Collaborative AI | `VITE_FEATURE_PHASE9` | Market intelligence and self-improvement |

---

## 🔮 Prediction Engine

The repository now ships with `prediction_engine.py`, a standalone inference harness that powers both the CLI tooling and any future server-side integrations. The engine performs strict feature validation against `model_config.yaml`, resolves the active serialized model from `models/model_registry.json`, and keeps the hydrated estimator cached via a singleton so disk I/O occurs only on the very first request. Every successful inference automatically records a row via `ml_logging.log_prediction_event`, ensuring downstream analytics (or audits) always have a traceable prediction ID.

### CLI usage

```bash
python prediction_engine.py \
  --team-a "Arsenal" \
  --team-b "Chelsea" \
  --features-json '{"team_form_index": 12, "opponent_form_index": 9, "avg_goals_scored": 2.1, "avg_goals_conceded": 0.8, "injury_count": 1, "rest_days": 5, "tempo_rating": 78}'
```

- Results stream to `stdout` as JSON so they can be piped into other tools.
- Validation errors (missing/extra features) exit with code `1`; filesystem or registry issues exit with code `2`.
- Prediction events are appended to `logs/prediction_events.csv` with the highest-probability scoreline.

### Response schema

The CLI and library variants both return the following JSON structure so callers can rely on a consistent contract:

```json
{
  "prediction_id": "0fba9b43-6f06-4045-a8d4-6c94074e9885",
  "model": {
    "name": "baseline_scoreline_model",
    "version": "2024.11.0",
    "path": "models/baseline_scoreline_model.pkl"
  },
  "ordered_features": ["team_form_index", "opponent_form_index", "avg_goals_scored", "avg_goals_conceded", "injury_count", "rest_days", "tempo_rating"],
  "feature_vector": [12.0, 9.0, 2.1, 0.8, 1.0, 5.0, 78.0],
  "probabilities": {"0-0": 0.18, "1-0": 0.22, "0-1": 0.11, "2-1": 0.15, "1-2": 0.09, "2-0": 0.12, "0-2": 0.08, "Other": 0.05},
  "predicted_result": "1-0",
  "confidence": 0.22,
  "context": {
    "team_a": "Arsenal",
    "team_b": "Chelsea"
  }
}
```

Supplementary Python unit tests live under `tests/test_prediction_engine.py` and assert the singleton loader semantics along with payload validation safety nets.

---

## 📣 Integration Notes
- All feature branches (Phases 3 → 9) have been merged sequentially into `integration/merge-phases-3-4-6-7-8-9` with navigation, routes, and domain types normalized to avoid duplication.
- Shared UI elements (e.g., `Sidebar`, `App.tsx`) have consolidated imports and route registrations to surface every phase feature consistently.
- Documentation now reflects the unified system so reviewers and stakeholders can evaluate the entire product surface area from a single reference.

---

## 📚 Operations & Documentation

### Comprehensive Documentation
- **[System Audit Report](docs/SYSTEM_AUDIT_2025-11.md)** - Complete end-to-end validation of all systems, security, performance, and deployment readiness
- **[Configuration Reference](docs/CONFIGURATION_REFERENCE.md)** - Environment variables, Supabase setup, secrets management, and feature flags
- **[Operations Runbook](docs/OPERATIONS_RUNBOOK.md)** - Build, deploy, troubleshoot, and maintain the platform
- **[Authentication Guide](docs/AUTHENTICATION.md)** - User authentication, authorization, OAuth setup, and security best practices
- **[Evaluation Logging Guide](docs/EVALUATION_LOGGING.md)** - Robust prediction tracking, result reconciliation, and accuracy analysis system

### Quick Commands
```bash
# Development
npm run dev                              # Start local dev server
npm run build                            # Build for production
npm run lint                             # Run ESLint
npm test                                 # Run Vitest suites with coverage
npm run test:supabase                    # Run Supabase (Deno) checks
npm run test:e2e                         # Execute Playwright flows

# Database Operations
supabase db push --project-ref <ID>     # Apply migrations
supabase db dump > backup.sql           # Backup database

# Edge Functions
supabase functions deploy <name>        # Deploy function
supabase functions logs <name>          # View function logs
supabase secrets set KEY=value          # Add secret

# Evaluation Logging
deno run test-evaluation-logging.ts     # Test evaluation logging system
cat /tmp/evaluation_log.csv            # View evaluation log
supabase functions invoke reconcile-prediction-result --data '{"prediction_id":"uuid","actual_result":"home_win"}'  # Reconcile prediction result

# Security
npm audit                               # Check for vulnerabilities
npm audit fix                           # Fix auto-fixable issues
```

### System Status (November 2025)
- ✅ **Build Status:** Success (bundle size: 1.3 MB - optimization recommended)
- ✅ **Database:** 14 migrations applied, 26 tables, RLS enabled on user_profiles
- ✅ **Edge Functions:** 28 functions deployed and operational
- ✅ **Authentication:** Fully functional with RBAC (admin, analyst, user)
- ⚠️ **Security:** 2 moderate npm vulnerabilities (dev-only, fix available)
- ✅ **Production Ready:** After addressing critical items in audit report

---

## 🤖 Model Training Pipeline

The platform includes a robust CLI tool for training and managing machine learning models with full reproducibility and versioning support.

### Quick Start

```bash
# Install Python dependencies
pip install -r requirements.txt

# Train a model with default settings
python train_model.py

# Train with custom data
python train_model.py --data-path data/custom_dataset.csv

# Dry run (train but don't save)
python train_model.py --dry-run

# Use custom random seed
python train_model.py --random-seed 123
```

### Training Workflow

1. **Prerequisites**: Python 3.9+ is required

2. **Install Dependencies**: Install required Python packages with pinned versions
   ```bash
   # It's recommended to use a virtual environment
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Prepare Data**: Ensure your training dataset CSV contains all features defined in `model_config.yaml`
   - Default location: `data/training_dataset.csv`
   - Must include all `input_features` and the `target_column`

4. **Configure Model**: Edit `model_config.yaml` to specify:
   - `model_type`: `LogisticRegression` or `DecisionTree`
   - `input_features`: List of feature column names
   - `target_column`: Target variable name
   - `hyperparameters`: Model-specific parameters

5. **Run Training**: Execute the training script
   ```bash
   python train_model.py
   ```

6. **Check Results**: 
   - Trained model saved to `models/<algorithm>_<YYYYMMDD_HHMMSS>.pkl`
   - Registry updated in `models/model_registry.json`
   - Evaluation metrics printed to console

### Features

- **Reproducibility**: Fixed random seed (default: 42) ensures identical results across runs
- **Versioning**: Timestamped model files prevent accidental overwrites
- **Comprehensive Metrics**: Accuracy, Precision, Recall, and F1-Score for all models
- **Registry Management**: JSON registry tracks all trained models with metadata
- **Error Handling**: Clear validation messages for missing features or malformed data
- **Dry Run Mode**: Test training without saving artifacts

### Model Registry

Each trained model is registered with:
- `id`: Unique UUID for the training run
- `timestamp`: ISO 8601 timestamp
- `metrics`: Performance scores (accuracy, precision, recall, f1_score)
- `parameters`: Hyperparameters used for training
- `model_path`: Relative path to the serialized model file
- `status`: Model status (`candidate` by default, can be promoted to `active`)
- `random_seed`: Seed used for reproducibility
- `features`: List of input features
- `target`: Target column name

### Troubleshooting

**Missing columns error**: Ensure your CSV contains all features listed in `model_config.yaml`

**Import errors**: Verify all dependencies are installed: `pip install -r requirements.txt`

**Registry corruption**: The script handles corrupted registries automatically by creating a new one

---

## 🤝 Contributing
1. Create feature branches off the integration branch (`integration/merge-phases-3-4-6-7-8-9`).
2. Follow the established folder conventions (`components/<feature>`, `pages/<Feature>.tsx`).
3. Use TanStack Query for data synchronization and Supabase Edge Functions for server-side orchestration.
4. Update documentation when introducing new domain concepts or workflows.
5. **Read the [System Audit Report](docs/SYSTEM_AUDIT_2025-11.md)** for known issues and best practices.

By keeping these guidelines in mind, the integrated TipsterHub platform remains maintainable, observable, and ready for further enhancements.
