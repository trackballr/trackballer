import Link from "next/link"

import { MatchRow } from "@/components/match-row"
import { MatchRowList } from "@/components/match/match-row-list"
import type { LeagueHomeMatches } from "@/lib/home/league-matches"
import type { FixtureWithTeams } from "@/lib/catalog/types"

type HomeLeagueMatchesProps = {
  leagues: LeagueHomeMatches[]
  variant?: "default" | "sidebar"
}

function MatchBlock({
  title,
  fixtures,
  localTime,
}: {
  title: string
  fixtures: FixtureWithTeams[]
  localTime?: boolean
}) {
  if (fixtures.length === 0) return null

  return (
    <div>
      <h4 className="mb-2 text-sm font-semibold text-foreground">{title}</h4>
      <MatchRowList className="overflow-hidden rounded-lg border border-border bg-card">
        {fixtures.map((fixture) => (
          <MatchRow
            key={fixture.id}
            fixture={fixture}
            aligned
            compact
            localTime={localTime}
            showContext
            crestFlags
          />
        ))}
      </MatchRowList>
    </div>
  )
}

function LeagueBlock({ league, compact }: { league: LeagueHomeMatches; compact?: boolean }) {
  const hasRecent = league.recent.length > 0
  const hasUpcoming = league.upcoming.length > 0

  return (
    <section>
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h3 className={compact ? "text-sm font-semibold" : "text-base font-semibold"}>
          {league.name}
        </h3>
        <Link
          href={`/league/${league.slug}`}
          className="text-xs font-medium text-primary hover:underline"
        >
          See all
        </Link>
      </div>

      {!hasRecent && !hasUpcoming ? (
        <p className="body-sm rounded-lg border border-border bg-card p-4 text-muted-foreground">
          No fixtures yet — check back once the season is synced.
        </p>
      ) : (
        <div className="space-y-4">
          <MatchBlock title="Latest results" fixtures={league.recent} />
          <MatchBlock title="Upcoming" fixtures={league.upcoming} localTime />
        </div>
      )}
    </section>
  )
}

export function HomeLeagueMatches({ leagues, variant = "default" }: HomeLeagueMatchesProps) {
  const isSidebar = variant === "sidebar"

  return (
    <section>
      <h2 className={isSidebar ? "h3 mb-3" : "h3 mb-4"}>Matches</h2>
      <div className={isSidebar ? "space-y-6" : "space-y-8"}>
        {leagues.map((league) => (
          <LeagueBlock key={league.leagueId} league={league} compact={isSidebar} />
        ))}
      </div>
    </section>
  )
}
