import { NextRequest } from "next/server";

export type SquadsSyncBody = {
  /** T5 league id (39, 140, …) or UCL (2). */
  leagueId?: number;
  seasonYear?: number;
  /** Max clubs per run — stay under Vercel 300s (~10 req/min). */
  limit?: number;
  /** Resume after timeout. */
  offset?: number;
};

export async function parseSquadsSyncBody(
  request: NextRequest,
): Promise<SquadsSyncBody | Response> {
  try {
    const text = await request.text();
    if (!text.trim()) return {};
    return JSON.parse(text) as SquadsSyncBody;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }
}
