# WinMix TipsterHub – Projekt állapotértékelés és roadmap (HU)

Utolsó frissítés: 2025-11

Cél: rövid, őszinte állapotjelentés a teljes repository alapján, valamint gyakorlati roadmap a következő fő fókuszokra: Streak Analysis és Transition Matrix. A dokumentum a jelenlegi kódbázis tényleges állapotából indul ki (React + TypeScript + Vite frontend, Tailwind + shadcn-ui, TanStack Query; Supabase PostgreSQL + Edge Functions + RLS; RBAC; teszt- és e2e-keretrendszer), és összeveti a mellékelt értékelő szöveg megállapításaival.

---

1) Rövid repo‑áttekintés (tényállás)

- Frontend
  - React 18 + TypeScript (strict), Vite, Tailwind, shadcn-ui, TanStack Query, React Router
  - Komponens-könyvtár: src/components (patterns, dashboard, crossleague, monitoring, phase9 stb.)
  - Vizualizációk: Recharts + egyedi SVG (pl. CorrelationHeatmap)
- Backend/integrációk
  - Supabase (PostgreSQL, RLS), Auth + Role alapú védelem (admin/analyst/user)
  - Edge Functions (Deno) – például: analyze-match (pattern detektálás + predikció), predictions-track, patterns-detect, models-performance, phase9-* funkciók
- Dokumentáció és tooling
  - Kiterjedt dokumentáció a docs/ könyvtárban (USER_GUIDE, SYSTEM_AUDIT_2025-11, OPERATIONS_RUNBOOK, CONFIGURATION_REFERENCE stb.)
  - ESLint, Vitest, Playwright készre konfigurálva

Következmény: ez nem „csak localStorage-es MVP”, hanem egy integrált (Phases 3–9) Supabase‑alapú alkalmazás, modern frontenddel és Edge Functions réteggel.

---

2) Erősségek

- Alapos tervezés és dokumentáció
  - Részletes, több szintű dokumentáció (felhasználói + technikai + audit)
  - Konzekvens konvenciók, navigáció, komponens‑felosztás
- Technikai implementáció
  - TypeScript strict, jól tagolt modulok, shadcn‑ui komponensrendszer
  - RBAC, RLS, Edge Functions – iparági jó gyakorlatok
  - Tesztkeretek: Vitest + Playwright; Supabase ellenőrző szkriptek
- Funkcionalitás
  - Predikció flow (analyze-match), pattern detektálás (pl. home/away winning streak, H2H dominance, form), 
  - Analytics/Monitoring/Cross‑league felületek, Model governance (Phase 6), Phase 9 market + collaborative intelligence alapok

---

3) Megfigyelések és javaslatok

3.1 Dokumentáció vs. implementáció (az értékelő szöveghez képest)
- A mellékelt szöveg több helyen „localStorage‑es, adatbázis nélküli” MVP‑ként hivatkozik a rendszerre. A repo viszont már teljesértékű Supabase + Edge Functions backenddel, RBAC‑cal és RLS‑sel rendelkezik.
- Javaslat: a külső összefoglaló/sales‑jellegű dokumentumokat szinkronizálni a tényleges állapottal (MVP+ / V1.0‑közeli). A docs/ mappában a SYSTEM_AUDIT_2025-11 és a CONFIGURATION_REFERENCE jelenleg jó hivatkozási alap.

3.2 Adatkezelés és perzisztencia
- Tény: az alkalmazás Supabase adatbázissal dolgozik; localStorage alapvetően session és kliens-oldali cache célokra használt.
- Javaslat: az adatkezelési irányelveket (privacy, retention, export) foglaljuk össze külön „Data Management” fejezetben a USER_GUIDE vagy CONFIGURATION_REFERENCE kiegészítéseként.

3.3 Hiányzó/részleges kulcsfunkciók a Roadmap szerint
- Streak Analysis (dedikált UI + szolgáltatás)
  - A backendben a streak jellegű minták már részben detektálásra kerülnek (analyze-match). 
  - Javaslat: külön StreakAnalysis komponens a TeamDetail és/vagy League szinten:
    - Jelenlegi sorozat (győzelem/döntetlen/vereség) – összesített, valamint home/away bontásban
    - Leghosszabb sorozatok (all‑time vagy választható időablak)
    - Clean sheet sorozatok, BTTS sorozatok
    - Egységes definíciók: outcome kódolás (H/D/V), streak reset szabályok, minimális minta
  - Elfogadási kritériumok: gyors számítás (N legutóbbi meccs), jól látható badge/ikonok, linkelés a nyers meccslistához

- Transition Matrix (Markov‑alapú állapotváltási mátrix)
  - Cél: H → {H,D,V}, D → {H,D,V}, V → {H,D,V} átmeneti valószínűségek vizualizálása
  - Forrás: csapat (vagy liga) outcome‑sorozata időrendben
  - Módszertan:
    - Laplace‑simítás kicsi mintákra: P_ij = (count_ij + 1) / (row_total + K), ahol K=3 állapot
    - Normalizáció és input validáció
  - UI: TransitionMatrixHeatmap komponens (3×3 heatmap, labels: H,D,V), tooltip: nyers számlálások + valószínűség

- Vizualizációk
  - A jelenlegi Recharts + custom SVG jó alap. A heatmap és speciális mátrixok megvalósíthatók saját SVG‑vel (D3 nem kötelező).

- Kód strukturáltság (javasolt finomítás – opcionális, fokozatos)
  - components/
    - analysis/  (StreakAnalysis, TransitionMatrixHeatmap, …)
    - stats/     (TeamPerformance, LeagueBreakdown, …)
    - visualization/ (közös rajzoló primitívek)
  - services/
    - dataService.ts (Supabase lekérdezések, cache‑stratégia)
    - statsService.ts (statisztikai számítások, pl. streak, transition)
    - mlService.ts (későbbi ML pipeline)
  - utils/
    - calculations.ts, validators.ts, rngValidation.ts (jövőbeli RNG tesztek)
  - types/ (közös domain típusok)

- Tesztelés
  - Vitest egységtesztek a számoló függvényekhez: streak kalkuláció, transition mátrix, egyszerű validátorok
  - Playwright: TeamDetail felület regressziója (streak widget megjelenés, heatmap tooltipek)

- RNG validáció (tervezett kiterjesztés – későbbi)
  - chiSquareTest(observed, expected)
  - runsTest(sequence) → { zScore, isRandom }
  - detectAnomalies(matches) → outlier flagelés

---

4) Állapotösszegzés (röviden)

- Infrastruktúra: 90–100% (Supabase, Edge Functions, RBAC, RLS, dokumentáció)
- Eredmény elemzés: ~70–80% (pattern detektálás, analytics UI, kalibráció részben)
- Csapat teljesítmény: ~70–80% (dashboard, H2H, form; streak/transition dedikált UI hiányzik)
- Stratégia szimuláció: ~10–20% (komplett backtesting motor még nincs)
- ML pipeline: ~0–10% (tervezési hely, típusok megvannak; model governance készen áll)
- RNG validáció: 0–10% (tervezett)
- UI/UX: ~60–70% (narratívák, dashboardok; PDF export és narratív riport generálás később)

Becsült státusz: „MVP+ / V1.0‑közeli” – termékérett, további elemző modulokkal bővíthető.

---

5) Következő lépések (priorizált roadmap)

Rövid táv (1–2 hét)
- StreakAnalysis komponens (TeamDetail + League szint; current/longest, home/away, clean sheet/BTTS)
- TransitionMatrixHeatmap komponens (3×3, Laplace‑simítással)
- Dokumentáció frissítése: USER_GUIDE + README linkek, mini „Data Management” fejezet

Közép táv (1–2 hónap)
- Egyszerű backtesting motor (fix odds), Kelly‑kritérium kalkuláció
- RNG validációs tesztek (chi‑square, runs test), anomália detektálás
- Exportok (CSV, egyszerű PDF riport)

Hosszú táv (3–6 hónap)
- ML pipeline (feature engineering, RandomForest/XGBoost baseline)
- Liga‑/csapat‑klaszterezés, scatter plot vizualizációk
- Komparatív elemzés (valós ligák vs. RNG)

---

6) Minta TypeScript aláírások (irányadó)

```ts
// types
export type Outcome = 'H' | 'D' | 'V';
export interface Match { id: string; date: string; homeTeamId: string; awayTeamId: string; homeScore: number; awayScore: number; }

// 6.1 Streak kalkuláció
export interface StreakSummary {
  current: { type: Outcome; length: number } | null;
  longest: { type: Outcome; length: number } | null;
  home?: { current: StreakSummary['current']; longest: StreakSummary['longest'] };
  away?: { current: StreakSummary['current']; longest: StreakSummary['longest'] };
  cleanSheets?: { current: number; longest: number };
  btts?: { current: number; longest: number };
}
export function computeStreaks(matches: Match[], teamId: string): StreakSummary { /* impl idea */ return { current: null, longest: null }; }

// 6.2 Transition mátrix
export function buildTransitionMatrix(outcomes: Outcome[]) {
  // rows: from H,D,V; cols: to H,D,V
  const idx = { H: 0, D: 1, V: 2 } as const;
  const counts = [ [0,0,0], [0,0,0], [0,0,0] ];
  for (let i = 0; i < outcomes.length - 1; i++) counts[idx[outcomes[i]]][idx[outcomes[i+1]]]++;
  // Laplace smoothing (K=3)
  const K = 3; const mat = counts.map(row => {
    const total = row.reduce((a,b)=>a+b,0);
    return row.map(c => (c + 1) / (total + K));
  });
  return mat; // number[3][3]
}

// 6.3 RNG validáció (későbbre)
export function chiSquareTest(observed: number[], expected: number[]): number { /* χ² */ return 0; }
export function runsTest(sequence: Outcome[]): { zScore: number; isRandom: boolean } { return { zScore: 0, isRandom: true }; }
```

---

7) Záró megjegyzés

A projekt kiforrott alapokkal rendelkezik (architektúra, dokumentáció, teszt‑ és operációs eszköztár). A legnagyobb rövid távú érték a core analytics vizualizációk (Streaks, Transition Matrix) dedikált komponenseinek bevezetésével érhető el, amelyek közvetlenül növelik az elemzői produktivitást és a felhasználói értéket, miközben kis technikai kockázatot jelentenek.
