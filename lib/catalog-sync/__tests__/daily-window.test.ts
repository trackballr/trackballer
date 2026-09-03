import { describe, expect, it } from "vitest";

import { dailyWindowRange } from "@/lib/catalog-sync/daily-window";

describe("dailyWindowRange", () => {
  it("defaults to today through daysAhead with no look-back", () => {
    const now = new Date(Date.UTC(2026, 8, 3));
    expect(dailyWindowRange(now, 7, 0)).toEqual({
      from: "2026-09-03",
      to: "2026-09-10",
    });
  });

  it("includes already-played matchweeks when daysBehind is set", () => {
    const now = new Date(Date.UTC(2026, 8, 3));
    expect(dailyWindowRange(now, 300, 45)).toEqual({
      from: "2026-07-20",
      to: "2027-06-30",
    });
  });
});
