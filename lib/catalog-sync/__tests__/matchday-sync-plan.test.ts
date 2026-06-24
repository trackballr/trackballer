import { describe, expect, it } from "vitest";

import {
  EVENTS_REPULL_WINDOW_MS,
  planMatchdaySync,
  shouldBatchRefreshFixture,
} from "@/lib/catalog-sync/matchday-sync-plan";

const KICKOFF_FUTURE = "2099-01-01T18:00:00.000Z";
const KICKOFF_PAST = "2020-01-01T18:00:00.000Z";

describe("planMatchdaySync", () => {
  it("queues lineups for first live sync, events-only after, and full detail for FT", () => {
    const plan = planMatchdaySync(
      [
        {
          id: 1,
          status_short: "1H",
          kickoff_at: KICKOFF_PAST,
          lineups_synced_at: null,
          appearances_synced_at: null,
        },
        {
          id: 5,
          status_short: "2H",
          kickoff_at: KICKOFF_PAST,
          lineups_synced_at: "2026-06-12T00:00:00.000Z",
          appearances_synced_at: null,
        },
        {
          id: 2,
          status_short: "FT",
          kickoff_at: KICKOFF_PAST,
          lineups_synced_at: null,
          appearances_synced_at: null,
        },
        {
          id: 3,
          status_short: "NS",
          kickoff_at: KICKOFF_FUTURE,
          lineups_synced_at: null,
          appearances_synced_at: null,
        },
      ],
      15,
    );

    expect(plan.liveSnapshotIds).toEqual([1]);
    expect(plan.eventsOnlyIds).toEqual([5]);
    expect(plan.fullDetailIds).toEqual([2]);
    expect(plan.fullDetailRemaining).toBe(0);
  });

  it("caps terminal full-detail sync by limit", () => {
    const plan = planMatchdaySync(
      [
        {
          id: 10,
          status_short: "FT",
          kickoff_at: KICKOFF_PAST,
          lineups_synced_at: null,
          appearances_synced_at: null,
        },
        {
          id: 11,
          status_short: "FT",
          kickoff_at: KICKOFF_PAST,
          lineups_synced_at: null,
          appearances_synced_at: null,
        },
      ],
      1,
    );

    expect(plan.liveSnapshotIds).toEqual([]);
    expect(plan.fullDetailIds).toEqual([10]);
    expect(plan.fullDetailRemaining).toBe(1);
  });

  it("re-pulls events for a recently-finished fixture to catch late subs", () => {
    const kickoff = "2026-06-12T18:00:00.000Z";
    const now = new Date("2026-06-12T20:30:00.000Z"); // 2.5h after kickoff, within window
    const plan = planMatchdaySync(
      [
        {
          id: 20,
          status_short: "FT",
          kickoff_at: kickoff,
          lineups_synced_at: "2026-06-12T20:00:00.000Z",
          appearances_synced_at: "2026-06-12T20:00:00.000Z",
        },
      ],
      15,
      now,
    );

    expect(plan.eventsOnlyIds).toEqual([20]);
    expect(plan.fullDetailIds).toEqual([]);
  });

  it("stops re-pulling events once a finished fixture leaves the grace window", () => {
    const kickoff = "2026-06-12T18:00:00.000Z";
    const now = new Date(
      new Date(kickoff).getTime() + EVENTS_REPULL_WINDOW_MS + 60_000,
    );
    const plan = planMatchdaySync(
      [
        {
          id: 21,
          status_short: "FT",
          kickoff_at: kickoff,
          lineups_synced_at: "2026-06-12T20:00:00.000Z",
          appearances_synced_at: "2026-06-12T20:00:00.000Z",
        },
      ],
      15,
      now,
    );

    expect(plan.eventsOnlyIds).toEqual([]);
    expect(plan.fullDetailIds).toEqual([]);
  });

  it("still prefers full detail when a finished fixture is missing appearances", () => {
    const kickoff = "2026-06-12T18:00:00.000Z";
    const now = new Date("2026-06-12T20:30:00.000Z");
    const plan = planMatchdaySync(
      [
        {
          id: 22,
          status_short: "FT",
          kickoff_at: kickoff,
          lineups_synced_at: "2026-06-12T20:00:00.000Z",
          appearances_synced_at: null,
        },
      ],
      15,
      now,
    );

    expect(plan.eventsOnlyIds).toEqual([]);
    expect(plan.fullDetailIds).toEqual([22]);
  });
});

describe("shouldBatchRefreshFixture", () => {
  const now = new Date("2026-06-12T12:00:00.000Z");

  it("refreshes in-play fixtures only", () => {
    expect(
      shouldBatchRefreshFixture(
        { status_short: "2H", kickoff_at: KICKOFF_PAST },
        now,
      ),
    ).toBe(true);
    expect(
      shouldBatchRefreshFixture(
        { status_short: "FT", kickoff_at: KICKOFF_PAST },
        now,
      ),
    ).toBe(false);
  });

  it("skips upcoming NS but refreshes NS after kickoff (stale status)", () => {
    expect(
      shouldBatchRefreshFixture(
        { status_short: "NS", kickoff_at: "2026-06-12T20:00:00.000Z" },
        now,
      ),
    ).toBe(false);
    expect(
      shouldBatchRefreshFixture(
        { status_short: "NS", kickoff_at: "2026-06-12T10:00:00.000Z" },
        now,
      ),
    ).toBe(true);
  });
});
