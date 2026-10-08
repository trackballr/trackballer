import Link from "next/link"

import { CareerRing } from "@/components/player/career-ring"
import { PlayerNationalityFlag } from "@/components/player/player-nationality-flag"
import { TeamFlag } from "@/components/team-flag"
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
  // The header dropdown stays flag-only; full rows show the club crest after the flag.
  const club = dense ? null : player.clubTeam
  const hasBadges = hasFlag || club != null
  const hasPosition = Boolean(positionLabel)
  const hasAge = Boolean(ageLabel)

  if (!hasBadges && !hasPosition && !hasAge) return null

  return (
    <p
      className={cn(
        "flex min-w-0 items-center gap-1 text-muted-foreground",
        dense ? "text-[10px]" : "text-xs",
      )}
    >
      {hasFlag ? <PlayerNationalityFlag nationality={player.nationality} /> : null}
      {club ? (
        <TeamFlag team={club} size="sm" variant="crest" className="size-4 shrink-0" />
      ) : null}
      {hasPosition ? (
        <>
          {hasBadges ? <span aria-hidden>·</span> : null}
          <span className="truncate">{positionLabel}</span>
        </>
      ) : null}
      {hasAge ? (
        <>
          {hasBadges || hasPosition ? <span aria-hidden>·</span> : null}
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
      <CareerRing
        name={player.displayName}
        photoUrl={player.photoUrl}
        tier={player.tier}
        displayScore={player.displayScore}
        size="mini"
        className="shrink-0"
      />
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
