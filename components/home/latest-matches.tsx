import Link from "next/link"

import { MatchRow } from "@/components/match-row"
import { MatchRowList } from "@/components/match/match-row-list"
import type { FixtureWithTeams } from "@/lib/catalog/types"

type LatestMatchesProps = {
  fixtures: FixtureWithTeams[]
}

export function LatestMatches({ fixtures }: LatestMatchesProps) {
  return (
    <section>
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="h3">Latest matches</h2>
        <Link
          href="/world-cup"
          className="text-xs font-medium text-primary hover:underline"
        >
          See all
        </Link>
      </div>

      {fixtures.length === 0 ? (
        <p className="body-sm rounded-lg border border-border bg-card p-4 text-muted-foreground">
          No recent matches yet.
        </p>
      ) : (
        <MatchRowList className="overflow-hidden rounded-lg border border-border bg-card lg:sticky lg:top-20">
          {fixtures.map((fixture) => (
            <MatchRow key={fixture.id} fixture={fixture} aligned showContext crestFlags />
          ))}
        </MatchRowList>
      )}
    </section>
  )
}
