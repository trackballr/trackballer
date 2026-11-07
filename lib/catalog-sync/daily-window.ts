import type { CatalogSync } from "@/lib/catalog-sync/catalog-sync";
import { DEFAULT_LEAGUE_ID, DEFAULT_SEASON_YEAR } from "@/lib/catalog-sync/constants";
import { upsertApiFixtureBatch } from "@/lib/catalog-sync/upsert-api-fixtures";

export type DailyWindowOptions = {
  leagueId?: number;
  seasonYear?: number;
  /** Days ahead from today (UTC). Default 7. */
  daysAhead?: number;
  /** Days before today (UTC). Default 0 — tonight-only season seed can pass ~45. */
  daysBehind?: number;
};

export type DailyWindowStats = {
  leagueId: number;
  seasonYear: number;
  from: string;
  to: string;
  apiFixtures: number;
  fixturesUpserted: number;
  teamsUpserted: number;
  /** Stored kickoffs refreshed by fixture id, including upcoming matches. */
  storedIds: number;
  storedIdsRefreshed: number;
};

/** How far back to re-read stored kickoffs. Covers a match moved to yesterday. */
const STORED_KICKOFF_LOOKBACK_DAYS = 2;

function formatUtcDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function nonNegativeInt(value: number | undefined, fallback: number): number {
  if (value == null || !Number.isFinite(value)) return fallback;
  return Math.max(0, Math.floor(value));
}

/**
 * Stored kickoffs to re-fetch by fixture id: two days ago through the same
 * daysAhead as the date window. Inclusive of the last day, exclusive end.
 * Upcoming matches are included. A kickoff that the API has moved outside
 * this window is still updated, because the lookup uses the time we have stored.
 */
export function storedKickoffRefreshRange(
  now: Date,
  daysAhead: number,
): { from: string; to: string } {
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  const d = now.getUTCDate();
  return {
    from: new Date(Date.UTC(y, m, d - STORED_KICKOFF_LOOKBACK_DAYS)).toISOString(),
    to: new Date(Date.UTC(y, m, d + daysAhead + 1)).toISOString(),
  };
}

function chunkIds(ids: number[], size: number): number[][] {
  const out: number[][] = [];
  for (let i = 0; i < ids.length; i += size) {
    out.push(ids.slice(i, i + size));
  }
  return out;
}

/** UTC calendar window: today − daysBehind through today + daysAhead. */
export function dailyWindowRange(
  now: Date,
  daysAhead: number,
  daysBehind: number,
): { from: string; to: string } {
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  const d = now.getUTCDate();
  return {
    from: formatUtcDate(new Date(Date.UTC(y, m, d - daysBehind))),
    to: formatUtcDate(new Date(Date.UTC(y, m, d + daysAhead))),
  };
}

/**
 * Job 1 — refresh kickoff, status, and scores for fixtures in a date window.
 */
export async function syncDailyWindow(
  sync: CatalogSync,
  options: DailyWindowOptions = {},
): Promise<DailyWindowStats> {
  const leagueId = options.leagueId ?? Number(process.env.API_FOOTBALL_LEAGUE_ID ?? DEFAULT_LEAGUE_ID);
  const seasonYear =
    options.seasonYear ?? Number(process.env.API_FOOTBALL_SEASON ?? DEFAULT_SEASON_YEAR);
  const daysAhead = nonNegativeInt(options.daysAhead, 7);
  const daysBehind = nonNegativeInt(options.daysBehind, 0);

  const { from, to } = dailyWindowRange(new Date(), daysAhead, daysBehind);

  const seasonId = await sync.ensureSeason(leagueId, seasonYear);
  const res = await sync.api.getFixturesByDateWindow(leagueId, seasonYear, from, to);
  const items = res.response;

  const dateUpsert = await upsertApiFixtureBatch(sync.db, seasonId, items, {
    isNational: leagueId === 1,
  });

  const idWindow = storedKickoffRefreshRange(new Date(), daysAhead);
  const { data: stored, error: storedError } = await sync.db
    .from("fixtures")
    .select("id")
    .eq("season_id", seasonId)
    .gte("kickoff_at", idWindow.from)
    .lt("kickoff_at", idWindow.to);

  if (storedError) throw storedError;

  const storedIds = (stored ?? []).map((row) => row.id);
  let storedIdsRefreshed = 0;
  for (const idChunk of chunkIds(storedIds, 20)) {
    const byId = await sync.api.getFixturesByIds(idChunk);
    if (byId.response.length === 0) continue;
    const idUpsert = await upsertApiFixtureBatch(sync.db, seasonId, byId.response, {
      isNational: leagueId === 1,
    });
    storedIdsRefreshed += idUpsert.fixtures;
  }

  return {
    leagueId,
    seasonYear,
    from,
    to,
    apiFixtures: items.length,
    fixturesUpserted: dateUpsert.fixtures,
    teamsUpserted: dateUpsert.teams,
    storedIds: storedIds.length,
    storedIdsRefreshed,
  };
}
