"use client"

import { ChevronLeft, ChevronRight, Flame, User } from "lucide-react"
import Link from "next/link"

import { PlayerAvatar } from "@/components/player-avatar"
import { RatingChip } from "@/components/rating/rating-chip"
import { TeamFlag } from "@/components/team-flag"
import { Button } from "@/components/ui/button"
import type { TeamSummary } from "@/lib/catalog/types"
import { positionDisplayLabel } from "@/lib/match/position-label"
import type { MatchLineupPlayer } from "@/lib/match/types"

export type RatingPanelProps = {
  player: MatchLineupPlayer
  activeIndex: number
  totalPlayers: number
  matchContext: string
  team: TeamSummary
  value: number
  onValueChange: (value: number) => void
  canGoPrev: boolean
  canGoNext: boolean
  onPrev: () => void
  onNext: () => void
  onClose: () => void
  onSubmit: (value: number) => void
  isSubmitting?: boolean
  hasNextPlayer?: boolean
  titleId?: string
}

/** A rating this far from the fans' average earns the hot-take badge. */
export const HOT_TAKE_GAP = 1.5

export function isHotTake(value: number | null, fansAvg: number | null): boolean {
  return value != null && fansAvg != null && Math.abs(value - fansAvg) >= HOT_TAKE_GAP
}

/** Live "you vs the fans" line under the slider value. */
function FansComparison({ player, value }: { player: MatchLineupPlayer; value: number }) {
  if (player.communityAvg == null || player.ratingCount === 0) {
    return (
      <p className="mt-2 text-center text-xs text-muted-foreground">
        No fan ratings yet — yours sets the tone.
      </p>
    )
  }

  const hot = isHotTake(value, player.communityAvg)
  const above = value > player.communityAvg

  return (
    <div className="mt-2 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
      <span>
        Fans{" "}
        <span className="font-semibold tabular-nums text-foreground">
          {player.communityAvg.toFixed(1)}
        </span>{" "}
        · {player.ratingCount} rating{player.ratingCount === 1 ? "" : "s"}
      </span>
      {player.userRating != null ? (
        <span>
          · You had{" "}
          <span className="font-semibold tabular-nums text-foreground">
            {player.userRating.toFixed(1)}
          </span>
        </span>
      ) : null}
      {hot ? (
        <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/15 px-2 py-0.5 font-semibold text-orange-700 dark:text-orange-300">
          <Flame className="size-3" aria-hidden />
          Hot take · {above ? "above" : "below"} the fans
        </span>
      ) : null}
    </div>
  )
}

export function RatingPanel({
  player,
  activeIndex,
  totalPlayers,
  matchContext,
  team,
  value,
  onValueChange,
  canGoPrev,
  canGoNext,
  onPrev,
  onNext,
  onClose,
  onSubmit,
  isSubmitting = false,
  hasNextPlayer = false,
  titleId = "rating-panel-title",
}: RatingPanelProps) {
  const submitLabel = isSubmitting
    ? "Saving…"
    : hasNextPlayer
      ? "Save & next"
      : "Save rating"
  const positionLabel = positionDisplayLabel(player.position)
  const metaParts = [
    player.shirtNumber != null ? `#${player.shirtNumber}` : null,
    positionLabel,
  ].filter(Boolean)

  return (
    <div className="px-1 pb-1">
      <div className="mb-4 flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-9 shrink-0 rounded-full"
          disabled={!canGoPrev || isSubmitting}
          onClick={onPrev}
          aria-label="Previous player"
        >
          <ChevronLeft className="size-5" />
        </Button>

        <div className="flex min-w-0 flex-1 flex-col items-center gap-1">
          <span className="relative inline-flex shrink-0">
            <PlayerAvatar
              name={player.name}
              photoUrl={player.photoUrl}
              shirtNumber={player.shirtNumber}
              size="lg"
              className="rounded-full"
            />
            <span className="absolute -bottom-0.5 -right-4 rounded-full border border-background bg-card p-0.5">
              <TeamFlag team={team} size="sm" />
            </span>
            <RatingChip
              value={player.communityAvg}
              size="sm"
              className="absolute -top-1 -right-5 z-10 min-w-[1.75rem] border-background shadow-sm"
            />
          </span>
          <h2 id={titleId} className="max-w-full truncate text-center text-lg font-semibold">
            {player.name}
          </h2>
          {metaParts.length > 0 && (
            <p className="text-center text-xs text-muted-foreground">{metaParts.join(" · ")}</p>
          )}
          <p className="text-center font-mono text-xs tabular-nums text-muted-foreground">
            {activeIndex + 1} / {totalPlayers}
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-9 shrink-0 rounded-full"
          disabled={!canGoNext || isSubmitting}
          onClick={onNext}
          aria-label="Next player"
        >
          <ChevronRight className="size-5" />
        </Button>
      </div>

      <p className="mb-4 text-center text-sm text-muted-foreground">{matchContext}</p>

      <p className="text-center font-mono text-4xl font-bold tabular-nums">{value.toFixed(1)}</p>

      <FansComparison player={player} value={value} />

      <input
        type="range"
        min={1}
        max={10}
        step={0.5}
        value={value}
        onChange={(e) => onValueChange(Number(e.target.value))}
        className="mt-4 w-full accent-primary"
        aria-label="Rating value"
        aria-valuetext={`${value.toFixed(1)} out of 10`}
      />
      <div className="mt-1 flex justify-between text-xs text-muted-foreground">
        <span>1</span>
        <span>10</span>
      </div>

      <div className="mt-6 flex items-center gap-2">
        <Link
          href={`/player/${player.playerId}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          onClick={onClose}
        >
          <User className="size-4 shrink-0" aria-hidden />
          Player profile
        </Link>
        <div className="ml-auto flex gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="button" disabled={isSubmitting} onClick={() => onSubmit(value)}>
            {submitLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
