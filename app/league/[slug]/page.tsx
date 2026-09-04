import Link from "next/link"
import { notFound, redirect } from "next/navigation"

import { CompetitionHubShell } from "@/components/competition/competition-hub-shell"
import { LeagueHubContent } from "@/components/league/league-hub-content"
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
      <CompetitionHubShell
        eyebrow={topLeague.country}
        footer={
          <p className="body-sm mt-8">
            <Link href="/" className="text-primary underline-offset-4 hover:underline">
              Back to home
            </Link>
          </p>
        }
      >
        <h1 className="h-display mb-2">{topLeague.name}</h1>
        <p className="body-sm text-muted-foreground">
          Fixtures are not available yet. Check back once the season is synced.
        </p>
        <div className="mt-10">
          <TeamOfTheWeekComingSoon leagueSlug={slug} />
        </div>
      </CompetitionHubShell>
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
    <CompetitionHubShell
      eyebrow={topLeague.country}
      footer={
        <p className="body-sm mt-8">
          <Link href="/" className="text-primary underline-offset-4 hover:underline">
            Back to home
          </Link>
        </p>
      }
    >
      <LeagueHubContent
        slug={slug}
        name={league?.name ?? topLeague.name}
        country={league?.country ?? topLeague.country}
        logoUrl={league?.logoUrl ?? null}
        activeRound={activeRound}
        rounds={rounds}
        view={view}
        fixtures={fixtures}
        standings={standings}
      />

      <div className="mt-10 lg:w-[55%]">
        <TeamOfTheWeekComingSoon leagueSlug={slug} />
      </div>
    </CompetitionHubShell>
  )
}
