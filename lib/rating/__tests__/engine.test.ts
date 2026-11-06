import { describe, expect, it } from "vitest"

import {
  formatMatchAggregate,
  isValidRatingValue,
  matchAverage,
} from "@/lib/rating/engine"

describe("matchAverage", () => {
  it("returns null for empty input", () => {
    expect(matchAverage([])).toBeNull()
  })

  it("averages to two decimal places", () => {
    expect(matchAverage([8, 7.5, 9])).toBe(8.17)
  })
})

describe("isValidRatingValue", () => {
  it("accepts half steps in range", () => {
    expect(isValidRatingValue(7.5)).toBe(true)
    expect(isValidRatingValue(1)).toBe(true)
    expect(isValidRatingValue(10)).toBe(true)
  })

  it("rejects out of range or wrong step", () => {
    expect(isValidRatingValue(0.5)).toBe(false)
    expect(isValidRatingValue(10.5)).toBe(false)
    expect(isValidRatingValue(7.3)).toBe(false)
  })
})

describe("formatMatchAggregate", () => {
  it("formats decimals and handles missing", () => {
    expect(formatMatchAggregate(8.166)).toBe("8.17")
    expect(formatMatchAggregate(null)).toBe("-")
  })
})
