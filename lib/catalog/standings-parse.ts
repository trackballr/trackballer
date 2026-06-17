import type { StandingsGroup, StandingsPayload } from "@/lib/catalog/standings-types"

type ApiStandingsTeam = {
  rank: number
  team: { id: number; name: string; logo: string | null }
  all: {
    played: number
    win: number
    draw: number
    lose: number
    goals: { for: number; against: number }
  }
  goalsDiff: number
  points: number
  form: string | null
  group?: string
}

function mapTeamRow(row: ApiStandingsTeam): StandingsGroup["teams"][number] {
  return {
    rank: row.rank,
    teamId: row.team.id,
    teamName: row.team.name,
    logoUrl: row.team.logo,
    played: row.all.played,
    win: row.all.win,
    draw: row.all.draw,
    lose: row.all.lose,
    goalsFor: row.all.goals.for,
    goalsAgainst: row.all.goals.against,
    goalsDiff: row.goalsDiff,
    points: row.points,
    form: row.form,
  }
}

function dedupeByTeamId(rows: ApiStandingsTeam[]): ApiStandingsTeam[] {
  const seen = new Set<number>()
  const unique: ApiStandingsTeam[] = []
  for (const row of rows) {
    if (seen.has(row.team.id)) continue
    seen.add(row.team.id)
    unique.push(row)
  }
  return unique
}

function flattenStandingsRows(tables: unknown[]): ApiStandingsTeam[] {
  const rows: ApiStandingsTeam[] = []
  for (const table of tables) {
    if (Array.isArray(table)) {
      rows.push(...(table as ApiStandingsTeam[]))
    }
  }
  return rows
}

/** Group rows by API `group` label — handles flat and cumulative table slots. */
function groupsFromRows(rows: ApiStandingsTeam[]): StandingsGroup[] {
  const byGroup = new Map<string, ApiStandingsTeam[]>()

  for (const row of rows) {
    const groupName = row.group?.trim() || "Standings"
    const bucket = byGroup.get(groupName) ?? []
    if (!bucket.some((existing) => existing.team.id === row.team.id)) {
      bucket.push(row)
    }
    byGroup.set(groupName, bucket)
  }

  return Array.from(byGroup.entries())
    .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
    .map(([name, groupRows]) => ({
      name,
      teams: [...groupRows].sort((a, b) => a.rank - b.rank).map(mapTeamRow),
    }))
}

function groupsFromTables(tables: unknown[]): StandingsGroup[] {
  return tables.map((table, index) => {
    const rows = Array.isArray(table) ? (table as ApiStandingsTeam[]) : []
    const first = rows[0]
    const name = first?.group ?? `Group ${String.fromCharCode(65 + index)}`
    return {
      name,
      teams: dedupeByTeamId(rows).map(mapTeamRow),
    }
  })
}

export function parseStandingsResponse(
  data: unknown,
  season: number,
): StandingsPayload | null {
  if (!data || typeof data !== "object") return null
  const root = data as { response?: unknown[] }
  const block = root.response?.[0]
  if (!block || typeof block !== "object") return null

  const league = (block as { league?: { name?: string; standings?: unknown[] } }).league
  const tables = league?.standings
  if (!Array.isArray(tables) || tables.length === 0) return null

  const allRows = flattenStandingsRows(tables)
  if (allRows.length === 0) return null

  const groups = allRows.some((row) => row.group?.trim())
    ? groupsFromRows(allRows)
    : groupsFromTables(tables)

  if (groups.length === 0) return null

  return {
    leagueName: league?.name ?? "World Cup",
    season,
    groups,
  }
}
