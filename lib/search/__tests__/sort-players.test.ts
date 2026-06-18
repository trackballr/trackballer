import { describe, expect, it } from "vitest"

import { sortPlayers } from "@/lib/search/sort-players"
import type { PlayerListItem } from "@/lib/search/types"

function player(id: number, score: number, name: string): PlayerListItem {
  return {
    id,
    displayName: name,
    catalogName: name,
    photoUrl: null,
    nationality: null,
    position: null,
    age: null,
    tier: "average",
    displayScore: score,
    isProvisional: false,
    clubName: null,
  }
}

describe("sortPlayers", () => {
  const sample = [player(1, 6.5, "Bravo"), player(2, 8.2, "Alpha"), player(3, 7.0, "Charlie")]

  it("sorts by rating descending by default", () => {
    expect(sortPlayers(sample, "rating-desc").map((p) => p.id)).toEqual([2, 3, 1])
  })

  it("sorts by rating ascending", () => {
    expect(sortPlayers(sample, "rating-asc").map((p) => p.id)).toEqual([1, 3, 2])
  })

  it("breaks rating ties by name", () => {
    const tied = [player(1, 7, "Zed"), player(2, 7, "Amy")]
    expect(sortPlayers(tied, "rating-desc").map((p) => p.id)).toEqual([2, 1])
  })
})
