"use client"

import { LineupPlayerNode } from "@/components/match/lineup-player-node"
import { buildFormationRows, type FormationRow } from "@/lib/match/formation"
import type { MatchLineupPlayer } from "@/lib/match/types"
import { cn } from "@/lib/utils"

type LineupSingleTeamPitchProps = {
  starters: MatchLineupPlayer[]
  side: "home" | "away"
  onPlayerClick?: (player: MatchLineupPlayer) => void
  ratingsLocked?: boolean
  className?: string
}

function FormationLineRow({
  row,
  locked,
  onPlayerClick,
}: {
  row: FormationRow
  locked: boolean
  onPlayerClick?: (player: MatchLineupPlayer) => void
}) {
  const players = row.players

  return (
    <div
      className="grid w-full items-start justify-items-center gap-x-1"
      style={{ gridTemplateColumns: `repeat(${players.length}, minmax(0, 1fr))` }}
    >
      {players.map((player) => (
        <LineupPlayerNode
          key={player.playerId}
          player={player}
          locked={locked}
          onClick={onPlayerClick}
          avatarSize="md"
        />
      ))}
    </div>
  )
}

function SingleTeamPitchMarkings() {
  return (
    <>
      {/* Outer boundary — square corners so the halfway line meets the sides cleanly */}
      <div className="pointer-events-none absolute inset-2 border border-primary/30" />
      {/* Halfway line (top of this half) */}
      <div className="pointer-events-none absolute inset-x-2 top-2 h-px bg-primary/30" />
      {/* Centre circle straddling the halfway line + centre spot */}
      <div className="pointer-events-none absolute left-1/2 top-2 size-16 -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/30" />
      <div className="pointer-events-none absolute left-1/2 top-2 size-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/40" />
      {/* Penalty box + goal area at the keeper's end (bottom) */}
      <div className="pointer-events-none absolute bottom-2 left-1/2 h-[18%] w-3/5 -translate-x-1/2 rounded-t-md border border-b-0 border-primary/30" />
      <div className="pointer-events-none absolute bottom-2 left-1/2 h-[8%] w-2/5 -translate-x-1/2 rounded-t-sm border border-b-0 border-primary/30" />
    </>
  )
}

export function LineupSingleTeamPitch({
  starters,
  side,
  onPlayerClick,
  ratingsLocked = false,
  className,
}: LineupSingleTeamPitchProps) {
  const teamStarters = starters.filter((p) => p.side === side)
  const rows = [...buildFormationRows(teamStarters)].reverse()

  return (
    <div
      className={cn(
        "relative flex min-h-[28rem] w-full flex-col justify-evenly gap-y-3 overflow-hidden rounded-xl border border-[color-mix(in_oklch,var(--pitch-line),transparent_30%)] bg-[var(--pitch)] px-2 py-4",
        className,
      )}
    >
      <SingleTeamPitchMarkings />
      {rows.map((row) => (
        <FormationLineRow
          key={row.row}
          row={row}
          locked={ratingsLocked}
          onPlayerClick={onPlayerClick}
        />
      ))}
    </div>
  )
}
