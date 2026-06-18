import { formatPlayerDisplayName } from "@/lib/player/display-name"
import { createClient } from "@/lib/supabase/server"

import { isFormationId } from "./formation-slots"
import { isMissingFeaturedColumn } from "./totw-featured"
import type { TotwDraft, TotwSlotAssignment } from "./totw-types"

const PLAYER_SELECT = `
  id,
  name,
  firstname,
  lastname,
  photo_url
`

/** Columns that exist before the featured_at migration. */
const TOTW_HEADER_SELECT = "id, round_id, title, formation, published_at"

type PlayerRow = {
  id: number
  name: string
  firstname: string | null
  lastname: string | null
  photo_url: string | null
}

type TotwRow = {
  id: number
  round_id: number | null
  title: string
  formation: string
  published_at: string | null
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

async function loadDraftFromRow(
  totw: TotwRow,
  featuredAt: string | null = null,
): Promise<TotwDraft | null> {
  if (totw.round_id == null || !isFormationId(totw.formation)) return null

  const supabase = await createClient()

  const { data: slotRows, error } = await supabase
    .from("team_of_the_week_players")
    .select(
      `
      slot,
      player_id,
      player:players!team_of_the_week_players_player_id_fkey(${PLAYER_SELECT})
    `,
    )
    .eq("team_of_the_week_id", totw.id)

  if (error) {
    console.error("loadDraftFromRow slots failed:", error.message)
    return null
  }

  const assignments: Record<string, TotwSlotAssignment> = {}
  for (const row of slotRows ?? []) {
    const player = normalizePlayer(row.player)
    if (player) {
      assignments[row.slot] = mapAssignment(player)
    }
  }

  return {
    id: totw.id,
    roundId: totw.round_id,
    title: totw.title,
    formation: totw.formation,
    featuredAt,
    assignments,
  }
}

/** Saved lineups for admin editor. */
export async function getAdminTeamsByRound(seasonId: number): Promise<TotwDraft[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("team_of_the_week")
    .select(TOTW_HEADER_SELECT)
    .eq("season_id", seasonId)
    .not("round_id", "is", null)
    .order("round_id", { ascending: true })

  if (error) {
    console.error("getAdminTeamsByRound failed:", error.message)
    return []
  }

  let featuredId: number | null = null
  try {
    featuredId = await getFeaturedTotwId(seasonId)
  } catch {
    featuredId = null
  }

  const drafts: TotwDraft[] = []
  for (const row of data ?? []) {
    const totwRow = row as TotwRow
    const featuredAt =
      featuredId != null && totwRow.id === featuredId
        ? new Date().toISOString()
        : null
    const draft = await loadDraftFromRow(totwRow, featuredAt)
    if (!draft) continue

    const hasPlayers = Object.keys(draft.assignments).length > 0
    const isPublished = totwRow.published_at != null
    if (hasPlayers || isPublished) {
      drafts.push(draft)
    }
  }
  return drafts
}

export async function getFeaturedTotwId(seasonId: number): Promise<number | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("team_of_the_week")
    .select("id, featured_at")
    .eq("season_id", seasonId)
    .not("featured_at", "is", null)
    .order("featured_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    if (isMissingFeaturedColumn(error.message)) {
      return null
    }
    console.error("getFeaturedTotwId failed:", error.message)
    return null
  }

  return data?.id ?? null
}

export async function getPublishedTeamForRound(
  seasonId: number,
  roundId: number,
): Promise<TotwDraft | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("team_of_the_week")
    .select(TOTW_HEADER_SELECT)
    .eq("season_id", seasonId)
    .eq("round_id", roundId)
    .maybeSingle()

  if (error || !data) {
    if (error) console.error("getPublishedTeamForRound failed:", error.message)
    return null
  }

  return loadDraftFromRow(data as TotwRow)
}
