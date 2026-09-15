import { getCatalogLeagueId, getCatalogSeasonYear } from "@/lib/catalog/config"
import { API_FOOTBALL_ENABLED } from "@/lib/catalog/sync-cron-enabled"
import { parseStandingsResponse } from "@/lib/catalog/standings-parse"
import type { StandingsPayload } from "@/lib/catalog/standings-types"

/** Server-only fetch — skipped entirely while API_FOOTBALL_ENABLED is false. */
export async function getStandingsPayload(
  leagueId = getCatalogLeagueId(),
  seasonYear = getCatalogSeasonYear(),
): Promise<StandingsPayload | null> {
  if (!API_FOOTBALL_ENABLED) {
    return null
  }

  const baseUrl =
    process.env.API_FOOTBALL_BASE_URL ?? "https://v3.football.api-sports.io"
  const apiKey = process.env.API_FOOTBALL_KEY
  if (!apiKey) {
    console.error("getStandingsPayload: API_FOOTBALL_KEY is not set")
    return null
  }

  const url = `${baseUrl}/standings?league=${leagueId}&season=${seasonYear}`
  const res = await fetch(url, {
    headers: {
      "x-apisports-key": apiKey,
      Accept: "application/json",
    },
    next: { revalidate: 3600 },
  })

  if (!res.ok) {
    console.error("getStandingsPayload failed:", res.status, await res.text())
    return null
  }

  const json: unknown = await res.json()
  return parseStandingsResponse(json, seasonYear)
}
