import { describe, expect, it } from "vitest"

import { formatRoundDateRange } from "@/lib/league/round-dates"

describe("formatRoundDateRange", () => {
  it("spans the first and last kickoff of a round", () => {
    expect(
      formatRoundDateRange(
        ["2026-09-05T11:30:00+00:00", "2026-09-06T13:00:00+00:00"],
        { utc: true },
      ),
    ).toBe("5 Sep – 6 Sep 2026")
  })

  it("collapses a single matchday to one date", () => {
    expect(
      formatRoundDateRange(
        ["2026-09-05T11:30:00+00:00", "2026-09-05T16:30:00+00:00"],
        { utc: true },
      ),
    ).toBe("5 Sep 2026")
  })

  it("ignores unordered input and returns null when empty", () => {
    expect(
      formatRoundDateRange(
        ["2026-09-06T13:00:00+00:00", "2026-09-05T11:30:00+00:00"],
        { utc: true },
      ),
    ).toBe("5 Sep – 6 Sep 2026")
    expect(formatRoundDateRange([], { utc: true })).toBeNull()
  })
})
