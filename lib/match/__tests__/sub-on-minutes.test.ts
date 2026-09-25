import { describe, expect, it } from "vitest"

import { buildSubOffMinuteMap, buildSubOnInfoMap } from "@/lib/match/sub-on-minutes"

describe("buildSubOnInfoMap", () => {
  it("maps entering player from assist and leaver from player (API-Football)", () => {
    const map = buildSubOnInfoMap([
      { type: "Goal", player_id: 1, assist_player_id: null, minute: 10, extra_minute: null },
      {
        type: "subst",
        player_id: 50,
        assist_player_id: 99,
        minute: 67,
        extra_minute: null,
      },
      {
        type: "subst",
        player_id: 51,
        assist_player_id: 88,
        minute: 90,
        extra_minute: 2,
      },
    ])
    expect(map.get(99)).toEqual({ minute: 67, replacedPlayerId: 50 })
    expect(map.get(88)).toEqual({ minute: 92, replacedPlayerId: 51 })
    expect(map.has(1)).toBe(false)
  })

  it("keeps first sub info when duplicate events exist", () => {
    const map = buildSubOnInfoMap([
      {
        type: "subst",
        player_id: 10,
        assist_player_id: 5,
        minute: 70,
        extra_minute: null,
      },
      {
        type: "subst",
        player_id: 11,
        assist_player_id: 5,
        minute: 71,
        extra_minute: null,
      },
    ])
    expect(map.get(5)).toEqual({ minute: 70, replacedPlayerId: 10 })
  })
})

describe("buildSubOffMinuteMap", () => {
  it("maps the leaving player to the sub minute including stoppage time", () => {
    const map = buildSubOffMinuteMap([
      { type: "Goal", player_id: 1, assist_player_id: null, minute: 10, extra_minute: null },
      { type: "subst", player_id: 50, assist_player_id: 99, minute: 67, extra_minute: null },
      { type: "subst", player_id: 51, assist_player_id: 88, minute: 45, extra_minute: 2 },
      { type: "subst", player_id: 50, assist_player_id: 77, minute: 80, extra_minute: null },
    ])
    expect(map.get(50)).toBe(67)
    expect(map.get(51)).toBe(47)
    expect(map.has(1)).toBe(false)
    expect(map.has(99)).toBe(false)
  })
})
