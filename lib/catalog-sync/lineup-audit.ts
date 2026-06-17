import type {
  ApiFixturePlayersItem,
  ApiLineupItem,
} from "@/lib/api-football/types";

export type LineupIdIssue = {
  teamId: number;
  teamName: string;
  role: "starter" | "sub";
  playerName: string | null;
  idValue: unknown;
  idType: string;
  reason: string;
  rawPlayer: unknown;
};

export function isValidLineupPlayerId(id: unknown): id is number {
  if (!describeId(id).ok) return false;
  const numeric = typeof id === "number" ? id : Number(id);
  return Number.isFinite(numeric) && numeric > 0;
}

/** @deprecated alias — use isValidLineupPlayerId */
export const isValidCatalogPlayerId = isValidLineupPlayerId;

export function lineupPlayerOverrideKey(teamId: number, playerName: string): string {
  return `${teamId}:${normalizeLineupPlayerName(playerName)}`;
}

export function normalizeLineupPlayerName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

function describeId(id: unknown): { ok: boolean; reason: string; idType: string } {
  const idType = id === null ? "null" : Array.isArray(id) ? "array" : typeof id;
  if (id == null) {
    return { ok: false, reason: "id is null or undefined", idType };
  }
  if (typeof id === "string" && id.trim().toLowerCase() === "null") {
    return { ok: false, reason: 'id is the string "null"', idType };
  }
  if (typeof id === "number" && Number.isFinite(id)) {
    return { ok: true, reason: "ok", idType };
  }
  if (typeof id === "string" && /^\d+$/.test(id.trim())) {
    return { ok: true, reason: "ok", idType };
  }
  return { ok: false, reason: "id is not a finite numeric player id", idType };
}

/** Flag lineup slots from API-Football that cannot be stored (missing/invalid player id). */
export function auditApiLineupIds(lineups: ApiLineupItem[]): LineupIdIssue[] {
  const issues: LineupIdIssue[] = [];

  for (const teamLineup of lineups) {
    const slots: Array<{ role: "starter" | "sub"; entries: ApiLineupItem["startXI"] }> = [
      { role: "starter", entries: teamLineup.startXI ?? [] },
      { role: "sub", entries: teamLineup.substitutes ?? [] },
    ];

    for (const { role, entries } of slots) {
      for (const entry of entries) {
        const id = entry.player?.id;
        if (isValidLineupPlayerId(id)) continue;
        const check = describeId(id);
        issues.push({
            teamId: teamLineup.team.id,
            teamName: teamLineup.team.name,
            role,
            playerName: entry.player?.name ?? null,
            idValue: id,
            idType: check.idType,
            reason: check.reason,
            rawPlayer: entry.player ?? null,
        });
      }
    }
  }

  return issues;
}

/** Dedupe lineup + appearance gaps before a single DB resolve pass. */
export function mergePlayerIdIssues(
  ...groups: LineupIdIssue[][]
): LineupIdIssue[] {
  const seen = new Set<string>();
  const merged: LineupIdIssue[] = [];
  for (const group of groups) {
    for (const issue of group) {
      const key = `${issue.teamId}:${normalizeLineupPlayerName(issue.playerName ?? "")}`;
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(issue);
    }
  }
  return merged;
}

/** Same null/zero id problem on GET /fixtures/players appearance blocks. */
export function auditApiAppearancePlayerIds(
  teams: ApiFixturePlayersItem[],
): LineupIdIssue[] {
  const issues: LineupIdIssue[] = [];

  for (const teamBlock of teams) {
    for (const row of teamBlock.players ?? []) {
      const id = row.player?.id;
      if (isValidLineupPlayerId(id)) continue;
      const check = describeId(id);
      issues.push({
        teamId: teamBlock.team.id,
        teamName: teamBlock.team.name,
        role: "sub",
        playerName: row.player?.name ?? null,
        idValue: id,
        idType: check.idType,
        reason:
          id === 0
            ? "id is zero"
            : id == null
              ? "id is null or undefined"
              : check.reason,
        rawPlayer: row.player ?? null,
      });
    }
  }

  return issues;
}

/** Compact summary for logs — full raw blocks are large. */
export function summarizeApiLineups(lineups: ApiLineupItem[]) {
  return lineups.map((team) => ({
    teamId: team.team.id,
    teamName: team.team.name,
    formation: team.formation ?? null,
    coach: team.coach ?? null,
    starters: (team.startXI ?? []).map((e) => ({
      id: e.player?.id ?? null,
      name: e.player?.name ?? null,
      number: e.player?.number ?? null,
    })),
    subs: (team.substitutes ?? []).map((e) => ({
      id: e.player?.id ?? null,
      name: e.player?.name ?? null,
      number: e.player?.number ?? null,
    })),
  }));
}
