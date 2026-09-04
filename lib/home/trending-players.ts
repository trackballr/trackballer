import { cache } from "react"

import { createClient } from "@/lib/supabase/server"

import type { TrendingPlayerCard } from "./types"

const TRENDING_LIMIT = 8

const PLAYER_SELECT = `
  id,
  name,
  photo_url,
  club_team:teams!players_club_team_id_fkey(id, name, logo_url, code),
  career:player_career_aggregates(display_score, tier, is_provisional, vote_count)
`

type ClubTeamRow = {
  id: number
  name: string
  logo_url: string | null
  code: string | null
}

type PlayerRow = {
  id: number
  name: string
  photo_url: string | null
  club_team: ClubTeamRow | ClubTeamRow[] | null
  career: {
    display_score: number
    tier: string
    is_provisional: boolean
    vote_count: number
  } | null
}

function normalizeClubTeam(
  raw: ClubTeamRow | ClubTeamRow[] | null,
): TrendingPlayerCard["clubTeam"] {
  if (!raw) return null
  const team = Array.isArray(raw) ? raw[0] : raw
  if (!team?.id) return null
  return {
    id: team.id,
    name: team.name,
    logo_url: team.logo_url,
    code: team.code,
  }
}

function mapPlayerRow(row: PlayerRow): TrendingPlayerCard {
  return {
    id: row.id,
    name: row.name,
    photoUrl: row.photo_url,
    tier: row.career?.tier ?? "provisional",
    displayScore: row.career ? Number(row.career.display_score) : 0,
    isProvisional: row.career?.is_provisional ?? true,
    clubTeam: normalizeClubTeam(row.club_team),
  }
}

function isPinnedActive(startsAt: string | null, endsAt: string | null, now: Date): boolean {
  if (startsAt && new Date(startsAt) > now) return false
  if (endsAt && new Date(endsAt) <= now) return false
  return true
}

async function fetchPinnedPlayers(now: Date): Promise<TrendingPlayerCard[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("featured_trending_players")
    .select(`sort_order, starts_at, ends_at, player:players!featured_trending_players_player_id_fkey(${PLAYER_SELECT})`)
    .order("sort_order", { ascending: true })

  if (error) {
    console.error("fetchPinnedPlayers failed:", error.message)
    return []
  }

  return (data ?? [])
    .filter((row) => isPinnedActive(row.starts_at, row.ends_at, now))
    .map((row) => row.player as PlayerRow | null)
    .filter((player): player is PlayerRow => player != null)
    .map(mapPlayerRow)
}

export const getTrendingPlayers = cache(async (): Promise<TrendingPlayerCard[]> => {
  const pinned = await fetchPinnedPlayers(new Date())
  return pinned.slice(0, TRENDING_LIMIT)
})
