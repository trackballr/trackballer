import Link from "next/link"
import { notFound, redirect } from "next/navigation"

import { CompetitionHubShell } from "@/components/competition/competition-hub-shell"
import { LeagueHubContent } from "@/components/league/league-hub-content"
import { LeaguePageHeader } from "@/components/league/league-page-header"
import { getT5SeasonYear } from "@/lib/catalog/config"
import {
  getCurrentRoundName,
  getLeagueCatalogContext,
  getRoundFixtures,
} from "@/lib/catalog/fixtures"
import { resolveRoundFixtureView } from "@/lib/catalog/fixture-view"
import { getCompetitionHubBySlug, isCompetitionHubSlug } from "@/lib/catalog/top-leagues"
import { getLeagueBySlug } from "@/lib/league/detail"
import { getLeagueStandings } from "@/lib/league/standings"
import { getPublishedTeamOfTheWeekForSeason } from "@/lib/home/team-of-the-stage"

type PageProps = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ round?: string; view?: string }>
}

function BackHomeLink() {
  return (
    <p className="body-sm mt-8">
      <Link href="/" className="text-primary underline-offset-4 hover:underline">
        Back to home
      </Link>
    </p>
  )
}

export default async function LeaguePage({ params, searchParams }: PageProps) {
  const { slug } = await params
  const { round: roundParam, view: viewParam } = await searchParams

  if (slug === "world-cup") {
    redirect("/league/premier-league")
  }

  if (!isCompetitionHubSlug(slug)) {
    const league = await getLeagueBySlug(slug)
    if (!league) notFound()
    redirect("/league/premier-league")
  }

  const hubLeague = getCompetitionHubBySlug(slug)!
  const league = await getLeagueBySlug(slug)
  const name = league?.name ?? hubLeague.name
  const country = league?.country ?? hubLeague.country
  const logoUrl = league?.logoUrl ?? null
  const header = (
    <LeaguePageHeader slug={slug} name={name} country={country} logoUrl={logoUrl} />
  )
  const seasonYear = getT5SeasonYear()
  const { season, rounds } = await getLeagueCatalogContext(hubLeague.id, seasonYear)

  if (!season || rounds.length === 0) {
    return (
      <CompetitionHubShell banner={header} footer={<BackHomeLink />}>
        <p className="body-sm text-muted-foreground">
          Fixtures are not available yet. Check back once the season is synced.
        </p>
      </CompetitionHubShell>
    )
  }

  const requestedRound = roundParam ? decodeURIComponent(roundParam) : undefined
  const isKnownRound =
    requestedRound != null && rounds.some((round) => round.name === requestedRound)
  const activeRound = isKnownRound
    ? requestedRound
    : ((await getCurrentRoundName(season.id)) ?? rounds[0].name)

  const view = await resolveRoundFixtureView(season.id, activeRound, viewParam)

  const [fixtures, standings, totw] = await Promise.all([
    getRoundFixtures(season.id, activeRound, { view }),
    getLeagueStandings(hubLeague.id, seasonYear),
    getPublishedTeamOfTheWeekForSeason(season.id),
  ])

  return (
    <CompetitionHubShell banner={header} footer={<BackHomeLink />}>
      <LeagueHubContent
        slug={slug}
        activeRound={activeRound}
        rounds={rounds}
        view={view}
        fixtures={fixtures}
        standings={standings}
        totw={totw}
      />
    </CompetitionHubShell>
  )
}
