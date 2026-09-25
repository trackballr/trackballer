import { CatalogImage } from "@/components/catalog-image"
import {
  formatGroupedScorerLine,
  groupScorersByPlayer,
} from "@/lib/match/match-goals"
import type { MatchGoalScorers } from "@/lib/match/types"
import { cn } from "@/lib/utils"

const GOAL_ICON = "/football-svgrepo-com.svg"

type MatchScorersRowProps = {
  scorers: MatchGoalScorers
  className?: string
}

function ScorerColumn({
  goals,
  align,
}: {
  goals: ReturnType<typeof groupScorersByPlayer>
  align: "left" | "right"
}) {
  if (goals.length === 0) return null

  return (
    <ul
      className={cn(
        "min-w-0 space-y-0.5 leading-relaxed",
        align === "left" ? "text-left" : "text-right",
      )}
    >
      {goals.map((group) => (
        <li key={group.playerId}>{formatGroupedScorerLine(group)}</li>
      ))}
    </ul>
  )
}

export function MatchScorersRow({ scorers, className }: MatchScorersRowProps) {
  const homeGroups = groupScorersByPlayer(scorers.home)
  const awayGroups = groupScorersByPlayer(scorers.away)

  if (homeGroups.length === 0 && awayGroups.length === 0) return null

  return (
    <div
      className={cn(
        "flex items-start px-2 text-xs text-muted-foreground md:text-sm",
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 justify-end pr-3">
        <ScorerColumn goals={homeGroups} align="right" />
      </div>
      <span className="flex size-5 shrink-0 items-center justify-center pt-0.5">
        <CatalogImage
          src={GOAL_ICON}
          alt=""
          width={14}
          height={14}
          className="object-contain opacity-70 dark:invert"
        />
      </span>
      <div className="flex min-w-0 flex-1 justify-start pl-3">
        <ScorerColumn goals={awayGroups} align="left" />
      </div>
    </div>
  )
}
