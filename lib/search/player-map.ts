import { formatPlayerDisplayName } from "@/lib/player/display-name"

import type { PlayerListItem } from "./types"

export type PlayerBrowseRow = {
  id: number
  name: string
  firstname: string | null
  lastname: string | null
  photo_url: string | null
  nationality: string | null
  primary_position: string | null
  age: number | null
  club_team: { name: string } | null
  career:
    | {
        display_score: number
        tier: string
        is_provisional: boolean
      }
    | {
        display_score: number
        tier: string
        is_provisional: boolean
      }[]
    | null
}

function resolveCareer(career: PlayerBrowseRow["career"]) {
  if (Array.isArray(career)) return career[0] ?? null
  return career
}

export function mapPlayerBrowseRow(row: PlayerBrowseRow): PlayerListItem {
  const career = resolveCareer(row.career)

  return {
    id: row.id,
    displayName: formatPlayerDisplayName(row.firstname, row.lastname, row.name),
    catalogName: row.name,
    photoUrl: row.photo_url,
    nationality: row.nationality,
    position: row.primary_position,
    age: row.age,
    tier: career?.tier ?? "provisional",
    displayScore: career ? Number(career.display_score) : 50,
    isProvisional: career?.is_provisional ?? true,
    clubName: row.club_team?.name ?? null,
  }
}
