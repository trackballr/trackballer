import { describe, expect, it } from "vitest"

import { buildMatchTopRatedPayload } from "@/lib/match/match-top-rated"
import type { MatchLineupPlayer } from "@/lib/match/types"

function player(
  overrides: Partial<MatchLineupPlayer> & Pick<MatchLineupPlayer, "playerId" | "teamId">,
): MatchLineupPlayer {
  return {
    playerId: overrides.playerId,
    teamId: overrides.teamId,
    name: overrides.name ?? `Player ${overrides.playerId}`,
    photoUrl: overrides.photoUrl ?? null,
    shirtNumber: overrides.shirtNumber ?? null,
    side: overrides.side ?? (overrides.teamId === 1 ? "home" : "away"),
    position: overrides.position ?? "M",
    gridRow: overrides.gridRow ?? 1,
    gridCol: overrides.gridCol ?? 1,
    isRateable: overrides.isRateable ?? true,
    userRating: overrides.userRating ?? null,
    communityAvg: overrides.communityAvg ?? null,
    ratingCount: overrides.ratingCount ?? 0,
    isStarter: overrides.isStarter ?? true,
    minutesPlayed: overrides.minutesPlayed ?? 90,
    subOnMinute: overrides.subOnMinute ?? null,
    subReplacedPlayerName: overrides.subReplacedPlayerName ?? null,
    goalCount: overrides.goalCount ?? 0,
    assistCount: overrides.assistCount ?? 0,
    yellowCardCount: overrides.yellowCardCount ?? 0,
    redCardCount: overrides.redCardCount ?? 0,
  }
}

describe("buildMatchTopRatedPayload", () => {
  const homeTeamId = 1
  const awayTeamId = 2

  it("returns null when either side has fewer than 3 rated players", () => {
    const starters = [
      player({ playerId: 1, teamId: homeTeamId, communityAvg: 8, ratingCount: 1 }),
      player({ playerId: 2, teamId: homeTeamId, communityAvg: 7, ratingCount: 1 }),
      player({ playerId: 3, teamId: awayTeamId, communityAvg: 9, ratingCount: 1 }),
    ]

    expect(buildMatchTopRatedPayload(starters, [], homeTeamId, awayTeamId)).toBeNull()
  })

  it("returns top 3 per team ordered by community average", () => {
    const starters = [
      player({ playerId: 1, teamId: homeTeamId, communityAvg: 7, ratingCount: 2 }),
      player({ playerId: 2, teamId: homeTeamId, communityAvg: 9, ratingCount: 1 }),
      player({ playerId: 3, teamId: homeTeamId, communityAvg: 8, ratingCount: 3 }),
      player({ playerId: 4, teamId: homeTeamId, communityAvg: 6, ratingCount: 1 }),
      player({ playerId: 5, teamId: awayTeamId, communityAvg: 6.5, ratingCount: 1 }),
      player({ playerId: 6, teamId: awayTeamId, communityAvg: 8.5, ratingCount: 2 }),
      player({ playerId: 7, teamId: awayTeamId, communityAvg: 7.5, ratingCount: 1 }),
      player({ playerId: 8, teamId: awayTeamId, communityAvg: 5, ratingCount: 1 }),
    ]

    const result = buildMatchTopRatedPayload(starters, [], homeTeamId, awayTeamId)

    expect(result?.home.map((p) => p.playerId)).toEqual([2, 3, 1])
    expect(result?.away.map((p) => p.playerId)).toEqual([6, 7, 5])
  })

  it("includes substitutes in the pool", () => {
    const starters = [
      player({ playerId: 1, teamId: homeTeamId, communityAvg: 7, ratingCount: 1 }),
      player({ playerId: 2, teamId: homeTeamId, communityAvg: 8, ratingCount: 1 }),
    ]
    const subs = [
      player({ playerId: 3, teamId: homeTeamId, communityAvg: 9, ratingCount: 1 }),
      player({ playerId: 4, teamId: awayTeamId, communityAvg: 7, ratingCount: 1 }),
      player({ playerId: 5, teamId: awayTeamId, communityAvg: 8, ratingCount: 1 }),
      player({ playerId: 6, teamId: awayTeamId, communityAvg: 9, ratingCount: 1 }),
    ]

    expect(buildMatchTopRatedPayload(starters, subs, homeTeamId, awayTeamId)).not.toBeNull()
  })
})
