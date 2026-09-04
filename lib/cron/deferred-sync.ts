import { after, NextResponse } from "next/server";

import { createCatalogSync } from "@/lib/admin/sync-handler";
import type { CatalogSync } from "@/lib/catalog-sync/catalog-sync";

import type { CronSyncBody } from "./parse-sync-body";

type CronJobName = "daily" | "matchday" | "fixture-details";

/**
 * Respond immediately for cron-job.org (30s HTTP timeout), run sync in after().
 * Work still runs in the same Vercel invocation up to maxDuration (300s).
 */
export function acceptDeferredSync(
  job: CronJobName,
  body: CronSyncBody,
  run: (sync: CatalogSync) => Promise<unknown>,
): NextResponse {
  after(async () => {
    try {
      const sync = createCatalogSync();
      const data = await run(sync);
      console.log("[catalog-sync]", `cron ${job} complete`, {
        data,
        rateLimit: sync.rateLimitInfo,
        quota: sync.api.lastQuota,
      });
    } catch (err) {
      console.error("[catalog-sync]", `cron ${job} failed`, err);
    }
  });

  return NextResponse.json({
    ok: true,
    status: "accepted",
    job,
    params: {
      leagueId: body.leagueId ?? null,
      seasonYear: body.seasonYear ?? null,
      daysAhead: body.daysAhead ?? null,
      daysBehind: body.daysBehind ?? null,
      limit: body.limit ?? null,
    },
    message:
      "Sync queued on server. cron-job.org only waits for this response; check Vercel function logs for completion.",
  });
}
