import { NextResponse } from "next/server"

import { STANDINGS_REVALIDATE_SECONDS } from "@/lib/catalog/standings-cache"
import { getStandingsPayload } from "@/lib/catalog/standings-fetch"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const leagueId = Number(searchParams.get("league") ?? "1")
  const season = Number(searchParams.get("season") ?? "2026")

  if (!Number.isFinite(leagueId) || !Number.isFinite(season)) {
    return NextResponse.json({ error: "Invalid league or season" }, { status: 400 })
  }

  const payload = await getStandingsPayload(leagueId, season)
  if (!payload) {
    return NextResponse.json({ error: "Could not load standings" }, { status: 502 })
  }

  return NextResponse.json(payload, {
    headers: {
      "Cache-Control": `public, s-maxage=${STANDINGS_REVALIDATE_SECONDS}, stale-while-revalidate=86400`,
    },
  })
}
