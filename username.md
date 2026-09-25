# Username — Trackballer

How fan handles work: Postgres column, uniqueness, onboarding write path, public URL, and where `@username` shows in the UI.

**Canonical field:** `profiles.username` (not `display_name`, not OAuth `preferred_username`).

OAuth metadata may fill **display name** on first sign-in. The public handle is chosen later on `/onboarding` and is stored lowercase.

---

## High-level summary

| Layer | Responsibility |
|-------|----------------|
| **Postgres** | Nullable `TEXT` on `profiles`; unique on `lower(username)` when set |
| **Signup trigger** | Creates the profile row with `username` still `NULL` |
| **Format rules** | Shared Zod helpers in `lib/profile/validate-username.ts` |
| **Availability** | `GET /api/profile/username-available` (signed-in onboarding) |
| **Claim** | `completeOnboarding` server action writes username + finish timestamp |
| **Owner hub** | `/profile` — handle is **read-only** after onboarding |
| **Public permalink** | `/u/:username` — visitors only; owner is redirected to `/profile` |
| **Comments** | `@username` → `/u/:username`; own comments show **You** → `/profile` |

```
Sign in (Google / X / …)
        │
        ▼
handle_new_user → profiles row (display_name, avatar; username NULL)
        │
        ▼
proxy / post-OAuth: missing username → /onboarding
        │
        ▼
Step 1: type handle → debounce GET username-available
        │
        ▼
Finish → completeOnboarding (admin client)
        │  unique index conflict → "taken"
        ▼
username set + onboarding_completed_at set
        │
        ├── Owner: /profile  (edit display name, not username)
        └── Public: /u/{username}
```

---

## Database

### Column

Added in `supabase/migrations/20260606120000_profiles_username_country_x.sql`:

| Column | Type | Notes |
|--------|------|-------|
| `profiles.username` | `TEXT` | Nullable until onboarding. Stored lowercase by the app. Public (shown on `/u/:username`). |

Related, not the handle:

| Column | vs username |
|--------|-------------|
| `display_name` | Human name from OAuth / profile edit. Can change. |
| `twitter_handle` | X social handle after Connect X — different field. |

There is **no** Postgres `CHECK` for format. Format is enforced in the app. Uniqueness is enforced in Postgres.

### Unique index

```sql
CREATE UNIQUE INDEX profiles_username_lower_idx
  ON public.profiles (lower(username))
  WHERE username IS NOT NULL;
```

- Case-insensitive unique (`Fan` and `fan` cannot both exist).
- Partial: many rows may have `NULL` username (signed-in, not finished onboarding).
- Duplicate insert/update returns Postgres `23505`; onboarding maps that to “That username is taken. Pick another.”

### Signup: username stays empty

`handle_new_user` (on `auth.users` insert) only sets `id`, `display_name`, and `avatar_url`. It does **not** copy OAuth `preferred_username` into `profiles.username`.

`lib/auth/sync-oauth-profiles.ts` uses `preferred_username` only as a **display name** fallback.

### RLS and writes

- `profiles_public_read`: anyone can `SELECT` the row, including `username`.
- Own-row `UPDATE` for authenticated users.
- Finish-onboarding also sets `onboarding_completed_at`. Direct client updates of that column are revoked (security Phase 3), so **`completeOnboarding` uses `createAdminClient()`** to write username + completion together.
- Profile edit (`updateProfile`) never includes `username` in the update payload.

### Lookups

Public and availability checks use **`.ilike("username", value)`** so `/u/Chai_47` still finds `chai_47`. Combined with stored lowercase, this is case-insensitive.

---

## Format rules (app)

Source: `lib/profile/validate-username.ts`. Tests: `lib/profile/__tests__/validate-username.test.ts`.

**Normalize:** trim + lowercase (`normalizeUsername`).

**Valid handle:**

- Length 3–20 after normalize
- Pattern `^[a-z][a-z0-9_]*$` (must start with a letter)
- No trailing `_`
- No consecutive `__`
- Not all digits
- Not in the reserved set

Reserved (examples): `admin`, `api`, `login`, `onboarding`, `profile`, `search`, `support`, `trackballer`, `worldcup`, `www`, `mod`, `official`, …

Zod `usernameSchema` applies the same rules on the server when finishing onboarding.

Copy shown under the input: “3–20 characters. Lowercase letters, numbers, and underscores.”

---

## Backend

### 1. Availability — `GET /api/profile/username-available`

File: `app/api/profile/username-available/route.ts`

Query: `?username=`

1. Normalize + format-check. Invalid format → `{ available: false, error: "<format message>" }`.
2. Load session via `getServerAuth`.
3. `SELECT id FROM profiles WHERE username ILIKE normalized`.
4. If a row exists **and** it is not the current user → `{ available: false, error: "That username is taken." }`.
5. Else `{ available: true }` (including “this is already your handle”).

Uses the user-scoped Supabase client (RLS), not the secret key.

This route is allowed while onboarding is incomplete (`/api/` prefix in `isOnboardingBypassPath`). Guests can call it too; it only reveals whether a **public** username exists (called out as low/informational in `breachlist.md`).

### 2. Claim — `completeOnboarding`

File: `lib/onboarding/complete.ts`

- Requires signed-in user.
- Body validated with `completeOnboardingSchema` (`usernameSchema` + DOB 18+ + country + optional favourite teams).
- Admin client `UPDATE profiles SET username, date_of_birth, country_code, favourites, onboarding_completed_at` where `id = auth.userId`.
- Unique violation → taken message.

After success the wizard calls `refreshAuthSession()` so JWT onboarding claims update without signing in again.

### 3. Profile read

`lib/profile/queries.ts`:

- `getProfileById` — owner hub.
- `getProfileByUsername` — public page; `ilike` on `username`.

`ProfileView.username` is `string | null`.

### 4. Profile edit

`lib/profile/actions/update-profile.ts` can change display name, country, favourites, Instagram, avatar source — **not** username. After save it `revalidatePath(`/u/${existing.username}`)` so the public page stays fresh.

### 5. Gates that require a username

Onboarding is treated as done only when **all** of these are set:

- `onboarding_completed_at`
- `username`
- `country_code`

Used in:

- `proxy.ts` (hard-gate incomplete logged-in users to `/onboarding`)
- `getPostOAuthRedirectPath` (`/` vs `/onboarding`)
- `/onboarding` page (already done → `/`)

JWT `app_metadata.is_onboarded` still comes from `onboarding_completed_at` via `custom_access_token_hook`. The extra username/country checks catch incomplete rows.

`/u/...` and `/profile` are **not** onboarding bypass paths — unfinished users cannot browse public profiles until they finish.

### 6. Nav

`components/top-nav-auth.tsx`: if the signed-in profile has a username → link to `/profile`; else `/onboarding`.

---

## Frontend

### Onboarding (choose handle)

| Piece | Role |
|-------|------|
| `OnboardingWizard` | Step 1 validation, Finish → `completeOnboarding` |
| `StepAbout` | `@` prefix input, live availability |
| `lib/onboarding/draft-storage` | Autosave draft (including username) to `localStorage` |

Live check: 400ms debounce after each keystroke → `GET /api/profile/username-available`. States: checking / available / taken / invalid. Continue on step 1 still runs `validateUsernameFormat` locally.

### Owner vs public routes

| URL | Who | Behaviour |
|-----|-----|-----------|
| `/profile` | Signed-in owner | Edit UI. Username shown as `@handle`, not an input. Copy-link via `ProfilePublicLink`. |
| `/u/:username` | Anyone else | Same profile chrome **without** edit. `notFound()` if no matching username. If the visitor **is** that user → `redirect("/profile")`. |
| Legacy `/profile/{uuid}` | — | Removed. |

Metadata on `/u/:username`: `{displayName} (@{username}) | Trackballr`.

### Display surfaces

| Surface | Behaviour |
|---------|-----------|
| `ProfileHeader` | Line under display name: `@username` |
| `ProfileEditForm` | Read-only username + public link copy |
| `CommentAuthorLink` / `getCommentAuthorDisplay` | Viewer’s own comment: **You** → `/profile`. Others: `@username` → `/u/{username}`. No username: `@displayName` with **no** profile link |
| Comment queries | `COMMENT_PROFILE_SELECT` includes `username` |
| Trending / match comment strips | Pass `authorUsername` into the same author link |

---

## Product rules (locked)

1. **Username ≠ display name.** Handle is the permalink; display name is the headline.
2. **Mandatory and unique** after onboarding (3–20, `a-z` `0-9` `_`, starts with a letter).
3. **Immutable in v1.** No change-username flow on `/profile`.
4. **Public permalink** is `/u/:username`, not UUID.
5. Visiting **your own** `/u/:username` always goes to `/profile` (no edit UI on the public URL).
6. Do not auto-claim OAuth `preferred_username` as the Trackballer handle.

---

## File map

| Path | What |
|------|------|
| `supabase/migrations/20260606120000_profiles_username_country_x.sql` | Column + unique index |
| `lib/profile/validate-username.ts` | Normalize, format, Zod, reserved list |
| `app/api/profile/username-available/route.ts` | Live availability |
| `lib/onboarding/complete.ts` | Persist username on Finish |
| `lib/onboarding/types.ts` | Draft + complete schemas |
| `components/onboarding/steps/step-about.tsx` | Username field + debounce |
| `app/u/[username]/page.tsx` | Public profile |
| `app/profile/page.tsx` | Owner hub |
| `lib/profile/queries.ts` | Load by id / by username |
| `lib/comment/author-display.ts` | You vs `@username` |
| `proxy.ts` | Incomplete users → `/onboarding` |
