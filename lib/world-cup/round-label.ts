import { formatLeagueRoundLabel } from "@/lib/league/round-label"

const GROUP_STAGE_ROUND = /^Group Stage\s*-\s*(\d+)$/i

/** Friendly label for fixture rows and round pickers (World Cup, T5, UCL). */
export function formatFixtureRoundLabel(roundName: string | null | undefined): string | null {
  if (!roundName) return null

  const groupStage = roundName.match(GROUP_STAGE_ROUND)
  if (groupStage) return `Round ${groupStage[1]}`

  return formatLeagueRoundLabel(roundName)
}
