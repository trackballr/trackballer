import Link from "next/link"

import { MatchRow } from "@/components/match-row"
import { MatchRowList } from "@/components/match/match-row-list"
import type { FixtureWithTeams } from "@/lib/catalog/types"

type HomeWcMatchesProps = {
  recentFixtures: FixtureWithTeams[]
  upcomingFixtures: FixtureWithTeams[]
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
      <h3 className="mb-2 text-sm font-semibold text-foreground">{title}</h3>
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

export function HomeWcMatches({
  recentFixtures,
  upcomingFixtures,
}: HomeWcMatchesProps) {
  const hasRecent = recentFixtures.length > 0
  const hasUpcoming = upcomingFixtures.length > 0

  return (
    <section>
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="h3">Matches</h2>
        <Link
          href="/world-cup"
          className="text-xs font-medium text-primary hover:underline"
        >
          See all
        </Link>
      </div>

      {!hasRecent && !hasUpcoming ? (
        <p className="body-sm rounded-lg border border-border bg-card p-4 text-muted-foreground">
          No matches yet.
        </p>
      ) : (
        <div className="space-y-4">
          <MatchBlock title="Recent matches" fixtures={recentFixtures} />
          <MatchBlock title="Upcoming matches" fixtures={upcomingFixtures} localTime />
        </div>
      )}
    </section>
  )
}
