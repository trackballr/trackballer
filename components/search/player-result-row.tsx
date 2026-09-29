import Link from "next/link"

import { PlayerClubCrestBadge } from "@/components/player/player-club-crest-badge"
import { CareerRing } from "@/components/player/career-ring"
import { PlayerNationalityFlag } from "@/components/player/player-nationality-flag"
import { positionDisplayLabel } from "@/lib/match/position-label"
import type { PlayerListItem } from "@/lib/search/types"
import { cn } from "@/lib/utils"

type PlayerResultRowProps = {
  player: PlayerListItem
  onSelect?: () => void
  className?: string
  /** Tighter row for header search dropdown. */
  dense?: boolean
  /** Grid tile on /players browse. */
  variant?: "list" | "card"
}

function PlayerMetaLine({
  player,
  dense = false,
  centered = false,
}: {
  player: PlayerListItem
  dense?: boolean
  centered?: boolean
}) {
  const positionLabel = positionDisplayLabel(player.position)
  const ageLabel = player.age != null ? String(player.age) : null
  const hasFlag = Boolean(player.nationality)
  const hasPosition = Boolean(positionLabel)
  const hasAge = Boolean(ageLabel)

  if (!hasFlag && !hasPosition && !hasAge) return null

  return (
    <p
      className={cn(
        "flex min-w-0 items-center gap-1 text-muted-foreground",
        centered ? "justify-center" : "",
        dense ? "text-[10px]" : "text-xs",
      )}
    >
      {hasFlag ? (
        <PlayerNationalityFlag nationality={player.nationality} size={dense ? "sm" : "sm"} />
      ) : null}
      {hasPosition ? (
        <>
          {hasFlag ? <span aria-hidden>·</span> : null}
          <span className="truncate">{positionLabel}</span>
        </>
      ) : null}
      {hasAge ? (
        <>
          {hasFlag || hasPosition ? <span aria-hidden>·</span> : null}
          <span className="shrink-0 tabular-nums">{ageLabel}</span>
        </>
      ) : null}
    </p>
  )
}

function PlayerResultRowContent({
  player,
  dense = false,
  variant = "list",
}: {
  player: PlayerListItem
  dense?: boolean
  variant?: "list" | "card"
}) {
  if (variant === "card") {
    return (
      <>
        <div className="relative shrink-0">
          <CareerRing
            name={player.displayName}
            photoUrl={player.photoUrl}
            tier={player.tier}
            displayScore={player.displayScore}
            compact
          />
          {player.clubTeam ? <PlayerClubCrestBadge team={player.clubTeam} /> : null}
        </div>
        <p className="line-clamp-2 w-full text-center text-xs font-semibold leading-tight">
          {player.displayName}
        </p>
        <PlayerMetaLine player={player} centered />
      </>
    )
  }

  return (
    <>
      <div className="relative shrink-0">
        <CareerRing
          name={player.displayName}
          photoUrl={player.photoUrl}
          tier={player.tier}
          displayScore={player.displayScore}
          size={dense ? "mini" : "compact"}
          className="shrink-0"
        />
        {!dense && player.clubTeam ? <PlayerClubCrestBadge team={player.clubTeam} /> : null}
      </div>
      <div className="min-w-0 flex-1">
        <p className={cn("truncate font-semibold", dense ? "text-xs" : "text-sm")}>
          {player.displayName}
        </p>
        <PlayerMetaLine player={player} dense={dense} />
      </div>
    </>
  )
}

const listRowClassName =
  "flex w-full items-center border-b border-border text-left transition-colors last:border-b-0 hover:bg-muted/30"

const cardClassName =
  "flex h-full min-w-0 flex-col items-center gap-2 rounded-lg border border-border bg-card p-3 text-left transition-colors hover:bg-muted/30"

export function PlayerResultRow({
  player,
  onSelect,
  className,
  dense = false,
  variant = "list",
}: PlayerResultRowProps) {
  const isCard = variant === "card"

  const layoutClass = isCard
    ? cardClassName
    : dense
      ? "gap-2 px-3 py-1.5"
      : "gap-3 px-4 py-3"

  const shellClass = isCard ? layoutClass : cn(listRowClassName, layoutClass)

  if (onSelect) {
    return (
      <button
        type="button"
        className={cn(shellClass, className)}
        onMouseDown={(event) => event.preventDefault()}
        onClick={onSelect}
      >
        <PlayerResultRowContent player={player} dense={dense} variant={variant} />
      </button>
    )
  }

  return (
    <Link href={`/player/${player.id}`} className={cn(shellClass, className)}>
      <PlayerResultRowContent player={player} dense={dense} variant={variant} />
    </Link>
  )
}
