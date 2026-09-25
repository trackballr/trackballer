"use server"

import {
  mapShuffleCareerPlayerRow,
  type ShufflePlayerCard,
} from "@/lib/home/shuffle-career-player-map"
import { sanitizeShuffleFilter } from "@/lib/home/shuffle-filter-state"
import { getServerAuth } from "@/lib/auth/server-session"
import { createClient } from "@/lib/supabase/server"

export type FetchShuffleCareerPlayerResult =
  | { ok: true; player: ShufflePlayerCard | null }
  | { ok: false; error: string }

export async function fetchShuffleCareerPlayer(
  filter: { leagueId: number | null; teamIds: number[] } = { leagueId: null, teamIds: [] },
): Promise<FetchShuffleCareerPlayerResult> {
  const supabase = await createClient()
  const auth = await getServerAuth(supabase)

  if (!auth) {
    return { ok: false, error: "Sign in required" }
  }

  const sanitized = sanitizeShuffleFilter(filter)
  if (!sanitized.ok) {
    return { ok: false, error: "Could not load a player. Try again." }
  }

  const { data, error } = await supabase.rpc("get_shuffle_career_player", {
    ...(sanitized.filter.leagueId != null ? { p_league_id: sanitized.filter.leagueId } : {}),
    ...(sanitized.filter.teamIds.length > 0 ? { p_team_ids: sanitized.filter.teamIds } : {}),
  })

  if (error) {
    console.error("get_shuffle_career_player failed:", error.message)
    return { ok: false, error: "Could not load a player. Try again." }
  }

  const row = data?.[0]
  if (!row) {
    return { ok: true, player: null }
  }

  return { ok: true, player: mapShuffleCareerPlayerRow(row) }
}
