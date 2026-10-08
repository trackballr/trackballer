import { formatFixtureRoundLabel } from "@/lib/world-cup/round-label"

/** e.g. "Premier League 2026 · Matchday 4" */
export function buildCompetitionLabel(
  leagueName: string | null | undefined,
  roundName: string | null | undefined,
  seasonYear: number | null | undefined,
): string | null {
  const competition = [leagueName?.trim(), seasonYear != null ? String(seasonYear) : null]
    .filter(Boolean)
    .join(" ")
  const round = roundName?.trim()
    ? (formatFixtureRoundLabel(roundName.trim()) ?? roundName.trim())
    : null

  return [competition, round].filter(Boolean).join(" · ") || null
}
