import { cache } from "react"

import { TOP_LEAGUE_CLUBS } from "@/lib/catalog/top-leagues"
import type { ShuffleClubOption } from "@/lib/home/shuffle-filter-state"
import { createClient } from "@/lib/supabase/server"

const TOP_LEAGUE_IDS = TOP_LEAGUE_CLUBS.map((league) => league.id)
const ROW_PAGE = 1000

type TeamRow = {
  id: number
  name: string
  logo_url: string | null
}

export const getShuffleClubs = cache(async (): Promise<ShuffleClubOption[]> => {
  const supabase = await createClient()
  const { data: seasons, error } = await supabase
    .from("seasons")
    .select("id, league_id, year")
    .in("league_id", TOP_LEAGUE_IDS)

  if (error) {
    console.error("getShuffleClubs seasons:", error.message)
    return []
  }
  if (!seasons?.length) return []

  const maxYear = Math.max(...seasons.map((season) => season.year))
  const latest = seasons.filter((season) => season.year === maxYear)
  const seasonLeague = new Map(latest.map((season) => [season.id, season.league_id]))
  const seasonIds = latest.map((season) => season.id)
  const byId = new Map<number, ShuffleClubOption>()

  await addSquadClubs(supabase, seasonIds, seasonLeague, byId)
  await addFixtureClubs(supabase, seasonIds, seasonLeague, byId)

  const leagueOrder = new Map(TOP_LEAGUE_CLUBS.map((league, index) => [league.id, index]))
  return [...byId.values()].sort((a, b) => {
    const leagueDelta = (leagueOrder.get(a.leagueId) ?? 99) - (leagueOrder.get(b.leagueId) ?? 99)
    if (leagueDelta !== 0) return leagueDelta
    return a.name.localeCompare(b.name)
  })
})

async function addSquadClubs(
  supabase: Awaited<ReturnType<typeof createClient>>,
  seasonIds: number[],
  seasonLeague: Map<number, number>,
  byId: Map<number, ShuffleClubOption>,
) {
  let from = 0
  while (true) {
    const { data, error } = await supabase
      .from("player_season_squads")
      .select(
        "team_id, season_id, team:teams!player_season_squads_team_id_fkey(id, name, logo_url)",
      )
      .in("season_id", seasonIds)
      .range(from, from + ROW_PAGE - 1)

    if (error) {
      console.error("getShuffleClubs squads:", error.message)
      return
    }

    for (const row of data ?? []) {
      const leagueId = seasonLeague.get(row.season_id)
      if (leagueId == null) continue
      addClub(byId, asTeam(row.team), leagueId)
    }

    if (!data || data.length < ROW_PAGE) return
    from += ROW_PAGE
  }
}

async function addFixtureClubs(
  supabase: Awaited<ReturnType<typeof createClient>>,
  seasonIds: number[],
  seasonLeague: Map<number, number>,
  byId: Map<number, ShuffleClubOption>,
) {
  let from = 0
  while (true) {
    const { data, error } = await supabase
      .from("fixtures")
      .select(
        "season_id, home_team:teams!fixtures_home_team_id_fkey(id, name, logo_url), away_team:teams!fixtures_away_team_id_fkey(id, name, logo_url)",
      )
      .in("season_id", seasonIds)
      .range(from, from + ROW_PAGE - 1)

    if (error) {
      console.error("getShuffleClubs fixtures:", error.message)
      return
    }

    for (const row of data ?? []) {
      const leagueId = seasonLeague.get(row.season_id)
      if (leagueId == null) continue
      addClub(byId, asTeam(row.home_team), leagueId)
      addClub(byId, asTeam(row.away_team), leagueId)
    }

    if (!data || data.length < ROW_PAGE) return
    from += ROW_PAGE
  }
}

function addClub(
  byId: Map<number, ShuffleClubOption>,
  team: TeamRow | null,
  leagueId: number,
) {
  if (!team || byId.has(team.id)) return
  byId.set(team.id, {
    id: team.id,
    name: team.name,
    logoUrl: team.logo_url,
    leagueId,
  })
}

function asTeam(value: unknown): TeamRow | null {
  const row = Array.isArray(value) ? value[0] : value
  if (!row || typeof row !== "object") return null
  const team = row as Partial<TeamRow>
  if (typeof team.id !== "number" || typeof team.name !== "string") return null
  return {
    id: team.id,
    name: team.name,
    logo_url: typeof team.logo_url === "string" ? team.logo_url : null,
  }
}
