import Link from "next/link"
import { notFound } from "next/navigation"

import { CountryMatchesPanel } from "@/components/country/country-matches-panel"
import { CountryPageHeader } from "@/components/country/country-page-header"
import { CountrySquadPanel } from "@/components/country/country-squad-panel"
import { getWorldCupSeason } from "@/lib/catalog/fixtures"
import { getNationalTeamProfile } from "@/lib/country/detail"
import { getTeamFixtures } from "@/lib/country/fixtures"
import { parseCountryPageParams } from "@/lib/country/query"
import { browsePlayers } from "@/lib/search/browse-players"

type PageProps = {
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function CountryPage({ params, searchParams }: PageProps) {
  const { id } = await params
  const teamId = Number(id)

  if (!Number.isFinite(teamId) || teamId <= 0) {
    notFound()
  }

  const rawSearchParams = await searchParams
  const pageParams = parseCountryPageParams(rawSearchParams)

  const team = await getNationalTeamProfile(teamId)
  if (!team) {
    notFound()
  }

  const season = await getWorldCupSeason()

  const [fixtures, squadResult] = await Promise.all([
    season
      ? getTeamFixtures(season.id, teamId, pageParams.view)
      : Promise.resolve([]),
    browsePlayers({
      q: null,
      nationalTeamId: teamId,
      position: null,
      clubId: null,
      leagueSlug: "world-cup",
      ageMin: null,
      ageMax: null,
      minRating: null,
      sort: pageParams.sort,
      page: pageParams.page,
    }),
  ])

  return (
    <div className="w-full py-8">
      <p className="eyebrow mb-3 px-4 lg:ml-[5%] lg:px-0">National team</p>

      <div className="px-4 lg:ml-[5%] lg:px-0 lg:pr-[5%]">
        <CountryPageHeader name={team.name} logoUrl={team.logoUrl} code={team.code} />

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-start">
          <CountryMatchesPanel teamId={teamId} view={pageParams.view} fixtures={fixtures} />
          <CountrySquadPanel teamId={teamId} pageParams={pageParams} result={squadResult} />
        </section>
      </div>

      <p className="body-sm mt-6 px-4 text-left lg:ml-[5%] lg:px-0">
        <Link href="/world-cup" className="text-primary underline-offset-4 hover:underline">
          Back to World Cup
        </Link>
      </p>
    </div>
  )
}
