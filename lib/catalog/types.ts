import type { Database } from "@/lib/database.types"

export type FixtureRow = Database["public"]["Tables"]["fixtures"]["Row"]
export type TeamRow = Database["public"]["Tables"]["teams"]["Row"]
export type SeasonRow = Database["public"]["Tables"]["seasons"]["Row"]
export type RoundRow = Database["public"]["Tables"]["rounds"]["Row"]

export type TeamSummary = Pick<TeamRow, "id" | "name" | "logo_url" | "code" | "is_national">

export type FixtureWithTeams = FixtureRow & {
  home_team: TeamSummary
  away_team: TeamSummary
}

export type GetFixturesOptions = {
  seasonId: number
  roundName?: string
  /** When set, only fixtures with this status_short */
  statusShort?: string
  limit?: number
}

/** Which slice of a round to show: matches still to come, or matches already played. */
export type FixtureView = "upcoming" | "finished"
