import Link from "next/link"
import { notFound, redirect } from "next/navigation"

import { LeagueFixturesList } from "@/components/league/league-fixtures-list"
import { LeaguePageHeader } from "@/components/league/league-page-header"
import { LeagueRoundNav } from "@/components/league/league-round-nav"
import { LeagueStandingsPanel } from "@/components/league/league-standings-panel"
import { TeamOfTheWeekComingSoon } from "@/components/league/team-of-the-week-coming-soon"
import { getT5SeasonYear } from "@/lib/catalog/config"
import {
  getCurrentRoundName,
  getLeagueCatalogContext,
  getRoundFixtures,
} from "@/lib/catalog/fixtures"
import { getTopLeagueBySlug, isTopLeagueSlug } from "@/lib/catalog/top-leagues"
import type { FixtureView } from "@/lib/catalog/types"
import { getLeagueBySlug } from "@/lib/league/detail"
import { getLeagueStandings } from "@/lib/league/standings"
import {
  wcHubContentGridClass,
  wcHubFixturesAreaClass,
  wcHubSidebarAreaClass,
  wcHubStandingsAreaClass,
} from "@/lib/world-cup/layout"

type PageProps = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ round?: string; view?: string }>
}

export default async function LeaguePage({ params, searchParams }: PageProps) {
  const { slug } = await params
  const { round: roundParam, view: viewParam } = await searchParams

  if (slug === "world-cup") {
    redirect("/league/premier-league")
  }

  if (!isTopLeagueSlug(slug)) {
    const league = await getLeagueBySlug(slug)
    if (!league) notFound()
    redirect("/league/premier-league")
  }

  const topLeague = getTopLeagueBySlug(slug)!
  const league = await getLeagueBySlug(slug)
  const seasonYear = getT5SeasonYear()
  const { season, rounds } = await getLeagueCatalogContext(topLeague.id, seasonYear)

  if (!season || rounds.length === 0) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <p className="eyebrow mb-3">{topLeague.country}</p>
        <h1 className="h-display mb-2">{topLeague.name}</h1>
        <p className="body-sm text-muted-foreground">
          Fixtures are not available yet. Check back once the season is synced.
        </p>
        <TeamOfTheWeekComingSoon leagueSlug={slug} />
        <p className="body-sm mt-8">
          <Link href="/" className="text-primary underline-offset-4 hover:underline">
            Back to home
          </Link>
        </p>
      </div>
    )
  }

  const view: FixtureView = viewParam === "finished" ? "finished" : "upcoming"
  const requestedRound = roundParam ? decodeURIComponent(roundParam) : undefined
  const isKnownRound =
    requestedRound != null && rounds.some((round) => round.name === requestedRound)
  const activeRound = isKnownRound
    ? requestedRound
    : ((await getCurrentRoundName(season.id)) ?? rounds[0].name)

  const [fixtures, standings] = await Promise.all([
    getRoundFixtures(season.id, activeRound, { view }),
    getLeagueStandings(topLeague.id, seasonYear),
  ])

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <p className="eyebrow mb-3">{topLeague.country}</p>

      <LeaguePageHeader
        name={league?.name ?? topLeague.name}
        country={league?.country ?? topLeague.country}
        logoUrl={league?.logoUrl ?? null}
        activeRound={activeRound}
      />

      <section className="min-w-0">
        <div className={wcHubContentGridClass}>
          <div className={wcHubFixturesAreaClass}>
            <h2 className="h3 mb-3">Matches</h2>
            <LeagueRoundNav
              slug={slug}
              rounds={rounds}
              activeRound={activeRound}
              view={view}
            />

            <div className="mt-4">
              {fixtures.length > 0 ? (
                <LeagueFixturesList fixtures={fixtures} />
              ) : (
                <p className="body-sm rounded-lg border border-border bg-card px-6 py-8 text-center text-muted-foreground">
                  {view === "finished"
                    ? "No finished matches in this round yet."
                    : "No upcoming matches in this round."}
                </p>
              )}
            </div>
          </div>

          <aside className={wcHubSidebarAreaClass}>
            <LeagueStandingsPanel
              data={standings}
              variant="sidebar"
              className={wcHubStandingsAreaClass}
            />
          </aside>
        </div>
      </section>

      <div className="mt-10">
        <TeamOfTheWeekComingSoon leagueSlug={slug} />
      </div>

      <p className="body-sm mt-8">
        <Link href="/" className="text-primary underline-offset-4 hover:underline">
          Back to home
        </Link>
      </p>
    </div>
  )
}
