import { describe, expect, it } from "vitest";

import {
  auditApiLineupIds,
  isValidLineupPlayerId,
  mergePlayerIdIssues,
} from "@/lib/catalog-sync/lineup-audit";
import type { ApiLineupItem } from "@/lib/api-football/types";

/** Captured from API-Football /fixtures/lineups for fixture 1489382 (Jordan bench). */
const JORDAN_NULL_ID_SUBS: ApiLineupItem[] = [
  {
    team: { id: 1548, name: "Jordan" },
    formation: "3-4-2-1",
    coach: { id: 1, name: "Coach", photo: null },
    startXI: [],
    substitutes: [
      {
        player: {
          id: null as unknown as number,
          name: "Noureddin Zaid",
          number: 12,
          pos: "G",
          grid: null,
        },
      },
      {
        player: {
          id: null as unknown as number,
          name: "Anas Badawi",
          number: 26,
          pos: "D",
          grid: null,
        },
      },
    ],
  },
];

describe("auditApiLineupIds", () => {
  it("flags Jordan bench slots where API returns id: null", () => {
    const issues = auditApiLineupIds(JORDAN_NULL_ID_SUBS);
    expect(issues).toHaveLength(2);
    expect(issues[0]).toMatchObject({
      teamName: "Jordan",
      role: "sub",
      playerName: "Noureddin Zaid",
      idValue: null,
    });
  });
});

describe("isValidLineupPlayerId", () => {
  it("rejects null, zero, and non-numeric ids", () => {
    expect(isValidLineupPlayerId(null)).toBe(false);
    expect(isValidLineupPlayerId(0)).toBe(false);
    expect(isValidLineupPlayerId("null")).toBe(false);
    expect(isValidLineupPlayerId(163908)).toBe(true);
  });
});

describe("mergePlayerIdIssues", () => {
  it("dedupes the same player from lineup and appearance gaps", () => {
    const merged = mergePlayerIdIssues(
      [
        {
          teamId: 1548,
          teamName: "Jordan",
          role: "sub",
          playerName: "Anas Badawi",
          idValue: null,
          idType: "null",
          reason: "id is null",
          rawPlayer: null,
        },
      ],
      [
        {
          teamId: 1548,
          teamName: "Jordan",
          role: "sub",
          playerName: "Anas Badawi",
          idValue: 0,
          idType: "number",
          reason: "id is zero",
          rawPlayer: null,
        },
      ],
    );

    expect(merged).toHaveLength(1);
  });
});
