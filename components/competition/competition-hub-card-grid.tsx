import Link from "next/link"

import { CatalogImage } from "@/components/catalog-image"
import type { CompetitionHubCard } from "@/lib/catalog/competition-hub-cards"

type CompetitionHubCardGridProps = {
  cards: CompetitionHubCard[]
}

export function CompetitionHubCardGrid({ cards }: CompetitionHubCardGridProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => (
        <Link
          key={card.slug}
          href={card.href}
          className="flex flex-col items-center rounded-lg border border-border bg-card px-4 py-6 text-center shadow-sm transition-colors hover:bg-muted/40"
        >
          <span className="mb-3 flex size-16 items-center justify-center">
            {card.logoUrl ? (
              <CatalogImage
                src={card.logoUrl}
                alt=""
                width={56}
                height={56}
                className="size-14 object-contain"
              />
            ) : (
              <span className="text-lg font-bold text-muted-foreground">
                {card.name.slice(0, 2).toUpperCase()}
              </span>
            )}
          </span>
          <p className="text-sm font-semibold">{card.name}</p>
          <p className="mt-1 text-xs text-muted-foreground">{card.country}</p>
        </Link>
      ))}
    </div>
  )
}
