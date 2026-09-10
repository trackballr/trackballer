import type { MatchLineupPlayer } from "@/lib/match/types"

export type RatingFlowMode = "single" | "rateAll"

/** Sort key for GK → DEF → MID → FWD; unknown positions last. */
export function positionBandOrder(position: string | null): number {
  if (!position) return 9
  const key = position.toUpperCase()
  if (key === "GK") return 0
  if (key === "DEF") return 1
  if (key === "MID") return 2
  if (key === "FWD") return 3
  return 9
}

/**
 * Canonical rate-all order: home starters (back→front, L→R), home subs,
 * away starters, away subs.
 */
export function compareRateablePlayers(
  a: MatchLineupPlayer,
  b: MatchLineupPlayer,
): number {
  if (a.side !== b.side) return a.side === "home" ? -1 : 1

  if (a.isStarter !== b.isStarter) return a.isStarter ? -1 : 1

  if (a.isStarter && b.isStarter) {
    const rowDiff = a.gridRow - b.gridRow
    if (rowDiff !== 0) return rowDiff
    const colDiff = a.gridCol - b.gridCol
    if (colDiff !== 0) return colDiff
    return (a.shirtNumber ?? 99) - (b.shirtNumber ?? 99)
  }

  const bandDiff = positionBandOrder(a.position) - positionBandOrder(b.position)
  if (bandDiff !== 0) return bandDiff

  const subDiff = (a.subOnMinute ?? 999) - (b.subOnMinute ?? 999)
  if (subDiff !== 0) return subDiff

  return (a.shirtNumber ?? 99) - (b.shirtNumber ?? 99)
}

export function sortRateableQueue(players: MatchLineupPlayer[]): MatchLineupPlayer[] {
  return [...players].sort(compareRateablePlayers)
}

/** Index of the first player without a user rating, or null if all rated. */
export function firstUnratedIndex(queue: MatchLineupPlayer[]): number | null {
  const index = queue.findIndex((p) => p.userRating == null)
  return index >= 0 ? index : null
}

/**
 * After saving a rating, pick the next sheet index or null to close.
 * single = next in queue; rateAll = next unrated after current index.
 */
export function nextRatingIndex(
  queue: MatchLineupPlayer[],
  from: number,
  mode: RatingFlowMode,
): number | null {
  if (from < 0 || from >= queue.length) return null

  if (mode === "single") {
    const next = from + 1
    return next < queue.length ? next : null
  }

  for (let i = from + 1; i < queue.length; i++) {
    if (queue[i].userRating == null) return i
  }
  return null
}

/** Whether another player remains after submit for the current flow mode. */
export function hasNextRatingPlayer(
  queue: MatchLineupPlayer[],
  from: number,
  mode: RatingFlowMode,
): boolean {
  return nextRatingIndex(queue, from, mode) != null
}
