import { NextRequest } from "next/server";

import { assertSyncAuthorized } from "@/lib/admin/sync-auth";
import { acceptDeferredSync } from "@/lib/cron/deferred-sync";
import { parseCronSyncBody } from "@/lib/cron/parse-sync-body";

export const runtime = "nodejs";
/** Hobby cap; work continues in after() within this invocation. */
export const maxDuration = 300;

/**
 * POST /api/cron/sync/daily
 * Returns immediately (cron-job.org 30s timeout); sync runs via after().
 */
export async function POST(request: NextRequest) {
  const unauthorized = assertSyncAuthorized(request);
  if (unauthorized) return unauthorized;

  const body = await parseCronSyncBody(request);
  if (body instanceof Response) return body;

  console.log("[catalog-sync]", "POST /api/cron/sync/daily accepted", {
    leagueId: body.leagueId ?? null,
    seasonYear: body.seasonYear ?? null,
    daysAhead: body.daysAhead ?? null,
    daysBehind: body.daysBehind ?? null,
  });

  return acceptDeferredSync("daily", body, (sync) =>
    sync.syncDailyWindow({
      leagueId: body.leagueId,
      seasonYear: body.seasonYear,
      daysAhead: body.daysAhead,
      daysBehind: body.daysBehind,
    }),
  );
}
