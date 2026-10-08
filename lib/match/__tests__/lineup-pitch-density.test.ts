import { describe, expect, it } from "vitest"

import { lineupPitchIsCompact, type FormationRow } from "@/lib/match/formation"
import type { MatchLineupPlayer } from "@/lib/match/types"

function rows(counts: number[]): FormationRow[] {
  return counts.map((count, index) => ({
    row: index + 1,
    players: Array.from({ length: count }, () => ({}) as MatchLineupPlayer),
  }))
}

describe("lineupPitchIsCompact", () => {
  it("keeps a 4-3-3 at the regular size", () => {
    expect(lineupPitchIsCompact(rows([1, 4, 3, 3]), rows([1, 4, 3, 3]))).toBe(false)
  })

  it("shrinks a back five and a 4-2-3-1 so the keeper is not clipped", () => {
    expect(lineupPitchIsCompact(rows([1, 5, 2, 3]), rows([1, 4, 4, 2]))).toBe(true)
    expect(lineupPitchIsCompact(rows([1, 4, 2, 3, 1]), rows([1, 4, 4, 2]))).toBe(true)
  })
})
