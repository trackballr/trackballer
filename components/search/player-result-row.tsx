import Link from "next/link"

import { PlayerClubCrestBadge } from "@/components/player/player-club-crest-badge"
import { CareerRing } from "@/components/player/career-ring"
import { PlayerNationalityFlag } from "@/components/player/player-nationality-flag"
import { nationalityToAlpha2 } from "@/lib/country/nationality-alpha2"
import { positionDisplayLabel } from "@/lib/match/position-label"
import type { PlayerListItem } from "@/lib/search/types"
import { cn } from "@/lib/utils"

type PlayerResultRowProps = {
  player: PlayerListItem
  onSelect?: () => void
  className?: string
  /** Tighter row for the header search dropdown. */
  dense?: boolean
}

function PlayerMetaLine({ player, dense = false }: { player: PlayerListItem; dense?: boolean }) {
  const positionLabel = positionDisplayLabel(player.position)
  const ageLabel = player.age != null ? String(player.age) : null
  const hasFlag = nationalityToAlpha2(player.nationality) != null
  const hasPosition = Boolean(positionLabel)
  const hasAge = Boolean(ageLabel)

  if (!hasFlag && !hasPosition && !hasAge) return null

  return (
    <p
      className={cn(
        "flex min-w-0 items-center gap-1 text-muted-foreground",
        dense ? "text-[10px]" : "text-xs",
      )}
    >
      {hasFlag ? <PlayerNationalityFlag nationality={player.nationality} /> : null}
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

const rowClassName =
  "flex w-full items-center border-b border-border text-left transition-colors last:border-b-0 hover:bg-muted/30"

export function PlayerResultRow({
  player,
  onSelect,
  className,
  dense = false,
}: PlayerResultRowProps) {
  const content = (
    <>
      <div className="relative shrink-0">
        <CareerRing
          name={player.displayName}
          photoUrl={player.photoUrl}
          tier={player.tier}
          displayScore={player.displayScore}
          size="mini"
        />
        {!dense && player.clubTeam ? (
          <PlayerClubCrestBadge team={player.clubTeam} size="xs" />
        ) : null}
      </div>
      <div className="min-w-0 flex-1">
        <p className={cn("truncate font-semibold", dense ? "text-xs" : "text-sm")}>
          {player.displayName}
        </p>
        <PlayerMetaLine player={player} dense={dense} />
      </div>
    </>
  )

  const layoutClass = dense ? "gap-2 px-3 py-1" : "gap-2.5 px-3 py-1.5"

  if (onSelect) {
    return (
      <button
        type="button"
        className={cn(rowClassName, layoutClass, className)}
        onMouseDown={(event) => event.preventDefault()}
        onClick={onSelect}
      >
        {content}
      </button>
    )
  }

  return (
    <Link href={`/player/${player.id}`} className={cn(rowClassName, layoutClass, className)}>
      {content}
    </Link>
  )
}
