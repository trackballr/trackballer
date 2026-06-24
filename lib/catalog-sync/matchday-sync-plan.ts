import { isLiveMatchStatus, TERMINAL_STATUSES } from "@/lib/catalog-sync/constants";

/**
 * Grace window (from kickoff) during which terminal fixtures keep re-pulling
 * events, even once lineups + appearances are fully synced. API-Football
 * publishes stoppage-time / post-90' substitutions with a lag, so the first
 * full-detail run after FT can freeze an incomplete event list. Covers 90' +
 * ET + PEN + feed lag with margin. Keying off kickoff bounds the cost to
 * recently-finished fixtures only.
 */
export const EVENTS_REPULL_WINDOW_MS = 4 * 60 * 60 * 1000;

export type MatchdayFixtureRow = {
  id: number;
  status_short: string;
  kickoff_at: string;
  lineups_synced_at: string | null;
  appearances_synced_at: string | null;
};

export type MatchdaySyncPlan = {
  /** Lineups + events (2 API calls). In-play only when lineups not yet in DB. */
  liveSnapshotIds: number[];
  /** Events only (1 API call). In-play once lineups are already synced, or a
   * recently-finished fixture re-pulling late subs within the grace window. */
  eventsOnlyIds: number[];
  /** Full detail (3 API calls each). Terminal fixtures still missing lineups or appearances. */
  fullDetailIds: number[];
  fullDetailRemaining: number;
};

/**
 * A finished fixture whose lineups + appearances are already synced still gets
 * its events re-pulled while it sits inside the post-kickoff grace window, to
 * catch substitutions the API published after the first full-detail run.
 */
export function isWithinEventsRepullWindow(
  fx: Pick<MatchdayFixtureRow, "status_short" | "kickoff_at" | "lineups_synced_at" | "appearances_synced_at">,
  now: Date,
): boolean {
  if (!TERMINAL_STATUSES.has(fx.status_short)) return false;
  if (!fx.lineups_synced_at || !fx.appearances_synced_at) return false;
  const ageMs = now.getTime() - new Date(fx.kickoff_at).getTime();
  return ageMs >= 0 && ageMs <= EVENTS_REPULL_WINDOW_MS;
}

export function planMatchdaySync(
  fixtures: MatchdayFixtureRow[],
  limit: number,
  now: Date = new Date(),
): MatchdaySyncPlan {
  const liveSnapshotIds: number[] = [];
  const eventsOnlyIds: number[] = [];
  const needsFullDetail: number[] = [];

  for (const fx of fixtures) {
    if (TERMINAL_STATUSES.has(fx.status_short)) {
      if (!fx.lineups_synced_at || !fx.appearances_synced_at) {
        needsFullDetail.push(fx.id);
      } else if (isWithinEventsRepullWindow(fx, now)) {
        eventsOnlyIds.push(fx.id);
      }
      continue;
    }

    if (isLiveMatchStatus(fx.status_short)) {
      if (fx.lineups_synced_at) {
        eventsOnlyIds.push(fx.id);
      } else {
        liveSnapshotIds.push(fx.id);
      }
    }
  }

  const fullDetailIds = needsFullDetail.slice(0, limit);

  return {
    liveSnapshotIds,
    eventsOnlyIds,
    fullDetailIds,
    fullDetailRemaining: Math.max(0, needsFullDetail.length - fullDetailIds.length),
  };
}

/**
 * Score refresh via GET /fixtures?ids= — live matches only, plus NS/TBD after kickoff
 * when DB status may still be stale.
 */
export function shouldBatchRefreshFixture(
  fx: Pick<MatchdayFixtureRow, "status_short" | "kickoff_at">,
  now = new Date(),
): boolean {
  if (isLiveMatchStatus(fx.status_short)) return true;
  if (TERMINAL_STATUSES.has(fx.status_short)) return false;
  if (fx.status_short === "NS" || fx.status_short === "TBD") {
    return new Date(fx.kickoff_at) <= now;
  }
  return false;
}
