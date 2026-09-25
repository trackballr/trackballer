import { RatingChip } from "@/components/rating/rating-chip"
import { TeamFlag } from "@/components/team-flag"
import type { TeamSummary } from "@/lib/catalog/types"
import { cn } from "@/lib/utils"

type TeamSide = {
  team: TeamSummary
  formation: string | null
  teamAvg: number | null
}

type MatchLineupFormationHeaderProps = {
  home: TeamSide
  away: TeamSide
  className?: string
}

function HeaderTeam({ side, align }: { side: TeamSide; align: "left" | "right" }) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-1 items-center gap-2.5",
        align === "right" && "flex-row-reverse",
      )}
    >
      <TeamFlag team={side.team} size="md" variant="crest" />
      <span className="min-w-0 truncate text-sm font-semibold">{side.team.name}</span>
      {side.teamAvg != null && (
        <RatingChip
          value={side.teamAvg}
          className="min-w-0 rounded-[5px] border-0 px-1.5 py-px font-sans text-[11px] font-bold"
        />
      )}
      <span
        className={cn(
          "shrink-0 text-xs font-medium tabular-nums text-muted-foreground",
          align === "left" ? "ml-auto" : "mr-auto",
        )}
      >
        {side.formation ?? ""}
      </span>
    </div>
  )
}

/** Team bar across the top of the desktop pitch: crest, name, team average, formation. */
export function MatchLineupFormationHeader({
  home,
  away,
  className,
}: MatchLineupFormationHeaderProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-6 border-b border-border px-4 py-2.5",
        className,
      )}
    >
      <HeaderTeam side={home} align="left" />
      <span className="h-5 w-px shrink-0 bg-border" aria-hidden />
      <HeaderTeam side={away} align="right" />
    </div>
  )
}
