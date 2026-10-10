import { CompetitionTile } from "@/components/home/featured-competitions"
import type { CompetitionHubCard } from "@/lib/catalog/competition-hub-cards"

type TotwCompetitionGridProps = {
  cards: CompetitionHubCard[]
}

/** Same brand-colour league tiles as the home page; each opens that league's editor. */
export function TotwCompetitionGrid({ cards }: TotwCompetitionGridProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => (
        <CompetitionTile key={card.slug} card={card} />
      ))}
    </div>
  )
}
