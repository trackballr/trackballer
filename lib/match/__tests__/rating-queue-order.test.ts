import { describe, expect, it } from "vitest"

import {
  compareRateablePlayers,
  firstUnratedIndex,
  hasNextRatingPlayer,
  nextRatingIndex,
  playersForRatingFlow,
  sortRateableQueue,
} from "@/lib/match/rating-queue-order"
import type { MatchLineupPlayer } from "@/lib/match/types"

function player(overrides: Partial<MatchLineupPlayer> & Pick<MatchLineupPlayer, "playerId">): MatchLineupPlayer {
  return {
    name: `Player ${overrides.playerId}`,
    photoUrl: null,
    shirtNumber: overrides.playerId,
    side: "home",
    teamId: 1,
    isStarter: true,
    isRateable: true,
    position: "MID",
    minutesPlayed: 90,
    subOnMinute: null,
    subReplacedPlayerName: null,
    subOffMinute: null,
    gridRow: 3,
    gridCol: 2,
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

describe("sortRateableQueue", () => {
  it("orders starters by grid row then column (back to front, left to right)", () => {
    const gk = player({ playerId: 1, position: "GK", gridRow: 1, gridCol: 1 })
    const cb = player({ playerId: 2, position: "DEF", gridRow: 2, gridCol: 2 })
    const lb = player({ playerId: 3, position: "DEF", gridRow: 2, gridCol: 1 })
    const cm = player({ playerId: 4, position: "MID", gridRow: 3, gridCol: 1 })

    expect(sortRateableQueue([cm, cb, gk, lb]).map((p) => p.playerId)).toEqual([
      1, 3, 2, 4,
    ])
  })

  it("puts home block before away and subs after starters", () => {
    const homeDef = player({ playerId: 1, side: "home", gridRow: 2, gridCol: 1 })
    const homeSub = player({
      playerId: 2,
      side: "home",
      isStarter: false,
      position: "FWD",
      subOnMinute: 70,
      gridRow: 99,
      gridCol: 1,
    })
    const awayDef = player({ playerId: 3, side: "away", teamId: 2, gridRow: 2, gridCol: 1 })
    const awaySub = player({
      playerId: 4,
      side: "away",
      teamId: 2,
      isStarter: false,
      position: "MID",
      subOnMinute: 60,
      gridRow: 99,
      gridCol: 1,
    })

    expect(
      sortRateableQueue([awaySub, homeSub, awayDef, homeDef]).map((p) => p.playerId),
    ).toEqual([1, 2, 3, 4])
  })
})

describe("compareRateablePlayers", () => {
  it("sorts subs by position band then sub-on minute", () => {
    const defSub = player({
      playerId: 10,
      isStarter: false,
      position: "DEF",
      subOnMinute: 80,
    })
    const fwdSub = player({
      playerId: 11,
      isStarter: false,
      position: "FWD",
      subOnMinute: 60,
    })

    expect(compareRateablePlayers(defSub, fwdSub)).toBeLessThan(0)
  })
})

describe("nextRatingIndex", () => {
  const queue = [
    player({ playerId: 1, userRating: 7 }),
    player({ playerId: 2, userRating: null }),
    player({ playerId: 3, userRating: 8 }),
    player({ playerId: 4, userRating: null }),
  ]

  it("single mode closes after the player you opened", () => {
    expect(nextRatingIndex(queue, 0, "single")).toBeNull()
    expect(nextRatingIndex(queue, 1, "single")).toBeNull()
  })

  it("team mode skips already-rated players on that side", () => {
    expect(nextRatingIndex(queue, 0, "team")).toBe(1)
    expect(nextRatingIndex(queue, 1, "team")).toBe(3)
    expect(nextRatingIndex(queue, 3, "team")).toBeNull()
  })
})

describe("playersForRatingFlow", () => {
  it("keeps one side, in queue order", () => {
    const queue = [
      player({ playerId: 1, side: "home" }),
      player({ playerId: 2, side: "away", teamId: 2 }),
      player({ playerId: 3, side: "home" }),
    ]
    expect(playersForRatingFlow(queue, "team", { side: "home" }).map((p) => p.playerId)).toEqual([
      1, 3,
    ])
  })

  it("returns only the tapped player", () => {
    const queue = [player({ playerId: 1 }), player({ playerId: 2 })]
    expect(playersForRatingFlow(queue, "single", { playerId: 2 }).map((p) => p.playerId)).toEqual([
      2,
    ])
  })
})

describe("firstUnratedIndex", () => {
  it("returns first missing user rating", () => {
    const queue = [
      player({ playerId: 1, userRating: 7 }),
      player({ playerId: 2, userRating: null }),
    ]
    expect(firstUnratedIndex(queue)).toBe(1)
    expect(firstUnratedIndex([player({ playerId: 1, userRating: 6 })])).toBeNull()
  })
})

describe("hasNextRatingPlayer", () => {
  it("reflects whether submit should offer another player", () => {
    const queue = [player({ playerId: 1 }), player({ playerId: 2 })]
    expect(hasNextRatingPlayer(queue, 0, "single")).toBe(false)
    expect(hasNextRatingPlayer(queue, 0, "team")).toBe(true)
    expect(hasNextRatingPlayer(queue, 1, "team")).toBe(false)
  })
})
