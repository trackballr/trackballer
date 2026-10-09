import { cache } from "react"

import { createClient } from "@/lib/supabase/server"

import { fetchPlayerIdsMatchingName } from "./player-name-query"
import { normalizeSearchQuery, SEARCH_RESULTS_LIMIT } from "./query"
import { mapAndSortPlayerRows } from "./sort-players"
import type { PlayerListItem } from "./types"

const PLAYER_SEARCH_SELECT = `
  id,
  name,
  firstname,
  lastname,
  photo_url,
  nationality,
  primary_position,
  age,
  birth_date,
  club_team:teams!players_club_team_id_fkey(name, logo_url, code),
  career:player_career_aggregates(display_score, tier, is_provisional)
`

export async function searchPlayersUncached(
  rawQuery: string | null | undefined,
): Promise<PlayerListItem[]> {
  const query = normalizeSearchQuery(rawQuery)
  if (!query) return []

  const supabase = await createClient()
  const matchingIds = await fetchPlayerIdsMatchingName(supabase, query)

  if (matchingIds.length === 0) return []

  const { data, error } = await supabase
    .from("players")
    .select(PLAYER_SEARCH_SELECT)
    .in("id", matchingIds)

  if (error) {
    console.error("searchPlayers failed:", error.message)
    return []
  }

  return mapAndSortPlayerRows(data ?? []).slice(0, SEARCH_RESULTS_LIMIT)
}

export const searchPlayers = cache(searchPlayersUncached)
