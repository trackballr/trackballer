import Link from "next/link"

import { TeamOfTheStageStrip } from "@/components/home/team-of-the-stage-strip"
import { LeagueFixturesList } from "@/components/league/league-fixtures-list"
import { LeagueRoundNav } from "@/components/league/league-round-nav"
import { LeagueStandingsPanel } from "@/components/league/league-standings-panel"
import type { FixtureView, FixtureWithTeams } from "@/lib/catalog/types"
import type { StandingsPayload } from "@/lib/catalog/standings-types"
import type { TeamOfTheStageView } from "@/lib/home/team-of-the-stage"

type LeagueHubContentProps = {
  slug: string
  activeRound: string
  rounds: { name: string }[]
  view: FixtureView
  fixtures: FixtureWithTeams[]
  standings: StandingsPayload | null
  totw?: TeamOfTheStageView | null
}

export function LeagueHubContent({
  slug,
  activeRound,
  rounds,
  view,
  fixtures,
  standings,
  totw = null,
}: LeagueHubContentProps) {
  return (
    <section className="min-w-0">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,65%)_minmax(0,35%)] lg:items-start">
        <div className="min-w-0 space-y-6">
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <LeagueRoundNav
              slug={slug}
              rounds={rounds}
              activeRound={activeRound}
              view={view}
            />

            {fixtures.length > 0 ? (
              <LeagueFixturesList fixtures={fixtures} />
            ) : (
              <p className="body-sm border-t border-border px-6 py-8 text-center text-muted-foreground">
                {view === "finished"
                  ? "No finished matches in this round yet."
                  : "No upcoming matches in this round."}
              </p>
            )}
          </div>

          <p className="body-sm">
            <Link href="/" className="text-primary underline-offset-4 hover:underline">
              Back to home
            </Link>
          </p>

          {totw ? (
            <TeamOfTheStageStrip
              team={totw}
              showWorldCupLink={false}
              sectionId="totw"
            />
          ) : null}
        </div>

        <aside className="min-w-0 lg:sticky lg:top-20 lg:self-start">
          <LeagueStandingsPanel data={standings} />
        </aside>
      </div>
    </section>
  )
}
