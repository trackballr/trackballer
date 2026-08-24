import type { OptionMenuGroup } from "@/components/ui/option-menu-select"

import { formatLeagueRoundLabel } from "@/lib/league/round-label"

/** Flat round list for domestic league matchweek pickers. */
export function buildLeagueRoundMenuGroups(rounds: { name: string }[]): OptionMenuGroup[] {
  if (rounds.length === 0) return []

  return [
    {
      options: rounds.map((round) => ({
        value: round.name,
        label: formatLeagueRoundLabel(round.name) ?? round.name,
      })),
    },
  ]
}
