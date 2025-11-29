# Supabase Állapot 2026 – Authoritative Documentation (Magyar)

**Utolsó frissítés:** 2026-01-01
**Verzió:** 1.0  
**Cél:** Konsolidált, autoritatív dokumentáció az aktuális Supabase séma, indexek, RLS-szabályzatok és data pipeline-ek teljes képéről.

---

## Tartalomjegyzék

1. [Áttekintés & Projekt Összefüggés](#áttekintés--projekt-összefüggés)
2. [Adatbázis Séma – Táblák & Indexek](#adatbázis-séma--táblák--indexek)
3. [RLS Szabályzatok & Hozzáférés-vezérlés](#rls-szabályzatok--hozzáférés-vezérlés)
4. [Supabase Edge Functions – Funkciók & Domének](#supabase-edge-functions--funkciók--domének)
5. [Auto Reinforcement Pipeline](#auto-reinforcement-pipeline)
6. [System Logs Pipeline](#system-logs-pipeline)
7. [Operacionális Útmutató](#operacionális-útmutató)
8. [Kereszthivatkozások & Kapcsolódó Dokumentáció](#kereszthivatkozások--kapcsolódó-dokumentáció)

---

## Áttekintés & Projekt Összefüggés

### WinMix TipsterHub Platform

A WinMix TipsterHub egy komprehenzív foci analitika és előrejelzési platform, amely:
- **Automatizált adatbevétellel** működik (matchek, csapatok, ligák)
- **Multi-model predikciós rendszert** implementál (Champions/Challenger keret)
- **Valós idejű monitoring**-ot biztosít a model teljesítményre
- **Auto Reinforcement Loop**-pal automatikusan javítja a model pontosságát
- **Szisztematikus naplózást** végez a ML pipeline-ből

### Supabase Szerepe

Supabase-t a következőkhöz használjuk:
- **Adatbázis**: PostgreSQL alapú adat tárolás (RLS-sel védelembe helyezve)
- **Valós idő**: Edge Functions és triggerek automatizált workflows-hoz
- **Authentikáció**: JWT-alapú auth (Supabase Auth)
- **Storage**: Modellek, naplók, adathalmazok tárolása

---

## Adatbázis Séma – Táblák & Indexek

### 1. Referenciaadatok Táblák

#### `leagues` (Ligák)
- **Forrás**: `supabase/migrations/*.sql` (RLS baseline, comprehensive policies)
- **Oszlopok**:
  - `id` (UUID) – Egyedi azonosító
  - `name` (TEXT) – Liga neve (pl. "Premier League")
  - `country` (TEXT) – Ország
  - `season` (TEXT) – Szezon (pl. "2025-2026")
  - `home_win_percentage` (NUMERIC) – Otthoni nyerések aránya
  - `avg_goals_per_match` (NUMERIC) – Átlagos gólok száma
  - `btts_percentage` (NUMERIC) – Mindkét csapat szerez gól
  - `created_at` (TIMESTAMPTZ) – Létrehozás dátuma
- **Indexek**: Nincs specifikus index (seq scan typically acceptable)
- **RLS Políciák**:
  - `"Public read access to leagues"` – ANYONE SELECT
  - `"Admin full access to leagues"` – Adminok full access

#### `teams` (Csapatok)
- **Oszlopok**:
  - `id` (UUID) – Egyedi azonosító
  - `name` (TEXT) – Csapanév
  - `league_id` (UUID FK) – `leagues.id`-re hivatkozás
  - `created_at` (TIMESTAMPTZ)
- **Indexek**:
  - `teams_league_id_fkey` – Külső kulcs index
- **RLS Políciák**:
  - `"Public read access to teams"` – ANYONE SELECT
  - `"Admin full access to teams"` – Adminok full access

#### `matches` (Mérkőzések)
- **Oszlopok**:
  - `id` (UUID) – Egyedi azonosító
  - `league_id` (UUID FK) – `leagues.id`
  - `home_team_id` (UUID FK) – `teams.id`
  - `away_team_id` (UUID FK) – `teams.id`
  - `match_date` (TEXT) – Mérkőzés dátuma
  - `halftime_home_score`, `halftime_away_score` (INT) – Félidőig tartó gólok
  - `home_score`, `away_score` (INT) – Végeredmény
  - `status` (TEXT) – Estado mérkőzésének (pending, completed, cancelled)
  - `created_at` (TIMESTAMPTZ)
- **RLS Políciák**:
  - `"Public read access to matches"` – ANYONE SELECT
  - `"Admin full access to matches"` – Adminok modify

#### `pattern_templates` (Szablonmintázatok)
- **Oszlopok**:
  - `id` (UUID)
  - `name` (TEXT) – Szablonnév
  - `description` (TEXT)
  - `category` (TEXT) – Mintázat kategória
  - `base_confidence_boost` (NUMERIC) – Konfidencia növelés
  - `is_active` (BOOLEAN)
  - `created_at` (TIMESTAMPTZ)
- **RLS Políciák**:
  - `"Public read access to pattern templates"` – ANYONE SELECT
  - `"Admin full access to pattern templates"` – Adminok modify

#### `pattern_definitions` (Mintázat Definíciók)
- **Oszlopok**:
  - `id` (UUID)
  - `pattern_name` (TEXT)
  - `detection_function` (TEXT) – Detekció függvény neve
  - `min_sample_size` (INT) – Minimum minta méret
  - `min_confidence_threshold` (NUMERIC) – Minimális konfidencia küszöb
  - `priority` (INT) – Feldolgozási prioritás
  - `is_active` (BOOLEAN)
  - `created_at`, `updated_at` (TIMESTAMPTZ)
- **RLS Políciák**:
  - `"Analysts read access to pattern definitions"` – Analitikusok SELECT
  - `"Admin full access to pattern definitions"` – Adminok modify

---

### 2. Predikció Adatok Táblái

#### `predictions` (Előrejelzések)
- **Forrás**: `supabase/migrations/20251205140100_comprehensive_rls_policies.sql`
- **Oszlopok**:
  - `id` (UUID) – Egyedi előrejelzés ID
  - `match_id` (UUID FK) – `matches.id`
  - `predicted_outcome` (TEXT) – Várható kimenetel (pl. "home_win", "draw", "away_win")
  - `confidence_score` (NUMERIC) – Konfidencia pontszám (0–100 vagy 0–1)
  - `predicted_home_score`, `predicted_away_score` (INT) – Várható gólok
  - `btts_prediction` (BOOLEAN) – Mindkét csapat szerez-e
  - `over_under_prediction` (TEXT) – Over/Under előrejelzés
  - `actual_outcome` (TEXT) – Valós kimenetel (postolás után)
  - `was_correct` (BOOLEAN) – Pontosság flag
  - `calibration_error` (NUMERIC) – Kalibrálási hiba
  - `css_score` (NUMERIC) – CSS (Continuous Scoring System) pontszám
  - `prediction_factors` (JSONB) – Tényezőelemzés
  - `model_id` (UUID) – Model azonosító
  - `model_name` (TEXT)
  - `model_version` (TEXT)
  - `is_shadow_mode` (BOOLEAN) – Shadow mode jelzés
  - `created_at`, `evaluated_at` (TIMESTAMPTZ)
  - **Szensitív mezők (Explainability Safeguards):**
    - `overconfidence_flag` (BOOLEAN)
    - `downgraded_from_confidence` (NUMERIC)
    - `prediction_status` (TEXT) – 'normal', 'uncertain', 'blocked'
    - `blocked_reason` (TEXT)
    - `alternate_outcome` (TEXT)
    - `blocked_at` (TIMESTAMPTZ)
    - `reviewed_by` (UUID FK) – `user_profiles.id`
- **RLS Políciák**:
  - `"Public read access to predictions"` – ANYONE SELECT
  - `"Service write access to predictions"` – Service role INSERT/UPDATE
  - `"Admin full access to predictions"` – Adminok modify

#### `pattern_accuracy` (Mintázat Pontosság)
- **Oszlopok**:
  - `id` (UUID)
  - `template_id` (UUID FK) – `pattern_templates.id`
  - `accuracy_rate` (NUMERIC)
  - `correct_predictions` (INT)
  - `total_predictions` (INT)
  - `last_updated` (TIMESTAMPTZ)
- **Indexek**: `pattern_accuracy_template_id_fkey`

---

### 3. Felhasználó Adatok Táblái

#### `user_profiles` (Felhasználói Profilok)
- **Forrás**: `supabase/migrations/20251220120000_consolidate_user_profiles.sql`
- **Oszlopok**:
  - `id` (UUID) – Supabase auth.users.id
  - `email` (TEXT) – E-mail cím
  - `full_name` (TEXT)
  - `role` (ENUM) – "admin" | "analyst" | "user" | "viewer" | "demo"
  - `is_active` (BOOLEAN)
  - `created_at`, `updated_at` (TIMESTAMPTZ)
- **Indexek**: Nincs explicit index
- **RLS Políciák**:
  - Felhasználók csak maguk olvashatnak, adminok teljes hozzáférés
  - Service role teljes hozzáférés

#### `user_predictions` (Felhasználó Előrejelzések)
- **Oszlopok**: Hasonlóak a `predictions`-hoz, de felhasználó-specifikus
- **RLS Políciák**:
  - Felhasználók csak az sajátjaikat olvashatják/módosíthatják
  - Analitikusok és adminok teljes hozzáférés

#### `detected_patterns` (Detektált Mintázatok)
- **Oszlopok**:
  - `id` (UUID)
  - `match_id` (UUID FK)
  - `template_id` (UUID FK)
  - `pattern_data` (JSONB)
  - `confidence_contribution` (NUMERIC)
  - `detected_at` (TIMESTAMPTZ)
  - `created_by` (UUID FK)
- **RLS Políciák**:
  - Felhasználók csak az sajátjaikat olvashatják
  - Analitikusok/Adminok teljes hozzáférés

#### `team_patterns` (Csapat Mintázatok)
- **Oszlopok**:
  - `id` (UUID)
  - `team_id` (UUID FK) – `teams.id`
  - `pattern_name` (TEXT)
  - `pattern_type` (TEXT)
  - `confidence` (NUMERIC)
  - `strength` (NUMERIC)
  - `valid_from`, `valid_until` (TIMESTAMPTZ)
  - `prediction_impact` (NUMERIC)
  - `historical_accuracy` (NUMERIC)
  - `pattern_metadata` (JSONB)
  - `created_at`, `updated_at` (TIMESTAMPTZ)
  - `created_by` (UUID FK)
- **RLS Políciák**:
  - Felhasználók csak az sajátjaikat olvashatják
  - Analitikusok/Adminok módosíthatják

---

### 4. Model Management & Analytics Táblái

#### `model_performance` (Model Teljesítmény)
- **Forrás**: `supabase/migrations/20251205140100_comprehensive_rls_policies.sql`
- **Oszlopok**:
  - `id` (UUID)
  - `model_version` (TEXT) – Git commit hash vagy verziónév
  - `period_start`, `period_end` (TIMESTAMPTZ)
  - `total_predictions` (INT)
  - `accuracy_overall`, `accuracy_winner`, `accuracy_btts` (NUMERIC)
  - `confidence_calibration_score` (NUMERIC)
  - `league_breakdown` (JSONB)
  - `created_at` (TIMESTAMPTZ)
- **RLS Políciák**:
  - `"Analysts read access to model performance"` – SELECT
  - `"Admin full access to model performance"` – Modify

#### `model_comparison` (Model Összehasonlítás)
- **Oszlopok**:
  - `id` (UUID)
  - `model_a_id`, `model_b_id` (UUID)
  - `accuracy_diff` (NUMERIC)
  - `p_value` (NUMERIC) – Statisztikai szignifikancia
  - `winning_model` (UUID)
  - `sample_size` (INT)
  - `comparison_date` (TIMESTAMPTZ)
  - `created_at` (TIMESTAMPTZ)
- **RLS Políciák**:
  - Analitikusok és adminok olvashatják

#### `model_retraining_runs` (Model Újratanítás Futások)
- **Forrás**: `supabase/migrations/20251227120000_auto_reinforcement_model_retraining.sql`
- **Oszlopok**:
  - `id` (UUID)
  - `source` (TEXT CHECK) – "auto_daily" | "manual" | "decay_triggered"
  - `dataset_size` (INT) – Error minták száma
  - `fine_tune_flag` (BOOLEAN) – Fine-tune (true) vagy scratch (false)
  - `status` (TEXT CHECK) – "pending" | "running" | "completed" | "failed"
  - `metrics` (JSONB) – `{"accuracy": 0.85, "precision": 0.82, "recall": 0.88, "f1_score": 0.85}`
  - `started_at`, `completed_at` (TIMESTAMPTZ)
  - `log_url` (TEXT) – Link a Supabase Storage-ben tárolt naplóhoz
  - `error_message` (TEXT)
  - `triggered_by` (UUID FK) – `auth.users.id`
  - `created_at`, `updated_at` (TIMESTAMPTZ)
- **Indexek**:
  - `idx_retraining_status` – Status szűréshez
  - `idx_retraining_source` – Forrás szűréshez
  - `idx_retraining_created_at` – Created_at DESC (time-series queries)
  - `idx_retraining_started_at` – Started_at DESC
  - `idx_retraining_triggered_by` – User szűréshez
- **RLS Políciák**:
  - `"Enable read access for authenticated users"` – Hitelesített felhasználók SELECT
  - `"Enable insert for service role only"` – Service role INSERT
  - `"Enable update for service role only"` – Service role UPDATE

#### `model_retraining_requests` (Model Újratanítás Kérések)
- **Forrás**: `supabase/migrations/20251227120000_auto_reinforcement_model_retraining.sql`
- **Oszlopok**:
  - `id` (UUID)
  - `requested_by` (UUID FK) – `auth.users.id` (aki kérte)
  - `reason` (TEXT) – Felhasználó által megadott ok/leírás
  - `priority` (TEXT CHECK) – "low" | "normal" | "high"
  - `status` (TEXT CHECK) – "pending" | "processing" | "completed" | "cancelled"
  - `processed_at` (TIMESTAMPTZ)
  - `retraining_run_id` (UUID FK) – `model_retraining_runs.id`
  - `created_at`, `updated_at` (TIMESTAMPTZ)
- **Indexek**:
  - `idx_requests_pending` – WHERE status = 'pending'
  - `idx_requests_requested_by`
  - `idx_requests_priority`
  - `idx_requests_created_at` – Created_at DESC
- **RLS Políciák**:
  - `"Users can create requests"` – INSERT WHERE auth.uid() == requested_by
  - `"Users can read their own requests"` – SELECT WHERE auth.uid() == requested_by
  - `"Users can update their pending requests"` – UPDATE WHERE auth.uid() == requested_by AND status = 'pending'
  - `"Service role can manage all"` – Service role full

---

### 5. Rendszer Naplózás & Audit Táblái

#### `system_logs` (Rendszer Naplók)
- **Forrás**: `supabase/migrations/20260101001000_system_logs.sql`
- **Cél**: ML pipeline és más system komponensek naplózása
- **Oszlopok**:
  - `id` (UUID)
  - `component` (TEXT) – Komponens neve (pl. "train_model", "auto_reinforcement")
  - `status` (TEXT CHECK) – "info" | "warning" | "error"
  - `message` (TEXT) – Ember által olvasható üzenet
  - `details` (JSONB) – Strukturált metaadatok (stack trace, paraméterek, stb.)
  - `created_at` (TIMESTAMPTZ)
- **Indexek**:
  - `system_logs_component_created_at_idx` – Component és created_at DESC szűréshez
  - `system_logs_status_idx` – Status szűréshez
- **RLS Políciák**:
  - `"Service can insert system logs"` – Service role INSERT
  - `"Admins can view system logs"` – Admin role SELECT
  - `"Analysts can view system logs"` – Analyst role SELECT
  - `"Service can view system logs"` – Service role SELECT

#### `admin_audit_log` (Adminisztratív Audit Naplók)
- **Oszlopok**:
  - `id` (UUID)
  - `user_id` (UUID FK)
  - `action` (TEXT) – Végrehajtott művelet ("approve_prediction", "promote_model", stb.)
  - `details` (JSONB)
  - `ip_address` (INET)
  - `created_at` (TIMESTAMPTZ)
- **RLS Políciák**:
  - Adminok teljes hozzáférés
  - Analitikusok olvashatják

---

### 6. Explainability & Safeguards Táblái

#### `prediction_review_log` (Előrejelzés Áttekintési Napló)
- **Forrás**: `supabase/migrations/20260101002000_prediction_review_log.sql`
- **Cél**: Admin áttekintések nyomon követése a blokkolt/túlbiztos előrejelzésekhez
- **Oszlopok**:
  - `id` (UUID)
  - `prediction_id` (UUID FK) – `predictions.id`
  - `action` (TEXT CHECK) – "accepted" | "rejected"
  - `reviewer_id` (UUID FK) – `user_profiles.id`
  - `notes` (TEXT)
  - `previous_status` (TEXT)
  - `created_at` (TIMESTAMPTZ)
- **Indexek**:
  - `idx_prediction_review_log_prediction_id`
  - `idx_prediction_review_log_created_at_desc` – Created_at DESC
  - `idx_prediction_review_log_reviewer_id`
- **View: `blocked_predictions_for_review`**
  - JOIN: `predictions` + `matches` + `teams`
  - Szűrés: WHERE `overconfidence_flag = true` AND `prediction_status IN ('uncertain', 'blocked')`
  - Oszlopok: Prediction ID, kimenetel, konfidencia, blokk oka, csapat nevei, reviewer email
- **RLS Políciák**:
  - `admin_select_prediction_review_log` – Adminok SELECT
  - `analyst_select_prediction_review_log` – Analitikusok SELECT
  - `admin_insert_prediction_review_log` – Adminok INSERT (reviewer_id = auth.uid())
  - `service_insert_prediction_review_log` – Service role INSERT

#### `retrain_suggestion_log` (Újratanítás Javaslat Napló)
- **Forrás**: `supabase/migrations/20260101003000_retrain_suggestion_log.sql`
- **Cél**: Automatikus újratanítás javaslatok nyomon követése
- **Oszlopok**:
  - `id` (UUID)
  - `window_days` (INT) – Elemzési időablak napjainak száma
  - `accuracy` (NUMERIC) – Megfigyelt pontosság
  - `status` (TEXT CHECK) – "pending" | "accepted" | "dismissed"
  - `suggested_at` (TIMESTAMPTZ)
  - `acknowledged_at` (TIMESTAMPTZ)
  - `retraining_run_id` (UUID FK) – `model_retraining_runs.id`
  - `notes` (TEXT)
  - `created_at`, `updated_at` (TIMESTAMPTZ)
- **Indexek**:
  - `idx_retrain_suggestion_status`
  - `idx_retrain_suggestion_suggested_at`
  - `idx_retrain_suggestion_accuracy`
- **RLS Políciák**:
  - `"Admins can view all retrain suggestions"` – Admin SELECT
  - `"Admins can update retrain suggestions"` – Admin UPDATE
  - `"Service can manage pending retrain suggestions"` – Service role ALL

#### `feedback` (Felhasználói Visszajelzés)
- **Forrás**: `supabase/migrations/20260101004000_feedback_inbox.sql`
- **Cél**: Felhasználók által beküldött javítási javaslatok és vélemények
- **Oszlopok**:
  - `id` (UUID)
  - `prediction_id` (UUID FK) – `predictions.id`
  - `user_suggestion` (TEXT) – Felhasználó szövege
  - `submitted_by` (UUID FK) – `user_profiles.id`
  - `metadata` (JSONB) – Kontextuális adatok
  - `resolved` (BOOLEAN)
  - `created_at`, `updated_at` (TIMESTAMPTZ)
- **Indexek**:
  - `idx_feedback_created_at_desc`
  - `idx_feedback_prediction_id`
  - `idx_feedback_submitted_by`
  - `idx_feedback_resolved`
- **RLS Políciák**:
  - `"Users can insert own feedback"` – INSERT WHERE submitted_by = auth.uid()
  - `"Admins and analysts can select all feedback"` – SELECT (admin OR analyst)
  - `"Admins can update feedback"` – UPDATE (admin)
  - `"Admins can delete feedback"` – DELETE (admin)

---

### 7. Analytics & Intelligence Táblái

#### `model_performance` (Model Teljesítmény)
- Már fent: Model Management szekcióban

#### `cross_league_correlations` (Ligaközi Korrelációk)
- **Oszlopok**:
  - `id` (UUID)
  - `league_a_id`, `league_b_id` (UUID FK)
  - `correlation_coefficient` (NUMERIC)
  - `metrics` (JSONB)
  - `calculated_at` (TIMESTAMPTZ)
- **RLS Políciák**:
  - Analitikusok és adminok olvashatják

#### `meta_patterns` (Meta Mintázatok)
- **Oszlopok**:
  - `id` (UUID)
  - `pattern_name` (TEXT)
  - `description` (TEXT)
  - `pattern_definition` (JSONB)
  - `effectiveness_score` (NUMERIC)
  - `discovered_at` (TIMESTAMPTZ)
- **RLS Políciák**:
  - Analitikusok és adminok olvashatják

#### `league_characteristics` (Liga Karakterisztikák)
- **Oszlopok**:
  - `id` (UUID)
  - `league_id` (UUID FK)
  - `characteristics` (JSONB) – Lige jellemzői (tempó, védekezés, támadó stílus, stb.)
  - `analyzed_at` (TIMESTAMPTZ)
- **RLS Políciák**:
  - Analitikusok és adminok olvashatják

#### `system_health_metrics` (Rendszer Egészség Mérőszámok)
- **Forrás**: `supabase/migrations/20251222000000_system_health_metrics.sql`
- **Oszlopok**:
  - `id` (UUID)
  - `timestamp` (TIMESTAMPTZ)
  - `db_response_time` (NUMERIC) – ms-ben
  - `api_response_time` (NUMERIC)
  - `error_rate` (NUMERIC) – 0–1 scale
  - `active_users` (INT)
  - `memory_usage` (NUMERIC) – MB-ben
  - `cpu_usage` (NUMERIC) – %-ban
  - `cache_hit_rate` (NUMERIC)
  - `created_at` (TIMESTAMPTZ)
- **RLS Políciák**:
  - Analitikusok és adminok olvashatják

---

### 8. Phase 9 & Advanced Features Táblái

#### `phase9_settings` (Phase 9 Beállítások)
- **Oszlopok**:
  - `id` (INT PRIMARY KEY)
  - `collaborative_intelligence_enabled` (BOOLEAN)
  - `temporal_decay_enabled` (BOOLEAN)
  - `temporal_decay_rate` (NUMERIC)
  - `freshness_check_seconds` (INT)
  - `staleness_threshold_days` (INT)
  - `market_integration_mode` (TEXT)
  - `market_api_key` (TEXT ENCRYPTED)
  - `cross_league_enabled` (BOOLEAN)
  - `cross_league_league_count` (INT)
  - `cross_league_depth` (TEXT)
  - `updated_at` (TIMESTAMPTZ)
- **RLS Políciák**:
  - Adminok csak módosíthatják

#### `ensemble_predictor` (Ensemble Prediktor Eredmények)
- **Oszlopok**:
  - `id` (UUID)
  - `prediction_id` (UUID FK)
  - `model_votes` (JSONB) – Szavazatok minden modelltől
  - `ensemble_confidence` (NUMERIC)
  - `ensemble_outcome` (TEXT)
  - `aggregation_method` (TEXT)
  - `created_at` (TIMESTAMPTZ)
- **RLS Políciák**:
  - Public read, service write

#### `prediction_decay_alerts` (Előrejelzés Lecsengési Riasztások)
- **Forrás**: `supabase/migrations/20251226000000_prediction_decay_alerts.sql`
- **Oszlopok**:
  - `id` (UUID)
  - `model_version` (TEXT)
  - `accuracy_7d`, `accuracy_30d` (NUMERIC)
  - `decay_rate` (NUMERIC) – Lecsengési ütem
  - `alert_type` (TEXT) – "gentle_warning" | "moderate_concern" | "critical"
  - `triggered_at` (TIMESTAMPTZ)
  - `acknowledged_by` (UUID FK)
  - `acknowledged_at` (TIMESTAMPTZ)
  - `created_at` (TIMESTAMPTZ)
- **RLS Políciák**:
  - Analitikusok és adminok olvashatják/módosíthatják

---

## RLS Szabályzatok & Hozzáférés-vezérlés

### Felhasználói Szerepek

| Szerep | Leírás | Hozzáférés |
|--------|--------|-----------|
| **admin** | Teljes rendszeradminisztrátor | Minden tábla, teljes módosítás |
| **analyst** | Adatelemző | Analytics/model táblák, user patterns read, olvasási hozzáférés |
| **user** | Általános felhasználó | Saját predictions/patterns, public read |
| **viewer** | Korlátozottabb felhasználó | Public read csak |
| **demo** | Demo felhasználó | Rate-limited public read |

### RLS Politika Típusok

#### 1. **Nyílt Olvasás (Public Read)**
```sql
CREATE POLICY "Public read access to <table>" ON public.<table>
  FOR SELECT USING (true);
```
Táblák: `leagues`, `teams`, `matches`, `pattern_templates`, `predictions`

#### 2. **Felhasználó Saját Adatai**
```sql
CREATE POLICY "Users read own <table>" ON public.<table>
  FOR SELECT USING (created_by = auth.uid() OR created_by IS NULL);
```
Táblák: `detected_patterns`, `team_patterns`, `user_predictions`

#### 3. **Service Role Írás**
```sql
CREATE POLICY "Service write access to <table>" ON public.<table>
  FOR INSERT WITH CHECK (auth.role() = 'service_role');
```
Táblák: `model_retraining_runs`, `predictions`, `system_logs`

#### 4. **Analitikus & Admin Olvasás**
```sql
CREATE POLICY "Analysts read <table>" ON public.<table>
  FOR SELECT USING (public.is_analyst() OR public.is_admin());
```
Táblák: `model_performance`, `system_health_metrics`, `cross_league_correlations`, `system_logs`

#### 5. **Admin Teljes Hozzáférés**
```sql
CREATE POLICY "Admin full access to <table>" ON public.<table>
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
```
Táblák: Majdnem minden rendszer tábla

### Biztonsági Függvények

Az alábbi függvények a `supabase/migrations/*.sql` fájlokban vannak definiálva:

```sql
-- is_admin() – Jelenlegi felhasználó admin?
-- is_analyst() – Jelenlegi felhasználó analitikus?
-- is_service_role() – Jelenlegi hívás a service role-ból?
-- current_app_role() – Az alkalmazott szerep lekérése
```

### FORCE ROW LEVEL SECURITY

Minden tábla a `FORCE ROW LEVEL SECURITY` parancssal van elválasztva, amely biztosítja, hogy az RLS-politikák még az admin felhasználók által is betartódnak.

---

## Supabase Edge Functions – Funkciók & Domének

### Áttekintés

Az Edge Functions Deno-ban írott, a Supabase szervere által futtatott TypeScript függvények. Az alábbi funkciók a `supabase/functions/` könyvtárban találhatók.

### 1. **Admin Model Control** (Admin Model Vezérlés)
Célja: Admin felhasználók által a model-ok kezeléséhez szükséges funkciók.

#### `admin-model-system-status`
- **Leírás**: Teljes model rendszer állapot lekérése
- **JWT Ellenőrzés**: Igen
- **Hozzáférés**: Admin csak
- **Táblák**: `model_performance`, `model_comparison`, `model_retraining_runs`
- **Kimenet**: System status, aktív modellek, utolsó retraining

#### `admin-model-promote`
- **Leírás**: Model előléptetése (Champion-ként)
- **JWT Ellenőrzés**: Igen
- **Hozzáférés**: Admin csak
- **Táblák**: `model_performance`, audit log
- **Kimenet**: Promotions status

#### `admin-model-analytics`
- **Leírás**: Model teljesítmény analitika
- **JWT Ellenőrzés**: Igen
- **Hozzáférés**: Admin/Analyst
- **Táblák**: `model_performance`, `model_comparison`
- **Kimenet**: Performance charts, metrics

#### `admin-model-trigger-training`
- **Leírás**: Manuális retraining trigger
- **JWT Ellenőrzés**: Igen
- **Hozzáférés**: Admin
- **Táblák**: `model_retraining_requests`, `model_retraining_runs`
- **Kimenet**: Training job status

#### `admin-import-env`
- **Leírás**: Konfigurációs paraméterek importálása
- **JWT Ellenőrzés**: Igen
- **Hozzáférés**: Admin csak
- **Kimenet**: Import status

#### `admin-import-matches-csv`
- **Leírás**: CSV-ból tömeges meccs adat importálása
- **JWT Ellenőrzés**: Igen
- **Hozzáférés**: Admin csak
- **Táblák**: `matches`, `teams`, `leagues`
- **Kimenet**: Import summary (created, updated, failed count)

#### `admin-prediction-review`
- **Leírás**: Blokkolt/bizonytalan előrejelzések áttekintése
- **JWT Ellenőrzés**: Igen
- **Hozzáférés**: Admin/Analyst
- **Táblák**: `prediction_review_log`, `predictions`
- **Kimenet**: Review queue, reviewer metrics

---

### 2. **Jobs Management** (Feladatok Kezelése)
Célja: Cron jobs és ütemezett feladatok vezérlése.

#### `jobs-create`
- **Leírás**: Új ütemezett feladat létrehozása
- **Táblák**: `scheduled_jobs`, `job_execution_logs`
- **Input**: Job típus, ütemezési cron expression

#### `jobs-list`
- **Leírás**: Az összes ütemezett feladat listázása
- **Táblák**: `scheduled_jobs`
- **Kimenet**: Job lista, státuszok, utolsó futások

#### `jobs-logs`
- **Leírás**: Feladat futási naplók
- **Táblák**: `job_execution_logs`
- **Kimenet**: Log bejegyzések, timestamps, hibák

#### `jobs-toggle`
- **Leírás**: Feladat engedélyezése/letiltása
- **Táblák**: `scheduled_jobs`

#### `jobs-trigger`
- **Leírás**: Feladat azonnali futtatása
- **Táblák**: `job_execution_logs`

#### `jobs-delete`
- **Leírás**: Feladat törlése
- **Táblák**: `scheduled_jobs`

#### `jobs-update`
- **Leírás**: Feladat paraméterek módosítása
- **Táblák**: `scheduled_jobs`

#### `jobs-scheduler`
- **Leírás**: Cron alapú ütemezési engine
- **Cron Config**: `supabase/config.toml` [cron.retrain-suggestion-check] szakasz

---

### 3. **Monitoring & Health** (Monitoring & Egészség)
Célja: Rendszer egészség és anomális detektálás.

#### `monitoring-health`
- **Leírás**: System health metrics (DB response, API latency, error rate, CPU, memory)
- **Táblák**: `system_health_metrics`
- **Kimenet**: Real-time health status

#### `monitoring-metrics`
- **Leírás**: Detailed performance metrics
- **Táblák**: `model_performance`, `system_health_metrics`
- **Kimenet**: Performance dashboard data

#### `monitoring-alerts`
- **Leírás**: Rendszer riasztások és anomálok
- **Táblák**: `prediction_decay_alerts`, `system_logs`
- **Kimenet**: Alert list, severity levels

#### `monitoring-computation-graph`
- **Leírás**: Számítási gráf és pipeline vizualizáció
- **Táblák**: `computation_graph` (ha létezik)
- **Kimenet**: Pipeline topology, execution times

---

### 4. **Prediction & Feedback** (Előrejelzések & Visszajelzés)
Célja: Előrejelzési ciklus kezelése és felhasználói visszajelzés.

#### `get-predictions`
- **Leírás**: Előrejelzések lekérése (nyilvános)
- **JWT Ellenőrzés**: Nem
- **Táblák**: `predictions`, `matches`, `leagues`, `teams`
- **Kimenet**: Prediction lista, confidence scores, mérkőzés adatok

#### `analyze-match`
- **Leírás**: Egy adott mérkőzéshez novel prediction generálása
- **JWT Ellenőrzés**: Igen
- **Táblák**: `predictions`, `matches`, `detected_patterns`
- **Kimenet**: Analysis result, suggested prediction

#### `predictions-track`
- **Leírás**: Új előrejelzés nyomon követése
- **JWT Ellenőrzés**: Igen
- **Táblák**: `predictions`
- **Input**: Prediction data

#### `predictions-update-results`
- **Leírás**: Mérkőzés eredmények frissítése
- **JWT Ellenőrzés**: Igen
- **Táblák**: `predictions`, `matches`
- **Input**: Match results

#### `submit-feedback`
- **Leírás**: Felhasználó visszajelzés beküldése
- **JWT Ellenőrzés**: Igen
- **Táblák**: `feedback`
- **Input**: Prediction ID, user suggestion

#### `retrain-suggestion-check`
- **Leírás**: Újratanítás javaslatok ellenőrzése (cron trigger)
- **Cron**: `0 * * * *` (minden óra)
- **Táblák**: `retrain_suggestion_log`, `model_performance`
- **Output**: Pending suggestions

#### `retrain-suggestion-action`
- **Leírás**: Újratanítás javaslat elfogadása/elutasítása
- **JWT Ellenőrzés**: Igen
- **Táblák**: `retrain_suggestion_log`, `model_retraining_runs`

---

### 5. **Prediction Review & Admin Control** (Előrejelzés Áttekintés)
Célja: Admin által az Explainability Safeguards vizsgálata.

#### `admin-prediction-review` (már fent van Admin szekcióban)
- **Leírás**: Blokkolt/bizonytalan előrejelzések kezelése
- **Táblák**: `prediction_review_log`, `blocked_predictions_for_review`

---

### 6. **Pattern Detection & Analysis** (Mintázat Detekció & Analízis)
Célja: Mintázat felismerés és meta-pattern elemzés.

#### `patterns-detect`
- **Leírás**: Egy mérkőzésben mintázatok detektálása
- **Táblák**: `detected_patterns`, `pattern_templates`
- **Kimenet**: Detected patterns, confidence values

#### `patterns-team`
- **Leírás**: Csapat-specifikus mintázatok elemzése
- **Táblák**: `team_patterns`, `predictions`
- **Kimenet**: Team pattern insights

#### `patterns-verify`
- **Leírás**: Mintázat pontosság ellenőrzése
- **Táblák**: `pattern_accuracy`, `predictions`

#### `meta-patterns-discover`
- **Leírás**: Meta-mintázatok felismerése
- **Táblák**: `meta_patterns`, `detected_patterns`

#### `meta-patterns-apply`
- **Leírás**: Meta-mintázatok alkalmazása előrejelzéshez
- **Táblák**: `predictions`, `meta_patterns`

#### `rare-pattern-sync`
- **Leírás**: Ritka mintázatok szinkronizálása
- **Táblák**: Mintázat-related táblák

---

### 7. **Model Management & Comparison** (Model Kezelés)
Célja: Model verziók kezelése, összehasonlítása és promóciók.

#### `models-compare`
- **Leírás**: Két model összehasonlítása
- **Táblák**: `model_performance`, `model_comparison`
- **Kimenet**: Comparison metrics, statistical significance

#### `models-performance`
- **Leírás**: Model teljesítmény részletezetten
- **Táblák**: `model_performance`
- **Kimenet**: Performance breakdown by league, time period

#### `models-auto-prune`
- **Leírás**: Automatikus model pruning (lezárt modellek eltávolítása)
- **Táblák**: `model_performance`
- **Kimenet**: Pruning summary

---

### 8. **Cross-League Intelligence** (Ligaközi Intelligencia)
Célja: Phase 7 – Ligaközi korrelációk és metaanalízis.

#### `cross-league-analyze`
- **Leírás**: Ligaközi korrelációk és trendek elemzése
- **Táblák**: `cross_league_correlations`, `predictions`, `leagues`
- **Kimenet**: Correlation heatmap, trends

#### `cross-league-correlations`
- **Leírás**: Ligapárok közötti korreláció számítása
- **Táblák**: `cross_league_correlations`
- **Kimenet**: Correlation matrix

---

### 9. **Phase 9 Advanced Intelligence** (Phase 9 Fejlett Intelligencia)
Célja: Collaboratif market intelligence, temporal decay, self-improving systems.

#### `phase9-collaborative-intelligence`
- **Leírás**: Felhasználó crowd wisdom aggregálása
- **Táblák**: `crowd_wisdom`, `predictions`

#### `phase9-market-integration`
- **Leírás**: Odds market integrációja
- **Táblák**: `market_odds`, `value_bets`

#### `phase9-self-improving-system`
- **Leírás**: Önjavító ML engine
- **Táblák**: `model_retraining_runs`, `predictions`

#### `phase9-temporal-decay`
- **Leírás**: Temporal decay weighting alkalmazása
- **Táblák**: `phase9_settings`, `predictions`

---

### 10. **AI Chat** (AI Csevegés)
Célja: AI-assisted szöveg elemzés és javaslatok.

#### `ai-chat`
- **Leírás**: Generatív AI chat interface
- **JWT Ellenőrzés**: Nem (nyilvános)

---

### Config & JWT Verification

Az összes Edge Function konfigurációja az alábbiban van:

**`supabase/config.toml`**:
```toml
[cron.retrain-suggestion-check]
schedule = "0 * * * *"  # Óránként egy 0 perckor

[functions.admin-import-env]
verify_jwt = true       # JWT szükséges

[functions.get-predictions]
verify_jwt = false      # Nyilvános
```

---

## Auto Reinforcement Pipeline

### Áttekintés

Az Auto Reinforcement Loop egy teljesen automatizált sistem, amely:
1. **Napi alapon** (GitHub Actions) futtatódik
2. Magas konfidenciájú hibákat szűr az előrejelzésekből
3. Fine-tuning adathalmazt készít
4. Model-t újratanít az érvényes hibákra
5. Metrikákat gyűjt az `model_retraining_runs` táblában

### Adatáram

```
┌────────────────────────────────────┐
│  GitHub Actions Workflow           │ (naponta 2:00 UTC)
│  Vagy Manual Trigger (UI)          │
└─────────────┬──────────────────────┘
              │
              ▼
┌────────────────────────────────────┐
│  ml_pipeline/auto_reinforcement.py │ (orchestration)
│  • Load evaluation log             │
│  • Filter high-confidence errors   │
│  • Create fine-tuning dataset      │
│  • Call train_model.py             │
│  • Log metrics to system_logs      │
└─────────────┬──────────────────────┘
              │
              ▼
┌────────────────────────────────────┐
│  ml_pipeline/train_model.py        │ (model training)
│  • Fine-tune model                 │
│  • Calculate accuracy, precision   │
│  • Output metrics as JSON          │
│  • Log to system_logs              │
└─────────────┬──────────────────────┘
              │
              ▼
┌────────────────────────────────────┐
│  Supabase Database Updates         │
│ 1. INSERT model_retraining_runs    │
│ 2. UPDATE model_retraining_requests│
│ 3. INSERT system_logs              │
│ 4. Upload logs to Storage          │
└────────────────────────────────────┘
```

### Táblák

#### `model_retraining_runs`
- Futások nyomon követése
- `source`: "auto_daily", "manual", "decay_triggered"
- `status`: Futás állapota
- `metrics`: Training results

#### `model_retraining_requests`
- Manuális kérések sort
- Felhasználók által indítható az UI-ból
- Prioritás: "low", "normal", "high"

#### `system_logs`
- Pipeline logging
- `component`: "auto_reinforcement", "train_model"
- `status`: "info", "warning", "error"

### RLS Politikák

- `model_retraining_runs`: Service role INSERT/UPDATE, hitelesített SELECT
- `model_retraining_requests`: Felhasználó saját, service role manage all
- `system_logs`: Service role INSERT, admin/analyst SELECT

### Operáció

**Manuális Trigger**: Az UI-ből a felhasználó létrehoz egy `model_retraining_requests` rekordot. A backend cron job periodikusan lekérdezi a pending kéréseket és feldolgozza őket.

**Napi Trigger**: GitHub Actions workflow (`.github/workflows/auto-reinforcement.yml`) futtatódik naponta 2:00 UTC-n, amely meghívja az `auto_reinforcement.py` Python scriptet.

---

## System Logs Pipeline

### Áttekintés

A System Logs Pipeline a ML pipeline-ből történő komprehenzív naplózást biztosít. Az összes kritikus event (training indítása, sikeres befejezés, hibák) naplózódnak az adatbázisba.

### Táblák

#### `system_logs`
- **Cél**: Rendszer-szintű naplózás
- **Oszlopok**:
  - `component` (TEXT) – "train_model", "auto_reinforcement"
  - `status` (TEXT CHECK) – "info", "warning", "error"
  - `message` (TEXT) – Ember által olvasható üzenet
  - `details` (JSONB) – Stack trace, paraméterek, stb.
  - `created_at` (TIMESTAMPTZ)

### Indexek

- `system_logs_component_created_at_idx` – Component & time-series queries
- `system_logs_status_idx` – Status szűréshez

### RLS Politikák

- Service role INSERT
- Admin SELECT
- Analyst SELECT
- Service role SELECT

### Data Insertion (Python)

Az `ml_pipeline/supabase_client.py` fájl biztosítja a `insert_system_log()` helper függvényt:

```python
def insert_system_log(component, status, message, details=None):
    """Insert a log entry into system_logs table"""
    try:
        supabase.table('system_logs').insert({
            'component': component,
            'status': status,
            'message': message,
            'details': details or {}
        }).execute()
    except Exception as e:
        # Graceful error handling – no exception is raised
        pass
```

### Instrumentation Points

Az alábbi pontok naplózódnak:

1. **training start**: component="train_model", status="info"
2. **dataset prepared**: component="train_model", status="info"
3. **training success**: component="train_model", status="info", metrics JSONB
4. **training error**: component="train_model", status="error", stack trace

### Admin UI View

Az `src/components/admin/model-status/SystemLogTable.tsx` komponens:
- Lekérdezi az utolsó 10 log bejegyzést
- Auto-refresh-el 30 másodpercenként
- Color-coded status badges (error=red, warning=amber, info=secondary)
- Magyar lokalizáció ("Frissítés" gomb)

---

## Operacionális Útmutató

### 1. RLS Politikák Validálása

A `scripts/verify-sensitive-rls.sh` script a szenzitív táblák RLS-et ellenőrzi:

```bash
#!/bin/bash
# Ellenőrzési lépések:
# 1. Egyedi politikák száma a szenzitív táblákhoz
# 2. Enable FORCE ROW LEVEL SECURITY
# 3. Nincsenek permissive "enable all for all users" políciák
# 4. Service role, admin, analyst políciák léteznek

psql -U postgres -d winmix <<EOF
SELECT table_name, policyname, permissive
FROM pg_policies
WHERE schemaname = 'public'
  AND table_name IN (
    'predictions',
    'user_profiles',
    'model_retraining_runs',
    'system_logs',
    'prediction_review_log',
    'feedback'
  );
EOF
```

Futtatás:
```bash
bash scripts/verify-sensitive-rls.sh
```

### 2. Edge Functions Telepítése

Supabase Edge Function telepítése:

```bash
# Egyetlen funkció telepítése
supabase functions deploy admin-model-promote

# Összes funkció telepítése
supabase functions deploy --no-verify-jwt

# Függvény logok
supabase functions fetch-logs admin-model-promote

# Lokális tesztelés
supabase functions serve
```

### 3. Konfigurációs Fájl: supabase/config.toml

Az alábbi beállítások kritikus:

```toml
# Cron job ütemezés
[cron.retrain-suggestion-check]
schedule = "0 * * * *"  # Óránként

# JWT ellenőrzés (protected vs public functions)
[functions.admin-model-promote]
verify_jwt = true       # Szükséges auth

[functions.get-predictions]
verify_jwt = false      # Nyilvános
```

### 4. Adatbázis Migrációk Alkalmazása

Új séma módosítások:

```bash
# Migrációs fájl létrehozása
supabase migration new <migration_name>

# Migráció lokálisan
supabase migration up

# Migráció remote
supabase db push
```

### 5. Model Retraining Trigger

Manuális trigger az UI-ből:
1. Navigáljon az `/monitoring` oldalra
2. Kattintson az "Auto Reinforcement Status" kártyán a "Retraining Trigger" gombra
3. Adjon meg egy okot
4. Nyomja meg a "Submit" gombra

A backend:
1. `model_retraining_requests` rekordot hoz létre
2. Status = "pending"
3. A Python cron job lekérdezi és feldolgozza az kéréseket

### 6. System Logs Megtekintése

Az admin dashboard-on (`/admin` vagy `/monitoring`):
- A "System Logs" tábla megjeleníti az utolsó log bejegyzéseket
- Szűrés status alapján
- Auto-refresh 30 másodpercenként

### 7. Adatbázis Performance Monitoring

**Lassú Queries Azonosítása**:
```sql
-- Futó queryek
SELECT query, query_start FROM pg_stat_statements WHERE mean_time > 1000;

-- Tábla méretei
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Index használat
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
```

### 8. Backup & Restore

```bash
# Backup
pg_dump -U postgres winmix > backup.sql

# Restore
psql -U postgres -d winmix < backup.sql

# Supabase backup (remote)
supabase db pull
```

---

## Kereszthivatkozások & Kapcsolódó Dokumentáció

### Szorosan Kapcsolódó Dokumentáció

- **[docs/AUTO_REINFORCEMENT.md](./AUTO_REINFORCEMENT.md)** – Auto Reinforcement Loop részletei, Python ML pipeline, konfigurációs útmutató
- **[docs/SYSTEM_LOGS_IMPLEMENTATION.md](./SYSTEM_LOGS_IMPLEMENTATION.md)** – System Logs implementation, admin UI integrációja
- **[docs/EXPLAINABILITY_SAFEGUARDS.md](./EXPLAINABILITY_SAFEGUARDS.md)** – Explainability Safeguards, overconfidence flag, prediction blocking
- **[docs/ADMIN_MODEL_STATUS_DASHBOARD.md](./ADMIN_MODEL_STATUS_DASHBOARD.md)** – Admin model status UI, monitoring integráció

### Supabase Architecture Dokumentáció

- **[docs/RLS_IMPLEMENTATION_SUMMARY.md](./RLS_IMPLEMENTATION_SUMMARY.md)** – RLS políciák áttekintése, security functions
- **[docs/SECURITY_IMPLEMENTATION_SUMMARY.md](./SECURITY_IMPLEMENTATION_SUMMARY.md)** – Kezeleti biztonsági összefoglaló
- **[docs/SENSITIVE_TABLES_RLS.md](./SENSITIVE_TABLES_RLS.md)** – Szenzitív táblák RLS detailjai
- **[docs/EDGE_FUNCTIONS_RBAC.md](./EDGE_FUNCTIONS_RBAC.md)** – Edge Functions RBAC & JWT enforcement

### Phase-Specific Dokumentáció

- **[docs/PHASE9_IMPLEMENTATION.md](./PHASE9_IMPLEMENTATION.md)** – Phase 9 collaborative intelligence, temporal decay
- **[docs/ADMIN_PANEL_EXTENDED_MVP.md](./ADMIN_PANEL_EXTENDED_MVP.md)** – Admin panel UI & funkcionalitás
- **[docs/OPERATIONS_RUNBOOK.md](./OPERATIONS_RUNBOOK.md)** – Operációs runbook, troubleshooting

### Általános Architektúra Dokumentáció

- **[README.md](../README.md)** – Platform áttekintés, feature overview, navigation
- **[docs/CONFIGURATION_REFERENCE.md](./CONFIGURATION_REFERENCE.md)** – Konfigurációs referencia
- **[docs/AUTHENTICATION.md](./AUTHENTICATION.md)** – Authentikációs rendszer leírása

---

## Összegzés & Checklist

### Telepítés Előtti Ellenőrzés

- [ ] Összes migráció alkalmazva (`supabase migration up` vagy `supabase db push`)
- [ ] RLS politikák engedélyezve és tesztelt (`verify-sensitive-rls.sh`)
- [ ] Edge Functions feltöltve (`supabase functions deploy`)
- [ ] Konfigurációs fájl (`supabase/config.toml`) helyes JWT beállításokkal
- [ ] Auto Reinforcement Loop naplózás működik (tesztelés: manual trigger)
- [ ] System Logs pipeline működik (admin UI megjelenik)

### Rendszeres Monitorozás

- [ ] System health metrics normálisak (`monitoring-health` endpoint)
- [ ] Model retraining futások sikeres (napi alapon)
- [ ] System logs nincs hibaokkal tele (admin dashboard)
- [ ] Database performance jó (indexek működnek, slow queries nincsenek)

### Hibaelhárítás

**Probléma**: System logs nem naplózódnak
- Ellenőrizze: `system_logs` tábla RLS política SERVICE_ROLE INSERT engedélyez-e
- Ellenőrizze: Python supabase_client.py `insert_system_log()` try-catch blokkja van-e

**Probléma**: Model retraining kérések feldolgozatlanok
- Ellenőrizze: `model_retraining_requests` tábla RLS política
- Ellenőrizze: Python cron job fut-e (GitHub Actions workflow vagy local scheduler)

**Probléma**: Admin predictions/logs nem látható
- Ellenőrizze: Felhasználó role = "admin" az `user_profiles` táblában
- Ellenőrizze: Edge Function JWT verifikáció engedélyezve van-e

---

**Dokumentáció verzió**: 1.0  
**Utolsó frissítés**: 2026-01-01  
**Szerzők**: Platform Engineering Team  
**Státusz**: Aktív
