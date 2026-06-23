import type { SupabaseClient, User } from "@supabase/supabase-js"

import { getFullAuthUser } from "@/lib/auth/server-session"
import {
  buildAvatarCacheUpdate,
  type AvatarSource,
} from "@/lib/profile/display-avatar"
import { normalizeXAvatarUrl } from "@/lib/profile/normalize-x-avatar-url"
import { normalizeSocialHandle } from "@/lib/profile/validate-social-handles"
import type { Database } from "@/lib/database.types"
import { createAdminClient } from "@/lib/supabase/admin"

type AuthUser = User

function readHttpsAvatar(meta: Record<string, unknown>): string | null {
  const raw =
    (typeof meta.picture === "string" && meta.picture) ||
    (typeof meta.avatar_url === "string" && meta.avatar_url) ||
    (typeof meta.profile_image_url === "string" && meta.profile_image_url) ||
    (typeof meta.profile_image_url_https === "string" &&
      meta.profile_image_url_https) ||
    null

  return raw?.startsWith("https://") ? raw : null
}

function readGoogleAvatar(user: AuthUser): string | null {
  const googleIdentity = user.identities?.find(
    (identity) => identity.provider === "google",
  )
  const meta = {
    ...(user.user_metadata ?? {}),
    ...((googleIdentity?.identity_data as Record<string, unknown> | undefined) ??
      {}),
  }
  return readHttpsAvatar(meta)
}

function readXData(user: AuthUser): {
  handle: string | null
  avatarUrl: string | null
} {
  const xIdentity = user.identities?.find(
    (identity) => identity.provider === "x" || identity.provider === "twitter",
  )

  const meta = {
    ...(user.user_metadata ?? {}),
    ...((xIdentity?.identity_data as Record<string, unknown> | undefined) ?? {}),
  }

  const rawHandle =
    (typeof meta.user_name === "string" && meta.user_name) ||
    (typeof meta.preferred_username === "string" && meta.preferred_username) ||
    (typeof meta.screen_name === "string" && meta.screen_name) ||
    null

  const normalized = rawHandle
    ? normalizeSocialHandle("twitter", rawHandle)
    : { ok: true as const, handle: null }

  const rawAvatar = readHttpsAvatar(meta)

  return {
    handle: normalized.ok ? normalized.handle : null,
    avatarUrl: rawAvatar ? normalizeXAvatarUrl(rawAvatar) : null,
  }
}

function hasProvider(user: AuthUser, provider: "google" | "x"): boolean {
  return Boolean(
    user.identities?.some(
      (identity) =>
        identity.provider === provider ||
        (provider === "x" && identity.provider === "twitter"),
    ),
  )
}

/** After OAuth sign-in or Connect X, store provider avatars separately and refresh display cache. */
export async function syncOAuthProfilesFromAuth(
  supabase: SupabaseClient<Database>,
): Promise<void> {
  const user = await getFullAuthUser(supabase)

  if (!user) return

  const googleAvatar = hasProvider(user, "google") ? readGoogleAvatar(user) : null
  const { handle: xHandle, avatarUrl: xAvatar } = hasProvider(user, "x")
    ? readXData(user)
    : { handle: null, avatarUrl: null }

  if (!googleAvatar && !xAvatar && !xHandle) return

  const admin = createAdminClient()

  const { data: existing } = await admin
    .from("profiles")
    .select(
      "avatar_url, google_avatar_url, x_avatar_url, avatar_source, twitter_handle, twitter_verified_at",
    )
    .eq("id", user.id)
    .maybeSingle()

  const updates: Database["public"]["Tables"]["profiles"]["Update"] = {}

  if (googleAvatar) {
    updates.google_avatar_url = googleAvatar
  }

  if (xHandle) {
    updates.twitter_handle = xHandle
    if (!existing?.twitter_verified_at) {
      updates.twitter_verified_at = new Date().toISOString()
    }
  }

  if (xAvatar) {
    updates.x_avatar_url = xAvatar
  }

  let avatarSource = (existing?.avatar_source as AvatarSource | null) ?? null

  if (!avatarSource) {
    if (googleAvatar && !xAvatar) avatarSource = "google"
    else if (xAvatar && !googleAvatar) avatarSource = "x"
    else if (googleAvatar) avatarSource = "google"
    else if (xAvatar) avatarSource = "x"
  }

  const cache = buildAvatarCacheUpdate({
    avatar_url: existing?.avatar_url,
    google_avatar_url: googleAvatar ?? existing?.google_avatar_url,
    x_avatar_url: xAvatar ?? existing?.x_avatar_url,
    avatar_source: avatarSource,
  })

  Object.assign(updates, cache)

  if (Object.keys(updates).length === 0) return

  await admin.from("profiles").update(updates).eq("id", user.id)
}
