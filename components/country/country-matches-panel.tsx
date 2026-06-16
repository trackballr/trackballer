import { WorldCupFixturesList } from "@/components/world-cup/world-cup-fixtures-list"
import type { FixtureView, FixtureWithTeams } from "@/lib/catalog/types"

import { CountryMatchesViewTabs } from "./country-matches-view-tabs"

type CountryMatchesPanelProps = {
  teamId: number
  view: FixtureView
  fixtures: FixtureWithTeams[]
}

export function CountryMatchesPanel({ teamId, view, fixtures }: CountryMatchesPanelProps) {
  return (
    <section className="min-w-0">
      <h2 className="h3 mb-3">Matches</h2>

      <CountryMatchesViewTabs teamId={teamId} view={view} />

      <div className="mt-4">
        {fixtures.length > 0 ? (
          <WorldCupFixturesList fixtures={fixtures} />
        ) : (
          <p className="body-sm rounded-lg border border-border bg-card px-6 py-8 text-center text-muted-foreground">
            {view === "finished"
              ? "No finished matches for this team yet."
              : "No upcoming matches scheduled for this team."}
          </p>
        )}
      </div>
    </section>
  )
}
