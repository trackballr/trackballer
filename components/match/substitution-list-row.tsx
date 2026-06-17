"use client"

import { ArrowDownLeft } from "lucide-react"

import { MatchContributionBadgesInline } from "@/components/match/match-event-badge"
import { PlayerAvatar } from "@/components/player-avatar"
import { RatingChip } from "@/components/rating/rating-chip"
import type { MatchLineupPlayer } from "@/lib/match/types"
import { cn } from "@/lib/utils"

type SubstitutionListRowProps = {
  player: MatchLineupPlayer
  disabled?: boolean
  onSelect: (player: MatchLineupPlayer) => void
  className?: string
}

export function SubstitutionListRow({
  player,
  disabled = false,
  onSelect,
  className,
}: SubstitutionListRowProps) {
  const canInteract = !disabled && player.isRateable
  const hasSubMinute = player.subOnMinute != null
  const hasReplaced = Boolean(player.subReplacedPlayerName)
  const hasContributions =
    player.goalCount > 0 ||
    player.assistCount > 0 ||
    player.yellowCardCount > 0 ||
    player.redCardCount > 0

  return (
    <button
      type="button"
      className={cn(
        "flex w-full items-center gap-3 border-b border-border px-3 py-3 text-left last:border-b-0",
        canInteract ? "hover:bg-muted/50" : "cursor-default",
        className,
      )}
      onClick={() => onSelect(player)}
      disabled={!canInteract}
    >
      <PlayerAvatar
        name={player.name}
        photoUrl={player.photoUrl}
        shirtNumber={player.shirtNumber}
        size="md"
        className="shrink-0 rounded-full"
      />

      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold">
          {player.shirtNumber != null ? `${player.shirtNumber} ` : ""}
          {player.name}
        </span>
        {(hasSubMinute || hasReplaced || hasContributions) && (
          <span className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
            {hasContributions && (
              <MatchContributionBadgesInline
                goalCount={player.goalCount}
                assistCount={player.assistCount}
                yellowCardCount={player.yellowCardCount}
                redCardCount={player.redCardCount}
              />
            )}
            {hasSubMinute && (
              <span className="inline-flex items-center gap-1 font-mono font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                <ArrowDownLeft className="size-3.5 shrink-0" aria-hidden />
                {player.subOnMinute}&apos;
              </span>
            )}
            {hasReplaced && (
              <span className="truncate">
                Out: {player.subReplacedPlayerName}
              </span>
            )}
          </span>
        )}
      </span>

      <RatingChip value={player.communityAvg} size="sm" className="shrink-0" />
    </button>
  )
}
