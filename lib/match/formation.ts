import type { MatchLineupPlayer } from "@/lib/match/types"

export type FormationRow = {
  row: number
  players: MatchLineupPlayer[]
}

/** Groups starters into formation lines (GK first), sorted left to right within each line. */
export function buildFormationRows(players: MatchLineupPlayer[]): FormationRow[] {
  const byRow = new Map<number, MatchLineupPlayer[]>()
  for (const player of players) {
    const line = byRow.get(player.gridRow) ?? []
    line.push(player)
    byRow.set(player.gridRow, line)
  }

  return [...byRow.entries()]
    .sort(([a], [b]) => a - b)
    .map(([row, line]) => ({
      row,
      players: [...line].sort((a, b) => a.gridCol - b.gridCol),
    }))
}

/** A back five or a five-line shape (4-2-3-1) needs smaller faces so the keeper stays on the pitch. */
export function lineupPitchIsCompact(homeRows: FormationRow[], awayRows: FormationRow[]): boolean {
  const rows = [...homeRows, ...awayRows]
  const maxInLine = rows.reduce((max, row) => Math.max(max, row.players.length), 0)
  const maxLines = Math.max(homeRows.length, awayRows.length)
  return maxInLine >= 5 || maxLines >= 5
}

/** Builds a "4-2-3-1" style label from the outfield lines (excludes the keeper line). */
export function formationLabel(rows: FormationRow[]): string | null {
  const outfield = rows.filter((r) => r.row > 1)
  if (outfield.length === 0) return null
  return outfield.map((r) => r.players.length).join("-")
}
