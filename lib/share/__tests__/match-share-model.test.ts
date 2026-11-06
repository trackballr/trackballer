import { describe, expect, it } from "vitest"

import {
  MATCH_SHARE_UNLOCK,
  buildMatchShare,
  formatShareMatchScore,
  matchSharePitchRows,
  shareCardName,
  type MatchSharePlayer,
} from "@/lib/share/match-share-model"

function player(
  overrides: Partial<MatchSharePlayer> & Pick<MatchSharePlayer, "id" | "name">,
): MatchSharePlayer {
  return {
    photoUrl: null,
    position: "MID",
    shirtNumber: overrides.id,
    isStarter: true,
    isRateable: true,
    gridRow: 2,
    gridCol: 1,
    subOnMinute: null,
    rating: null,
    ...overrides,
  }
}

const base = {
  fixtureId: 10,
  username: "chai",
  displayName: "Chai",
  team: { id: 33, name: "Man City", logoUrl: null },
  opponentName: "Fulham",
  roundLabel: "Matchday 6",
  ratedAt: "2026-11-06T12:00:00.000Z",
}

describe("buildMatchShare", () => {
  it("stays locked under five ratings", () => {
    const players = Array.from({ length: 4 }, (_, i) =>
      player({ id: i + 1, name: `P${i + 1}`, rating: 7 }),
    )
    expect(buildMatchShare({ ...base, players })).toBeNull()
    expect(MATCH_SHARE_UNLOCK).toBe(5)
  })

  it("ranks by the score they gave, highest first", () => {
    const players = [
      player({ id: 1, name: "Low", rating: 6 }),
      player({ id: 2, name: "Top", rating: 9 }),
      player({ id: 3, name: "Mid", rating: 7.5 }),
      player({ id: 4, name: "Also", rating: 7 }),
      player({ id: 5, name: "Bench", rating: 8, isStarter: false, subOnMinute: 70 }),
    ]
    const share = buildMatchShare({ ...base, players })
    expect(share?.ranked.map((row) => row.name)).toEqual(["Top", "Bench", "Mid", "Also", "Low"])
    expect(share?.complete).toBe(true)
    expect(share?.subs.map((row) => row.name)).toEqual(["Bench"])
  })

  it("keeps played subs and leaves the unused bench off", () => {
    const players = [
      ...Array.from({ length: 5 }, (_, i) =>
        player({ id: i + 1, name: `P${i + 1}`, rating: 7, gridRow: 1 }),
      ),
      player({
        id: 8,
        name: "Came on",
        isStarter: false,
        isRateable: true,
        rating: 6,
        subOnMinute: 60,
      }),
      player({
        id: 9,
        name: "Unused",
        isStarter: false,
        isRateable: false,
        rating: null,
      }),
    ]
    const share = buildMatchShare({ ...base, players })
    expect(share?.subs.map((row) => row.name)).toEqual(["Came on"])
    expect(share?.ranked.some((row) => row.name === "Unused")).toBe(false)
    expect(share?.complete).toBe(true)
  })

  it("is not complete while a player who played is still unrated", () => {
    const players = [
      ...Array.from({ length: 5 }, (_, i) =>
        player({ id: i + 1, name: `P${i + 1}`, rating: 7 }),
      ),
      player({ id: 9, name: "Waiting", rating: null }),
    ]
    const share = buildMatchShare({ ...base, players })
    expect(share?.complete).toBe(false)
    expect(share?.ratedCount).toBe(5)
    expect(share?.totalRateable).toBe(6)
  })
})

describe("matchSharePitchRows", () => {
  it("puts the attack above the keeper", () => {
    const rows = matchSharePitchRows([
      player({ id: 1, name: "Keeper", gridRow: 1, gridCol: 1 }),
      player({ id: 2, name: "Right", gridRow: 3, gridCol: 2 }),
      player({ id: 3, name: "Left", gridRow: 3, gridCol: 1 }),
    ])
    expect(rows.map((line) => line.map((player) => player.name))).toEqual([
      ["Left", "Right"],
      ["Keeper"],
    ])
  })
})

describe("formatShareMatchScore", () => {
  it("keeps a half step and drops a trailing zero", () => {
    expect(formatShareMatchScore(7.5)).toBe("7.5")
    expect(formatShareMatchScore(8)).toBe("8")
  })
})

describe("shareCardName", () => {
  it("turns a stored apostrophe entity into a real one", () => {
    expect(shareCardName("N. O&apos;Reilly")).toBe("N. O\u2019Reilly")
  })
})
