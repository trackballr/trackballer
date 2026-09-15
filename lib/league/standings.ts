import { cache } from "react"

import { getT5SeasonYear } from "@/lib/catalog/config"
import { getStandingsPayload } from "@/lib/catalog/standings-fetch"
import type { StandingsPayload } from "@/lib/catalog/standings-types"

/** League standings — ~30-day cache; paused API serves cache only. */
export const getLeagueStandings = cache(
  async (
    leagueId: number,
    seasonYear = getT5SeasonYear(),
  ): Promise<StandingsPayload | null> => {
    return getStandingsPayload(leagueId, seasonYear)
  },
)
