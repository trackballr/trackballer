import { cache } from "react"

import { createClient } from "@/lib/supabase/server"

import { fetchPlayerIdsMatchingName } from "./player-name-query"
import { browseOffset, BROWSE_PAGE_SIZE } from "./query"
import { mapAndSortPlayerRows } from "./sort-players"
import type { BrowseFilters, BrowsePlayersResult } from "./types"

const PLAYER_BROWSE_SELECT = `
  id,
  name,
  firstname,
  lastname,
  photo_url,
  nationality,
  primary_position,
  age,
  club_team:teams!players_club_team_id_fkey(name, logo_url, code),
  career:player_career_aggregates(display_score, tier, is_provisional)
`

const DB_PAGE = 1000
const ID_CHUNK = 300

type Db = Awaited<ReturnType<typeof createClient>>
type PlayersQuery = ReturnType<Db["from"]>

async function resolveCandidateIds(
  supabase: Db,
  filters: BrowseFilters,
): Promise<number[] | null> {
  if (!filters.q) return null

  const nameIds = await fetchPlayerIdsMatchingName(supabase, filters.q)
  return nameIds.length === 0 ? [] : nameIds
}

function applyBrowseFilters(
  query: PlayersQuery,
  filters: BrowseFilters,
): PlayersQuery {
  let q = query

  if (filters.nationalTeamId != null) {
    q = q.eq("national_team_id", filters.nationalTeamId)
  }
  if (filters.position) {
    q = q.eq("primary_position", filters.position)
  }
  if (filters.clubId != null) {
    q = q.eq("club_team_id", filters.clubId)
  }
  if (filters.ageMin != null) {
    q = q.gte("age", filters.ageMin)
  }
  if (filters.ageMax != null) {
    q = q.lte("age", filters.ageMax)
  }

  return q
}

async function fetchBrowseRows(
  supabase: Db,
  filters: BrowseFilters,
  candidateIds: number[] | null,
): Promise<{ rows: unknown[]; total: number | null }> {
  const allRows: unknown[] = []

  if (candidateIds !== null) {
    for (let i = 0; i < candidateIds.length; i += ID_CHUNK) {
      const chunk = candidateIds.slice(i, i + ID_CHUNK)
      const { data, error } = await applyBrowseFilters(
        supabase.from("players").select(PLAYER_BROWSE_SELECT),
        filters,
      ).in("id", chunk)

      if (error) {
        console.error("browsePlayers chunk failed:", error.message)
        return { rows: [], total: null }
      }

      allRows.push(...(data ?? []))
    }

    // Count filtered rows, not raw name matches — age/club/position filters apply here too.
    return { rows: allRows, total: allRows.length }
  }

  let from = 0
  let total: number | null = null

  while (true) {
    const { data, error, count } = await applyBrowseFilters(
      supabase.from("players").select(PLAYER_BROWSE_SELECT, {
        count: from === 0 ? "exact" : undefined,
      }),
      filters,
    ).range(from, from + DB_PAGE - 1)

    if (error) {
      console.error("browsePlayers failed:", error.message)
      return { rows: [], total: null }
    }

    if (from === 0 && count != null) total = count
    allRows.push(...(data ?? []))

    if (!data || data.length < DB_PAGE) break
    from += DB_PAGE
  }

  return { rows: allRows, total }
}

export const browsePlayers = cache(
  async (filters: BrowseFilters): Promise<BrowsePlayersResult> => {
    const supabase = await createClient()
    const candidateIds = await resolveCandidateIds(supabase, filters)

    if (candidateIds && candidateIds.length === 0) {
      return {
        players: [],
        total: 0,
        page: filters.page,
        pageSize: BROWSE_PAGE_SIZE,
      }
    }

    const { rows } = await fetchBrowseRows(supabase, filters, candidateIds)
    let sorted = mapAndSortPlayerRows(rows, filters.sort)

    if (filters.minRating != null) {
      sorted = sorted.filter((player) => player.displayScore >= filters.minRating!)
    }

    const from = browseOffset(filters.page)

    return {
      players: sorted.slice(from, from + BROWSE_PAGE_SIZE),
      total: sorted.length,
      page: filters.page,
      pageSize: BROWSE_PAGE_SIZE,
    }
  },
)
