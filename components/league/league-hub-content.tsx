import { LeagueFixturesList } from "@/components/league/league-fixtures-list"
import { LeaguePageHeader } from "@/components/league/league-page-header"
import { LeagueRoundNav } from "@/components/league/league-round-nav"
import { LeagueStandingsPanel } from "@/components/league/league-standings-panel"
import type { FixtureView, FixtureWithTeams } from "@/lib/catalog/types"
import type { StandingsPayload } from "@/lib/catalog/standings-types"
import {
  wcHubContentGridClass,
  wcHubFixturesAreaClass,
  wcHubSidebarAreaClass,
  wcHubStandingsAreaClass,
} from "@/lib/world-cup/layout"

type LeagueHubContentProps = {
  slug: string
  name: string
  country: string | null
  logoUrl: string | null
  activeRound: string
  rounds: { name: string }[]
  view: FixtureView
  fixtures: FixtureWithTeams[]
  standings: StandingsPayload | null
}

export function LeagueHubContent({
  slug,
  name,
  country,
  logoUrl,
  activeRound,
  rounds,
  view,
  fixtures,
  standings,
}: LeagueHubContentProps) {
  return (
    <>
      <LeaguePageHeader
        name={name}
        country={country}
        logoUrl={logoUrl}
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
    </>
  )
}