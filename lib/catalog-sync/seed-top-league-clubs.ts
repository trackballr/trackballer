import type { SupabaseClient } from "@supabase/supabase-js"

import type { ApiFootballClient } from "@/lib/api-football/client"
import {
  COMPETITION_HUB_LEAGUES,
  TOP_LEAGUE_CLUBS,
  type TopLeagueDefinition,
} from "@/lib/catalog/top-leagues"
import type { Database } from "@/lib/database.types"
import { mapClubFromLeague } from "@/lib/catalog-sync/mappers"

type Db = SupabaseClient<Database>

export type { TopLeagueDefinition }
export { TOP_LEAGUE_CLUBS }

export type TopLeagueClubsSeedResult = {
  seasonYear: number
  leaguesUpserted: number
  teamsUpserted: number
  byLeague: Array<{
    leagueId: number
    slug: string
    teamsFromApi: number
  }>
}

function dedupeById<T extends { id: number }>(rows: T[]): T[] {
  const map = new Map<number, T>()
  for (const row of rows) {
    map.set(row.id, row)
  }
  return [...map.values()]
}

export async function seedTopLeagueClubs(
  db: Db,
  api: ApiFootballClient,
  seasonYear: number,
): Promise<TopLeagueClubsSeedResult> {
  const leagueRows: Database["public"]["Tables"]["leagues"]["Insert"][] =
    COMPETITION_HUB_LEAGUES.map((league) => ({
      id: league.id,
      name: league.name,
      slug: league.slug,
      country: league.country,
      logo_url: null,
      is_active: false,
    }))

  const { error: leagueError } = await db.from("leagues").upsert(leagueRows, {
    onConflict: "id",
  })
  if (leagueError) throw leagueError

  const byLeague: TopLeagueClubsSeedResult["byLeague"] = []
  const allTeams: Database["public"]["Tables"]["teams"]["Insert"][] = []

  for (const league of TOP_LEAGUE_CLUBS) {
    const teamsRes = await api.getTeams(league.id, seasonYear)
    const teamRows = teamsRes.response.map(mapClubFromLeague)
    allTeams.push(...teamRows)
    byLeague.push({
      leagueId: league.id,
      slug: league.slug,
      teamsFromApi: teamRows.length,
    })
  }

  const uniqueTeams = dedupeById(allTeams)
  if (uniqueTeams.length > 0) {
    const { error: teamError } = await db.from("teams").upsert(uniqueTeams, {
      onConflict: "id",
    })
    if (teamError) throw teamError
  }

  return {
    seasonYear,
    leaguesUpserted: leagueRows.length,
    teamsUpserted: uniqueTeams.length,
    byLeague,
  }
}
