import { cache } from "react"

import { getCompetitionHubLogosBySlug } from "@/lib/catalog/competition-hub-cards"
import { getT5SeasonYear } from "@/lib/catalog/config"
import {
  getRecentLiveAndResults,
  getSeasonByLeagueId,
  getUpcomingFixtures,
} from "@/lib/catalog/fixtures"
import { COMPETITION_HUB_LEAGUES } from "@/lib/catalog/top-leagues"
import type { FixtureWithTeams } from "@/lib/catalog/types"

export type LeagueHomeMatches = {
  leagueId: number
  name: string
  slug: string
  logoUrl: string | null
  recent: FixtureWithTeams[]
  upcoming: FixtureWithTeams[]
}

export const getHomeLeagueMatches = cache(async (): Promise<LeagueHomeMatches[]> => {
  const seasonYear = getT5SeasonYear()
  const logosBySlug = await getCompetitionHubLogosBySlug()

  const blocks = await Promise.all(
    COMPETITION_HUB_LEAGUES.map(async (league) => {
      const season = await getSeasonByLeagueId(league.id, seasonYear)
      if (!season) {
        return {
          leagueId: league.id,
          name: league.name,
          slug: league.slug,
          logoUrl: logosBySlug.get(league.slug) ?? null,
          recent: [],
          upcoming: [],
        }
      }

      const [recent, upcoming] = await Promise.all([
        getRecentLiveAndResults(season.id, { limit: 3 }),
        getUpcomingFixtures(season.id, { limit: 3 }),
      ])

      return {
        leagueId: league.id,
        name: league.name,
        slug: league.slug,
        logoUrl: logosBySlug.get(league.slug) ?? null,
        recent,
        upcoming,
      }
    }),
  )

  return blocks
})
