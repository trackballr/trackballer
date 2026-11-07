"use client"

import { TeamFlag } from "@/components/team-flag"
import type { TeamSummary } from "@/lib/catalog/types"
import type { PitchSide } from "@/lib/match/lineup-position"
import { cn } from "@/lib/utils"

type LineupTeamSwitcherProps = {
  homeTeam: TeamSummary
  awayTeam: TeamSummary
  selected: PitchSide
  onSelect: (side: PitchSide) => void
  className?: string
}

export function LineupTeamSwitcher({
  homeTeam,
  awayTeam,
  selected,
  onSelect,
  className,
}: LineupTeamSwitcherProps) {
  return (
    <div
      className={cn(
        "flex rounded-full border border-border bg-muted/60 p-1",
        className,
      )}
      role="tablist"
      aria-label="Select team lineup"
    >
      {(["home", "away"] as const).map((side) => {
        const team = side === "home" ? homeTeam : awayTeam
        const isActive = selected === side
        return (
          <button
            key={side}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onSelect(side)}
            className={cn(
              "flex flex-1 items-center justify-center rounded-full px-3 py-2 transition-colors",
              isActive
                ? "bg-neutral-200 shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <TeamFlag team={team} size="sm" />
          </button>
        )
      })}
    </div>
  )
}
