import { describe, expect, it } from "vitest"

import type { StandingsTeamRow } from "@/lib/catalog/standings-types"
import {
  collectQualificationZones,
  getQualificationZone,
} from "@/lib/league/qualification"

function row(description: string | null): StandingsTeamRow {
  return {
    rank: 1,
    teamId: 1,
    teamName: "Team",
    logoUrl: null,
    played: 0,
    win: 0,
    draw: 0,
    lose: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalsDiff: 0,
    points: 0,
    form: null,
    description,
  }
}

describe("getQualificationZone", () => {
  it("reads the European places off the API note", () => {
    expect(
      getQualificationZone("Promotion - Champions League (Group Stage)")?.key,
    ).toBe("champions-league")
    expect(getQualificationZone("Promotion - Europa League (Group Stage)")?.key).toBe(
      "europa-league",
    )
    expect(getQualificationZone("Relegation - Championship")?.key).toBe("relegation")
  })

  it("keeps Europa Conference League out of the Europa zone", () => {
    expect(
      getQualificationZone("Promotion - Europa Conference League (Qualification)")?.key,
    ).toBe("conference-league")
  })

  it("returns null when the row has no note", () => {
    expect(getQualificationZone(null)).toBeNull()
    expect(getQualificationZone("")).toBeNull()
  })
})

describe("collectQualificationZones", () => {
  it("lists each zone once, in table order", () => {
    const zones = collectQualificationZones([
      row("Promotion - Champions League (Group Stage)"),
      row("Promotion - Champions League (Group Stage)"),
      row("Promotion - Europa League (Group Stage)"),
      row(null),
      row("Relegation - Championship"),
    ])

    expect(zones.map((zone) => zone.key)).toEqual([
      "champions-league",
      "europa-league",
      "relegation",
    ])
  })
})
