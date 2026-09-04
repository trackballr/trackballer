const REGULAR_SEASON_ROUND = /^Regular Season\s*-\s*(\d+)$/i
const LEAGUE_STAGE_ROUND = /^League Stage\s*-\s*(\d+)$/i

/** Turn API-Football round strings into readable league / UCL labels. */
export function formatLeagueRoundLabel(roundName: string | null | undefined): string | null {
  if (!roundName) return null

  const trimmed = roundName.trim()
  const regularSeason = REGULAR_SEASON_ROUND.exec(trimmed)
  if (regularSeason) {
    return `Matchday ${regularSeason[1]}`
  }

  const leagueStage = LEAGUE_STAGE_ROUND.exec(trimmed)
  if (leagueStage) {
    return `Matchday ${leagueStage[1]}`
  }

  return trimmed
}
