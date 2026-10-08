"use client"

import {
  PitchCardMarker,
  PitchIconMarker,
  PitchRatingMarker,
  PitchSubOffMarker,
} from "@/components/match/lineup-player-markers"
import { Flame } from "lucide-react"

import { PlayerAvatar } from "@/components/player-avatar"
import { isHotTake } from "@/components/rating/rating-panel"
import type { MatchLineupPlayer } from "@/lib/match/types"
import { cn } from "@/lib/utils"

const ASSIST_ICON = "/american-football-black-shoe-svgrepo-com.svg"
const GOAL_ICON = "/football-svgrepo-com.svg"

function shortName(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length <= 1) return name
  const last = parts[parts.length - 1] ?? name
  const first = parts[0]
  if (!first) return last
  return `${first[0]}. ${last}`
}

/** Faces stay small enough that a back five and the keeper still fit on one pitch. */
const avatarSizeClass = {
  sm: "size-6",
  md: "size-7",
  lg: "size-8",
} as const

type LineupPlayerNodeProps = {
  player: MatchLineupPlayer
  locked?: boolean
  onClick?: (player: MatchLineupPlayer) => void
  avatarSize?: "sm" | "md" | "lg"
  className?: string
}

export function LineupPlayerNode({
  player,
  locked = false,
  onClick,
  avatarSize = "lg",
  className,
}: LineupPlayerNodeProps) {
  const rated = player.userRating != null
  const hot = isHotTake(player.userRating, player.communityAvg)
  const comparison =
    rated && player.communityAvg != null
      ? `You ${player.userRating!.toFixed(1)} · Fans ${player.communityAvg.toFixed(1)}`
      : undefined

  return (
    <button
      type="button"
      disabled={locked}
      title={comparison}
      onClick={() => onClick?.(player)}
      className={cn(
        "group flex w-full min-w-0 flex-col items-center px-0.5 text-center",
        locked ? "cursor-default" : "cursor-pointer",
        className,
      )}
    >
      <span className="relative inline-flex shrink-0">
        <PlayerAvatar
          name={player.name}
          photoUrl={player.photoUrl}
          shirtNumber={player.shirtNumber}
          size={avatarSize}
          className={cn(
            "rounded-full border-2 shadow-[0_1px_3px_rgb(0_0_0/0.18)] transition-transform",
            rated ? "border-primary" : "border-white dark:border-zinc-800",
            !locked && "group-hover:scale-105",
            avatarSizeClass[avatarSize],
          )}
        />

        {/* Left edge: subbed off (top), card (middle), assist (bottom) */}
        <span className="pointer-events-none absolute -top-1 -bottom-1 right-[calc(100%-8px)] z-20 flex flex-col items-center justify-between">
          <span className="flex h-3.5 items-center">
            <PitchSubOffMarker minute={player.subOffMinute} />
          </span>
          <span className="flex h-3.5 items-center">
            <PitchCardMarker yellow={player.yellowCardCount} red={player.redCardCount} />
          </span>
          <span className="flex h-3.5 items-center">
            <PitchIconMarker iconSrc={ASSIST_ICON} label="assist" count={player.assistCount} />
          </span>
        </span>

        {/* Right edge: rating (top), goals (bottom) */}
        <span className="pointer-events-none absolute -top-1.5 -bottom-1 left-[calc(100%-12px)] z-20 flex flex-col items-start justify-between">
          <span className="flex h-4 items-center">
            <PitchRatingMarker value={player.communityAvg} />
          </span>
          <span className="ml-1 flex h-3.5 items-center">
            <PitchIconMarker iconSrc={GOAL_ICON} label="goal" count={player.goalCount} />
          </span>
        </span>
      </span>

      <span
        className={cn(
          "mt-0.5 inline-flex max-w-full items-center gap-0.5 font-semibold leading-tight text-white [text-shadow:0_1px_2px_rgb(0_0_0/0.45)]",
          avatarSize === "sm" ? "text-[9px]" : "text-[10px]",
        )}
      >
        {hot ? (
          <Flame className="size-2.5 shrink-0 text-orange-300" aria-label="Hot take" />
        ) : null}
        <span className="min-w-0 truncate">
          {player.shirtNumber != null && (
            <span className="mr-0.5 font-normal tabular-nums text-white/75">
              {player.shirtNumber}
            </span>
          )}
          {shortName(player.name)}
        </span>
      </span>
    </button>
  )
}
