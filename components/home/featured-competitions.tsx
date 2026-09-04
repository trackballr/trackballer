import { CompetitionHubCardGrid } from "@/components/competition/competition-hub-card-grid"
import type { CompetitionHubCard } from "@/lib/catalog/competition-hub-cards"

type FeaturedCompetitionsProps = {
  cards: CompetitionHubCard[]
}

export function FeaturedCompetitions({ cards }: FeaturedCompetitionsProps) {
  return (
    <section>
      <h2 className="h3 mb-4">Featured Competitions</h2>
      <CompetitionHubCardGrid cards={cards} />
    </section>
  )
}
