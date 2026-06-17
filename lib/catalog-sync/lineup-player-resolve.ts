import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/database.types";
import {
  lineupPlayerOverrideKey,
  normalizeLineupPlayerName,
  type LineupIdIssue,
} from "@/lib/catalog-sync/lineup-audit";

type SquadPlayer = { id: number; name: string };

export type ResolvedLineupPlayer = {
  teamId: number;
  teamName: string;
  apiName: string;
  playerId: number;
  dbName: string;
  match: "exact" | "last_name";
};

export type UnresolvedLineupPlayer = {
  teamId: number;
  teamName: string;
  apiName: string;
  reason: "not_in_db" | "ambiguous_last_name";
};

export type LineupPlayerIdOverrides = {
  overrides: Map<string, number>;
  resolved: ResolvedLineupPlayer[];
  unresolved: UnresolvedLineupPlayer[];
};

function lastNameToken(name: string): string | null {
  const parts = normalizeLineupPlayerName(name).split(" ").filter(Boolean);
  return parts.length > 0 ? (parts[parts.length - 1] ?? null) : null;
}

/** Match API lineup name to a squad row — exact first, then unique last-name match. */
export function matchPlayerInSquad(
  apiName: string,
  squad: SquadPlayer[],
): { playerId: number; dbName: string; match: "exact" | "last_name" } | null {
  const normalizedApi = normalizeLineupPlayerName(apiName);
  if (!normalizedApi) return null;

  const exact = squad.find((p) => normalizeLineupPlayerName(p.name) === normalizedApi);
  if (exact) {
    return { playerId: exact.id, dbName: exact.name, match: "exact" };
  }

  const apiLast = lastNameToken(apiName);
  if (!apiLast) return null;

  const byLast = squad.filter((p) => lastNameToken(p.name) === apiLast);
  if (byLast.length === 1) {
    const only = byLast[0]!;
    return { playerId: only.id, dbName: only.name, match: "last_name" };
  }

  return null;
}

async function fetchSquadPlayersForLineupTeam(
  db: SupabaseClient<Database>,
  teamId: number,
): Promise<SquadPlayer[]> {
  const { data: team, error: teamError } = await db
    .from("teams")
    .select("is_national")
    .eq("id", teamId)
    .maybeSingle();

  if (teamError) throw teamError;

  const squadColumn = team?.is_national ? "national_team_id" : "club_team_id";
  const { data, error } = await db
    .from("players")
    .select("id, name")
    .eq(squadColumn, teamId);

  if (error) throw error;
  return data ?? [];
}

/**
 * When API-Football omits player.id, try Postgres squad link (national_team_id or club_team_id).
 */
export async function buildLineupPlayerIdOverrides(
  db: SupabaseClient<Database>,
  issues: LineupIdIssue[],
): Promise<LineupPlayerIdOverrides> {
  const overrides = new Map<string, number>();
  const resolved: ResolvedLineupPlayer[] = [];
  const unresolved: UnresolvedLineupPlayer[] = [];

  const issuesByTeam = new Map<number, LineupIdIssue[]>();
  for (const issue of issues) {
    const list = issuesByTeam.get(issue.teamId) ?? [];
    list.push(issue);
    issuesByTeam.set(issue.teamId, list);
  }

  for (const [teamId, teamIssues] of issuesByTeam) {
    const squad = await fetchSquadPlayersForLineupTeam(db, teamId);

    for (const issue of teamIssues) {
      const apiName = issue.playerName?.trim() ?? "";
      if (!apiName) {
        unresolved.push({
          teamId,
          teamName: issue.teamName,
          apiName,
          reason: "not_in_db",
        });
        continue;
      }

      const match = matchPlayerInSquad(apiName, squad);
      if (!match) {
        const apiLast = lastNameToken(apiName);
        const ambiguous =
          apiLast != null &&
          squad.filter((p) => lastNameToken(p.name) === apiLast).length > 1;

        unresolved.push({
          teamId,
          teamName: issue.teamName,
          apiName,
          reason: ambiguous ? "ambiguous_last_name" : "not_in_db",
        });
        continue;
      }

      const key = lineupPlayerOverrideKey(teamId, apiName);
      overrides.set(key, match.playerId);
      resolved.push({
        teamId,
        teamName: issue.teamName,
        apiName,
        playerId: match.playerId,
        dbName: match.dbName,
        match: match.match,
      });
    }
  }

  return { overrides, resolved, unresolved };
}
