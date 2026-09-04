import Link from "next/link"

import { CareerRing } from "@/components/player/career-ring"
import { positionDisplayLabel } from "@/lib/match/position-label"
import type { PlayerListItem } from "@/lib/search/types"
import { cn } from "@/lib/utils"

type PlayerResultRowProps = {
  player: PlayerListItem
  onSelect?: () => void
  className?: string
  /** Tighter row for header search dropdown. */
  dense?: boolean
}

function PlayerResultRowContent({
  player,
  dense = false,
}: {
  player: PlayerListItem
  dense?: boolean
}) {
  const positionLabel = positionDisplayLabel(player.position)
  const meta = [player.nationality, positionLabel, player.age != null ? String(player.age) : null]
    .filter(Boolean)
    .join(" · ")

  return (
    <>
      <CareerRing
        name={player.displayName}
        photoUrl={player.photoUrl}
        tier={player.tier}
        displayScore={player.displayScore}
        size={dense ? "mini" : "compact"}
        className="shrink-0"
      />
      <div className="min-w-0 flex-1">
        <p className={cn("truncate font-semibold", dense ? "text-xs" : "text-sm")}>
          {player.displayName}
        </p>
        {meta ? (
          <p className={cn("truncate text-muted-foreground", dense ? "text-[10px]" : "text-xs")}>
            {meta}
          </p>
        ) : null}
      </div>
    </>
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
  const layoutClass = dense
    ? "gap-2 px-3 py-1.5"
    : "gap-3 px-4 py-3"
  if (onSelect) {
    return (
      <button
        type="button"
        className={cn(rowClassName, layoutClass, className)}
        onMouseDown={(event) => event.preventDefault()}
        onClick={onSelect}
      >
        <PlayerResultRowContent player={player} dense={dense} />
      </button>
    )
  }

  return (
    <Link href={`/player/${player.id}`} className={cn(rowClassName, layoutClass, className)}>
      <PlayerResultRowContent player={player} dense={dense} />
    </Link>
  )
}
