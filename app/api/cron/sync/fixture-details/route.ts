import { NextRequest } from "next/server";

import { assertSyncAuthorized } from "@/lib/admin/sync-auth";
import { getT5SeasonYear } from "@/lib/catalog/config";
import { acceptDeferredSync } from "@/lib/cron/deferred-sync";
import { parseCronSyncBody } from "@/lib/cron/parse-sync-body";

export const runtime = "nodejs";
/** Hobby cap; work continues in after() within this invocation. */
export const maxDuration = 300;

/**
 * POST /api/cron/sync/fixture-details
 * Backfill lineups + appearances + events for concluded (FT/AET/PEN) matches
 * still missing sync flags. One league per request — use body `limit` (~10)
 * so ~30 API calls fit in 300s. Returns immediately for cron-job.org.
 */
export async function POST(request: NextRequest) {
  const unauthorized = assertSyncAuthorized(request);
  if (unauthorized) return unauthorized;

  const body = await parseCronSyncBody(request);
  if (body instanceof Response) return body;

  if (body.leagueId == null) {
    return Response.json(
      {
        error:
          "leagueId is required (one T5 league per job). Example: {\"leagueId\":39,\"seasonYear\":2026,\"limit\":10}",
      },
      { status: 400 },
    );
  }

  const seasonYear = body.seasonYear ?? getT5SeasonYear();
  const limit = body.limit ?? 10;

  console.log("[catalog-sync]", "POST /api/cron/sync/fixture-details accepted", {
    leagueId: body.leagueId,
    seasonYear,
    limit,
  });

  return acceptDeferredSync("fixture-details", { ...body, seasonYear, limit }, (sync) =>
    sync.syncPendingFixtureDetails({
      leagueId: body.leagueId,
      seasonYear,
      limit,
    }),
  );
}
