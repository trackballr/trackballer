import { describe, expect, it } from "vitest"

import { formatFixtureRoundLabel } from "@/lib/world-cup/round-label"

describe("formatFixtureRoundLabel", () => {
  it("maps group stage rounds to Round N", () => {
    expect(formatFixtureRoundLabel("Group Stage - 1")).toBe("Round 1")
    expect(formatFixtureRoundLabel("Group Stage - 2")).toBe("Round 2")
    expect(formatFixtureRoundLabel("Group Stage - 3")).toBe("Round 3")
  })

  it("maps T5 and UCL rounds to matchday labels", () => {
    expect(formatFixtureRoundLabel("Regular Season - 2")).toBe("Matchday 2")
    expect(formatFixtureRoundLabel("League Stage - 1")).toBe("Matchday 1")
  })

  it("leaves knockout round names unchanged", () => {
    expect(formatFixtureRoundLabel("Round of 16")).toBe("Round of 16")
  })

  it("returns null for empty input", () => {
    expect(formatFixtureRoundLabel(null)).toBeNull()
    expect(formatFixtureRoundLabel("")).toBeNull()
  })
})
