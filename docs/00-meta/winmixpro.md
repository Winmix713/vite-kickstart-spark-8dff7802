# WinmixPro Admin Prototípus

A WinmixPro admin felület (oldalak 5–15) egy teljesen kliens oldali prototípus, amely a `src/winmixpro` könyvtár alatt található komponensekre, adathalmazokra és segédfüggvényekre épül. A cél az volt, hogy a végleges dashboard élmény (oldalanként magyar tartalommal) demózható legyen valódi backend kapcsolat nélkül.

## Technológiai stack

- **React 19**: Modern server component-ready framework
- **Tailwind CSS 4 (alpha)**: Nightly build CSS-first system
- **TypeScript 5.8**: Strict typing support
- **Vite 5**: Lightning-fast build and dev server
- **React Router v6**: Client-side routing for nested pages
- **@winmixpro alias**: Dedicated namespace for the WinmixPro feature module

## Elérhető oldalak és útvonalak

| Útvonal | Modul | Rövid leírás |
| --- | --- | --- |
| `/winmixpro/users` | **Felhasználók** | Jogosultságok, szűrők, aktív státuszok, szerepkör alapú lokalizált táblázat |
| `/winmixpro/jobs` | **Folyamatok** | Job kártyák, állapot kapcsolók, timeline widget |
| `/winmixpro/models` | **Model vezérlő** | Champion/challenger idősor, trafikelosztás, kártyák |
| `/winmixpro/health` | **Rendszer egészség** | Heatmap, aktív riasztások, SLA metrikák |
| `/winmixpro/integrations` | **Integrációk** | GitHub/Linear/Slack/Sentry mock státusz, ellenőrzés gomb |
| `/winmixpro/stats` | **Adatstatisztikák** | Gól eloszlás grafikon, scoreline lista, minőségi zászlók |
| `/winmixpro/feedback` | **Visszajelzés inbox** | Magyar inbox lista, státusz kapcsolás localStorage-ból |
| `/winmixpro/predictions` | **Predikciók** | Pontosság összevetés (model vs crowd vs piac) + közelgő mérkőzések |
| `/winmixpro/phase9` | **Phase 9 vezérlő** | Temporal decay, crowd súly és piaci mód beállítások |
| `/winmixpro/themes` | **Téma könyvtár** | Glass preset kártyák, kedvencek és reset action |
| `/winmixpro/ui-controls` | **UI kontroll mátrix** | Függőségi mátrix és pin lista |

A belső navigáció metaadatait a `src/winmixpro/constants.ts` fájlban található `WINMIX_PRO_NAV_SECTIONS` tömb tartalmazza; ezt használja a desktop sidebar és a mobil sheet menü is, így minden útvonal egységesen kap aktív állapotot.

## Mock adatok

- A teljes adatforrás a `src/winmixpro/data/index.ts` fájlban él (felhasználók, job timeline, modellek, integrációk, statisztikák stb.).
- A típusdefiníciók ugyanebben a fájlban találhatók, így a lapok típusbiztosan dolgoznak a mintákkal.
- Szükség esetén új mezők / magyar szövegek itt egészíthetők ki, minden oldal kizárólag innen olvas.

## localStorage kulcsok és reset

A módosítható állapotokat a `usePersistentState` hook írja-olvassa. A kulcsok listája a `WINMIX_PRO_STORAGE_KEYS` konstansban érhető el (pl. `winmixpro-users-filter`, `winmixpro-job-state`, `winmixpro-theme-active`).

- A **Téma könyvtár** oldalon található „localStorage reset” gomb végigiterál ezen a listán és törli az összes WinmixPro kulcsot.
- Dokumentációs célra a `docs/winmixpro.md` is rögzíti ezt a folyamatot – manuális resethez a böngésző konzolban futtatható: `WINMIX_PRO_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key))`.

## Reszponzív viselkedés és animációk

- Mobilon a sidebar automatikusan eltűnik, helyette a `WinmixProMobileHeader` egy `Sheet` alapú menüt kínál.
- A fő tartalom `winmixpro-scroll` osztályt kapott, amely egyedi, vékony görgetősávval jelenik meg.
- A `WinmixProPage` komponens minden oldalon shimmer skeletont és finom `fade-in` animációt használ a mock betöltés érzékeltetéséhez.
- A kártyák „glass” stílusúak (`glass-card` utility), és grid elrendezésben 1 oszlopról 2/3 oszlopra váltanak nagyobb kijelzőn.

## Navigáció és belépési pont

A WinmixPro felület bármely oldaláról elérhető a `/winmixpro` útvonal, a router automatikusan a felhasználói oldalra (`/winmixpro/users`) irányítja a látogatót. A meglévő admin felület (`/admin`) továbbra is Supabase-alapú, a WinmixPro rész OTT fut, ahol a prototípusokra van szükség.

## Folder Structure

```
src/winmixpro/
├── components/          # Shared UI components
│   ├── LoadingGrid.tsx
│   ├── MetricCard.tsx
│   ├── MobileHeader.tsx
│   ├── Page.tsx
│   └── SidebarNavigation.tsx
├── data/                # Mock data and types
│   └── index.ts
├── hooks/               # Custom React hooks
├── lib/                 # Utility functions (ready for expansion)
├── pages/               # Page components (11 admin pages)
│   ├── AdminUsers.tsx
│   ├── AdminJobs.tsx
│   ├── AdminModels.tsx
│   ├── AdminHealth.tsx
│   ├── AdminIntegrations.tsx
│   ├── AdminStats.tsx
│   ├── AdminFeedback.tsx
│   ├── AdminPredictions.tsx
│   ├── AdminPhase9.tsx
│   ├── AdminThemes.tsx
│   └── AdminUIControls.tsx
├── providers/           # Context providers (ready for expansion)
├── types/               # TypeScript interfaces (ready for expansion)
├── constants.ts         # Navigation, storage keys
├── index.ts             # Public exports
└── WinmixProLayout.tsx  # Main layout shell
```

## Development Setup

### Prerequisites

```bash
node >= 20.x
npm >= 10.x
```

### Installation & Build

```bash
# Install dependencies with legacy peer deps support
npm install --legacy-peer-deps

# Development server
npm run dev

# Production build
npm run build

# Linting and type checking
npm run lint
npm run type-check
```

### Path Aliases

The `@winmixpro` alias resolves to `src/winmixpro`:

- **Vite**: Configured in `vite.config.ts`
- **TypeScript**: Configured in `tsconfig.app.json`

Example import:
```typescript
import { WinmixProLayout } from '@winmixpro';
```

## QA és parancsok

Az új felület kizárólag frontend oldalon fut, így a klasszikus minőségbiztosítás továbbra is:

```bash
npm run lint
npm run test
npm run build
```

A `finish` folyamat automatikusan futtatja ezeket, így a WinmixPro kód hozzáadása nem igényel extra lépést.

## Tailwind CSS v4 Migration Notes

- **PostCSS Plugin**: Uses `@tailwindcss/postcss` for Tailwind v4 alpha support
- **Utilities**: Custom utilities in `src/index.css` use native CSS instead of `@apply` directives
- **Glass Morphism**: Implemented using `backdrop-filter` and rgba colors for cross-browser compatibility
- **Build Output**: Smaller CSS footprint with CSS-first design approach
