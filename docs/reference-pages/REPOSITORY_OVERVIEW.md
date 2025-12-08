# WinMix TipsterHub - Repository Overview

## 1. Projekt Overview

### Projekt Célja és Típusa
A **WinMix TipsterHub** egy komplett focielemzési és predikciós platform, amely integrálja a 3-9. fázisban fejlesztett összes képességet egyetlen koherens rendszerbe. Az alkalmazás automatizált adatfeldolgozást, modellelemzést, cross-league intelligenciát, monitorozást és önjavító piaci együttműködési funkciókat ötvöz egy modern React + Supabase stack-en.

### Technológia Stack
- **Frontend**: React 18 + Vite + TypeScript
- **Styling**: Tailwind CSS + shadcn-ui komponensek
- **State Management**: TanStack Query
- **Routing**: React Router DOM
- **Backend**: Supabase (Auth + Database + Edge Functions)
- **Telemetry**: Sentry + Cloudflare Analytics
- **Testing**: Vitest (unit/integration) + Playwright (e2e)
- **Build Tool**: Vite + SWC

### Verzió és Dependencies
- **Verzió**: 0.0.0
- **Package Manager**: npm (package-lock.json)
- **Node Version**: Kompatibilis a legfrissebb LTS verziókkal
- **Major Dependencies**: 
  - React: ^18.3.1
  - @supabase/supabase-js: ^2.78.0
  - @tanstack/react-query: ^5.83.0
  - React Router DOM: ^6.30.1

---

## 2. Mappastruktúra & Szervezés

### Gyökér Szint
```
/home/engine/project/
├── .github/                 # GitHub Actions workflow-ok
├── .gitignore              # Git ignore szabályok
├── 8888/                   # Build kimenet (ha van)
├── docs/                   # Projekt dokumentáció
├── e2e/                    # Playwright e2e tesztek
├── node_modules/           # npm csomagok
├── public/                 # Statikus asset-ek
├── scripts/                # Build és utility script-ek
├── src/                    # Fő forráskód
├── supabase/               # Supabase konfiguráció és Edge Functions
├── package.json            # Projekt függőségek
├── vite.config.ts          # Vite konfiguráció
├── tailwind.config.ts      # Tailwind konfiguráció
├── tsconfig.json           # TypeScript konfiguráció
├── playwright.config.ts    # Playwright konfiguráció
├── vitest.config.ts        # Vitest konfiguráció
└── .env.example            # Environment változók sablonja
```

### Főbb Direktóriumok és Tartalmuk

#### `/src/` - Fő Forráskód
```
src/
├── components/             # React komponensek
│   ├── ui/                # shadcn-ui komponensek (55 db)
│   ├── admin/             # Admin specifikus komponensek
│   ├── analysis/          # Analitikai komponensek
│   ├── common/            # Közös komponensek
│   ├── crossleague/       # Cross-league komponensek
│   ├── dashboard/         # Dashboard komponensek
│   ├── jobs/              # Job management komponensek
│   ├── models/            # Model management komponensek
│   ├── monitoring/        # Monitoring komponensek
│   ├── patterns/          # Pattern detection komponensek
│   └── phase9/            # Phase 9 komponensek
├── pages/                 # Route oldal komponensek
│   ├── admin/             # Admin oldalak
│   ├── Auth/              # Autentikációs oldalak
│   └── [főoldalak].tsx    # Fő funkció oldalak
├── integrations/          # Külső rendszer integrációk
│   ├── models/            # Model integrációk
│   └── supabase/          # Supabase kliens és típusok
├── lib/                   # Segédfüggvények és utility-k
├── types/                 # TypeScript type definíciók
├── hooks/                 # Custom React hook-ok
├── providers/             # Context provider-ök
├── utils/                 # Utility függvények
├── assets/                # Asset-ek (képek, ikonok)
└── test/                  # Teszt segédek
```

#### `/supabase/` - Backend Konfiguráció
```
supabase/
├── functions/             # Edge Functions (38 db)
│   ├── _shared/           # Közös segédfüggvények
│   ├── admin-*/           # Admin funkciók
│   ├── jobs-*/            # Job management
│   ├── models-*/          # Model műveletek
│   ├── monitoring-*/      # Monitoring
│   ├── patterns-*/        # Pattern detection
│   └── phase9-*/          # Phase 9 funkciók
├── migrations/            # Adatbázis migrációk
├── policies/              # RLS szabályok
└── tests/                 # Backend tesztek
```

#### `/docs/` - Dokumentáció
```
docs/
├── ADMIN_PANEL_EXTENDED_MVP.md
├── ANALYTICS_FEATURES.md
├── API_REFERENCE.md
├── AUTHENTICATION.md
├── FEATURE_FLAGS_GUIDE.md
├── PHASE9_IMPLEMENTATION.md
├── SECURITY_IMPLEMENTATION.md
├── TESTING_GUIDE.md
└── [további 40+ dokumentum]
```

### Fájltípusok és Kiterjesztések
- **`.tsx/.ts`**: TypeScript React komponensek és logika
- **`.json`**: Konfigurációs fájlok (package.json, tsconfig.json)
- **`.md`**: Dokumentáció
- **`.css`**: Stylusok (Tailwind)
- **`.spec.ts`**: Playwright e2e tesztek
- **`.test.ts/.test.tsx`**: Vitest unit/integration tesztek
- **`.mjs`**: Node.js script-ek
- **`.sh`**: Shell script-ek

---

## 3. Frontend Architektúra

### React Komponensek Szervezése

#### Komponens Hierarchia
```
App.tsx
├── QueryClientProvider (TanStack Query)
├── TooltipProvider
├── BrowserRouter
├── AuthProvider
├── ErrorBoundary
└── AppRoutes
    ├── Public Routes
    ├── Protected Routes (AuthGate)
    └── Admin Routes (RoleGate)
```

#### Fő Komponens Kategóriák

##### 1. Layout Komponensek
- **AppRoutes.tsx**: Route konfiguráció és lazy loading
- **Header.tsx**: Fő navigációs fejléc
- **Sidebar.tsx**: Oldalsó navigáció
- **Footer.tsx**: Lábléc
- **TopBar.tsx**: Felső státusz sor

##### 2. Feature Komponensek
- **PredictionDisplay.tsx**: Predikció megjelenítés
- **MatchSelection.tsx**: Meccsválasztás
- **TeamStatisticsTable.tsx**: Csapat statisztikák
- **HeroSection.tsx**: Fő hero szekció
- **ControlPanel.tsx**: Vezérlő panel

##### 3. UI Komponensek (shadcn-ui)
55 db shadcn-ui komponens a `/src/components/ui/` mappában:
- **Form komponensek**: input.tsx, button.tsx, form.tsx
- **Layout komponensek**: card.tsx, dialog.tsx, sheet.tsx
- **Navigation**: breadcrumb.tsx, menubar.tsx, tabs.tsx
- **Feedback**: toast.tsx, alert.tsx, sonner.tsx
- **Data display**: table.tsx, badge.tsx, avatar.tsx
- **Charts**: chart.tsx (recharts integráció)

### State Management (TanStack Query)

#### Query Kliens Konfiguráció
```typescript
const queryClient = new QueryClient();
// Globális konfiguráció a Vite config-ban
// Cache, retry, staleTime beállítások
```

#### Főbb Query Kategóriák
- **Auth Queries**: Felhasználói adatok, profilok
- **Data Queries**: Meccsek, csapatok, ligák
- **Analytics Queries**: Model teljesítmény, statisztikák
- **Job Queries**: Scheduled jobs állapotok
- **Monitoring Queries**: Rendszer metrikák

### Pages Szervezés

#### Főbb Route-ok
- **`/`**: Index oldal (HeroSection)
- **`/auth/login`**: Bejelentkezés
- **`/auth/signup`**: Regisztráció
- **`/dashboard`**: Fő dashboard
- **`/predictions`**: Predikciók
- **`/matches`**: Meccsek
- **`/teams`**: Csapatok
- **`/leagues`**: Ligák
- **`/analytics`**: Analitika (Phase 4+)
- **`/models`**: Modellek (Phase 6+)
- **`/crossleague`**: Cross-league (Phase 7+)
- **`/monitoring`**: Monitorozás (Phase 8+)
- **`/phase9`**: Phase 9 funkciók
- **`/admin/*`**: Admin panel

#### Lazy Loading Stratégia
Nehéz komponensek lazy loading segítségével:
```typescript
const ModelsPage = React.lazy(() => import('@/pages/ModelsPage'));
const MonitoringPage = React.lazy(() => import('@/pages/MonitoringPage'));
// stb.
```

---

## 4. Backend & API Integráció

### Supabase Kliens Konfiguráció

#### Kliens Setup
```typescript
// src/integrations/supabase/client.ts
export const supabase = createClient<Database>(
  NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
    }
  }
);
```

#### Típusos Adatbázis Hozzáférés
- **Database types**: `src/integrations/supabase/types.ts` (24,513 sor)
- **Auto-generated típusok**: Supabase CLI által generált
- **Typed queries**: Teljes TypeScript támogatás

### Edge Functions Listája és Célja

#### Job Management (8 db)
- **jobs-list**: Job-ok listázása
- **jobs-logs**: Logok lekérése
- **jobs-create**: Job létrehozás
- **jobs-delete**: Job törlés
- **jobs-toggle**: Job enable/disable
- **jobs-trigger**: Manuális indítás
- **jobs-update**: Job frissítés
- **jobs-scheduler**: Cron scheduler

#### Model Management (5 db)
- **models-performance**: Model teljesítmény
- **models-compare**: Model összehasonlítás
- **models-auto-prune**: Auto prune
- **analyze-match**: Meccs analízis
- **get-predictions**: Predikciók lekérése

#### Pattern Detection (4 db)
- **patterns-detect**: Pattern detekció
- **patterns-verify**: Pattern verifikáció
- **patterns-team**: Csapat pattern-ek
- **meta-patterns-discover**: Meta pattern felfedezés
- **meta-patterns-apply**: Meta pattern alkalmazás

#### Monitoring (4 db)
- **monitoring-health**: Rendszer egészség
- **monitoring-metrics**: Metrikák
- **monitoring-alerts**: Riasztások
- **monitoring-computation-graph**: Számítási gráf

#### Phase 9 Advanced (4 db)
- **phase9-collaborative-intelligence**: Kollaboratív intelligencia
- **phase9-market-integration**: Piaci integráció
- **phase9-self-improving-system**: Önjavító rendszer
- **phase9-temporal-decay**: Időbeli dekádosás

#### Cross-League (2 db)
- **cross-league-analyze**: Cross-league analízis
- **cross-league-correlations**: Korrelációk

#### Admin (3 db)
- **admin-import-env**: Environment import
- **admin-import-matches-csv**: CSV import
- **submit-feedback**: Feedback beküldés

### API Végpontok és Típusok

#### Auth Endpoints
- **POST /auth/v1/signup**: Regisztráció
- **POST /auth/v1/token**: Bejelentkezés
- **POST /auth/v1/logout**: Kijelentkezés
- **GET /auth/v1/user**: Felhasználói adatok

#### Database Endpoints
- **REST API**: Auto-generated Supabase REST
- **Realtime**: WebSocket alapú valós idejű frissítések
- **RLS**: Row Level Security minden táblán

#### Edge Functions Endpoints
- **POST /functions/v1/{function-name}**: Edge Function hívás
- **CORS**: Minden function CORS beállítva
- **Auth**: JWT token alapú authentikáció

---

## 5. Funkciók & Feature-ek

### Major Feature-ök Rövid Leírása

#### 1. Prediction System
- **Match Selection**: Meccsválasztás ligák és csapatok szerint
- **Score Input**: Pontszám beküldés halftime és fulltime
- **Prediction Display**: Predikciók megjelenítése vizualizációval
- **Results Tracking**: Eredmények követése és statisztikák

#### 2. Analytics Dashboard (Phase 4+)
- **Model Performance**: Modellek teljesítményének követése
- **Feedback Loop**: Felhasználói visszajelzések gyűjtése
- **Pattern Detection**: Mintázatok felismerése
- **Statistical Analysis**: Statisztikai elemzések

#### 3. Model Management (Phase 6+)
- **Champion/Challenger**: Model versenyeztetés
- **Model Comparison**: Modellek összehasonlítása
- **Auto-pruning**: Automatikus model tisztítás
- **Performance Metrics**: Teljesítménymetrikák

#### 4. Cross-League Intelligence (Phase 7+)
- **Correlation Analysis**: Ligák közötti korrelációk
- **Radar Charts**: Ligák összehasonlítása
- **Meta Patterns**: Meta mintázatok felfedezése
- **League Comparison**: Ligák összehasonlító analízis

#### 5. Monitoring & Visualization (Phase 8+)
- **System Health**: Rendszer állapot monitorozása
- **Compute Metrics**: Számítási metrikák
- **Alert System**: Riasztási rendszer
- **Anomaly Detection**: Anomália detekció

#### 6. Phase 9 Collaborative Intelligence
- **Temporal Decay**: Időbeli dekádosás súlyozás
- **Self-Improving**: Önjavító rendszerek
- **Market Integration**: Piaci adatok integrációja
- **Collaborative Learning**: Kollaboratív tanulás

#### 7. Admin Console
- **User Management**: Felhasználó kezelése
- **Job Management**: Scheduled jobs kezelése
- **Environment Variables**: Környezeti változók kezelése
- **Health Dashboard**: Rendszer egészség admin nézetben
- **Integrations**: Külső integrációk kezelése

### Feature Flags Implementációja

#### Phase-alapú Feature Flags
```typescript
// src/providers/FeatureFlagsProvider.tsx
interface FeatureFlag {
  phase5: boolean;    // Advanced pattern detection
  phase6: boolean;    // Model evaluation & feedback loop  
  phase7: boolean;    // Cross-league intelligence
  phase8: boolean;    // Monitoring & visualization
  phase9: boolean;    // Collaborative market intelligence
}
```

#### Környezeti Változók
- **VITE_FEATURE_PHASE5**: Pattern detection engedélyezése
- **VITE_FEATURE_PHASE6**: Model evaluation engedélyezése
- **VITE_FEATURE_PHASE7**: Cross-league engedélyezése
- **VITE_FEATURE_PHASE8**: Monitoring engedélyezése
- **VITE_FEATURE_PHASE9**: Phase 9 engedélyezése

#### Dinamikus Feature Toggle
- **Runtime ellenőrzés**: `usePhaseFlags()` hook
- **Conditional rendering**: Komponensek szűrése phase alapján
- **Route protection**: Route-ok védelme feature flag-ekkel

### Auth & Role-based Access Control

#### Felhasználói Szerepkörök
```typescript
export type UserRole = 'admin' | 'analyst' | 'user';
```

#### Auth Provider
- **AuthProvider**: Kontextus a felhasználói állapotnak
- **Session management**: Automatikus session frissítés
- **Profile fetching**: Felhasználói profil adatok
- **Token refresh**: Automatikus token frissítés

#### Role-based Access
- **RoleGate komponens**: Szerepkör alapú hozzáférés
- **Admin routes**: `/admin/*` csak admin szerepkörrel
- **Protected routes**: Authentikációhoz kötött útvonalak
- **Feature access**: Funkciók szűrése szerepkör alapján

#### Supabase Auth Integráció
- **Email/Password**: Alap authentikáció
- **Session storage**: LocalStorage alapú
- **JWT tokens**: Supabase JWT token-ek
- **RLS integration**: Adatbázis szintű jogosultságok

---

## 6. Telemetry & Monitoring

### Sentry Integráció

#### Konfiguráció
```typescript
// src/lib/sentry.ts
export const initSentry = (): void => {
  // Dinamikus Sentry betöltés
  // Error boundary integráció
  // Performance monitoring
};
```

#### Funkcionalitás
- **Error tracking**: JavaScript hibák követése
- **Performance monitoring**: Lassú betöltések észlelése
- **User feedback**: Felhasználói visszajelzések
- **Release tracking**: Verziókövetés

#### Environment Konfiguráció
- **VITE_SENTRY_DSN**: Sentry DSN
- **VITE_SENTRY_ENV**: Környezet (development/production)
- **Sample rates**: Tracing és replay sample rate-ek

### Cloudflare Analytics

#### Beacon Integráció
```typescript
// src/lib/cloudflare.ts
export const initCloudflareBeacon = (): void => {
  // Cloudflare beacon script betöltése
  // Web vitals követés
};
```

#### Metrikák
- **Page views**: Oldalmegtekintések
- **Core Web Vitals**: LCP, FID, CLS
- **Geolocation**: Földrajzi helyzet
- **Device info**: Eszközinformációk

### Monitoring & Analytics

#### Performance Monitoring
```typescript
// src/lib/performance-monitor.ts
export const initPerformanceMonitoring = (): void => {
  // Navigation timing
  // Resource timing
  // User interaction timing
};
```

#### Logolás
```typescript
// src/lib/logger.ts
import logger from '@/lib/logger';
// Strukturált logolás
// Szintek: error, warn, info, debug
```

#### Health Checks
- **Component health**: Komponens állapotok
- **API health**: API végpontok elérhetősége
- **Data freshness**: Adatfrissesség ellenőrzése
- **System metrics**: Rendszer metrikák

---

## 7. Tesztelés

### Vitest Setup

#### Konfiguráció
```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    coverage: {
      provider: "v8",
      thresholds: {
        statements: 40,
        branches: 30,
        functions: 35,
        lines: 40,
      },
    },
  },
});
```

#### Teszt Típusok
- **Unit tesztek**: Komponensek és utility függvények
- **Integration tesztek**: Komponens integrációk
- **API tesztek**: Supabase kliens tesztek
- **Mocking**: MSW (Mock Service Worker) használata

#### Coverage Küszöbök
- **Statements**: 40%
- **Branches**: 30%
- **Functions**: 35%
- **Lines**: 40%

### Playwright E2e Tesztek

#### Konfiguráció
```typescript
// playwright.config.ts
export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  fullyParallel: true,
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
});
```

#### E2e Tesztek
- **auth.spec.ts**: Autentikációs folyamatok
- **predictions.spec.ts**: Predikciós workflow-k
- **Cross-browser**: Chrome, Firefox, Safari támogatás
- **CI integráció**: GitHub Actionsben futtatás

### Teszt Fájlok Elhelyezkedése

#### Unit/Integration Tesztek
```
src/
├── __tests__/              # Globális tesztek
├── components/
│   └── *.test.tsx         # Komponens tesztek
├── lib/
│   └── *.test.ts          # Utility tesztek
├── hooks/
│   └── *.test.ts          # Hook tesztek
└── integrations/
    └── *.test.ts          # Integrációs tesztek
```

#### E2e Tesztek
```
e2e/
├── auth.spec.ts           # Autentikáció
├── predictions.spec.ts    # Predikciók
└── fixtures/              # Teszt adatok
```

---

## 8. Egyéb

### Environment Konfigurációk

#### Főbb Environment Változók
```bash
# Supabase
VITE_SUPABASE_URL="https://project.supabase.co"
VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIs..."

# Feature Flags
VITE_FEATURE_PHASE5="false"
VITE_FEATURE_PHASE6="false"
VITE_FEATURE_PHASE7="false"
VITE_FEATURE_PHASE8="false"
VITE_FEATURE_PHASE9="false"

# Phase 9
VITE_ODDS_API_KEY="your_api_key"
VITE_PHASE9_FEATURE_FLAGS="collaborative_intelligence:true"

# Telemetry
VITE_SENTRY_DSN=""
VITE_SENTRY_ENV="development"
VITE_CLOUDFLARE_BEACON_TOKEN=""
```

#### Backend Secrets
- **SUPABASE_SERVICE_ROLE_KEY**: Service role kulcs
- **CRON_SECRET**: Cron authentikáció
- **GITHUB_TOKEN**: GitHub integráció
- **LINEAR_API_KEY**: Linear integráció
- **SLACK_WEBHOOK_URL**: Slack integráció

### Build & Deployment Workflow

#### Vite Build Konfiguráció
```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'ui-vendor': ['@radix-ui/*'],
          'query-vendor': ['@tanstack/react-query'],
          'chart-vendor': ['recharts'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
});
```

#### Build Parancsok
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "build:dev": "vite build --mode development",
    "preview": "vite preview",
    "type-check": "tsc --noEmit",
    "lint": "eslint ."
  }
}
```

### GitHub Actions / CI-CD Setup

#### Workflow
```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:coverage
      - run: npm run test:e2e
      - run: npm run type-check
      - run: npm run lint
```

#### Teszt Script-ek
```json
{
  "test": "vitest",
  "test:coverage": "vitest --coverage",
  "test:e2e": "playwright test",
  "test:all": "npm run test:coverage && npm run test:e2e"
}
```

### docs/ Mappa Tartalma

#### Főbb Dokumentációs Kategóriák
- **Admin**: Admin panel dokumentáció
- **Auth**: Autentikációs útmutatók
- **API**: API referencia
- **Security**: Biztonsági implementáció
- **Testing**: Tesztelési útmutató
- **Phase 9**: Phase 9 specifikus dokumentáció
- **Operations**: Működési útmutatók

#### Kulcs Fontosságú Dokumentumok
- **QUICK_START.md**: Gyors kezdési útmutató
- **USER_GUIDE.md**: Felhasználói kézikönyv
- **SECURITY_IMPLEMENTATION.md**: Biztonsági implementáció
- **FEATURE_FLAGS_GUIDE.md**: Feature flags útmutató
- **PHASE9_IMPLEMENTATION.md**: Phase 9 implementáció

---

## Összegzés

A WinMix TipsterHub egy komplex, modern webalkalmazás, amely teljes körű megoldást nyújt focielemzésre és predikciókra. A projekt jól szervezett, skálázható architektúrával rendelkezik, amely támogatja a feature-alapú fejlesztést, a comprehensive tesztelést és a production-ready monitorozást.

### Kulcs Fontosságú Jellemzők
- **Modern Tech Stack**: React 18 + TypeScript + Vite
- **Komponens-alapú**: shadcn-ui + Tailwind CSS
- **Type-safe**: Teljes TypeScript támogatás
- **Skálázható Backend**: Supabase + Edge Functions
- **Feature Driven**: Phase-alapú feature flags
- **Comprehensive Testing**: Unit + Integration + E2e
- **Production Ready**: Monitoring + Error tracking
- **Well Documented**: Részletes dokumentáció

A repository strukturált és karbantartható, lehetővé téve a hatékony fejlesztést és a könnyű bővíthetőséget.