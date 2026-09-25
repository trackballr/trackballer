import { describe, expect, it } from "vitest"

import { teamCommunityAvg } from "@/lib/match/team-match-rating"
import type { MatchLineupPlayer } from "@/lib/match/types"

function player(overrides: Partial<MatchLineupPlayer> = {}): MatchLineupPlayer {
  return {
    playerId: 1,
    name: "Test",
    photoUrl: null,
    shirtNumber: 10,
    side: "home",
    teamId: 1,
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

describe("teamCommunityAvg", () => {
  it("returns null when no players have ratings", () => {
    expect(teamCommunityAvg([player(), player({ playerId: 2 })])).toBeNull()
  })

  it("averages rated players and ignores nulls", () => {
    const avg = teamCommunityAvg([
      player({ communityAvg: 7 }),
      player({ playerId: 2, communityAvg: 9 }),
      player({ playerId: 3, communityAvg: null }),
    ])
    expect(avg).toBe(8)
  })

  it("rounds to two decimal places", () => {
    const avg = teamCommunityAvg([
      player({ communityAvg: 7.33 }),
      player({ playerId: 2, communityAvg: 8.66 }),
    ])
    expect(avg).toBe(8)
  })
})
