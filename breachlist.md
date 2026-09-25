# BREACHLIST — trackballer security audit

White-box authorization / access-control audit, run against the method in `../THOUGHT_BANK.md`
(the Fable 5 hypothesis-driven playbook). Every item below was formed as a **falsifiable
hypothesis**, traced to **ground truth** (the RLS `with check`/`using`, the data-layer `where`,
the live Postgres ACL, or the render sink), then **accepted** (exploit written) / **rejected**
(exact killing guard cited) / **pivoted**. Runtime facts were confirmed **read-only** against the
linked Supabase project `oovtjqxxavffzndpyevr` via MCP — no writes, no PII exfiltration.

- **Target:** Next.js 16 (App Router) + Supabase (Postgres + RLS + PostgREST + Auth). "trackballer".
- **Auth model:** Supabase session JWT in cookies; `app_metadata.is_admin` mirrored from
  `profiles.is_admin` by a custom access-token hook; RLS is the declarative policy spec.
- **Date:** 2026-06-19. **Method:** primary recon + tracing by lead auditor; **3 independent
  Opus sub-agents** (cold context, adversarial briefs) ran a falsification pass on the crown
  jewel + breadth passes on reads/multi-path/§6. Findings cross-confirmed against live DB.

---

## Overall rating: **CRITICAL (compromised)** — 4/10 until F-1 is fixed

The codebase is, in most respects, **well-engineered**: server actions use strict column
allow-lists, every `/api/admin/sync/*` and `/api/cron/*` route gates *before* any side effect,
the service-role key never crosses into the client bundle, there is no `dangerouslySetInnerHTML`,
no SSRF in the upstream fetchers, and redirects are hardcoded literals. **But security is the
weakest link** (§9): a single trivially-reachable privilege break — any logged-in user can make
themselves an admin in one request — caps the entire rating. "Well-engineered" never upgrades a
finding. **Fix F-1/F-2 before this goes to production.**

### Findings at a glance

| ID | Severity | Who can trigger | Effect |
|----|----------|-----------------|--------|
| **F-1** | **CRITICAL** | any authenticated user | self-assign `is_admin=true` → full app admin |
| **F-2** | **HIGH** | any banned user | self-clear `is_banned` → defeats all moderation |
| **F-3** | **HIGH** | anonymous (no auth) | bulk PII (DOB, location, handles) + admin/ban enumeration of whole user base |
| **F-4** | **HIGH** | any authenticated user | UPDATE a rating onto a locked/non-rateable target → poison public match aggregates |
| **F-5** | **MEDIUM** | any banned user | keep editing own comments + resurrect moderator-soft-deleted ones |
| **F-6** | **MEDIUM** | anonymous (no auth) | call recompute RPCs → DELETE/blank aggregate rows + DB load (ACL drift) |

**Systemic root cause behind F-1, F-2, F-3:** `public.profiles` grants table-wide
`SELECT`/`UPDATE` to `anon`/`authenticated` (live ACL `authenticated=arwdDxtm/postgres`), while
RLS is **row-only** (`auth.uid()=id`) with **no column restriction, no column GRANT/REVOKE, and
no guard trigger**. Row-level rules do **not** restrict columns (§5.4 trap) — so every column of a
user's own row, and every column of *everyone's* row on read, is reachable.

---

## Recon map (the ground truth everything is judged against)

**Identity origin (trustworthy):** `lib/auth/server-session.ts:15` → `supabase.auth.getClaims()`
(JWT signature-verified). `sub` = user id; `app_metadata.is_admin`/`is_onboarded` parsed at
`lib/auth/session-claims.ts:19`.

**Source of truth for ADMIN authority = the column `public.profiles.is_admin`**
(`supabase/migrations/20260529050000_init_profiles_ratings.sql:17`). Three consumers all key on it:
1. `custom_access_token_hook` copies it → JWT `app_metadata.is_admin`
   (`...20260605120000_custom_access_token_hook.sql:30`); enabled in `supabase/config.toml`
   (`[auth.hook.custom_access_token] enabled = true`).
2. `public.is_admin()` SECURITY DEFINER reads it for every admin RLS policy
   (`...20260529050002_init_rls_policies.sql:4-17`).
3. `requireAdmin`/`assertAdminAction`/`getAdminSession` re-read it from the DB
   (`lib/admin/require-admin.ts:37`, `lib/admin/assert-admin-action.ts:21`).

**Write paths to `profiles` (the multi-path enumeration, §1 Q2 / §4):**
| Path | Role | Verdict |
|------|------|---------|
| `updateProfile` (`lib/profile/actions/update-profile.ts:88`) | authenticated | **SAFE** — fixed allow-list, no privileged col |
| `completeOnboarding` (`lib/onboarding/complete.ts:35`) | authenticated | writes `onboarding_completed_at` (server time) — legit, see remediation |
| `syncOAuthProfilesFromAuth` (`lib/auth/sync-oauth-profiles.ts:137`) | authenticated | writes `twitter_verified_at` from a *verified* X identity — legit, see remediation |
| `adminBanUser` (`lib/admin/actions/moderation.ts:40`) | service role | **SAFE** — admin-gated, single column, blocks self-target |
| **direct browser → PostgREST (publishable key)** | authenticated | **WEAK PATH — F-1/F-2** |

The app's own server actions are the *imperative* paths and they are safe; the *declarative* RLS
path is the weaker one (the §4 lesson — "do not assume which path is stronger").

---

## FINDINGS

### F-1 — CRITICAL — Privilege escalation: any user self-assigns `is_admin` (mass assignment on own profile row)

- **OWASP A01 / mass assignment. Playbook §5.4 + worked traces §7-A (pivot to the crown jewel), §7-B (dual-check is one check), §7-G (the gated admin surface is the *payload*).**

**Hypothesis.** `profiles.is_admin` is the admin source of truth; if `profiles_update_own` has no
column restriction, no column REVOKE, and no guard trigger, a user PATCHes their own row to
`is_admin=true` via the public PostgREST endpoint, then the token hook promotes them.

**Trace to ground truth — all three §5.4 negatives confirmed at runtime:**
1. RLS `profiles_update_own` = `USING ((select auth.uid())=id) WITH CHECK ((select auth.uid())=id)`
   — **row only, no column predicate** (`...init_rls_policies.sql:60-63`; live `pg_policy`
   identical → **no drift**). RLS enabled but **not forced**; the attacker is a normal subject and
   the policy passes for their own row.
2. **No column REVOKE.** Live `has_column_privilege('authenticated','public.profiles','is_admin',
   'UPDATE')` → **TRUE** (also `is_banned`, `onboarding_completed_at`, `twitter_verified_at` →
   TRUE). Live ACL: `authenticated=arwdDxtm/postgres` (full table privileges, no column list).
   Grep of all 15 migrations: every GRANT/REVOKE targets a *function*, never a profile column.
3. **No guard trigger.** Live `pg_trigger` on `profiles` → only `profiles_set_updated_at`
   (timestamp setter). No BEFORE-UPDATE guard on `is_admin`.
4. Hook then mirrors it: `app_metadata.is_admin := profiles.is_admin`
   (`...custom_access_token_hook.sql:30`, hook `enabled=true` in `config.toml`). Every gate
   (`proxy.ts:92`, `require-admin.ts:43`, `is_admin()` RLS) now passes.

**Why the app's safe write path does not save it (§4 trap).** `updateProfile`
(`update-profile.ts:88-98`) writes a fixed allow-list with no `is_admin` — genuinely safe, but it
is path (a). The exploit uses the direct path: the browser already holds a valid `authenticated`
JWT and the publishable key (both public), so the attacker calls PostgREST directly and never
touches the server action.

**VERDICT: ACCEPTED.** Independent Opus falsification pass *tried to refute this and could not* —
every candidate guard is absent in both source and the live catalog.

Exploit (any logged-in user, browser devtools console on the live site):
```js
// `supabase` = the app's browser client (publishable key + the user's OWN session)
await supabase.from('profiles').update({ is_admin: true }).eq('id', user.id)   // → 204
// Refresh the token (sign out/in or wait for auto-refresh) so the hook re-issues
// app_metadata.is_admin = true.  → /admin loads; is_admin() RLS unlocks editorial +
// comment-moderation writes (edit/delete ANY comment, read soft-deleted, write
// featured_trending_players / team_of_the_week*).
```
**Blast-radius precision:** F-1 does **not** grant the `/api/admin/sync/*` data-ingestion routes —
those gate on a separate `SYNC_ADMIN_SECRET` (`lib/admin/sync-auth.ts`), not on `is_admin`. F-1's
reach is the `/admin` UI + everything `is_admin()` RLS governs = full application-level admin.

**Fix (do #1 immediately):**
1. **Hard-block the always-privileged columns** (no legitimate authenticated-role writer exists):
   ```sql
   REVOKE UPDATE (is_admin, is_banned) ON public.profiles FROM anon, authenticated;
   ```
   plus a BEFORE UPDATE guard trigger that raises if `NEW.is_admin <> OLD.is_admin` or
   `NEW.is_banned <> OLD.is_banned` unless `current_user = 'service_role'` (defense in depth, and
   protects against a future re-GRANT).
2. `onboarding_completed_at` / `twitter_verified_at` are today written by **authenticated** server
   actions (`complete.ts:43`, `sync-oauth-profiles.ts:110`). Move those two writes to the
   service-role admin client (both set server-controlled values), then add them to the REVOKE
   above. (Until then they are self-settable — low impact: fake "verified" badge / onboarding-gate
   skip; see F-1b.) Alternatively, a guard trigger permitting only `NULL → timestamp` transitions.
3. Optionally narrow `profiles_update_own` `WITH CHECK` to assert the privileged columns are
   unchanged.

**F-1b (LOW, same root):** `twitter_verified_at` self-write → fake X-verified badge;
`onboarding_completed_at` self-write → partial onboarding-gate skip (the proxy gate also requires
`username`+`country_code`, `proxy.ts:77-81`, so impact is limited). Both closed by the F-1 fix.

---

### F-2 — HIGH — Banned users can self-unban (`is_banned`, same root cause)

- **OWASP A01. Playbook §5.4 sibling of F-1.**

**Hypothesis.** `adminBanUser` sets `is_banned=true` via the service role
(`moderation.ts:40-44`), and comment-insert RLS reads `profiles.is_banned`
(`...init_rls_policies.sql:166`). If the *user* can write their own `is_banned`, a ban is
trivially reversible.

**Trace.** Same as F-1 #1–#3; `has_column_privilege('authenticated',…,'is_banned','UPDATE')` →
**TRUE**; row-only policy; no guard. **VERDICT: ACCEPTED.**
```js
await supabase.from('profiles').update({ is_banned: false }).eq('id', user.id)  // ban defeated
```
**Severity:** High — any banned user nullifies the entire moderation mechanism. Compounds with F-5.
**Fix:** covered by the F-1 fix (the REVOKE/guard names `is_banned`).

---

### F-3 — HIGH — Full-table PII exposure to anonymous via `profiles_public_read USING (true)` + anon column grants

- **OWASP A01 / excessive data exposure. Playbook §5.7 (audit the COLUMNS, not just the rows).**

**Hypothesis.** The `USING(true)` SELECT policy plus default anon column grants lets an anonymous
`GET /rest/v1/profiles?select=*` return sensitive columns.

**Trace — confirmed live:** `profiles_public_read` = `FOR SELECT TO anon,authenticated USING(true)`
(`...init_rls_policies.sql:52-54`, runtime-confirmed). `has_column_privilege('anon',
'public.profiles', <col>, 'SELECT')` → **TRUE for every sensitive column**: `date_of_birth`,
`location`, `twitter_handle`, `reddit_handle`, `instagram_handle`, `tiktok_handle`, **`is_admin`**,
**`is_banned`**, `onboarding_completed_at`, `twitter_verified_at`, `country_code`, `id`.

**VERDICT: ACCEPTED.**
```
GET {SUPABASE_URL}/rest/v1/profiles?select=id,date_of_birth,location,is_admin,is_banned,twitter_handle
apikey: <publishable key>     # anonymous — no session needed
```
returns every user's row. `is_admin`/`is_banned` are a free **admin/ban-status enumeration oracle**
(lets an attacker pinpoint admins to target with F-1-style attacks); `date_of_birth` (real DOB,
collected with an 18+ gate at onboarding) + social handles are real PII. The app's *own* reads are
restrained (`lib/profile/queries.ts`, `lib/comment/profile-select.ts` never select DOB/location/
is_admin) — so this is purely a direct-PostgREST / column-grant problem.
**Severity:** High — anonymous, whole user base. **Fix:** serve public profile data through a view
exposing only public columns, and `REVOKE SELECT (date_of_birth, location, is_admin, is_banned,
onboarding_completed_at, twitter_verified_at) ON public.profiles FROM anon, authenticated;` (read
sensitive columns only via owner-scoped server queries).

---

### F-4 — HIGH — `match_ratings` UPDATE bypasses the rateable/unlocked gate (insert→update policy divergence)

- **OWASP A01 / state machine. Playbook §4 (multi-path divergence) + §5.9.**

**Hypothesis.** INSERT enforces `fixtures.ratings_unlocked_at IS NOT NULL` **and**
`fixture_appearances.is_rateable=true`, but UPDATE only checks `user_id`. A user inserts one
legitimate rateable rating, then UPDATEs its `fixture_id`/`player_id`/`value` onto a locked or
non-rateable target.

**Trace — confirmed live:**
- INSERT `WITH CHECK` includes both EXISTS gates; `match_ratings_update_own` `USING/CHECK` =
  **only** `auth.uid()=user_id` (`...init_rls_policies.sql:127-130`, live `pg_policy` identical).
- `UNIQUE(user_id, fixture_id, player_id)` blocks only colliding with your *own* existing row, not
  the move. `authenticated` holds table-level UPDATE → raw PATCH feasible. No BEFORE-UPDATE trigger
  (only `set_updated_at` + the AFTER aggregate trigger).
- `is_rateable` is `GENERATED ALWAYS AS (minutes_played > 0)` — can't be set directly, but that's
  irrelevant: the bypass is about which row you *point a rating at*.
- The AFTER trigger `on_match_rating_change` (`...init_aggregate_triggers.sql:227-257`) recomputes
  `player_match_aggregates`/tournament/form for `NEW.fixture_id, NEW.player_id` → the smuggled
  rating **is counted into the public average**.

**VERDICT: ACCEPTED.**
```
PATCH /rest/v1/match_ratings?id=eq.<your_legit_row_id>
body: { "fixture_id": <locked_fixture>, "player_id": <player_with_0_minutes>, "value": 10 }
```
passes (only `user_id` re-checked) → the fixture's public rating is polluted before ratings unlock
and for a non-participant. Repeatable across fixtures.
**Severity:** High (integrity). Any authenticated user.
**Fix:** mirror the INSERT EXISTS gates into the UPDATE `WITH CHECK`, or a BEFORE-UPDATE trigger
asserting the target stays rateable+unlocked.

---

### F-5 — MEDIUM — Banned users can keep editing (and un-soft-delete) their own comments

- **OWASP A01. Playbook §4 (insert vs update asymmetry).**

**Hypothesis.** `comments_insert_auth` checks `is_banned=false`, but `comments_update_own` does not.

**Trace — confirmed live:** `comments_update_own` `USING/CHECK` = `auth.uid()=user_id OR
is_admin()` — **no `is_banned` check** (`...init_rls_policies.sql:169-172`). No BEFORE-UPDATE guard.
`body` updatable (only a 280-char CHECK); `is_deleted` is a writable boolean, and the app's
`deleteComment` only *soft*-deletes (`is_deleted=true`, `lib/comment/submit-comment.ts:159`).

**VERDICT: ACCEPTED.** A banned user (who can't INSERT new comments) can still
`PATCH /rest/v1/comments?id=eq.<own_comment>` to rewrite `body`, or set `is_deleted=false` to
resurrect a comment a moderator soft-deleted.
**Severity:** Medium — banned user keeps a live, editable soapbox and undoes moderator soft-deletes
on their own comments. Compounds with F-2.
**Fix:** add `AND (select is_banned from profiles where id=(select auth.uid()))=false` to
`comments_update_own`; disallow `is_deleted` false-transitions by non-admins.

---

### F-6 — MEDIUM — Anonymous-executable recompute RPCs → DELETE/blank aggregate rows + DB load (ACL drift)

- **OWASP A01 / A05 misconfiguration. Playbook §6 (SECURITY DEFINER) + §4/§H (the policy that
  governs is not the one in the repo — here, drift between migration intent and live ACL).**

**Hypothesis.** A SECURITY DEFINER function is reachable by a role it shouldn't be.

**Trace — confirmed live:**
- Intent: `...20260529050004_init_function_security.sql:13-17` `REVOKE ALL ... FROM PUBLIC` on
  `recompute_player_career_aggregate`, `recompute_player_match_aggregate`,
  `recompute_player_form_snapshot`, `recompute_player_tournament_aggregate`,
  `refresh_comment_vote_counts`.
- **Live `pg_proc.proacl`: every one still grants `anon=X` and `authenticated=X`.** Corroborated by
  `get_advisors(security)` → 14× `*_security_definer_function_executable`.
- **Root cause (classic Postgres gotcha):** later migrations `CREATE OR REPLACE` two of these
  (`...20260609120000_career_ratings_100_scale.sql:67,130`) **without re-issuing the REVOKE** —
  `CREATE OR REPLACE` resets a function's ACL to default (PUBLIC EXECUTE), silently undoing the
  20260529 hardening. (Contrast: the `get_shuffle_career_player` migrations re-issue REVOKE+GRANT
  correctly.)

**VERDICT: ACCEPTED.** Anonymous (publishable key only):
```
POST {SUPABASE_URL}/rest/v1/rpc/recompute_player_match_aggregate
body: { "p_fixture_id": <f>, "p_player_id": <p> }   # a pair with zero match_ratings
```
hits the `v_count=0` branch → `DELETE FROM player_match_aggregates WHERE fixture_id=.. AND
player_id=..` (same DELETE-when-empty in the tournament recompute). An unauthenticated attacker can
blank displayed aggregate rows until the next legitimate recompute, and drive arbitrary DB load by
hammering the RPCs.
**Bounds (why Medium, not High):** the functions only recompute *from existing rows* — no value
injection, no forged score, no cross-tenant read; `search_path` is pinned (no SQLi). Impact is
integrity/availability of derived display tables.
**Fix:** a migration re-issuing `REVOKE ALL ON FUNCTION <each> FROM PUBLIC, anon, authenticated;`
(the callers are the service-role admin client + AFTER triggers running as table owner — they need
no role grant).

---

## Hypotheses REJECTED (recorded so the next pass doesn't re-walk them — §10)

| Hypothesis | Killing guard (file:line) |
|---|---|
| `updateProfile` mass-assignment | Fixed Zod schema + explicit column allow-list, no privileged col (`update-profile.ts:12-29,88-98`). The vuln is the *direct* path (F-1). |
| `completeOnboarding` privileged-col write | Allow-list write; sets `onboarding_completed_at` from **server** time, never `is_admin`/`is_banned`; zod-validated, owner-scoped (`complete.ts:35-45`). |
| `syncOAuthProfilesFromAuth` privileged write | Writes only avatar fields + `twitter_handle`/`twitter_verified_at`, sourced from a **signature-verified OAuth identity** (not request body), only when an X identity is actually linked (`sync-oauth-profiles.ts:102-137`). |
| `adminBanUser` IDOR / self-ban-escape | Admin-gated, uuid-validated, blocks self-target, single-column service-role write (`moderation.ts:27-44`). |
| `comment_votes` arbitrary/inflated values | CHECK `value IN (-1,1)`; PK `(user_id,comment_id)`; zod `enum(["1","-1"])`; `score`/counts are **trigger-derived** by COUNT, not client-supplied (`...init_aggregate_triggers.sql:260`). |
| `career_ratings` UPDATE gate bypass | No gate to bypass — its INSERT `WITH CHECK` is only `auth.uid()=user_id`; value bounded 1–100 by CHECK on insert+update. |
| `profile_followed_clubs` / `_interested_leagues` IDOR | `FOR ALL USING/CHECK (auth.uid()=user_id)`, composite PK + FK; user touches only own rows. |
| Admin gate trusts only forgeable JWT | `getClaims()` verifies signature **and** `require-admin`/`assert-admin-action` re-read the DB (`require-admin.ts:37`). (Still defeated by F-1, but not by forgery.) |
| `assertSyncAuthorized` fail-open | Returns 500 when `SYNC_ADMIN_SECRET` unset; both admin + cron routes call it first (`sync-auth.ts:5-10`). |
| Service-role key in client bundle | `createAdminClient` importers are all `"use server"`/route handlers; no `"use client"` imports it directly or transitively. |
| Open redirect (OAuth) | `post-oauth-redirect.ts` returns hardcoded literals; `proxy.ts` builds redirects from hardcoded paths against `request.url` — destination never user-controlled. |
| `/api/football/standings` SSRF / key leak | `leagueId`/`season` coerced via `Number()` + finite-check; only those ints interpolated into a fixed host; API key sent as header, never returned (`lib/catalog/standings-fetch.ts:20-30`). |
| `/api/search/players` LIKE-injection / over-select | No `.ilike`/`.or`; in-memory substring match over a cached index then `.in("id", ints)`; returns public catalog fields only (`lib/search/*`). |
| `/api/profile/username-available` oracle | Returns only existence of an already-public username; format-validated, bounded input. Low/informational. |
| Comment stored XSS | Zero `dangerouslySetInnerHTML` repo-wide; body rendered as `{comment.body}` (React auto-escapes); no user-built `href`. |
| SECURITY DEFINER RPC injection | `search_path` pinned on all; no dynamic SQL; params are `bigint`/`numeric`; `get_shuffle_career_player` gates on `auth.uid()` and is correctly REVOKE-PUBLIC/GRANT-authenticated. |

---

## Minor / hardening (not findings, worth doing)

- **Non-constant-time secret compare** in `assertSyncAuthorized` (`!==`, `sync-auth.ts:17`) — LOW
  (network-facing, high-entropy secret). Swap to `crypto.timingSafeEqual` for defense in depth.
- **No max length on search `q`** (`lib/search/query.ts:12-16`) — each request scans the in-memory
  player index; add a max length to harden against CPU abuse.
- **`public.is_admin()` is `anon`/`authenticated`-executable via `/rest/v1/rpc/is_admin`** —
  informational (reads only the caller's own flag).
- **Supabase advisors:** `pg_trgm` installed in `public` schema (move to `extensions`); Auth
  leaked-password protection (HaveIBeenPwned) disabled — enable it; a few `IMMUTABLE` helper
  functions have a mutable `search_path` (negligible — they take no table input).

---

## Prioritized remediation

1. **F-1 + F-2 (CRITICAL/HIGH) — close the column-write hole.** `REVOKE UPDATE (is_admin,
   is_banned) ON public.profiles FROM anon, authenticated;` + a BEFORE-UPDATE guard trigger that
   forbids non-service-role changes to `is_admin`/`is_banned`. Move `completeOnboarding` /
   `syncOAuthProfilesFromAuth` writes of `onboarding_completed_at`/`twitter_verified_at` to the
   service-role client, then revoke those columns too (closes F-1b).
2. **F-3 (HIGH) — close the column-read hole.** `REVOKE SELECT` of the sensitive columns from
   `anon`/`authenticated`; serve public profiles via a view of public columns only.
3. **F-4 (HIGH) — re-assert the rating gate on UPDATE** (`match_ratings_update_own` `WITH CHECK`).
4. **F-6 (MEDIUM) — re-REVOKE** the five recompute/refresh functions from PUBLIC/anon/authenticated
   (and add the REVOKE to any future `CREATE OR REPLACE`).
5. **F-5 (MEDIUM) — add `is_banned=false`** to `comments_update_own`; block non-admin `is_deleted`
   resurrection.

> The single dominant defect is **table-wide column grants to `anon`/`authenticated` on
> `public.profiles` under row-only RLS.** One migration that converts those to column-scoped grants
> (+ a guard trigger) removes F-1, F-2, F-3, and F-1b at once. Items 3–5 are independent
> policy-asymmetry fixes.

---

## Method notes (for reproducibility / §10)

- Confirmed read-only against live DB via Supabase MCP: `pg_policy` (no drift), `pg_trigger`
  (only `set_updated_at` on profiles), `has_column_privilege`/`has_table_privilege` for anon &
  authenticated, `pg_proc.proacl`, `get_advisors`. No writes, no PII pulled.
- 3 independent **Opus** sub-agents, cold context + adversarial "CONFIRM or REFUTE" briefs:
  (1) falsify F-1 — could not refute; (2) reads/PII + multi-path — confirmed F-3, found F-4/F-5;
  (3) §6 breadth — found F-6, cleared the rest with specifics.
- "Broken" verdicts are strong (each has a traced exploit); "safe" verdicts above were re-derived
  by an independent pass, not generalized from a sample (§0/§8).

---

# SOLUTIONS (proposed — verify before applying)

Each fix below is a **proposed** patch, not yet applied. Status legend — an agent applying these
should flip the box and record the verification result:

`[ ] proposed  ·  [ ] applied  ·  [ ] verified (re-run the exploit; confirm it now fails)`

| Finding | Fix summary | Status |
|---|---|---|
| F-1 / F-2 | guard trigger + column `REVOKE UPDATE (is_admin,is_banned)` | `[ ] applied [ ] verified` |
| F-1b | move `onboarding_completed_at` / `twitter_verified_at` writes to service role, then REVOKE | `[ ] applied [ ] verified` |
| F-3 | `is_banned()` helper + RPC/definer re-point + `REVOKE SELECT` of private cols | `[ ] applied [ ] verified` |
| F-4 | re-assert insert gates in `match_ratings_update_own` WITH CHECK | `[ ] applied [ ] verified` |
| F-5 | add `is_banned=false` to `comments_update_own` + un-delete guard trigger | `[ ] applied [ ] verified` |
| F-6 | re-`REVOKE` recompute/refresh functions from PUBLIC/anon/authenticated | `[ ] applied [ ] verified` |
| Minor | constant-time secret compare; max length on search `q` | `[ ] applied [ ] verified` |

> All SQL below belongs in **new** timestamped migrations under `supabase/migrations/` (never edit
> a shipped migration). Apply in the order F-6 → F-4 → F-5 → F-1 → F-3 (least-coupled first).
> After any `CREATE OR REPLACE FUNCTION`, re-issue its REVOKE in the **same** migration (the F-6 root
> cause). Recommended verification uses the read-only checks at the end of each block.

---

## S-1 + S-2 — Lock down `is_admin` / `is_banned` writes (kills F-1, F-2)

`is_admin` has no legitimate authenticated-role writer; `is_banned` is written only by the
service-role `adminBanUser`. So both can be hard-blocked for `anon`/`authenticated` with **zero app
breakage** (`updateProfile`, `completeOnboarding`, `syncOAuthProfilesFromAuth` never touch them).
Apply defense-in-depth: a guard trigger **and** a column REVOKE.

```sql
-- migration: <ts>_lock_profiles_privileged_columns.sql

-- 1) Guard trigger: no anon/authenticated caller may change is_admin or is_banned.
--    Runs SECURITY INVOKER (default) so current_user is the real caller role.
CREATE OR REPLACE FUNCTION public.profiles_guard_privileged_columns()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF current_user IN ('authenticated', 'anon') THEN
    IF NEW.is_admin IS DISTINCT FROM OLD.is_admin THEN
      RAISE EXCEPTION 'is_admin cannot be modified by this role' USING ERRCODE = '42501';
    END IF;
    IF NEW.is_banned IS DISTINCT FROM OLD.is_banned THEN
      RAISE EXCEPTION 'is_banned cannot be modified by this role' USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_guard_privileged_columns ON public.profiles;
CREATE TRIGGER profiles_guard_privileged_columns
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.profiles_guard_privileged_columns();

-- 2) Column REVOKE (defense in depth — survives the trigger being dropped):
REVOKE UPDATE (is_admin, is_banned) ON public.profiles FROM anon, authenticated;
```

**Verify (read-only):**
```sql
SELECT has_column_privilege('authenticated','public.profiles','is_admin','UPDATE')  AS should_be_false,
       has_column_privilege('authenticated','public.profiles','is_banned','UPDATE') AS should_be_false_2;
-- both must now return FALSE; then re-run the F-1/F-2 PATCH as a test user → expect 403/permission denied.
```

---

## S-1b — Close the low-severity self-writes `onboarding_completed_at` / `twitter_verified_at` (F-1b)

These two are written today by **authenticated** server actions, so they cannot simply be revoked
without first moving the writes to the service role.

**Code — route both privileged writes through the service-role client:**

`lib/onboarding/complete.ts` — swap the client used for the write (input is already zod-validated
and the row is scoped to the session user id, so RLS bypass is safe here):
```diff
- import { createClient } from "@/lib/supabase/server"
+ import { createClient } from "@/lib/supabase/server"
+ import { createAdminClient } from "@/lib/supabase/admin"
  ...
  const supabase = await createClient()
  const auth = await getServerAuth(supabase)
  ...
- const { error: updateError } = await supabase
+ const admin = createAdminClient()
+ const { error: updateError } = await admin
    .from("profiles")
    .update({ username, date_of_birth: dateOfBirth, country_code: countryCode,
              favourite_club_id: favouriteClubId, favourite_national_team_id: favouriteNationalTeamId,
              onboarding_completed_at: new Date().toISOString() })
    .eq("id", auth.userId)   // session-derived id — the only scoping under the service role
```

`lib/auth/sync-oauth-profiles.ts` — (a) make `twitter_verified_at` **idempotent** (only set when
not already set, so it isn't bumped on every X login), and (b) write privileged fields via the admin
client. Minimal version:
```diff
  if (xHandle) {
    updates.twitter_handle = xHandle
-   updates.twitter_verified_at = new Date().toISOString()
+   if (!existing?.twitter_verified_at) {
+     updates.twitter_verified_at = new Date().toISOString()
+   }
  }
  ...
- await supabase.from("profiles").update(updates).eq("id", user.id)
+ await createAdminClient().from("profiles").update(updates).eq("id", user.id)
```

**Then** add to the S-1 migration (now safe — no authenticated writer remains):
```sql
REVOKE UPDATE (onboarding_completed_at, twitter_verified_at) ON public.profiles FROM anon, authenticated;
```
(Optional: extend the guard trigger to also block these for `authenticated`/`anon`.)

> If you prefer not to touch the writers now: leave these two columns granted and accept the LOW
> residual (fake "verified" badge / partial onboarding-skip). F-1/F-2 are fully closed by S-1 alone.

---

## S-3 — Stop anonymous/authenticated PII + admin-enumeration reads (F-3)

`REVOKE SELECT` on the private columns, but **first re-point the internal readers** or the admin
gates and the comment-insert policy break (the authenticated role evaluates those reads).

**Step 1 — add an `is_banned()` SECURITY DEFINER helper (mirrors `is_admin()`):**
```sql
CREATE OR REPLACE FUNCTION public.is_banned()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND is_banned = true);
$$;
REVOKE ALL ON FUNCTION public.is_banned() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_banned() TO authenticated;
```

**Step 2 — rewrite the policy that inlines an `is_banned` column read** (so it no longer needs the
column grant):
```sql
DROP POLICY comments_insert_auth ON public.comments;
CREATE POLICY comments_insert_auth ON public.comments
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id AND NOT (SELECT public.is_banned()));
```

**Step 3 — re-point the admin gates from a column SELECT to the `is_admin()` RPC** (definer; needs
no column grant). In `lib/admin/require-admin.ts`, `lib/admin/assert-admin-action.ts`, and
`getAdminSession`:
```diff
- const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", auth.userId).single()
- if (!profile?.is_admin) { ... }
+ const { data: isAdmin } = await supabase.rpc("is_admin")
+ if (!isAdmin) { ... }
```

**Step 4 — owner self-reads of DOB/location** (e.g. the settings page) go through a definer that
returns only the caller's own private fields:
```sql
CREATE OR REPLACE FUNCTION public.get_my_private_profile()
RETURNS TABLE (date_of_birth date, location text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT date_of_birth, location FROM public.profiles WHERE id = (SELECT auth.uid());
$$;
REVOKE ALL ON FUNCTION public.get_my_private_profile() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_private_profile() TO authenticated;
```

**Step 5 — find every remaining reader, then REVOKE.** Run this grep and re-point any hit to the
helpers above before applying the REVOKE:
```
grep -rn "date_of_birth\|\.location\|\bis_admin\b\|\bis_banned\b\|twitter_verified_at" lib app
```
```sql
REVOKE SELECT (date_of_birth, location, is_admin, is_banned, twitter_verified_at)
  ON public.profiles FROM anon, authenticated;
```
(Social handles + `username` + `country_code` stay public — they are displayed on `/u/<username>`.)

**Verify:** `GET /rest/v1/profiles?select=date_of_birth,is_admin` with the publishable key (anon) →
expect `permission denied`; the app's profile pages and admin gates still load.

> Alternative (broader refactor): expose a `public_profiles` view of public columns only and point
> all public reads at it, then REVOKE SELECT on the base table entirely. The column-REVOKE above is
> the smaller, targeted change.

---

## S-4 — Re-assert the rating gate on UPDATE (F-4)

Mirror the INSERT policy's `ratings_unlocked` + `is_rateable` gates into the UPDATE `WITH CHECK`:
```sql
DROP POLICY match_ratings_update_own ON public.match_ratings;
CREATE POLICY match_ratings_update_own ON public.match_ratings
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK (
    (SELECT auth.uid()) = user_id
    AND EXISTS (
      SELECT 1 FROM public.fixtures f
      WHERE f.id = match_ratings.fixture_id AND f.ratings_unlocked_at IS NOT NULL)
    AND EXISTS (
      SELECT 1 FROM public.fixture_appearances fa
      WHERE fa.fixture_id = match_ratings.fixture_id
        AND fa.player_id = match_ratings.player_id
        AND fa.is_rateable = true)
  );
```
**Verify:** as a test user, `PATCH` an existing rating's `fixture_id` to a locked fixture → expect
the row to violate the check (no rows updated / error).

---

## S-5 — Block banned-user comment edits and un-delete resurrection (F-5)

```sql
-- (a) banned users may not UPDATE their comments
DROP POLICY comments_update_own ON public.comments;
CREATE POLICY comments_update_own ON public.comments
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id OR (SELECT public.is_admin()))
  WITH CHECK (
    ((SELECT auth.uid()) = user_id OR (SELECT public.is_admin()))
    AND ((SELECT public.is_admin()) OR NOT (SELECT public.is_banned()))   -- needs S-3 step 1
  );

-- (b) only admins may flip is_deleted back to false (RLS can't see OLD → use a trigger)
CREATE OR REPLACE FUNCTION public.comments_guard_undelete()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF OLD.is_deleted = true AND NEW.is_deleted = false AND NOT (SELECT public.is_admin()) THEN
    RAISE EXCEPTION 'cannot resurrect a deleted comment' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS comments_guard_undelete ON public.comments;
CREATE TRIGGER comments_guard_undelete
  BEFORE UPDATE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.comments_guard_undelete();
```
(If applying S-5 before S-3, inline the `is_banned` subquery instead of `is_banned()`.)
**Verify:** ban a test user, then `PATCH` their own comment body / set `is_deleted=false` → expect
permission denied.

---

## S-6 — Re-REVOKE the recompute/refresh functions (F-6)

```sql
-- migration: <ts>_rerevoke_recompute_functions.sql
REVOKE ALL ON FUNCTION public.recompute_player_career_aggregate(bigint)        FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.recompute_player_match_aggregate(bigint, bigint) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.recompute_player_form_snapshot(bigint)           FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.recompute_player_tournament_aggregate(bigint, bigint) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.refresh_comment_vote_counts(bigint)              FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.init_player_career_aggregate()                   FROM PUBLIC, anon, authenticated;
```
The callers are the service-role admin client and AFTER triggers (run as table owner) — no role
grant is needed. **Process fix:** whenever any of these is `CREATE OR REPLACE`d in a future
migration, append its `REVOKE` in the same file.
**Verify:** `SELECT has_function_privilege('anon','public.recompute_player_match_aggregate(bigint,bigint)','EXECUTE');`
→ must be FALSE. Then `POST /rest/v1/rpc/recompute_player_match_aggregate` as anon → expect 404/permission denied.

---

## S-Minor — hardening

**Constant-time secret compare** (`lib/admin/sync-auth.ts`):
```diff
+ import { timingSafeEqual } from "node:crypto"
+
+ function safeEqual(a: string | null, b: string): boolean {
+   if (!a) return false
+   const ab = Buffer.from(a), bb = Buffer.from(b)
+   return ab.length === bb.length && timingSafeEqual(ab, bb)
+ }
  ...
- if (bearer !== secret && headerSecret !== secret) {
+ if (!safeEqual(bearer, secret) && !safeEqual(headerSecret, secret)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }
```

**Max length on search `q`** (`lib/search/query.ts`, in `normalizeSearchQuery`): reject/truncate
input beyond e.g. 64 chars before scanning the in-memory index.

**Supabase advisors:** move `pg_trgm` out of `public` into the `extensions` schema; enable Auth
leaked-password protection (HaveIBeenPwned) in the dashboard.
