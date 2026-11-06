import { cache } from "react"

import { getProfileByUsername } from "@/lib/profile/queries"
import { buildSubOnInfoMap, type SubstitutionEventRow } from "@/lib/match/sub-on-minutes"
import { formatFixtureRoundLabel } from "@/lib/world-cup/round-label"
import {
  buildMatchShare,
  lineupGrid,
  type MatchShare,
  type MatchSharePlayer,
} from "@/lib/share/match-share-model"
import { createClient } from "@/lib/supabase/server"

export type MatchShareLookup =
  | { status: "ok"; share: MatchShare }
  | { status: "locked"; fixtureId: number }
  | { status: "not-found" }

type TeamSide = { id: number; name: string; logo_url: string | null }

type FixtureRow = {
  id: number
  round_name: string | null
  home_team_id: number
  away_team_id: number
  home_team: TeamSide | TeamSide[] | null
  away_team: TeamSide | TeamSide[] | null
}

type LineupRow = {
  player_id: number
  is_starter: boolean
  shirt_number: number | null
  grid: string | null
  players: { id: number; name: string; photo_url: string | null } | { id: number; name: string; photo_url: string | null }[] | null
}

function one<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) return value[0] ?? null
  return value
}

/** Seconds since the latest save. Changes the card address when a score changes. */
export function matchShareVersion(share: MatchShare): string {
  return String(Math.floor(new Date(share.ratedAt).getTime() / 1000))
}

/** One viewer's ratings of one team. Locked until five players who played are scored. */
export const getMatchShare = cache(
  async (username: string, fixtureId: number, teamId: number): Promise<MatchShareLookup> => {
    const supabase = await createClient()
    const profile = await getProfileByUsername(username)
    if (!profile?.username) return { status: "not-found" }

    const { data: fixtureRow, error: fixtureError } = await supabase
      .from("fixtures")
      .select(
        `id, round_name, home_team_id, away_team_id,
         home_team:teams!fixtures_home_team_id_fkey(id, name, logo_url),
         away_team:teams!fixtures_away_team_id_fkey(id, name, logo_url)`,
      )
      .eq("id", fixtureId)
      .maybeSingle()

    if (fixtureError || !fixtureRow) {
      if (fixtureError) console.error("getMatchShare fixture:", fixtureError.message)
      return { status: "not-found" }
    }

    const fixture = fixtureRow as unknown as FixtureRow
    const home = one(fixture.home_team)
    const away = one(fixture.away_team)
    const team = home?.id === teamId ? home : away?.id === teamId ? away : null
    const opponent = team?.id === home?.id ? away : home
    if (!team || !opponent) return { status: "not-found" }

    const [lineupsRes, appearancesRes, ratingsRes, eventsRes] = await Promise.all([
      supabase
        .from("fixture_lineups")
        .select("player_id, is_starter, shirt_number, grid, players(id, name, photo_url)")
        .eq("fixture_id", fixtureId)
        .eq("team_id", teamId),
      supabase
        .from("fixture_appearances")
        .select("player_id, is_rateable, minutes_played, position")
        .eq("fixture_id", fixtureId),
      supabase
        .from("match_ratings")
        .select("player_id, value, updated_at")
        .eq("user_id", profile.id)
        .eq("fixture_id", fixtureId),
      supabase
        .from("fixture_events")
        .select("player_id, assist_player_id, minute, extra_minute, type")
        .eq("fixture_id", fixtureId)
        .eq("team_id", teamId),
    ])

    if (lineupsRes.error) console.error("getMatchShare lineups:", lineupsRes.error.message)
    const lineups = (lineupsRes.data ?? []) as unknown as LineupRow[]
    if (lineups.length === 0) return { status: "not-found" }

    const appearanceByPlayer = new Map(
      (appearancesRes.data ?? []).map((row) => [row.player_id, row]),
    )
    const ratingByPlayer = new Map(
      (ratingsRes.data ?? []).map((row) => [row.player_id, row]),
    )
    const subOn = buildSubOnInfoMap((eventsRes.data ?? []) as SubstitutionEventRow[])

    let fallback = 0
    const players: MatchSharePlayer[] = []
    let ratedAt: string | null = null

    for (const row of lineups) {
      const person = one(row.players)
      if (!person) continue
      const appearance = appearanceByPlayer.get(row.player_id)
      const rating = ratingByPlayer.get(row.player_id)
      const grid = lineupGrid(row.grid, fallback)
      fallback += 1
      if (rating?.updated_at && (!ratedAt || rating.updated_at > ratedAt)) {
        ratedAt = rating.updated_at
      }
      players.push({
        id: person.id,
        name: person.name,
        photoUrl: person.photo_url,
        position: appearance?.position ?? null,
        shirtNumber: row.shirt_number,
        isStarter: row.is_starter,
        isRateable: appearance?.is_rateable === true,
        gridRow: grid.gridRow,
        gridCol: grid.gridCol,
        subOnMinute: row.is_starter ? null : (subOn.get(row.player_id)?.minute ?? null),
        rating: rating ? Number(rating.value) : null,
      })
    }

    const share = buildMatchShare({
      fixtureId,
      username: profile.username,
      displayName: profile.displayName,
      team: { id: team.id, name: team.name, logoUrl: team.logo_url },
      opponentName: opponent.name,
      roundLabel: formatFixtureRoundLabel(fixture.round_name),
      players,
      ratedAt,
    })

    if (!share) return { status: "locked", fixtureId }
    return { status: "ok", share }
  },
)
