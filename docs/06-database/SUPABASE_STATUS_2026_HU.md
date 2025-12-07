---
title: "Supabase Állapot 2026"
description: "Authoritative dokumentáció az aktuális Supabase séma, RLS-szabályzatok és pipeline-ek teljes képéről"
category: "06-database"
language: "hu"
version: "1.0.0"
last_updated: "2026-01-01"
status: "active"
related_docs:
  - "/docs/06-database/RLS_POLICIES.md"
  - "/docs/07-security/SECURITY_OVERVIEW.md"
  - "/docs/08-ml-pipeline/AUTO_REINFORCEMENT.md"
tags: ["supabase", "database", "schema", "rls", "edge-functions"]
---

# Supabase Állapot 2026 – Authoritative Documentation (Magyar)

**Utolsó frissítés:** 2026-01-01
**Verzió:** 1.0  
**Cél:** Konsolidált, autoritatív dokumentáció az aktuális Supabase séma, indexek, RLS-szabályzatok és data pipeline-ek teljes képéről.

## Tartalomjegyzék
1.  [Általános Áttekintés](#altalanos-attekintes)
2.  [Adatbázis Séma](#adatbazis-schema)
3.  [Row Level Security (RLS) Szabályzatok](#row-level-security-rls-szabalyzatok)
4.  [Edge Functions](#edge-functions)
5.  [Automatikus Reinforcement Pipeline](#automatikus-reinforcement-pipeline)
6.  [Ellenőrzési Pontok](#ellenorzesi-pontok)

---

## Általános Áttekintés

Ez a dokumentum a Supabase projekt aktuális állapotát tükrözi 2026-ban. Célja, hogy egyértelmű és részletes képet nyújtson az adatbázis sémájáról, a beállított RLS szabályzatokról, az edge function-ökről és az automatikus reinforcement pipeline működéséről.

### Célközönség
*   Fejlesztők
*   Adatbázis adminisztrátorok
*   Biztonsági szakértők
*   Auditorok

### Dokumentum Felépítése
A dokumentum logikusan van felépítve, hogy könnyen lehessen navigálni a különböző területek között. Minden fejezet részletes információkat tartalmaz az adott témáról, beleértve a konfigurációs beállításokat, a kód példákat és az ellenőrzési pontokat.

---

## Adatbázis Séma

Az adatbázis séma a projekt alapja. Fontos, hogy a séma jól legyen dokumentálva, hogy mindenki értse az adatbázis felépítését és a táblák közötti kapcsolatokat.

### Táblák
*   `users`: Felhasználói adatok tárolása (id, email, jelszó, stb.)
*   `teams`: Csapatok adatai (id, név, leírás)
*   `matches`: Mérkőzések adatai (id, csapat1_id, csapat2_id, időpont, eredmény)
*   `predictions`: Felhasználók által tett jóslatok (id, user_id, match_id, tipp)
*   `team_patterns`: Csapatokra vonatkozó minták (id, team_id, pattern_type, confidence, metadata)

### Indexek
Minden táblához tartoznak indexek, amelyek felgyorsítják az adatok lekérdezését. Az indexek karbantartása fontos a teljesítmény szempontjából.

*   `users_pkey`: Primary key index a `users` táblán
*   `teams_pkey`: Primary key index a `teams` táblán
*   `matches_pkey`: Primary key index a `matches` táblán
*   `predictions_pkey`: Primary key index a `predictions` táblán
*   `team_patterns_pkey`: Primary key index a `team_patterns` táblán

### Nézetek (Views)
Nézetek segítségével komplex lekérdezéseket lehet egyszerűsíteni és újrahasználni.

*   `user_predictions`: Felhasználók jóslatainak összesített nézete
*   `team_match_stats`: Csapatok mérkőzéseinek statisztikái

### Stored Procedures
Stored procedure-ek segítségével komplex adatbázis műveleteket lehet végrehajtani egyetlen hívással.

*   `calculate_team_stats(team_id UUID)`: Kiszámolja a csapat statisztikáit
*   `update_user_rankings()`: Frissíti a felhasználói rangsorokat

---

## Row Level Security (RLS) Szabályzatok

Az RLS szabályzatok biztosítják, hogy a felhasználók csak azokhoz az adatokhoz férhessenek hozzá, amelyekhez jogosultságuk van.

### `users` tábla
*   Csak a saját adatait láthatja/módosíthatja a felhasználó.
*   Adminisztrátorok minden adatot láthatnak/módosíthatnak.

### `teams` tábla
*   Bárki láthatja a csapatok adatait.
*   Csak a csapat adminisztrátorai módosíthatják a csapat adatait.

### `matches` tábla
*   Bárki láthatja a mérkőzések adatait.
*   Adminisztrátorok hozhatnak létre/módosíthatnak mérkőzéseket.

### `predictions` tábla
*   Csak a saját jóslatait láthatja/módosíthatja a felhasználó.
*   Adminisztrátorok minden jóslatot láthatnak.

### `team_patterns` tábla
*   Bárki láthatja a csapatokra vonatkozó mintákat.
*   Csak az analitikusok hozhatnak létre/módosíthatnak mintákat.

---

## Edge Functions

Az Edge Functions lehetővé teszik, hogy szerver oldali logikát futtassunk a Supabase infrastruktúráján.

### `team-streaks`
*   Lekérdezi a csapatokra vonatkozó nyerési sorozatokat.
*   Paraméterek: `team_id` vagy `team_name`.
*   Visszaadja a csapat azonosítóját és a nyerési sorozatokat.

### `team-transition-matrix`
*   Lekérdezi a csapatok átmeneti mátrixát (H/D/V).
*   Paraméterek: `team_id` vagy `team_name`, `maxMatches`.
*   Visszaadja a csapat azonosítóját, a mátrixot, a számlálókat és a minta méretét.

### `patterns-detect`
*   Észleli a csapatokra vonatkozó mintákat.
*   Paraméterek: `team_id` vagy `team_name`, `pattern_types`.
*   Visszaadja a `team_patterns` táblába beszúrt/frissített sorokat.

---

## Automatikus Reinforcement Pipeline

Az automatikus reinforcement pipeline célja, hogy automatikusan javítsa a predikciós modellek pontosságát.

### Adatgyűjtés
*   Mérkőzések eredményeinek automatikus gyűjtése.
*   Felhasználói jóslatok gyűjtése.

### Modell betanítás
*   Predikciós modellek automatikus betanítása az összegyűjtött adatok alapján.
*   Modellek validálása és finomhangolása.

### Visszacsatolás
*   A modellek teljesítményének monitorozása.
*   Automatikus visszacsatolás a modellek javításához.

---

## Ellenőrzési Pontok

*   Győződj meg róla, hogy az adatbázis séma megfelel a dokumentációnak.
*   Ellenőrizd az RLS szabályzatokat, hogy biztosítsd az adatok védelmét.
*   Teszteld az Edge Functions működését.
*   Monitorozd az automatikus reinforcement pipeline teljesítményét.
