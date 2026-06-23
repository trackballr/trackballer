"use server"

import { getServerAuth } from "@/lib/auth/server-session"
import { completeOnboardingSchema } from "@/lib/onboarding/types"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

export type CompleteOnboardingResult =
  | { ok: true }
  | { ok: false; error: string }

export async function completeOnboarding(
  input: unknown,
): Promise<CompleteOnboardingResult> {
  const supabase = await createClient()
  const auth = await getServerAuth(supabase)

  if (!auth) {
    return { ok: false, error: "You must be signed in." }
  }

  const parsed = completeOnboardingSchema.safeParse(input)
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Invalid onboarding data"
    return { ok: false, error: message }
  }

  const {
    username,
    dateOfBirth,
    countryCode,
    favouriteClubId,
    favouriteNationalTeamId,
  } = parsed.data

  const { error: updateError } = await createAdminClient()
    .from("profiles")
    .update({
      username,
      date_of_birth: dateOfBirth,
      country_code: countryCode,
      favourite_club_id: favouriteClubId,
      favourite_national_team_id: favouriteNationalTeamId,
      onboarding_completed_at: new Date().toISOString(),
    })
    .eq("id", auth.userId)

  if (updateError) {
    if (updateError.code === "23505") {
      return { ok: false, error: "That username is taken. Pick another." }
    }
    return { ok: false, error: "Could not save your profile. Try again." }
  }

  return { ok: true }
}
