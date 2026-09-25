"use client"

import {
  PitchCardMarker,
  PitchIconMarker,
  PitchRatingMarker,
  PitchSubOffMarker,
} from "@/components/match/lineup-player-markers"
import { PlayerAvatar } from "@/components/player-avatar"
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

/** Face size on the pitch — 15% under the old 44px / 36px pucks. */
const avatarSizeClass = {
  md: "size-[1.875rem]",
  lg: "size-[2.375rem]",
} as const

type LineupPlayerNodeProps = {
  player: MatchLineupPlayer
  locked?: boolean
  onClick?: (player: MatchLineupPlayer) => void
  avatarSize?: "md" | "lg"
  className?: string
}

export function LineupPlayerNode({
  player,
  locked = false,
  onClick,
  avatarSize = "lg",
  className,
}: LineupPlayerNodeProps) {
  return (
    <button
      type="button"
      disabled={locked}
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
            "rounded-full border-2 border-white shadow-[0_1px_3px_rgb(0_0_0/0.18)] transition-transform dark:border-zinc-800",
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

      <span className="mt-1 max-w-full truncate text-[10px] font-medium leading-tight text-foreground">
        {player.shirtNumber != null && (
          <span className="mr-0.5 font-normal tabular-nums text-muted-foreground">
            {player.shirtNumber}
          </span>
        )}
        {shortName(player.name)}
      </span>
    </button>
  )
}
