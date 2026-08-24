import { cache } from "react"

import { getT5SeasonYear } from "@/lib/catalog/config"
import { getStandingsPayload } from "@/lib/catalog/standings-fetch"
import type { StandingsPayload } from "@/lib/catalog/standings-types"

/** League standings — API fetch with 1h cache until Postgres sync lands. */
export const getLeagueStandings = cache(
  async (
    leagueId: number,
    seasonYear = getT5SeasonYear(),
  ): Promise<StandingsPayload | null> => {
    return getStandingsPayload(leagueId, seasonYear)
  },
)
