import { cache } from "react"

import { FIXTURE_TEAM_SELECT, getWorldCupSeason, mapFixtureRow } from "@/lib/catalog/fixtures"
import type { FixtureWithTeams } from "@/lib/catalog/types"
import { createClient } from "@/lib/supabase/server"

import { utcDayBounds } from "./dates"
import type { YourTeamTodayItem } from "./types"

type ProfileTeams = {
  clubId: number | null
  clubName: string | null
  clubLogoUrl: string | null
  nationalId: number | null
  nationalName: string | null
  nationalLogoUrl: string | null
}

async function loadProfileTeams(userId: string): Promise<ProfileTeams | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("profiles")
    .select(`
      favourite_club_id,
      favourite_national_team_id,
      club:teams!profiles_favourite_club_id_fkey(id, name, logo_url),
      national:teams!profiles_favourite_national_team_id_fkey(id, name, logo_url)
    `)
    .eq("id", userId)
    .maybeSingle()

  if (error) {
    console.error("loadProfileTeams failed:", error.message)
    return null
  }

  if (!data) return null

  const club = data.club as { id: number; name: string; logo_url: string | null } | null
  const national = data.national as { id: number; name: string; logo_url: string | null } | null

  return {
    clubId: club?.id ?? data.favourite_club_id,
    clubName: club?.name ?? null,
    clubLogoUrl: club?.logo_url ?? null,
    nationalId: national?.id ?? data.favourite_national_team_id,
    nationalName: national?.name ?? null,
    nationalLogoUrl: national?.logo_url ?? null,
  }
}

function mapFixtureToYourTeamItem(
  fixture: FixtureWithTeams,
  teamId: number,
  teamName: string,
  teamLogoUrl: string | null,
): YourTeamTodayItem {
  const isHome = fixture.home_team_id === teamId
  const opponent = isHome ? fixture.away_team : fixture.home_team

  return {
    fixtureId: fixture.id,
    teamName,
    teamLogoUrl,
    kickoffAt: fixture.kickoff_at,
    roundName: fixture.round_name,
    opponentName: opponent.name,
    opponentLogoUrl: opponent.logo_url,
    isHome,
  }
}

async function fetchFixturesForTeamsToday(
  seasonId: number,
  teamIds: number[],
): Promise<FixtureWithTeams[]> {
  if (teamIds.length === 0) return []

  const supabase = await createClient()
  const { start, end } = utcDayBounds()
  const idList = teamIds.join(",")

  const { data, error } = await supabase
    .from("fixtures")
    .select(FIXTURE_TEAM_SELECT)
    .eq("season_id", seasonId)
    .gte("kickoff_at", start)
    .lt("kickoff_at", end)
    .or(`home_team_id.in.(${idList}),away_team_id.in.(${idList})`)
    .order("kickoff_at", { ascending: true })

  if (error) {
    console.error("fetchFixturesForTeamsToday failed:", error.message)
    return []
  }

  return (data ?? [])
    .map(mapFixtureRow)
    .filter((row): row is FixtureWithTeams => row != null)
}

export const getYourTeamToday = cache(
  async (userId: string | null): Promise<YourTeamTodayItem[]> => {
    if (!userId) return []

    const [profileTeams, season] = await Promise.all([
      loadProfileTeams(userId),
      getWorldCupSeason(),
    ])

    if (!profileTeams || !season) return []

    const teamEntries: Array<{ id: number; name: string; logoUrl: string | null }> = []
    if (profileTeams.clubId && profileTeams.clubName) {
      teamEntries.push({
        id: profileTeams.clubId,
        name: profileTeams.clubName,
        logoUrl: profileTeams.clubLogoUrl,
      })
    }
    if (profileTeams.nationalId && profileTeams.nationalName) {
      teamEntries.push({
        id: profileTeams.nationalId,
        name: profileTeams.nationalName,
        logoUrl: profileTeams.nationalLogoUrl,
      })
    }

    const teamIds = teamEntries.map((team) => team.id)
    const fixtures = await fetchFixturesForTeamsToday(season.id, teamIds)
    const teamById = new Map(teamEntries.map((team) => [team.id, team]))

    const items: YourTeamTodayItem[] = []
    for (const fixture of fixtures) {
      const matchedTeamId =
        teamById.has(fixture.home_team_id) ? fixture.home_team_id : fixture.away_team_id
      const matched = teamById.get(matchedTeamId)
      if (!matched) continue

      items.push(
        mapFixtureToYourTeamItem(fixture, matched.id, matched.name, matched.logoUrl),
      )
    }

    return items
  },
)
