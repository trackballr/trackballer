/** Turn API-Football round strings into readable league labels. */
export function formatLeagueRoundLabel(roundName: string | null | undefined): string | null {
  if (!roundName) return null

  const regularSeason = /^Regular Season\s*-\s*(\d+)$/i.exec(roundName.trim())
  if (regularSeason) {
    return `Matchweek ${regularSeason[1]}`
  }

  return roundName
}
