import { CompetitionHubCardGrid } from "@/components/competition/competition-hub-card-grid"
import type { CompetitionHubCard } from "@/lib/catalog/competition-hub-cards"

type TotwCompetitionGridProps = {
  cards: CompetitionHubCard[]
}

export function TotwCompetitionGrid({ cards }: TotwCompetitionGridProps) {
  return (
    <section>
      <h1 className="h-display mb-2">Featured Competitions</h1>
      <p className="body-sm mb-6 text-muted-foreground">
        Pick a competition, then choose a matchday XI to publish.
      </p>

      <CompetitionHubCardGrid cards={cards} />
    </section>
  )
}
