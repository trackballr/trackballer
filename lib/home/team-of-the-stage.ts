import { cache } from "react"

import { getWorldCupSeason } from "@/lib/catalog/fixtures"
import { isFormationId, type FormationId } from "@/lib/admin/formation-slots"
import { isMissingFeaturedColumn } from "@/lib/admin/totw-featured"
import type { TotwSlotAssignment } from "@/lib/admin/totw-types"
import { formatPlayerDisplayName } from "@/lib/player/display-name"
import { createClient } from "@/lib/supabase/server"

export type TeamOfTheStageView = {
  id: number
  title: string
  formation: FormationId
  roundId: number | null
  assignments: Record<string, TotwSlotAssignment>
}

const PLAYER_SELECT = `
  id,
  name,
  firstname,
  lastname,
  photo_url
`

type PlayerRow = {
  id: number
  name: string
  firstname: string | null
  lastname: string | null
  photo_url: string | null
}

type TotwHeader = {
  id: number
  title: string
  formation: string
  round_id: number | null
}

function normalizePlayer(raw: unknown): PlayerRow | null {
  if (!raw || typeof raw !== "object") return null
  if (Array.isArray(raw)) {
    return raw.length > 0 ? normalizePlayer(raw[0]) : null
  }
  return raw as PlayerRow
}

function mapAssignment(row: PlayerRow): TotwSlotAssignment {
  return {
    playerId: row.id,
    displayName: formatPlayerDisplayName(row.firstname, row.lastname, row.name),
    catalogName: row.name,
    photoUrl: row.photo_url,
  }
}

async function loadViewFromTotw(totw: TotwHeader): Promise<TeamOfTheStageView | null> {
  if (!isFormationId(totw.formation)) return null

  const supabase = await createClient()

  const { data: slotRows, error: slotsError } = await supabase
    .from("team_of_the_week_players")
    .select(
      `
      slot,
      player:players!team_of_the_week_players_player_id_fkey(${PLAYER_SELECT})
    `,
    )
    .eq("team_of_the_week_id", totw.id)

  if (slotsError) {
    console.error("getPublishedTeamOfTheStage slots failed:", slotsError.message)
    return null
  }

  const assignments: Record<string, TotwSlotAssignment> = {}
  for (const row of slotRows ?? []) {
    const player = normalizePlayer(row.player)
    if (player) {
      assignments[row.slot] = mapAssignment(player)
    }
  }

  if (Object.keys(assignments).length === 0) return null

  return {
    id: totw.id,
    title: totw.title,
    formation: totw.formation,
    roundId: totw.round_id,
    assignments,
  }
}

async function fetchFeaturedTotw(seasonId: number): Promise<TotwHeader | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("team_of_the_week")
    .select("id, title, formation, round_id")
    .eq("season_id", seasonId)
    .not("featured_at", "is", null)
    .order("featured_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error && isMissingFeaturedColumn(error.message)) {
    return null
  }

  if (error || !data) {
    if (error) console.error("getPublishedTeamOfTheStage featured failed:", error.message)
    return null
  }

  return data
}

async function fetchLatestPublishedTotw(seasonId: number): Promise<TotwHeader | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("team_of_the_week")
    .select("id, title, formation, round_id")
    .eq("season_id", seasonId)
    .not("published_at", "is", null)
    .order("published_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error || !data) {
    if (error) console.error("getPublishedTeamOfTheStage latest failed:", error.message)
    return null
  }

  return data
}

async function loadFeaturedView(seasonId: number): Promise<TeamOfTheStageView | null> {
  const featured = await fetchFeaturedTotw(seasonId)
  if (featured) {
    return loadViewFromTotw(featured)
  }

  const latest = await fetchLatestPublishedTotw(seasonId)
  if (latest) {
    return loadViewFromTotw(latest)
  }

  return null
}

/** Live lineup for a season: admin-featured matchday when set, else latest published. */
export const getPublishedTeamOfTheWeekForSeason = cache(
  async (seasonId: number): Promise<TeamOfTheStageView | null> => {
    return loadFeaturedView(seasonId)
  },
)

/** World Cup live lineup (legacy public surface). */
export const getPublishedTeamOfTheStage = cache(async (): Promise<TeamOfTheStageView | null> => {
  const season = await getWorldCupSeason()
  if (!season) return null
  return loadFeaturedView(season.id)
})
