"use server"

import { revalidatePath } from "next/cache"

import { requireServerAuth } from "@/lib/auth/server-session"
import {
  buildAvatarCacheUpdate,
  type AvatarSource,
} from "@/lib/profile/display-avatar"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

export type DisconnectXResult = { ok: true } | { ok: false; error: string }

/** Clear X link + verified badge after the user unlinks their X identity. */
export async function disconnectXProfile(): Promise<DisconnectXResult> {
  const supabase = await createClient()
  const gate = await requireServerAuth(supabase)

  if (!gate.ok) {
    return { ok: false, error: "Sign in to disconnect X." }
  }

  const { userId } = gate.auth

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { ok: false, error: "Could not load your account." }
  }

  const xIdentity = user.identities?.find(
    (identity) => identity.provider === "x" || identity.provider === "twitter",
  )

  if (xIdentity) {
    const { error: unlinkError } = await supabase.auth.unlinkIdentity(xIdentity)
    if (unlinkError) {
      return { ok: false, error: unlinkError.message }
    }
  }

  const admin = createAdminClient()
  const { data: existing, error: fetchError } = await admin
    .from("profiles")
    .select("avatar_source, google_avatar_url, x_avatar_url, avatar_url")
    .eq("id", userId)
    .maybeSingle()

  if (fetchError || !existing) {
    return { ok: false, error: "Could not load your profile." }
  }

  const nextSource: AvatarSource | null =
    existing.avatar_source === "x"
      ? "google"
      : existing.avatar_source === "google"
        ? "google"
        : null

  const avatarCache = buildAvatarCacheUpdate({
    avatar_source: nextSource ?? null,
    google_avatar_url: existing.google_avatar_url,
    x_avatar_url: null,
    avatar_url: existing.avatar_url,
  })

  const { error: updateError } = await admin
    .from("profiles")
    .update({
      twitter_handle: null,
      twitter_verified_at: null,
      x_avatar_url: null,
      ...avatarCache,
    })
    .eq("id", userId)

  if (updateError) {
    return { ok: false, error: "Could not disconnect X. Try again." }
  }

  revalidatePath("/profile")
  return { ok: true }
}
