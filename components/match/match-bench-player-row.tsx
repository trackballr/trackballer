import { ArrowRight } from "lucide-react"

import { MatchContributionBadgesInline } from "@/components/match/match-event-badge"
import { PlayerAvatar } from "@/components/player-avatar"
import { RatingChip } from "@/components/rating/rating-chip"
import { positionDisplayLabel } from "@/lib/match/position-label"
import type { MatchLineupPlayer } from "@/lib/match/types"
import { cn } from "@/lib/utils"

type MatchBenchPlayerRowProps = {
  player: MatchLineupPlayer
  showSubInfo?: boolean
  disabled?: boolean
  onSelect: (player: MatchLineupPlayer) => void
}

export function MatchBenchPlayerRow({
  player,
  showSubInfo = false,
  disabled = false,
  onSelect,
}: MatchBenchPlayerRowProps) {
  const positionLabel = positionDisplayLabel(player.position)
  const canInteract = !disabled && player.isRateable
  const hasSubMinute = player.subOnMinute != null
  const hasReplaced = Boolean(player.subReplacedPlayerName)
  const hasContributions =
    player.goalCount > 0 ||
    player.assistCount > 0 ||
    player.yellowCardCount > 0 ||
    player.redCardCount > 0
  const showSubColumn = showSubInfo && (hasSubMinute || hasReplaced || hasContributions)

  return (
    <button
      type="button"
      className={cn(
        "flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm",
        canInteract ? "hover:bg-muted/50" : "cursor-default opacity-90",
      )}
      onClick={() => onSelect(player)}
      disabled={!canInteract}
    >
      <PlayerAvatar
        name={player.name}
        photoUrl={player.photoUrl}
        shirtNumber={player.shirtNumber}
        size="sm"
      />

      <RatingChip value={player.communityAvg} size="sm" className="shrink-0" />

      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium">
          {player.shirtNumber != null ? `${player.shirtNumber} ` : ""}
          {player.name}
        </span>
        {positionLabel && (
          <span className="block truncate text-xs text-muted-foreground">
            {positionLabel}
          </span>
        )}
      </span>

      {showSubColumn && (
        <span className="flex shrink-0 flex-col items-end gap-0.5 pl-1">
          {hasReplaced && (
            <span className="max-w-[7rem] truncate text-right text-xs text-muted-foreground">
              On for {player.subReplacedPlayerName}
            </span>
          )}
          {(hasContributions || hasSubMinute) && (
            <span className="flex items-center gap-1.5">
              <MatchContributionBadgesInline
                goalCount={player.goalCount}
                assistCount={player.assistCount}
                yellowCardCount={player.yellowCardCount}
                redCardCount={player.redCardCount}
              />
              {hasContributions && hasSubMinute && (
                <span className="text-xs text-muted-foreground" aria-hidden>
                  |
                </span>
              )}
              {hasSubMinute && (
                <span
                  className="flex items-center gap-1 font-mono text-xs font-semibold tabular-nums text-emerald-600 dark:text-emerald-400"
                  aria-label={`Subbed on ${player.subOnMinute} minutes`}
                >
                  {player.subOnMinute}&apos;
                  <span className="flex size-5 items-center justify-center rounded-full bg-emerald-500/20">
                    <ArrowRight className="size-3" aria-hidden />
                  </span>
                </span>
              )}
            </span>
          )}
        </span>
      )}
    </button>
  )
}
