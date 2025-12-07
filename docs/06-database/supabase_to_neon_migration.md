# Supabase → Neon migrációs útmutató (HU)

Frissítve: 2025-11

Ez a dokumentum lépésről lépésre bemutatja, hogyan lehet a WinMix TipsterHub projektet a Supabase által hosztolt Postgres-ről a Neon szerverless Postgres-re átköltöztetni. Két megközelítést ismertetünk: fokozatos (hibrid) átállás és teljes kiváltás.

—

## 1) Áttekintés: Supabase vs. Neon

- Supabase: Postgres + Auth + Storage + Realtime + Edge Functions + PostgREST + RLS/JWT integráció.
- Neon: szerverless Postgres (autoscaling, branching). Nem tartalmaz Auth/Storage/Edge Functions/PostgREST szolgáltatásokat.

Következmény: ha csak az adatbázist cseréljük Neonra, az alkalmazásönmagában nem fog ugyanúgy működni a frontendből futó `supabase.from()` hívásokkal. Ezeket szerver-oldali rétegre (Edge/Worker/API) kell terelni, vagy PostgREST/Hasura alternatívát kell bevezetni.

—

## 2) Döntési fa és javasolt stratégia

- Opció A – Hibrid (fokozatos átállás, javasolt):
  - Auth, Storage, Edge Functions egyelőre marad Supabase-en.
  - Az app-táblák (matches, teams, leagues, stb.) Neon-ra költöznek.
  - A frontend közvetlen `supabase.from()` lekérdezéseit fokozatosan Edge/Worker API-endpontokra cseréljük, amelyek már közvetlenül a Neon DB-hez kapcsolódnak.
  - Előny: kicsi kockázat, visszagörgethető. Hátrány: átmeneti állapotban két DB végpont/SDK.

- Opció B – Teljes kiváltás (egylépéses áttérés):
  - Auth: kiváltás (pl. Clerk/Auth.js/Keycloak/Cognito), vagy saját auth-service.
  - Storage: S3/Cloudflare R2/Backblaze B2.
  - Edge Functions: Cloudflare Workers / Deno Deploy / Render/ Fly.io Node szolgáltatás.
  - Realtime: Pusher/Ably/Postgres LISTEN/NOTIFY-proxy.
  - Előny: hosszú távon egyszerű architektúra. Hátrány: nagyobb egyszeri változtatás.

A WinMix TipsterHub jelenlegi kódja erősen Supabase-központú (auth és több `supabase.from()` hívás), ezért a hibrid, fokozatos átállást javasoljuk.

—

## 3) Felkészülés: mit használ ma az app?

- Frontend:
  - Supabase Auth (login, session, RBAC profil `user_profiles` táblában)
  - Számos `supabase.from('...')` olvasás/írás (pl. Matches, Teams, Admin oldalak)
  - Supabase Edge Functions hívások (`supabase.functions.invoke`)
- Backend (Edge Functions / Deno):
  - Olvasás/aggregálás Supabase-ből (pl. team-streaks, team-transition-matrix)

Migráció hatása: a frontenden a közvetlen táblahívásokat (supabase.from) API-rétegre kell vinni, ha a DB Neonra költözik.

—

## 4) Adatbázis migráció: Supabase → Neon

1. Sémadump és adatmentés Supabase-ről
   - CLI-vel (fejlesztői környezetben):
     ```bash
     supabase db dump --data-only   > data.sql
     supabase db dump --schema-only > schema.sql
     # vagy egyben
     supabase db dump > full.sql
     ```
   - Vagy `pg_dump` használatával (API/DB endpoint a Supabase konzolról):
     ```bash
     pg_dump "postgresql://postgres:PASSWORD@db.<ref>.supabase.co:5432/postgres" \
       --format=plain --no-owner --no-privileges --encoding=UTF8 > full.sql
     ```

2. Supabase-specifikus objektumok áttekintése
   - Extensions: pg_graphql, pgsodium, http, stb. Nem mindegyik támogatott Neonon – auditáld és távolítsd el/módosítsd őket szükség esetén.
   - Trigger/fv-k: maradhatnak, ha standard Postgres. Supabase auth séma (auth.*) Neonon nem lesz automatikusan használható.

3. Neon projekt létrehozása
   - Hozz létre egy Neon projektet és adatbázist: https://neon.tech/
   - Másold ki a `NEON_DATABASE_URL` connection stringet (SSL kötelező).

4. Import Neonra
   - `psql`-lel:
     ```bash
     psql "$NEON_DATABASE_URL" -f schema.sql
     psql "$NEON_DATABASE_URL" -f data.sql
     ```
   - Ha egy fájlba dumpoltál:
     ```bash
     psql "$NEON_DATABASE_URL" -f full.sql
     ```

5. RLS/policy szabályok
   - Az RLS továbbra is Postgres oldali; azonban a Supabase-féle `auth.uid()` és JWT-claim környezet PostgREST nélkül nem áll rendelkezésre.
   - Megoldás: szerveroldali API/Edge Function réteg használata „service role”-lal + saját autorizáció (user/session azonosítás az API-ban), vagy PostgREST telepítése és JWT integráció.

—

## 5) Alkalmazás-konfiguráció

- Új környezeti változó (szerver/Edge/Worker):
  - `NEON_DATABASE_URL` – Neon Postgres connection string
- A repo Admin/Integrations oldala már számol ezzel a kulccsal, lásd: `src/pages/admin/IntegrationsPage.tsx` (Neon szekció).
- Frontend `.env` NEM tartalmazhat DB credent-eket. Csak szerver-oldal (Edge/Worker) láthatja a Neon URL-t.

—

## 6) Supabase Edge Function → Neon kapcsolat (példa)

Supabase Edge Functions Deno környezet. A Neonhoz ajánlott a serverless driver:

```ts
// Példa Deno + Neon serverless driverre
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { neon } from "https://esm.sh/@neondatabase/serverless@0.9.3";

serve(async (req) => {
  try {
    const dbUrl = Deno.env.get('NEON_DATABASE_URL');
    if (!dbUrl) return new Response('Missing NEON_DATABASE_URL', { status: 500 });

    const sql = neon(dbUrl);
    const rows = await sql`select id, name from teams order by name limit 10`;

    return new Response(JSON.stringify({ teams: rows }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500 });
  }
});
```

Megjegyzések:
- A fenti kód teljesen Supabase DB-től független. Az auth-ot és jogosultságot az API-n belül kell ellenőrizni (pl. Authorization header → Supabase Auth ellenőrzés, vagy saját JWT/Clerk stb.).
- Alternatíva: `deno_postgres` driver TLS-sel; a Neon SSL-t igényel.

—

## 7) Frontend refaktor – közvetlen táblahívások kiváltása

A kódbázisban több helyen használjuk a `supabase.from('...')` hívásokat (pl. MatchesPage, Admin oldalak). Ha a táblák Neonra költöznek, ezeket ki kell váltani API hívásokra.

Javasolt terv:
1. API réteg: hozz létre `src/integrations/api/*` vagy `src/lib/api.ts` alatt fetch-wrappert (TanStack Query kompatibilis), amely Edge/Worker végpontokat hív.
2. Edge/Worker végpontok: a kritikus olvasás/írás műveleteket implementáld Neonra kapcsolódva (lásd 6. fejezet). Minden endpoint végezzen jogosultság-ellenőrzést.
3. Fokozatos csere: UI komponensekben cseréld a `supabase.from` hívásokat az új API wrapperre. Kezdd a read-only listákkal.
4. Teszt: Vitest + Playwright – regressziós és E2E ellenőrzés.

Megjegyzés: a Supabase Auth maradhat a frontenden. A szerveroldali végpontok az Authorization fejléccel kapott Supabase JWT-t ellenőrizhetik a Supabase Auth API-n keresztül (vagy átállhatsz más authra is később).

—

## 8) Edge Functions, Streak/Transition analitika

Az új StreakAnalysis és TransitionMatrixHeatmap jelenleg Supabase Edge Functions-t hívnak. Ha a meccs/teams adatok Neonnal lesznek kiszolgálva, két út van:
- A meglévő Edge Functionök belsejét cseréled Neon-lekérdezésekre (lásd 6. fejezet), a publikus API változatlan marad.
- Vagy új Neon-alapú Worker/Edge szolgáltatásra költözteted az endpointokat, és a frontendben az `invoke` hívásokat sima `fetch`-re cseréled.

Átmenetileg a funkciók maradhatnak Supabase-en, csak a belső adatforrást (query-k) mutasd Neonra.

—

## 9) Realtime, Storage és egyéb szolgáltatások kiváltása

- Realtime: használhatsz Pusher/Ably-t, vagy építhetsz LISTEN/NOTIFY alapú köztes réteget.
- Storage: S3 kompatibilis tár (AWS S3, Cloudflare R2, Backblaze B2). A kliens feltöltés szerver-által aláírt URL-ekkel történjen.
- Ütemezett feladatok / háttérmunkák: Render cron, Cloudflare Workers Cron, GitHub Actions, Railway, Fly.io stb.

—

## 10) Átállási terv és élesítés

- Pilot/hibrid fázis:
  - Supabase Auth + Edge Functions marad
  - Táblák Neonra költöznek, új API-k készülnek
  - Frontend fokozatosan az új API-t használja
- Adatszinkron/átállás:
  - Futtass rendszeres dumpot → import Neonra
  - Éles váltás előtt írj-le tiltás Supabase oldalon, végső delta dump, import Neonra
  - Kapcsold át az API-kat végleg Neonra
- Rollback:
  - Ha gond van, az API környezetiváltozóval visszakapcsolható a Supabase DB-re (amíg a séma kompatibilis)

—

## 11) Tesztelés és verifikáció

- Unit: `src/lib` szintű tesztek változatlanok.
- Edge/API integráció: Deno/Node endpointokhoz célzott tesztek.
- E2E: TeamDetail oldalon az analitikai widgetek továbbra is renderelődnek és degradálnak backend-hiba esetén.

—

## 12) Gyors parancsok (példák)

```bash
# Dump Supabase-ből
supabase db dump --schema-only > schema.sql
supabase db dump --data-only   > data.sql

# Import Neonra
export NEON_DATABASE_URL="postgresql://<user>:<pass>@<host>/<db>?sslmode=require"
psql "$NEON_DATABASE_URL" -f schema.sql
psql "$NEON_DATABASE_URL" -f data.sql

# Supabase Edge Functions – secret beállítás a Neonhoz
supabase secrets set NEON_DATABASE_URL="$NEON_DATABASE_URL"

# (Opcionális) Edge függvény deploy
supabase functions deploy team-streaks
supabase functions deploy team-transition-matrix
```

—

## 13) GYIK

- „Megmaradhat a Supabase Auth, ha a DB Neonon van?”
  - Igen. A frontend auth folytatható Supabase-szal. Az API/Edge réteg ellenőrzi a Supabase JWT-t, miközben az adatot Neonról olvassa/írja.
- „Mi lesz az RLS-sel?”
  - RLS a Postgresben marad, de a claim-ek értelmezését neked kell pótolni API-szinten vagy PostgREST + JWT integrációval.
- „Mit nyerünk Neonnal?”
  - Gyors skálázás, ágaztatás (branching), költséghatékony szerverless működés, jó DX a DB-hez.

—

Ha végrehajtjuk a fenti lépéseket, a WinMix TipsterHub biztonságosan és fokozatosan költöztethető Supabase-ről Neonra úgy, hogy közben az üzemi kockázat alacsony marad és a felhasználói élmény nem sérül.
