"use client"

import { LineupPlayerNode } from "@/components/match/lineup-player-node"
import { buildFormationRows, type FormationRow } from "@/lib/match/formation"
import type { MatchLineupPlayer } from "@/lib/match/types"
import { cn } from "@/lib/utils"

type LineupPitchProps = {
  starters: MatchLineupPlayer[]
  onPlayerClick?: (player: MatchLineupPlayer) => void
  ratingsLocked?: boolean
  className?: string
}

/** Each formation line is a vertical column (GK at the touchline). Desktop only. */
function FormationLineColumn({
  row,
  locked,
  onPlayerClick,
}: {
  row: FormationRow
  locked: boolean
  onPlayerClick?: (player: MatchLineupPlayer) => void
}) {
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center justify-evenly gap-2 py-1">
      {row.players.map((player) => (
        <LineupPlayerNode
          key={`${player.side}-${player.playerId}`}
          player={player}
          locked={locked}
          onClick={onPlayerClick}
        />
      ))}
    </div>
  )
}

function PitchMarkings() {
  return (
    <>
      {/* Outer boundary */}
      <div className="pointer-events-none absolute inset-3 rounded-lg border border-primary/30" />
      {/* Halfway line */}
      <div className="pointer-events-none absolute top-3 bottom-3 left-1/2 w-px -translate-x-1/2 bg-primary/30" />
      {/* Centre circle + spot */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 size-20 -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/30" />
      <div className="pointer-events-none absolute top-1/2 left-1/2 size-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/40" />
      {/* Penalty boxes (18-yard) */}
      <div className="pointer-events-none absolute top-1/2 left-3 h-[55%] w-[16%] -translate-y-1/2 rounded-sm border border-primary/30" />
      <div className="pointer-events-none absolute top-1/2 right-3 h-[55%] w-[16%] -translate-y-1/2 rounded-sm border border-primary/30" />
      {/* Goal areas (6-yard) */}
      <div className="pointer-events-none absolute top-1/2 left-3 h-[26%] w-[6%] -translate-y-1/2 rounded-sm border border-primary/30" />
      <div className="pointer-events-none absolute top-1/2 right-3 h-[26%] w-[6%] -translate-y-1/2 rounded-sm border border-primary/30" />
      {/* Penalty spots */}
      <div className="pointer-events-none absolute top-1/2 left-[11%] size-1 -translate-y-1/2 rounded-full bg-primary/40" />
      <div className="pointer-events-none absolute top-1/2 right-[11%] size-1 -translate-y-1/2 rounded-full bg-primary/40" />
      {/* Penalty arcs (the "D") at the box edge */}
      <div className="pointer-events-none absolute top-1/2 left-[calc(0.75rem_+_16%)] h-[22%] w-[5%] -translate-y-1/2 rounded-r-full border border-l-0 border-primary/30" />
      <div className="pointer-events-none absolute top-1/2 right-[calc(0.75rem_+_16%)] h-[22%] w-[5%] -translate-y-1/2 rounded-l-full border border-r-0 border-primary/30" />
    </>
  )
}

function TeamHalfHorizontal({
  rows,
  locked,
  onPlayerClick,
  className,
}: {
  rows: FormationRow[]
  locked: boolean
  onPlayerClick?: (player: MatchLineupPlayer) => void
  className?: string
}) {
  return (
    <div
      className={cn(
        "relative flex min-h-0 flex-1 flex-row items-stretch justify-evenly gap-0.5 px-1",
        className,
      )}
    >
      {rows.map((row) => (
        <FormationLineColumn
          key={row.row}
          row={row}
          locked={locked}
          onPlayerClick={onPlayerClick}
        />
      ))}
    </div>
  )
}

export function LineupPitch({
  starters,
  onPlayerClick,
  ratingsLocked = false,
  className,
}: LineupPitchProps) {
  const homeRows = buildFormationRows(starters.filter((p) => p.side === "home"))
  const awayRows = buildFormationRows(starters.filter((p) => p.side === "away"))
  const awayRowsHorizontal = [...awayRows].reverse()

  return (
    <div
      className={cn(
        "relative flex w-full flex-row overflow-hidden rounded-xl border border-[color-mix(in_oklch,var(--pitch-line),transparent_30%)] bg-[var(--pitch)]",
        "aspect-[16/10] min-h-[18rem]",
        className,
      )}
    >
      <PitchMarkings />

      <TeamHalfHorizontal
        rows={homeRows}
        locked={ratingsLocked}
        onPlayerClick={onPlayerClick}
        className="pl-2"
      />
      <TeamHalfHorizontal
        rows={awayRowsHorizontal}
        locked={ratingsLocked}
        onPlayerClick={onPlayerClick}
        className="pr-2"
      />
    </div>
  )
}
