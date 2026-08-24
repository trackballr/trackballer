import { cache } from "react"

import { getT5SeasonYear } from "@/lib/catalog/config"
import { FIXTURE_TEAM_SELECT, getSeasonByLeagueId, mapFixtureRow } from "@/lib/catalog/fixtures"
import { TOP_LEAGUE_CLUBS } from "@/lib/catalog/top-leagues"
import type { FixtureWithTeams } from "@/lib/catalog/types"
import { createClient } from "@/lib/supabase/server"

import { utcDayBounds } from "./dates"
import type { YourTeamTodayItem } from "./types"

type ProfileTeams = {
  clubId: number | null
  clubName: string | null
  clubLogoUrl: string | null
}

async function loadProfileTeams(userId: string): Promise<ProfileTeams | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("profiles")
    .select(`
      favourite_club_id,
      club:teams!profiles_favourite_club_id_fkey(id, name, logo_url)
    `)
    .eq("id", userId)
    .maybeSingle()

  if (error) {
    console.error("loadProfileTeams failed:", error.message)
    return null
  }

  if (!data) return null

  const club = data.club as { id: number; name: string; logo_url: string | null } | null

  return {
    clubId: club?.id ?? data.favourite_club_id,
    clubName: club?.name ?? null,
    clubLogoUrl: club?.logo_url ?? null,
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

async function getTopLeagueSeasonIds(seasonYear: number): Promise<number[]> {
  const seasons = await Promise.all(
    TOP_LEAGUE_CLUBS.map((league) => getSeasonByLeagueId(league.id, seasonYear)),
  )
  return seasons.filter((season) => season != null).map((season) => season.id)
}

async function fetchClubFixturesToday(
  seasonIds: number[],
  clubId: number,
): Promise<FixtureWithTeams[]> {
  if (seasonIds.length === 0) return []

  const supabase = await createClient()
  const { start, end } = utcDayBounds()

  const { data, error } = await supabase
    .from("fixtures")
    .select(FIXTURE_TEAM_SELECT)
    .in("season_id", seasonIds)
    .gte("kickoff_at", start)
    .lt("kickoff_at", end)
    .or(`home_team_id.eq.${clubId},away_team_id.eq.${clubId}`)
    .order("kickoff_at", { ascending: true })

  if (error) {
    console.error("fetchClubFixturesToday failed:", error.message)
    return []
  }

  return (data ?? [])
    .map(mapFixtureRow)
    .filter((row): row is FixtureWithTeams => row != null)
}

export const getYourTeamToday = cache(
  async (userId: string | null): Promise<YourTeamTodayItem[]> => {
    if (!userId) return []

    const profileTeams = await loadProfileTeams(userId)
    if (!profileTeams?.clubId || !profileTeams.clubName) return []

    const seasonIds = await getTopLeagueSeasonIds(getT5SeasonYear())
    const fixtures = await fetchClubFixturesToday(seasonIds, profileTeams.clubId)

    return fixtures.map((fixture) =>
      mapFixtureToYourTeamItem(
        fixture,
        profileTeams.clubId!,
        profileTeams.clubName!,
        profileTeams.clubLogoUrl,
      ),
    )
  },
)
