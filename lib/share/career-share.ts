import { cache } from "react"

import { getProfileByUsername } from "@/lib/profile/queries"
import { isCareerHotTake } from "@/lib/share/share-links"
import { createClient } from "@/lib/supabase/server"

export type CareerShare = {
  user: {
    id: string
    username: string
    displayName: string
    avatarUrl: string | null
  }
  player: {
    id: number
    name: string
    photoUrl: string | null
    clubName: string | null
    clubLogoUrl: string | null
  }
  /** The user's career rating, 1–100. */
  rating: number
  /** When the rating was last saved — versions the card picture. */
  ratedAt: string
  /** Public career score shown on the player page. */
  publicScore: number
  publicTier: string
  /** True while the public score is still the base rating (under 10 fan votes). */
  isProvisional: boolean
  isHotTake: boolean
}

type PlayerRow = {
  id: number
  name: string
  photo_url: string | null
  club_team: { name: string; logo_url: string | null } | null
  career:
    | { display_score: number; tier: string; is_provisional: boolean }
    | { display_score: number; tier: string; is_provisional: boolean }[]
    | null
}

export type CareerShareLookup =
  | { status: "ok"; share: CareerShare }
  /** The player exists but this user has no rating for them (or no such user). */
  | { status: "no-rating"; playerId: number }
  | { status: "not-found" }

/** One user's career rating of one player, with what the share card needs. */
export const getCareerShare = cache(
  async (username: string, playerId: number): Promise<CareerShareLookup> => {
    const supabase = await createClient()

    const [profile, playerRes] = await Promise.all([
      getProfileByUsername(username),
      supabase
        .from("players")
        .select(
          `id, name, photo_url,
           club_team:teams!players_club_team_id_fkey(name, logo_url),
           career:player_career_aggregates(display_score, tier, is_provisional)`,
        )
        .eq("id", playerId)
        .maybeSingle(),
    ])

    if (playerRes.error) {
      console.error("getCareerShare player failed:", playerRes.error.message)
    }
    const player = playerRes.data as unknown as PlayerRow | null
    if (!player) return { status: "not-found" }
    if (!profile?.username) return { status: "no-rating", playerId }

    const { data: ratingRow, error } = await supabase
      .from("career_ratings")
      .select("value, updated_at")
      .eq("user_id", profile.id)
      .eq("player_id", playerId)
      .maybeSingle()

    if (error) console.error("getCareerShare rating failed:", error.message)
    if (!ratingRow) return { status: "no-rating", playerId }

    const career = Array.isArray(player.career) ? (player.career[0] ?? null) : player.career
    const rating = Number(ratingRow.value)
    const publicScore = career ? Number(career.display_score) : 50

    return {
      status: "ok",
      share: {
        user: {
          id: profile.id,
          username: profile.username,
          displayName: profile.displayName,
          avatarUrl: profile.avatarUrl,
        },
        player: {
          id: player.id,
          name: player.name,
          photoUrl: player.photo_url,
          clubName: player.club_team?.name ?? null,
          clubLogoUrl: player.club_team?.logo_url ?? null,
        },
        rating,
        ratedAt: ratingRow.updated_at,
        publicScore,
        publicTier: career?.tier ?? "provisional",
        isProvisional: career?.is_provisional ?? true,
        isHotTake: isCareerHotTake(rating, publicScore),
      },
    }
  },
)

/** Stable version string for the card picture: changes only when the rating is re-saved. */
export function careerShareVersion(share: CareerShare): string {
  return String(Math.floor(new Date(share.ratedAt).getTime() / 1000))
}
