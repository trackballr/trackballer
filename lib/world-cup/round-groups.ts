import type { OptionMenuGroup } from "@/components/ui/option-menu-select"

import { formatFixtureRoundLabel } from "@/lib/world-cup/round-label"

const GROUP_STAGE_PREFIX = "Group Stage"

/** Split catalog rounds into group-stage and knockout buckets for the round picker. */
export function buildRoundMenuGroups(rounds: { name: string }[]): OptionMenuGroup[] {
  const groupStage = rounds.filter((round) => round.name.startsWith(GROUP_STAGE_PREFIX))
  const knockout = rounds.filter((round) => !round.name.startsWith(GROUP_STAGE_PREFIX))

  const groups: OptionMenuGroup[] = []

  if (groupStage.length > 0) {
    groups.push({
      label: "Group stage",
      options: groupStage.map((round) => ({
        value: round.name,
        label: formatFixtureRoundLabel(round.name) ?? round.name,
      })),
    })
  }

  if (knockout.length > 0) {
    groups.push({
      label: "Knockout",
      options: knockout.map((round) => ({
        value: round.name,
        label: round.name,
      })),
    })
  }

  return groups
}
