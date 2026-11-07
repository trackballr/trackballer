import { describe, expect, it } from "vitest";

import { dailyWindowRange, storedKickoffRefreshRange } from "@/lib/catalog-sync/daily-window";

describe("dailyWindowRange", () => {
  it("defaults to today through daysAhead with no look-back", () => {
    const now = new Date(Date.UTC(2026, 8, 3));
    expect(dailyWindowRange(now, 7, 0)).toEqual({
      from: "2026-09-03",
      to: "2026-09-10",
    });
  });

  it("re-reads stored kickoffs from two days ago through the week ahead", () => {
    const now = new Date(Date.UTC(2026, 10, 7, 15, 30));
    expect(storedKickoffRefreshRange(now, 7)).toEqual({
      from: "2026-11-05T00:00:00.000Z",
      to: "2026-11-15T00:00:00.000Z",
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
