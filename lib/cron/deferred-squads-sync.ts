import { after, NextResponse } from "next/server";

import { ApiFootballClient } from "@/lib/api-football/client";
import { getT5SeasonYear } from "@/lib/catalog/config";
import { UCL_COMPETITION } from "@/lib/catalog/top-leagues";
import { seedTopLeaguePlayers } from "@/lib/catalog-sync/seed-top-league-players";
import { seedUclPlayers } from "@/lib/catalog-sync/seed-ucl-players";
import { createAdminClient } from "@/lib/supabase/admin";

import type { SquadsSyncBody } from "./parse-squads-sync-body";

/**
 * Respond immediately for cron-job.org (30s HTTP timeout), run squad sync in after().
 * Work still runs in the same Vercel invocation up to maxDuration (300s).
 */
export function acceptDeferredSquadsSync(body: SquadsSyncBody): NextResponse {
  after(async () => {
    try {
      const api = new ApiFootballClient();
      const db = createAdminClient();
      const seasonYear = body.seasonYear ?? getT5SeasonYear();
      const leagueId = body.leagueId;

      const data =
        leagueId === UCL_COMPETITION.id
          ? await seedUclPlayers(db, api, {
              seasonYear,
              limit: body.limit,
              offset: body.offset,
            })
          : await seedTopLeaguePlayers(db, api, {
              seasonYear,
              leagueIds: leagueId != null ? [leagueId] : undefined,
              limit: body.limit,
              offset: body.offset,
            });

      console.log("[catalog-sync]", "cron squads complete", {
        leagueId: leagueId ?? null,
        seasonYear,
        data,
        rateLimit: api.rateLimit,
        quota: api.lastQuota,
      });
    } catch (err) {
      console.error("[catalog-sync]", "cron squads failed", err);
    }
  });

  return NextResponse.json({
    ok: true,
    status: "accepted",
    job: "squads",
    params: {
      leagueId: body.leagueId ?? null,
      seasonYear: body.seasonYear ?? null,
      limit: body.limit ?? null,
      offset: body.offset ?? null,
    },
    message:
      "Squad sync queued on server. cron-job.org only waits for this response; check Vercel function logs for completion.",
  });
}
