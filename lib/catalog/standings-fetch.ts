import { getCatalogLeagueId, getCatalogSeasonYear } from "@/lib/catalog/config"
import { STANDINGS_REVALIDATE_SECONDS } from "@/lib/catalog/standings-cache"
import { parseStandingsResponse } from "@/lib/catalog/standings-parse"
import type { StandingsPayload } from "@/lib/catalog/standings-types"
import { API_FOOTBALL_ENABLED } from "@/lib/catalog/sync-cron-enabled"

function standingsRequestInit(apiKey: string): RequestInit {
  if (!API_FOOTBALL_ENABLED) {
    // Serve last cached table only — never open a new API connection.
    return {
      headers: {
        "x-apisports-key": apiKey,
        Accept: "application/json",
      },
      cache: "only-if-cached",
    }
  }

  return {
    headers: {
      "x-apisports-key": apiKey,
      Accept: "application/json",
    },
    next: { revalidate: STANDINGS_REVALIDATE_SECONDS },
  }
}

/**
 * Server-only standings fetch.
 * Live mode: at most one API call per league/season per ~30 days.
 * Paused mode: returns cached payload only (no API calls).
 */
export async function getStandingsPayload(
  leagueId = getCatalogLeagueId(),
  seasonYear = getCatalogSeasonYear(),
): Promise<StandingsPayload | null> {
  const baseUrl =
    process.env.API_FOOTBALL_BASE_URL ?? "https://v3.football.api-sports.io"
  const apiKey = process.env.API_FOOTBALL_KEY
  if (!apiKey) {
    console.error("getStandingsPayload: API_FOOTBALL_KEY is not set")
    return null
  }

  const url = `${baseUrl}/standings?league=${leagueId}&season=${seasonYear}`

  try {
    const res = await fetch(url, standingsRequestInit(apiKey))

    if (!res.ok) {
      console.error("getStandingsPayload failed:", res.status, await res.text())
      return null
    }

    const json: unknown = await res.json()
    return parseStandingsResponse(json, seasonYear)
  } catch (err) {
    if (!API_FOOTBALL_ENABLED) {
      console.warn(
        "getStandingsPayload: no cached standings while API is paused",
        { leagueId, seasonYear },
      )
      return null
    }
    console.error("getStandingsPayload error:", err)
    return null
  }
}
