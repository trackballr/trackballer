import Link from "next/link"

import { CatalogImage } from "@/components/catalog-image"
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
      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </p>
      <MatchRowList className="divide-y divide-border">
        {fixtures.map((fixture) => (
          <MatchRow
            key={fixture.id}
            fixture={fixture}
            aligned
            compact
            localTime={localTime}
            crestFlags
            className="border-0 px-0 py-2"
          />
        ))}
      </MatchRowList>
    </div>
  )
}

function LeagueHeader({
  league,
  compact,
}: {
  league: LeagueHomeMatches
  compact?: boolean
}) {
  return (
    <div className="mb-2 flex items-center justify-between gap-2 border-b border-border pb-2">
      <div className="flex min-w-0 items-center gap-2">
        {league.logoUrl ? (
          <CatalogImage
            src={league.logoUrl}
            alt=""
            width={20}
            height={20}
            className="size-5 shrink-0 object-contain"
          />
        ) : (
          <span className="flex size-5 shrink-0 items-center justify-center rounded-sm bg-muted text-[8px] font-bold text-muted-foreground">
            {league.name.slice(0, 2).toUpperCase()}
          </span>
        )}
        <h3
          className={
            compact
              ? "truncate text-xs font-semibold"
              : "truncate text-sm font-semibold"
          }
        >
          {league.name}
        </h3>
      </div>
      <Link
        href={`/league/${league.slug}`}
        className="shrink-0 text-[11px] font-medium text-primary hover:underline"
      >
        See all
      </Link>
    </div>
  )
}

function LeagueBlock({ league, compact }: { league: LeagueHomeMatches; compact?: boolean }) {
  const hasRecent = league.recent.length > 0
  const hasUpcoming = league.upcoming.length > 0

  if (!hasRecent && !hasUpcoming) return null

  return (
    <section>
      <LeagueHeader league={league} compact={compact} />
      <div className="space-y-3">
        <MatchBlock title="Latest results" fixtures={league.recent} />
        <MatchBlock title="Upcoming" fixtures={league.upcoming} localTime />
      </div>
    </section>
  )
}

export function HomeLeagueMatches({ leagues, variant = "default" }: HomeLeagueMatchesProps) {
  const isSidebar = variant === "sidebar"
  const visibleLeagues = leagues.filter(
    (league) => league.recent.length > 0 || league.upcoming.length > 0,
  )

  return (
    <section>
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h2 className="h3">Matches</h2>
      </div>

      {visibleLeagues.length === 0 ? (
        <p className="body-sm rounded-lg border border-border bg-card p-4 text-muted-foreground">
          No fixtures yet — check back once the season is synced.
        </p>
      ) : (
        <div className={isSidebar ? "space-y-5" : "space-y-8"}>
          {visibleLeagues.map((league) => (
            <LeagueBlock key={league.leagueId} league={league} compact={isSidebar} />
          ))}
        </div>
      )}
    </section>
  )
}
