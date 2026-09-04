import { NextRequest } from "next/server";

import { assertSyncAuthorized } from "@/lib/admin/sync-auth";
import { acceptDeferredSquadsSync } from "@/lib/cron/deferred-squads-sync";
import { parseSquadsSyncBody } from "@/lib/cron/parse-squads-sync-body";

export const runtime = "nodejs";
/** Hobby cap; work continues in after() within this invocation. */
export const maxDuration = 300;

/**
 * POST /api/cron/sync/squads
 * Monthly squad refresh — one T5 league or UCL per job (leagueId in body).
 * Returns immediately; sync runs via after().
 */
export async function POST(request: NextRequest) {
  const unauthorized = assertSyncAuthorized(request);
  if (unauthorized) return unauthorized;

  const body = await parseSquadsSyncBody(request);
  if (body instanceof Response) return body;

  console.log("[catalog-sync]", "POST /api/cron/sync/squads accepted", {
    leagueId: body.leagueId ?? null,
    seasonYear: body.seasonYear ?? null,
    limit: body.limit ?? null,
    offset: body.offset ?? null,
  });

  return acceptDeferredSquadsSync(body);
}
