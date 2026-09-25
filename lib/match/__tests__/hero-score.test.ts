import { describe, expect, it } from "vitest"

import { formatMatchHeroScore, matchHeroStatusLabel } from "@/lib/match/hero-score"
import { matchRowFixture } from "@/lib/match/__tests__/fixtures"

describe("formatMatchHeroScore", () => {
  it("shows ET score and pen subline for penalty shootouts", () => {
    const result = formatMatchHeroScore(
      matchRowFixture({
        id: 1,
        status_short: "PEN",
        home_goals_ft: 1,
        away_goals_ft: 1,
        home_goals_et: 3,
        away_goals_et: 3,
        home_goals_pen: 4,
        away_goals_pen: 2,
      }),
    )

    expect(result.mainScore).toBe("3 - 3")
    expect(result.penLine).toBe("Pen: 4 - 2")
    expect(result.statusText).toBe("PEN")
    expect(result.isLive).toBe(false)
  })

  it("shows FT score without pen line", () => {
    const result = formatMatchHeroScore(
      matchRowFixture({
        id: 2,
        home_goals_ft: 2,
        away_goals_ft: 1,
      }),
    )

    expect(result.mainScore).toBe("2 - 1")
    expect(result.penLine).toBeNull()
    expect(result.statusText).toBe("FT")
  })
})

describe("matchHeroStatusLabel", () => {
  it("spells out finished and paused states", () => {
    expect(matchHeroStatusLabel("FT")).toBe("Full time")
    expect(matchHeroStatusLabel("AET")).toBe("After extra time")
    expect(matchHeroStatusLabel("PEN")).toBe("After penalties")
    expect(matchHeroStatusLabel("HT")).toBe("Half time")
  })

  it("returns null before kickoff and Live for in-play codes", () => {
    expect(matchHeroStatusLabel("NS")).toBeNull()
    expect(matchHeroStatusLabel("TBD")).toBeNull()
    expect(matchHeroStatusLabel("2H")).toBe("Live")
  })
})
