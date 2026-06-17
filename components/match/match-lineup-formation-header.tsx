type MatchLineupFormationHeaderProps = {
  homeFormation: string | null
  awayFormation: string | null
}

export function MatchLineupFormationHeader({
  homeFormation,
  awayFormation,
}: MatchLineupFormationHeaderProps) {
  if (!homeFormation && !awayFormation) return null

  return (
    <div className="mb-3 grid grid-cols-[1fr_auto_1fr] items-baseline gap-3">
      <span className="truncate font-mono text-xs tabular-nums text-muted-foreground">
        {homeFormation ?? "?"}
      </span>
      <h2 className="h3 shrink-0 text-center">Lineups</h2>
      <span className="truncate text-right font-mono text-xs tabular-nums text-muted-foreground">
        {awayFormation ?? "?"}
      </span>
    </div>
  )
}
