import { ChevronRight } from "lucide-react"
import Link from "next/link"

import { CatalogImage } from "@/components/catalog-image"
import type { CompetitionHubCard } from "@/lib/catalog/competition-hub-cards"
import { getLeagueHubHeaderStyle } from "@/lib/league/hub-theme"

type FeaturedCompetitionsProps = {
  cards: CompetitionHubCard[]
}

/**
 * One tile per hub league in its brand colour — the same colours as the league
 * page banner and the match heading, so a league looks the same everywhere.
 */
export function CompetitionTile({ card }: { card: CompetitionHubCard }) {
  return (
    <Link
      href={card.href}
      style={getLeagueHubHeaderStyle(card.slug)}
      className="group relative flex items-center gap-3 overflow-hidden rounded-lg px-3.5 py-3.5 transition-[filter,translate] hover:-translate-y-0.5 hover:brightness-110"
    >
      {/* Soft light from the top-left so the flat colour has some depth. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_90%_at_0%_0%,rgb(255_255_255/0.18),transparent_60%)]"
      />
      <span className="relative flex size-11 shrink-0 items-center justify-center rounded-full bg-white shadow-sm">
        {card.logoUrl ? (
          <CatalogImage
            src={card.logoUrl}
            alt=""
            width={28}
            height={28}
            className="size-7 object-contain"
          />
        ) : (
          <span className="text-sm font-bold text-zinc-700">
            {card.name.slice(0, 2).toUpperCase()}
          </span>
        )}
      </span>
      <span className="relative min-w-0 flex-1">
        <span className="line-clamp-2 font-display text-[0.9375rem] leading-tight font-semibold">
          {card.name}
        </span>
        <span className="mt-0.5 block truncate text-xs opacity-75">{card.country}</span>
      </span>
      <ChevronRight
        aria-hidden
        className="relative size-4 shrink-0 opacity-70 transition-transform group-hover:translate-x-0.5"
      />
    </Link>
  )
}

export function FeaturedCompetitions({ cards }: FeaturedCompetitionsProps) {
  return (
    <section>
      <h2 className="h3 mb-3">Featured competitions</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <CompetitionTile key={card.slug} card={card} />
        ))}
      </div>
    </section>
  )
}
