import type { RoundRow } from "@/lib/catalog/types"
import { createClient } from "@/lib/supabase/server"

/** Sort key for API-Football domestic rounds like "Regular Season - 12". */
export function leagueRoundSortKey(name: string): number {
  const match = /^Regular Season\s*-\s*(\d+)$/i.exec(name.trim())
  if (match) return Number.parseInt(match[1], 10)
  return Number.MAX_SAFE_INTEGER
}

export function sortRoundNames(names: string[]): string[] {
  return [...names].sort((a, b) => {
    const keyDiff = leagueRoundSortKey(a) - leagueRoundSortKey(b)
    if (keyDiff !== 0) return keyDiff
    return a.localeCompare(b)
  })
}

export function roundSortOrderFromName(name: string): number {
  const key = leagueRoundSortKey(name)
  return key === Number.MAX_SAFE_INTEGER ? 999 : key - 1
}

/**
 * Hub picker source of truth is fixture round names. A partial `rounds` table
 * (e.g. one preponed matchweek upserted) must not hide the rest of the season.
 */
export function mergeCatalogRounds(
  seasonId: number,
  tableRounds: RoundRow[],
  fixtureRoundNames: string[],
): RoundRow[] {
  const names = sortRoundNames([
    ...new Set([
      ...tableRounds.map((round) => round.name),
      ...fixtureRoundNames.filter(Boolean),
    ]),
  ])
  const byName = new Map(tableRounds.map((round) => [round.name, round]))

  return names.map((name, index) => {
    const existing = byName.get(name)
    if (existing) return existing
    return {
      id: -(index + 1),
      season_id: seasonId,
      name,
      sort_order: index,
    }
  })
}

/** When bootstrap skipped rounds, derive matchweeks from fixture rows. */
export async function deriveRoundsFromFixtures(seasonId: number): Promise<RoundRow[]> {
  const supabase = await createClient()
  const names = new Set<string>()
  const pageSize = 1000
  let offset = 0

  while (true) {
    const { data, error } = await supabase
      .from("fixtures")
      .select("round_name")
      .eq("season_id", seasonId)
      .not("round_name", "is", null)
      .range(offset, offset + pageSize - 1)

    if (error) {
      console.error("deriveRoundsFromFixtures failed:", error.message)
      break
    }
    if (!data?.length) break

    for (const row of data) {
      if (row.round_name) names.add(row.round_name)
    }
    if (data.length < pageSize) break
    offset += pageSize
  }

  return sortRoundNames([...names]).map((name, index) => ({
    id: -(index + 1),
    season_id: seasonId,
    name,
    sort_order: index,
  }))
}
