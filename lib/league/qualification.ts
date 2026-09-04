import type { StandingsTeamRow } from "@/lib/catalog/standings-types"

export type QualificationZone = {
  key: string
  label: string
  /** CSS colour for the row marker and the legend dot. */
  color: string
}

const ZONES: (QualificationZone & { match: RegExp })[] = [
  {
    key: "champions-league",
    label: "Champions League",
    color: "var(--success)",
    match: /champions league/i,
  },
  {
    key: "conference-league",
    label: "Conference League",
    color: "var(--warning)",
    match: /conference/i,
  },
  {
    key: "europa-league",
    label: "Europa League",
    color: "var(--rating-world-class)",
    match: /europa/i,
  },
  {
    key: "promotion",
    label: "Promotion",
    color: "var(--success)",
    match: /promotion|championship round|next round/i,
  },
  {
    key: "play-off",
    label: "Play-offs",
    color: "var(--rating-average)",
    match: /play-?off/i,
  },
  {
    key: "relegation",
    label: "Relegation",
    color: "var(--destructive)",
    match: /relegation/i,
  },
]

/**
 * Read the qualification zone off the API note for a standings row.
 * Conference is checked before Europa — "Europa Conference League" matches both.
 */
export function getQualificationZone(
  description: string | null | undefined,
): QualificationZone | null {
  if (!description) return null

  for (const zone of ZONES) {
    if (zone.match.test(description)) {
      return { key: zone.key, label: zone.label, color: zone.color }
    }
  }

  return null
}

/** Zones present in a table, in table order — for the legend under the standings. */
export function collectQualificationZones(rows: StandingsTeamRow[]): QualificationZone[] {
  const seen = new Map<string, QualificationZone>()

  for (const row of rows) {
    const zone = getQualificationZone(row.description)
    if (zone && !seen.has(zone.key)) {
      seen.set(zone.key, zone)
    }
  }

  return Array.from(seen.values())
}
