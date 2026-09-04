import { describe, expect, it } from "vitest"

import { computeAgeFromBirthDate } from "@/lib/player/age"

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
