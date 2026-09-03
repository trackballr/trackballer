import { NextRequest } from "next/server";

export type CronSyncBody = {
  leagueId?: number;
  seasonYear?: number;
  limit?: number;
  daysAhead?: number;
  daysBehind?: number;
};

export async function parseCronSyncBody(
  request: NextRequest,
): Promise<CronSyncBody | Response> {
  try {
    const text = await request.text();
    if (!text.trim()) return {};
    return JSON.parse(text) as CronSyncBody;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }
}
