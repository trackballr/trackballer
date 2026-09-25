# Supabase schema (Penaltyboxd)

Migrations implement the locked design in [`../../DATABASE.md`](../../DATABASE.md).

**Staging + prod:** see [`../../STAGING-PROD.md`](../../STAGING-PROD.md) (two Supabase projects, Vercel Preview vs Production env vars).

**Staging project:** `cznywzmmqypprsmulxty` (configure in `config.toml`)

## Migrations

| Version | Name | Contents |
|---------|------|----------|
| `20260529041735` | `init_extensions_and_catalog` | `pg_trgm`, catalog tables, WC league seed |
| `20260529050000` | `init_profiles_ratings` | Profiles, ratings, aggregate cache tables, auth bootstrap |
| `20260529050001` | `init_comments_admin` | Comments, votes, trending, team of the week, T5 league stubs |
| `20260529050002` | `init_rls_policies` | RLS on all tables (`(select auth.uid())` pattern) |
| `20260529050003` | `init_aggregate_triggers` | Career/match/form/tournament aggregates + comment vote counts |
| `20260529050004` | `init_function_security` | `search_path` + revoke public execute on internal functions |
| `20260605120000` | `custom_access_token_hook` | JWT `app_metadata.is_admin` + `is_onboarded` from `profiles` |
| `20260609120000` | `career_ratings_100_scale` | Career votes 1–100 integer OVR; widen aggregate columns; tier thresholds ×10 |
| `20260610120000` | `shuffle_career_player_rpc` | `get_shuffle_career_player()` — random unrated player with photo for home strip |
| `20260925120000` | `shuffle_career_player_filters` | Home shuffle can narrow by one top-5 league and an optional club list |

## Custom access token hook

On each login or `refreshSession`, Supabase Auth runs `public.custom_access_token_hook`, which reads `profiles.is_admin` and `profiles.onboarding_completed_at` and sets:

- `app_metadata.is_admin` (boolean)
- `app_metadata.is_onboarded` (boolean — `onboarding_completed_at IS NOT NULL`)

**Local:** enabled in `config.toml` under `[auth.hook.custom_access_token]`.

**Hosted (required once per project):** After `db push`, open **Authentication → Hooks → Custom Access Token** and enable the hook with URI:

`pg-functions://postgres/public/custom_access_token_hook`

**After granting admin in SQL:** the user must sign out/in or call `refreshSession()` so the JWT picks up `is_admin: true`.

**App usage:** `proxy.ts` blocks `/admin` when JWT `is_admin` is not true; `requireAdmin()` still checks `profiles.is_admin` in the database. Onboarding Finish calls `refreshAuthSession()` so `is_onboarded` updates immediately.

## Apply locally

```bash
npx supabase link --project-ref cznywzmmqypprsmulxty
npx supabase db push
```

Regenerate TypeScript types:

```bash
npx supabase gen types typescript --project-id cznywzmmqypprsmulxty > lib/database.types.ts
```

## Catalog sync (Postman)

Server routes under `/api/admin/sync/*`. Start dev server: `npm run dev` in `trackballer/`.

### Postman setup

1. **Authorization** tab → Type **Bearer Token** → Token = your `SYNC_ADMIN_SECRET` value from `.env.local`.
2. Or add header: `x-sync-secret` = same value.
3. Base URL: `http://localhost:3000` (no `curl` needed — `curl.exe` in docs is only for Windows terminals).

| Method | URL | Body |
|--------|-----|------|
| `GET` | `http://localhost:3000/api/admin/sync/status?seasonYear=2022` | none (row counts) |
| `GET` | `http://localhost:3000/api/admin/sync/health?seasonYear=2022` | none (**which fixtures** pending / partial / complete) |
| `POST` | `http://localhost:3000/api/admin/sync/bootstrap` | optional — see **Bootstrap** below |
| `POST` | `http://localhost:3000/api/admin/sync/fixture-details/pending` | optional — **skips** fixtures with `lineups_synced_at` set |
| `POST` | `http://localhost:3000/api/admin/sync/coaches/backfill` | optional — **lineups API only**; fills `fixture_coaches` where missing |
| `POST` | `http://localhost:3000/api/admin/sync/fixture/855736` | none (replace id) |
| `POST` | `http://localhost:3000/api/admin/sync/player/891` | `{"seasonYear":2022}` optional |
| `POST` | `http://localhost:3000/api/admin/sync/players/repair` | `{"limit":30,"seasonYear":2022}` optional |
| `POST` | `http://localhost:3000/api/admin/sync/players/enrich` | `{"profileSeasonYear":2025,"squadSeasonYear":2026,"nationalTeamIds":[10]}` optional |

### Bootstrap (`POST /api/admin/sync/bootstrap`)

Same URL; behaviour depends on the body:

| Request | What runs |
|---------|-----------|
| **No body** (or `{}`) | Catalog only: rounds, 64 fixtures, teams, squads — **no** lineups/events |
| `{"syncFixtureDetails":true}` | Catalog **plus** detail for **all 64** terminal matches (re-syncs the 8 you already have) |

Catalog-only (typical first run):

```bash
curl --location --request POST 'http://localhost:3000/api/admin/sync/bootstrap' \
  --header 'Authorization: Bearer YOUR_SYNC_SECRET'
```

### Pending fixture details (resume after rate limit)

Skips fixtures where `lineups_synced_at` is already set (your 8 Group Stage 1 games). Only hits the **~56** missing matches. **3 API calls per fixture.**

```bash
curl --location --request POST 'http://localhost:3000/api/admin/sync/fixture-details/pending' \
  --header 'Authorization: Bearer YOUR_SYNC_SECRET' \
  --header 'Content-Type: application/json' \
  --data '{"seasonYear":2022,"limit":10}'
```

Omit `limit` to process all pending in one run (~168 API calls). Re-run until `pending` in the response is `0`.

### Coaches backfill (after `fixture_coaches` migration)

For matches that already have lineups but no coach rows: **1 API call per fixture** (lineups endpoint only). Skips fixtures that already have coaches unless `force: true`.

```bash
curl --location --request POST 'http://localhost:3000/api/admin/sync/coaches/backfill' \
  --header 'Authorization: Bearer YOUR_SYNC_SECRET' \
  --header 'Content-Type: application/json' \
  --data '{"seasonYear":2022}'
```

Optional `limit` (e.g. `10`) for a short batch. Re-run until `missingTotal` in the response is `0`.

### Knowing what was interrupted (prod)

The **HTTP response** from `pending` only helps if the request **finished** — check `syncedFixtureIds` and `failures`. If Postman times out, use the DB via **health**:

```bash
curl --location 'http://localhost:3000/api/admin/sync/health?seasonYear=2022' \
  --header 'Authorization: Bearer YOUR_SYNC_SECRET'
```

| `state` | Meaning | What to run |
|---------|---------|-------------|
| `pending` | No `lineups_synced_at` — not started or failed before lineups saved | `POST /fixture-details/pending` or `/fixture/:id` |
| `partial` | Lineups saved, `appearances_synced_at` null — **interrupted mid-detail** | `POST /fixture/:id` for each id in `partialFixtureIds` |
| `complete` | Lineups + appearances synced | Skip (or re-sync single fixture if you need a refresh) |

Response includes `pendingFixtureIds`, `partialFixtureIds`, and per-match `lineupCount` / `eventCount` for auditing.

### Env (`trackballer/.env.local`)

```env
SUPABASE_SECRET_KEY=...
API_FOOTBALL_KEY=...
API_FOOTBALL_LEAGUE_ID=1
API_FOOTBALL_SEASON=2022
SYNC_ADMIN_SECRET=your-long-secret
# Free tier: 10 requests/minute (default). Override if your plan differs:
API_FOOTBALL_REQUESTS_PER_MINUTE=10
```

### API-Football rate limit

The sync client **serializes** every API-Football call (~6.5s apart at 10 req/min). Do not run bootstrap twice in parallel.

| Step | API calls (approx.) | Time at 10/min |
|------|---------------------|----------------|
| Status | 0 | instant |
| Bootstrap (catalog only, 32-team WC) | ~42 | **~5 min** |
| Bootstrap (catalog only, 48-team WC 2026) | ~62 | **~6 min** |
| Players enrich (per incomplete player) | 1 × incomplete count | 50 players ≈ **5 min** |
| Bootstrap + all fixture details | ~234 | **~40 min** |
| Pending fixture details | 3 × pending count | 3 × 56 ≈ **18 min** if 56 left |
| One fixture detail | 3 | ~20s |

If you hit `429`, the client waits ~65s and retries once. Optional: `API_FOOTBALL_MIN_INTERVAL_MS=7000` for extra headroom.

### FM career base ratings (Slice 7)

Seed `players.fm_base_rating` from repo CSV, then refresh provisional career aggregates:

```bash
node --env-file=.env scripts/seed-fm-ratings.mjs ../players_with_fm_ratings.csv
node --env-file=.env scripts/backfill-career-aggregates.mjs
```

Use `--dry-run` on either script to preview. Players without an FM row keep the default provisional score (5.0).

### Player profile repair

Fixture event sync used to write `Player {id}` when the API omitted names. Stub upserts now **merge** and never downgrade a real name. To fix existing rows:

```bash
# One player (Postman import)
curl --location --request POST 'http://localhost:3000/api/admin/sync/player/891' \
  --header 'Authorization: Bearer YOUR_SYNC_SECRET' \
  --header 'Content-Type: application/json' \
  --data '{"seasonYear":2022}'

# Batch: placeholder names + appearance players missing national_team_id (default limit 30)
curl --location --request POST 'http://localhost:3000/api/admin/sync/players/repair' \
  --header 'Authorization: Bearer YOUR_SYNC_SECRET' \
  --header 'Content-Type: application/json' \
  --data '{"limit":30,"seasonYear":2022}'
```

Re-run repair until `candidates` in the response is `0` (or run with a higher `limit` when quota allows).

### Player profiles + current club (DB-driven)

Finds players **already in Postgres** missing any of: `firstname`, `lastname`, `nationality`, `birth_date`, or `club_team_id`. One API call per player (`GET /players?id&season`) — fills Kane-style gaps to match Dembélé-style rows and upserts each club into `teams`.

```bash
curl --location --request POST 'http://localhost:3000/api/admin/sync/players/enrich' \
  --header 'Authorization: Bearer YOUR_SYNC_SECRET' \
  --header 'Content-Type: application/json' \
  --data '{"profileSeasonYear":2025,"squadSeasonYear":2026,"syncNationalTeam":true}'

# England squad only (team id 10)
curl --location --request POST 'http://localhost:3000/api/admin/sync/players/enrich' \
  --header 'Authorization: Bearer YOUR_SYNC_SECRET' \
  --header 'Content-Type: application/json' \
  --data '{"profileSeasonYear":2025,"squadSeasonYear":2026,"nationalTeamIds":[10]}'
```

Omit `limit` to process **all** remaining candidates in one local run. On Vercel Hobby (300s cap), pass `"limit":30` and resume with `offset`. Pass `squadSeasonYear` to only enrich players linked in `player_season_squads` for that WC (skips Curacao and other non–2026-squad rows). Pass `nationalTeamIds` to narrow further (e.g. `[6,3]` Brazil + Croatia). Re-run until `candidates` is `0`. Set `profileSeasonYear` to the current domestic year so current clubs resolve (Kane → Bayern, Messi → Inter Miami, Ronaldo → Al Nassr).

## Editorial admin (`/admin`)

Super-admin UI for trending pins, Team of the Stage, comment moderation, and catalog name/photo fixes. Uses signed-in OAuth and `profiles.is_admin` (not `SYNC_ADMIN_SECRET`).

Bootstrap your account in the Supabase SQL editor:

```sql
UPDATE public.profiles SET is_admin = true WHERE id = '<your-auth-user-uuid>';
```

Then open `http://localhost:3000/admin` while signed in.

### Team of the Stage (featured lineup)

Run migration `20260604120000_team_of_the_week_featured.sql` (`featured_at` column). Publish a lineup per stage in `/admin/team-of-the-stage`, then click **Show on home & World Cup** — only one stage is live at a time on `/` and `/world-cup#totw`.

## Scheduled sync (cron-job.org)

Full reference: repo root **[CRON-SYNC.md](../../CRON-SYNC.md)**.

| Job | Route | Typical schedule |
|-----|--------|------------------|
| Daily fixture window | `POST /api/cron/sync/daily` | 06:00 + 18:00 UTC |
| Matchday batch | `POST /api/cron/sync/matchday` | Hourly |

Both use the same auth as manual sync (`Authorization: Bearer` + `SYNC_ADMIN_SECRET`). Optional JSON body: `leagueId`, `seasonYear`, `limit` (matchday, default 15), `daysAhead` (daily, default 7).

Cron routes return **`{ "status": "accepted" }` immediately** (Next.js `after()`), so [cron-job.org](https://cron-job.org)’s ~30s HTTP timeout is not hit; sync still runs on Vercel for up to 300s — check **Vercel → Logs** for `cron daily complete` / `cron matchday complete` or `failed`.

Staging smoke (`trackballer.vercel.app`):

```bash
curl -X POST "https://trackballer.vercel.app/api/cron/sync/daily" \
  -H "Authorization: Bearer YOUR_SYNC_ADMIN_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"seasonYear":2022,"leagueId":1}'
```

Matchday only picks fixtures kicking off **today or yesterday (UTC)** — with a 2022 WC catalog in 2026, `candidatesInWindow` is often `0`; use daily to verify cron wiring.

## Notes

- **Catalog writes** use the service role (sync jobs only), not the anon key.
- **Match ratings** require `fixtures.ratings_unlocked_at` and `fixture_appearances.is_rateable` (enforced in RLS).
- **Career display** uses FM blend until 10 votes; tiers from `tier_for_score()`.
