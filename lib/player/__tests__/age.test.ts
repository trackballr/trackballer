import { describe, expect, it } from "vitest"

import { computeAgeFromBirthDate, latestBirthDateForAge } from "@/lib/player/age"

describe("computeAgeFromBirthDate", () => {
  it("counts whole years on the same calendar day", () => {
    const asOf = new Date("2026-09-04T12:00:00Z")
    expect(computeAgeFromBirthDate("2000-09-04", asOf)).toBe(26)
  })

  it("subtracts one year before the birthday in the current year", () => {
    const asOf = new Date("2026-09-03T12:00:00Z")
    expect(computeAgeFromBirthDate("2000-09-04", asOf)).toBe(25)
  })

  it("returns null for invalid dates", () => {
    expect(computeAgeFromBirthDate("not-a-date")).toBeNull()
  })
})

describe("latestBirthDateForAge", () => {
  it("gives the birth date that turns that age today", () => {
    const asOf = new Date("2026-10-09T12:00:00Z")
    expect(latestBirthDateForAge(30, asOf)).toBe("1996-10-09")
    expect(computeAgeFromBirthDate("1996-10-09", asOf)).toBe(30)
    expect(computeAgeFromBirthDate("1996-10-10", asOf)).toBe(29)
  })

  it("clamps 29 February to a year without one", () => {
    const asOf = new Date("2028-02-29T12:00:00Z")
    expect(latestBirthDateForAge(1, asOf)).toBe("2027-02-28")
  })
})
