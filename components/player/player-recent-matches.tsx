import Link from "next/link"

import { RatingChip } from "@/components/rating/rating-chip"
import { TeamFlag } from "@/components/team-flag"
import { Panel, PanelEmpty, PanelHeader, PanelList } from "@/components/ui/panel"
import { formatMatchScore } from "@/lib/match/score"
import type { PlayerProfile } from "@/lib/player/types"
import { formatFixtureRoundLabel } from "@/lib/world-cup/round-label"
import { cn } from "@/lib/utils"

type PlayerRecentMatchesProps = {
  profile: PlayerProfile
}

function formatKickoffDay(iso: string): { day: string; month: string } {
  const date = new Date(iso)
  return {
    day: new Intl.DateTimeFormat("en-GB", { day: "numeric", timeZone: "UTC" }).format(date),
    month: new Intl.DateTimeFormat("en-GB", { month: "short", timeZone: "UTC" }).format(date),
  }
}

/** Rows: date block, both teams, score and status, then the fans' rating for this player. */
export function PlayerRecentMatches({ profile }: PlayerRecentMatchesProps) {
  return (
    <Panel>
      <PanelHeader title="Recent matches" description="Fans' average rating for each game." />
      {profile.recentMatches.length === 0 ? (
        <PanelEmpty>No rated matches yet.</PanelEmpty>
      ) : (
        <PanelList className="mb-1">
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
            const { day, month } = formatKickoffDay(match.kickoffAt)
            const round = match.roundName
              ? (formatFixtureRoundLabel(match.roundName) ?? match.roundName)
              : null

            return (
              <Link
                key={match.fixtureId}
                href={`/match/${match.fixtureId}`}
                className="group flex items-center gap-4 py-3"
              >
                <span className="flex w-9 shrink-0 flex-col items-center leading-none">
                  <span className="font-display text-lg font-bold tabular-nums">{day}</span>
                  <span className="mt-0.5 text-[11px] font-medium text-muted-foreground uppercase">
                    {month}
                  </span>
                </span>

                <span className="min-w-0 flex-1">
                  {/* Phones: one team per line. Wider screens: "Home vs Away" on one line. */}
                  <span className="flex min-w-0 flex-col gap-1 text-sm font-semibold group-hover:underline sm:flex-row sm:items-center sm:gap-1.5">
                    <span className="flex min-w-0 items-center gap-1.5">
                      <TeamFlag team={match.homeTeam} size="sm" />
                      <span className="truncate">{match.homeTeam.name}</span>
                    </span>
                    <span className="hidden shrink-0 font-normal text-muted-foreground sm:inline">
                      vs
                    </span>
                    <span className="flex min-w-0 items-center gap-1.5">
                      <TeamFlag team={match.awayTeam} size="sm" />
                      <span className="truncate">{match.awayTeam.name}</span>
                    </span>
                  </span>
                  {round ? (
                    <span className="mt-0.5 hidden truncate text-xs text-muted-foreground sm:block">
                      {round}
                    </span>
                  ) : null}
                </span>

                <span className="w-14 shrink-0 text-center leading-tight">
                  <span className="block text-sm font-semibold tabular-nums">{scoreline}</span>
                  <span
                    className={cn(
                      "block text-[11px] font-medium text-muted-foreground uppercase",
                      statusLabel.startsWith("PEN (") && "normal-case",
                      isLive && "text-primary",
                    )}
                  >
                    {statusLabel}
                  </span>
                </span>

                <RatingChip
                  value={match.playerAvgRating}
                  size="md"
                  className="w-11 shrink-0 justify-center"
                />
              </Link>
            )
          })}
        </PanelList>
      )}
    </Panel>
  )
}
