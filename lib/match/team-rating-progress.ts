import type { TeamSummary } from "@/lib/catalog/types"
import type { PitchSide } from "@/lib/match/lineup-position"
import type { MatchLineupPlayer } from "@/lib/match/types"

export type TeamRatingCounts = {
  side: PitchSide
  team: TeamSummary
  rated: number
  total: number
}

export function teamRatingCounts(
  queue: MatchLineupPlayer[],
  side: PitchSide,
): { rated: number; total: number } {
  let rated = 0
  let total = 0
  for (const player of queue) {
    if (player.side !== side) continue
    total += 1
    if (player.userRating != null) rated += 1
  }
  return { rated, total }
}

/** One row per side that has someone who played. */
export function teamRatingRows(
  queue: MatchLineupPlayer[],
  home: TeamSummary,
  away: TeamSummary,
): TeamRatingCounts[] {
  return (["home", "away"] as const)
    .map((side) => ({
      side,
      team: side === "home" ? home : away,
      ...teamRatingCounts(queue, side),
    }))
    .filter((row) => row.total > 0)
}
