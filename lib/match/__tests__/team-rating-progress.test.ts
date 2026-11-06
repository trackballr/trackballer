import { describe, expect, it } from "vitest"

import { teamRatingCounts, teamRatingRows } from "@/lib/match/team-rating-progress"
import type { MatchLineupPlayer } from "@/lib/match/types"
import type { TeamSummary } from "@/lib/catalog/types"

function player(
  overrides: Partial<MatchLineupPlayer> & Pick<MatchLineupPlayer, "playerId" | "side">,
): MatchLineupPlayer {
  return {
    name: `Player ${overrides.playerId}`,
    photoUrl: null,
    shirtNumber: overrides.playerId,
    teamId: overrides.side === "home" ? 1 : 2,
    isStarter: true,
    isRateable: true,
    position: "MID",
    minutesPlayed: 90,
    subOnMinute: null,
    subReplacedPlayerName: null,
    subOffMinute: null,
    gridRow: 1,
    gridCol: 1,
    communityAvg: null,
    ratingCount: 0,
    userRating: null,
    goalCount: 0,
    assistCount: 0,
    yellowCardCount: 0,
    redCardCount: 0,
    ...overrides,
  }
}

const home: TeamSummary = {
  id: 1,
  name: "Man City",
  logo_url: null,
  code: "MCI",
  is_national: false,
}
const away: TeamSummary = {
  id: 2,
  name: "Fulham",
  logo_url: null,
  code: "FUL",
  is_national: false,
}

describe("teamRatingCounts", () => {
  it("counts only the chosen side", () => {
    const queue = [
      player({ playerId: 1, side: "home", userRating: 7 }),
      player({ playerId: 2, side: "home" }),
      player({ playerId: 3, side: "away", userRating: 6 }),
    ]
    expect(teamRatingCounts(queue, "home")).toEqual({ rated: 1, total: 2 })
    expect(teamRatingCounts(queue, "away")).toEqual({ rated: 1, total: 1 })
  })
})

describe("teamRatingRows", () => {
  it("drops a side with nobody to rate", () => {
    const rows = teamRatingRows(
      [player({ playerId: 1, side: "away" })],
      home,
      away,
    )
    expect(rows.map((row) => row.team.name)).toEqual(["Fulham"])
  })
})
