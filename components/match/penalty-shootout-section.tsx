import { Check, X } from "lucide-react"

import type { PenaltyKick, PenaltyShootout } from "@/lib/match/types"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type PenaltyShootoutSectionProps = {
  shootout: PenaltyShootout
  className?: string
}

function SummaryCircle({
  index,
  result,
}: {
  index: number
  result: boolean | null
}) {
  const base =
    "flex size-8 items-center justify-center rounded-full text-xs font-bold tabular-nums md:size-9"

  if (result === null) {
    return (
      <span className={cn(base, "border border-border bg-muted/50 text-muted-foreground")}>
        {index}
      </span>
    )
  }

  if (result) {
    return (
      <span className={cn(base, "bg-emerald-500 text-white")}>{index}</span>
    )
  }

  return (
    <span className={cn(base, "bg-destructive text-white")}>{index}</span>
  )
}

function KickSummaryRow({
  kicks,
}: {
  kicks: (boolean | null)[]
}) {
  return (
    <div className="flex items-center justify-center gap-1.5 md:gap-2">
      {kicks.map((result, i) => (
        <SummaryCircle key={i} index={i + 1} result={result} />
      ))}
    </div>
  )
}

function shortName(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length <= 1) return name
  const last = parts[parts.length - 1] ?? name
  const first = parts[0]
  if (!first) return last
  return `${first[0]}. ${last}`
}

function RunningScore({ kick }: { kick: PenaltyKick }) {
  const homeClass = kick.scored && kick.side === "home" ? "text-emerald-600" : "text-muted-foreground"
  const awayClass = kick.scored && kick.side === "away" ? "text-emerald-600" : "text-muted-foreground"

  return (
    <span className="font-mono text-xs tabular-nums text-muted-foreground">
      (<span className={homeClass}>{kick.homeScoreAfter}</span>
      {" - "}
      <span className={awayClass}>{kick.awayScoreAfter}</span>)
    </span>
  )
}

function TimelineRow({ kick }: { kick: PenaltyKick }) {
  const isHome = kick.side === "home"
  const icon = (
    <span
      className={cn(
        "flex size-7 shrink-0 items-center justify-center rounded-md border",
        kick.scored
          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600"
          : "border-destructive/40 bg-destructive/10 text-destructive",
      )}
      aria-hidden
    >
      {kick.scored ? <Check className="size-4" /> : <X className="size-4" />}
    </span>
  )

  const label = (
    <span className="min-w-0 truncate text-sm font-semibold">
      {shortName(kick.playerName)}{" "}
      <RunningScore kick={kick} />
    </span>
  )

  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 py-2">
      <div className={cn("min-w-0 text-right", !isHome && "invisible")}>
        {isHome ? label : null}
      </div>
      <div className="flex justify-center">{icon}</div>
      <div className={cn("min-w-0 text-left", isHome && "invisible")}>
        {!isHome ? label : null}
      </div>
    </div>
  )
}

export function PenaltyShootoutSection({
  shootout,
  className,
}: PenaltyShootoutSectionProps) {
  return (
    <Card className={cn("mb-6 overflow-hidden px-4 py-4 md:px-6", className)}>
      <h2 className="mb-4 text-center text-sm font-semibold">Penalty-shootout</h2>

      <div className="mb-5 flex items-center justify-center gap-3 md:gap-6">
        <KickSummaryRow kicks={shootout.homeKicks} />
        <div className="h-8 w-px shrink-0 bg-border" aria-hidden />
        <KickSummaryRow kicks={shootout.awayKicks} />
      </div>

      <div className="divide-y divide-border/60">
        {shootout.sequence.map((kick) => (
          <TimelineRow key={`${kick.sequenceOrder}-${kick.playerId}`} kick={kick} />
        ))}
      </div>
    </Card>
  )
}
