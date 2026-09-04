import { describe, expect, it } from "vitest"

import { formatLeagueRoundLabel } from "@/lib/league/round-label"

describe("formatLeagueRoundLabel", () => {
  it("maps T5 regular season rounds to matchday labels", () => {
    expect(formatLeagueRoundLabel("Regular Season - 1")).toBe("Matchday 1")
    expect(formatLeagueRoundLabel("Regular Season - 2")).toBe("Matchday 2")
    expect(formatLeagueRoundLabel("Regular Season - 38")).toBe("Matchday 38")
  })

  it("maps UCL league stage rounds to matchday labels", () => {
    expect(formatLeagueRoundLabel("League Stage - 1")).toBe("Matchday 1")
    expect(formatLeagueRoundLabel("League Stage - 8")).toBe("Matchday 8")
  })

  it("passes through knockout and other round names", () => {
    expect(formatLeagueRoundLabel("Round of 16")).toBe("Round of 16")
  })

  it("returns null for empty input", () => {
    expect(formatLeagueRoundLabel(null)).toBeNull()
    expect(formatLeagueRoundLabel("")).toBeNull()
  })
})
