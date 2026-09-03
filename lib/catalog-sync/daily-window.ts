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
};

function formatUtcDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function nonNegativeInt(value: number | undefined, fallback: number): number {
  if (value == null || !Number.isFinite(value)) return fallback;
  return Math.max(0, Math.floor(value));
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

  const { fixtures, teams } = await upsertApiFixtureBatch(sync.db, seasonId, items, {
    isNational: leagueId === 1,
  });

  return {
    leagueId,
    seasonYear,
    from,
    to,
    apiFixtures: items.length,
    fixturesUpserted: fixtures,
    teamsUpserted: teams,
  };
}
