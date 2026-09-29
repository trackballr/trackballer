import Link from "next/link"

import { Card } from "@/components/ui/card"
import { TeamFlag } from "@/components/team-flag"
import { formatMatchScore } from "@/lib/match/score"
import type { PlayerProfile } from "@/lib/player/types"
import { cn } from "@/lib/utils"

type PlayerRecentMatchesProps = {
  profile: PlayerProfile
}

function formatOneDecimal(value: number | null): string {
  if (value == null || Number.isNaN(value)) return "—"
  return value.toFixed(1)
}

function formatKickoffShort(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "2-digit",
    timeZone: "UTC",
  }).format(new Date(iso))
}

export function PlayerRecentMatches({ profile }: PlayerRecentMatchesProps) {
  return (
    <section className="mb-8">
      <Card className="overflow-hidden">
        <div className="border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold">Recent matches</h2>
        </div>
        {profile.recentMatches.length === 0 ? (
          <p className="px-4 py-4 text-sm text-muted-foreground">No rated matches yet.</p>
        ) : (
          <ul className="divide-y divide-border">
            {profile.recentMatches.map((match) => {
              const { scoreline, statusLabel, isLive } = formatMatchScore({
                status_short: match.statusShort,
                kickoff_at: match.kickoffAt,
                home_goals_ft: match.homeGoalsFt,
                away_goals_ft: match.awayGoalsFt,
                home_goals_et: match.homeGoalsEt,
                away_goals_et: match.awayGoalsEt,
                home_goals_pen: match.homeGoalsPen,
                away_goals_pen: match.awayGoalsPen,
              })

              return (
                <li key={match.fixtureId}>
                  <Link
                    href={`/match/${match.fixtureId}`}
                    className="grid grid-cols-[1fr_auto_auto] gap-2 px-4 py-3 transition-colors hover:bg-muted/50"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1 text-sm font-semibold">
                        <TeamFlag team={match.homeTeam} size="sm" />
                        <span className="truncate">{match.homeTeam.name}</span>
                        <span className="text-muted-foreground">vs</span>
                        <TeamFlag team={match.awayTeam} size="sm" />
                        <span className="truncate">{match.awayTeam.name}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatKickoffShort(match.kickoffAt)}
                        {match.roundName ? ` · ${match.roundName}` : ""}
                      </p>
                    </div>
                    <div className="justify-self-center text-right">
                      <p className="font-mono text-sm font-semibold tabular-nums">{scoreline}</p>
                      <p
                        className={cn(
                          "text-[11px] font-semibold tracking-wide text-muted-foreground uppercase",
                          statusLabel.startsWith("PEN (") && "normal-case",
                          isLive && "text-primary",
                        )}
                      >
                        {statusLabel}
                      </p>
                    </div>
                    <div className="justify-self-end text-right">
                      <p className="font-mono text-sm font-semibold tabular-nums">
                        {formatOneDecimal(match.playerAvgRating)}
                      </p>
                      <p className="text-[11px] text-muted-foreground">avg</p>
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </Card>
    </section>
  )
}
