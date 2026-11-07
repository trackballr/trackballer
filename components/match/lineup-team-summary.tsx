import { RatingChip } from "@/components/rating/rating-chip"
import { TeamFlag } from "@/components/team-flag"
import type { TeamSummary } from "@/lib/catalog/types"
import { cn } from "@/lib/utils"

type LineupTeamSummaryProps = {
  team: TeamSummary
  formation: string | null
  teamAvg: number | null
  className?: string
}

export function LineupTeamSummary({
  team,
  formation,
  teamAvg,
  className,
}: LineupTeamSummaryProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg border border-border bg-neutral-100 px-3 py-2.5",
        className,
      )}
    >
      <TeamFlag team={team} size="sm" />
      <span className="min-w-0 flex-1 truncate text-sm font-semibold">{team.name}</span>
      {teamAvg != null && (
        <RatingChip value={teamAvg} size="sm" className="shrink-0" />
      )}
      {formation && (
        <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
          {formation}
        </span>
      )}
    </div>
  )
}
