import { describe, expect, it } from "vitest"

import { parseStandingsResponse } from "@/lib/catalog/standings-parse"

function apiTeam(
  id: number,
  name: string,
  group: string,
  rank: number,
): Record<string, unknown> {
  return {
    rank,
    team: { id, name, logo: null },
    points: 3,
    goalsDiff: 1,
    group,
    form: null,
    all: {
      played: 1,
      win: 1,
      draw: 0,
      lose: 0,
      goals: { for: 2, against: 1 },
    },
  }
}

describe("parseStandingsResponse", () => {
  it("groups by group label when API returns cumulative table slots", () => {
    const payload = parseStandingsResponse(
      {
        response: [
          {
            league: {
              name: "World Cup",
              standings: [
                [
                  apiTeam(1, "Egypt", "Group A", 4),
                  apiTeam(2, "Uruguay", "Group A", 1),
                  apiTeam(3, "Saudi Arabia", "Group A", 2),
                  apiTeam(4, "Spain", "Group A", 3),
                ],
                [
                  apiTeam(1, "Egypt", "Group A", 4),
                  apiTeam(2, "Uruguay", "Group A", 1),
                  apiTeam(3, "Saudi Arabia", "Group A", 2),
                  apiTeam(4, "Spain", "Group A", 3),
                  apiTeam(5, "Cape Verde", "Group B", 4),
                  apiTeam(6, "Norway", "Group B", 1),
                  apiTeam(7, "France", "Group B", 2),
                  apiTeam(8, "Senegal", "Group B", 3),
                ],
              ],
            },
          },
        ],
      },
      2026,
    )

    expect(payload?.groups).toHaveLength(2)
    expect(payload?.groups[0]?.name).toBe("Group A")
    expect(payload?.groups[0]?.teams).toHaveLength(4)
    expect(payload?.groups[1]?.name).toBe("Group B")
    expect(payload?.groups[1]?.teams).toHaveLength(4)
    expect(payload?.groups[1]?.teams.map((t) => t.teamName)).toEqual([
      "Norway",
      "France",
      "Senegal",
      "Cape Verde",
    ])
  })

  it("splits one flat table by group label", () => {
    const payload = parseStandingsResponse(
      {
        response: [
          {
            league: {
              name: "World Cup",
              standings: [
                [
                  apiTeam(1, "Egypt", "Group A", 1),
                  apiTeam(5, "Cape Verde", "Group B", 1),
                ],
              ],
            },
          },
        ],
      },
      2026,
    )

    expect(payload?.groups).toHaveLength(2)
    expect(payload?.groups[0]?.teams).toHaveLength(1)
    expect(payload?.groups[1]?.teams).toHaveLength(1)
  })
})
