"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { buildAvatarCacheUpdate } from "@/lib/profile/display-avatar"
import { normalizeSocialHandle } from "@/lib/profile/validate-social-handles"
import { countryCodeSchema } from "@/lib/profile/validate-username"
import { requireServerAuth } from "@/lib/auth/server-session"
import { createClient } from "@/lib/supabase/server"

const updateProfileSchema = z.object({
  displayName: z.string().trim().min(1, "Display name is required.").max(80),
  countryCode: countryCodeSchema,
  favouriteClubId: z.number().int().positive().nullable(),
  favouriteNationalTeamId: z.number().int().positive().nullable(),
  plasticFanConfirmed: z.boolean().optional(),
  instagramHandle: z
    .union([z.string(), z.null(), z.undefined()])
    .transform((val, ctx) => {
      const result = normalizeSocialHandle("instagram", val ?? null)
      if (!result.ok) {
        ctx.addIssue({ code: "custom", message: result.error })
        return z.NEVER
      }
      return result.handle
    }),
  avatarSource: z.enum(["google", "x"]).optional(),
})

export type UpdateProfileResult = { ok: true } | { ok: false; error: string }

export async function updateProfile(input: unknown): Promise<UpdateProfileResult> {
  const supabase = await createClient()
  const gate = await requireServerAuth(supabase)

  if (!gate.ok) {
    return { ok: false, error: "Sign in to edit your profile." }
  }

  const { userId } = gate.auth

  const parsed = updateProfileSchema.safeParse(input)
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Invalid profile data."
    return { ok: false, error: message }
  }

  const data = parsed.data

  const { data: existing, error: fetchError } = await supabase
    .from("profiles")
    .select(
      "favourite_club_id, onboarding_completed_at, username, google_avatar_url, x_avatar_url, avatar_source, avatar_url",
    )
    .eq("id", userId)
    .single()

  if (fetchError || !existing) {
    return { ok: false, error: "Could not load your profile." }
  }

  const clubChanged =
    existing.favourite_club_id != null &&
    data.favouriteClubId !== existing.favourite_club_id

  if (
    clubChanged &&
    existing.onboarding_completed_at &&
    !data.plasticFanConfirmed
  ) {
    return {
      ok: false,
      error: "Confirm your new club loyalty before saving.",
    }
  }

  const avatarFields =
    data.avatarSource != null
      ? buildAvatarCacheUpdate({
          avatar_source: data.avatarSource,
          google_avatar_url: existing.google_avatar_url,
          x_avatar_url: existing.x_avatar_url,
          avatar_url: existing.avatar_url,
        })
      : {}

  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      display_name: data.displayName,
      country_code: data.countryCode,
      favourite_club_id: data.favouriteClubId,
      favourite_national_team_id: data.favouriteNationalTeamId,
      instagram_handle: data.instagramHandle,
      ...avatarFields,
    })
    .eq("id", userId)

  if (updateError) {
    return { ok: false, error: "Could not save profile. Try again." }
  }

  if (existing.username) {
    revalidatePath(`/u/${existing.username}`)
  }
  revalidatePath("/profile")
  revalidatePath("/")
  return { ok: true }
}
