import { describe, expect, it } from "vitest";

import { mapLineups, mapAppearances } from "@/lib/catalog-sync/mappers";
import { lineupPlayerOverrideKey } from "@/lib/catalog-sync/lineup-audit";
import { matchPlayerInSquad } from "@/lib/catalog-sync/lineup-player-resolve";
import type { ApiLineupItem } from "@/lib/api-football/types";

const JORDAN_SQUAD = [
  { id: 163908, name: "Noureddin Zaid" },
  { id: 664028, name: "A. Badawi" },
];

describe("matchPlayerInSquad", () => {
  it("matches exact API name to DB row", () => {
    const match = matchPlayerInSquad("Noureddin Zaid", JORDAN_SQUAD);
    expect(match).toEqual({
      playerId: 163908,
      dbName: "Noureddin Zaid",
      match: "exact",
    });
  });

  it("matches by unique last name when API uses full name and DB uses abbreviated", () => {
    const match = matchPlayerInSquad("Anas Badawi", JORDAN_SQUAD);
    expect(match).toEqual({
      playerId: 664028,
      dbName: "A. Badawi",
      match: "last_name",
    });
  });

  it("returns null when last name is ambiguous", () => {
    const squad = [
      { id: 1, name: "A. Badawi" },
      { id: 2, name: "B. Badawi" },
    ];
    expect(matchPlayerInSquad("Anas Badawi", squad)).toBeNull();
  });
});

describe("mapLineups with DB overrides", () => {
  const lineups: ApiLineupItem[] = [
    {
      team: { id: 1548, name: "Jordan" },
      formation: "3-4-2-1",
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

  it("maps null API ids when overrides are provided", () => {
    const overrides = new Map<string, number>([
      [lineupPlayerOverrideKey(1548, "Noureddin Zaid"), 163908],
      [lineupPlayerOverrideKey(1548, "Anas Badawi"), 664028],
    ]);

    const { lineups: rows, playerStubs, skipped } = mapLineups(1489382, lineups, {
      playerIdOverrides: overrides,
    });

    expect(skipped).toHaveLength(0);
    expect(rows).toHaveLength(2);
    expect(rows.map((r) => r.player_id).sort()).toEqual([163908, 664028]);
    expect(playerStubs.map((p) => p.id).sort()).toEqual([163908, 664028]);
  });

  it("skips slots that still have no resolvable id", () => {
    const { lineups: rows, skipped } = mapLineups(1489382, lineups);
    expect(rows).toHaveLength(0);
    expect(skipped).toHaveLength(2);
  });
});

describe("mapAppearances with DB overrides", () => {
  const playerBlocks = [
    {
      team: { id: 1548, name: "Jordan" },
      players: [
        {
          player: { id: 0, name: "Anas Badawi", photo: null },
          statistics: [{ games: { minutes: 0, substitute: true, position: "D" } }],
        },
        {
          player: { id: null as unknown as number, name: "Noureddin Zaid", photo: null },
          statistics: [{ games: { minutes: 0, substitute: true, position: "G" } }],
        },
        {
          player: { id: 15286, name: "Mousa Tamari", photo: null },
          statistics: [{ games: { minutes: 90, substitute: false, position: "F" } }],
        },
      ],
    },
  ] satisfies import("@/lib/api-football/types").ApiFixturePlayersItem[];

  it("resolves null/zero ids and dedupes by player_id", () => {
    const overrides = new Map<string, number>([
      [lineupPlayerOverrideKey(1548, "Anas Badawi"), 664028],
      [lineupPlayerOverrideKey(1548, "Noureddin Zaid"), 163908],
    ]);

    const { appearances, skipped } = mapAppearances(1489382, playerBlocks, {
      playerIdOverrides: overrides,
    });

    expect(skipped).toHaveLength(0);
    expect(appearances).toHaveLength(3);
    expect(appearances.map((a) => a.player_id).sort()).toEqual([15286, 163908, 664028]);
  });
});
