import { cache } from "react"

import { getT5SeasonYear } from "@/lib/catalog/config"
import { getStandingsPayload } from "@/lib/catalog/standings-fetch"
import type { StandingsPayload } from "@/lib/catalog/standings-types"

/** League standings — cached for this deploy (API hourly refresh paused). */
export const getLeagueStandings = cache(
  async (
    leagueId: number,
    seasonYear = getT5SeasonYear(),
  ): Promise<StandingsPayload | null> => {
    return getStandingsPayload(leagueId, seasonYear)
  },
)
