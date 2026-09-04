import Link from "next/link"

import { TeamOfTheStageStrip } from "@/components/home/team-of-the-stage-strip"
import { WorldCupFixturesList } from "@/components/world-cup/world-cup-fixtures-list"
import { WorldCupPageHeader } from "@/components/world-cup/world-cup-page-header"
import { WorldCupRoundNav } from "@/components/world-cup/world-cup-round-nav"
import { WorldCupPlayerLeaders } from "@/components/world-cup/world-cup-player-leaders"
import { WorldCupStandingsPanel } from "@/components/world-cup/world-cup-standings-panel"
import { WorldCupTrendingMatchComments } from "@/components/world-cup/world-cup-trending-match-comments"
import { getServerAuth } from "@/lib/auth/server-session"
import { getCatalogLeagueId, getCatalogSeasonYear } from "@/lib/catalog/config"
import { getStandingsPayload } from "@/lib/catalog/standings-fetch"
import { getWorldCupPlayerLeaders } from "@/lib/world-cup/player-leaders"
import {
  getCurrentRoundName,
  getRoundFixtures,
  getWorldCupCatalogContext,
} from "@/lib/catalog/fixtures"
import { resolveRoundFixtureView } from "@/lib/catalog/fixture-view"
import type { FixtureView } from "@/lib/catalog/types"
import { getPublishedTeamOfTheStage } from "@/lib/home/team-of-the-stage"
import { getCompetitionStrip } from "@/lib/home/leagues"
import {
  wcHubCommentsAreaClass,
  wcHubContentGridClass,
  wcHubFixturesAreaClass,
  wcHubLeadersAreaClass,
  wcHubSidebarAreaClass,
  wcHubSidebarInnerGridClass,
  wcHubStandingsAreaClass,
} from "@/lib/world-cup/layout"
import { getTrendingMatchComments } from "@/lib/world-cup/trending-match-comments"
import { createClient } from "@/lib/supabase/server"

type PageProps = {
  searchParams: Promise<{ round?: string; view?: string }>
}

export default async function WorldCupPage({ searchParams }: PageProps) {
  const { round: roundParam, view: viewParam } = await searchParams
  const { season, rounds } = await getWorldCupCatalogContext()

  if (!season || rounds.length === 0) {
    return (
      <div className="w-full py-8">
        <p className="eyebrow mb-3 px-4 lg:ml-[5%] lg:px-0">FIFA World Cup</p>
        <div className="px-4 lg:ml-[5%] lg:w-[55%] lg:px-0">
          <h1 className="h-display mb-2">World Cup 2026</h1>
          <p className="body-sm text-muted-foreground">
            Fixtures are not available yet. Please check back soon.
          </p>
        </div>
      </div>
    )
  }

  const requestedRound = roundParam
    ? decodeURIComponent(roundParam)
    : undefined
  const isKnownRound =
    requestedRound != null && rounds.some((r) => r.name === requestedRound)
  const activeRound = isKnownRound
    ? requestedRound
    : ((await getCurrentRoundName(season.id)) ?? rounds[0].name)

  const view = await resolveRoundFixtureView(season.id, activeRound, viewParam)

  const supabase = await createClient()
  const auth = await getServerAuth(supabase)

  const [fixtures, totw, standings, playerLeaders, trendingMatchComments, competitionStrip] =
    await Promise.all([
      getRoundFixtures(season.id, activeRound, { view }),
      getPublishedTeamOfTheStage(),
      getStandingsPayload(getCatalogLeagueId(), getCatalogSeasonYear()),
      getWorldCupPlayerLeaders(season.id),
      getTrendingMatchComments(season.id),
      getCompetitionStrip(),
    ])

  const wcLogoUrl = competitionStrip.featured.logoUrl

  return (
    <div className="w-full py-8">
      <p className="eyebrow mb-3 px-4 lg:ml-[5%] lg:px-0">INTERNATIONAL</p>

      <div className="px-4 lg:ml-[5%] lg:px-0 lg:pr-[5%]">
        <WorldCupPageHeader logoUrl={wcLogoUrl} activeRound={activeRound} />

        <section className="min-w-0">
          <div className={wcHubContentGridClass}>
            <div className={wcHubFixturesAreaClass}>
              <h2 className="h3 mb-3">Matches</h2>
              <WorldCupRoundNav
                rounds={rounds}
                activeRound={activeRound}
                view={view}
              />

              <div className="mt-4">
                {fixtures.length > 0 ? (
                  <WorldCupFixturesList fixtures={fixtures} />
                ) : (
                  <p className="body-sm rounded-lg border border-border bg-card px-6 py-8 text-center text-muted-foreground">
                    {view === "finished"
                      ? "No matches have finished in this round yet."
                      : "No upcoming matches in this round."}
                  </p>
                )}
              </div>
            </div>

            <aside className={wcHubSidebarAreaClass}>
              <div className={wcHubSidebarInnerGridClass}>
                <WorldCupPlayerLeaders
                  leaders={playerLeaders}
                  variant="sidebar"
                  className={wcHubLeadersAreaClass}
                />

                <WorldCupTrendingMatchComments
                  comments={trendingMatchComments}
                  currentUserId={auth?.userId ?? null}
                  variant="sidebar"
                  className={wcHubCommentsAreaClass}
                />

                <WorldCupStandingsPanel
                  data={standings}
                  variant="sidebar"
                  className={wcHubStandingsAreaClass}
                />
              </div>
            </aside>
          </div>
        </section>
      </div>

      {totw ? (
        <section id="totw" className="mb-6 scroll-mt-8 px-4 lg:ml-[5%] lg:w-[55%] lg:px-0">
          <TeamOfTheStageStrip team={totw} showWorldCupLink={false} />
        </section>
      ) : null}

      <p className="body-sm mt-6 px-4 text-left lg:ml-[5%] lg:px-0">
        <Link href="/" className="text-primary underline-offset-4 hover:underline">
          Back to home
        </Link>
      </p>
    </div>
  )
}
