"use client"

import { Children, useState, type ReactNode } from "react"

import { CatalogImage } from "@/components/catalog-image"
import { cn } from "@/lib/utils"

type LeagueTab = { id: number; name: string; logoUrl: string | null }

type HomeLeagueSwitcherProps = {
  leagues: LeagueTab[]
  /** One pre-rendered block per league, same order as `leagues`. */
  children: ReactNode
}

/**
 * Below lg the home matches show one league at a time behind pills, so the
 * block stays short on phones. On desktop every league is listed.
 */
export function HomeLeagueSwitcher({ leagues, children }: HomeLeagueSwitcherProps) {
  const [active, setActive] = useState(0)
  const blocks = Children.toArray(children)

  return (
    <div>
      <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] lg:hidden [&::-webkit-scrollbar]:hidden">
        {leagues.map((league, index) => (
          <button
            key={league.id}
            type="button"
            onClick={() => setActive(index)}
            aria-pressed={index === active}
            className={cn(
              "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-sm font-semibold transition-colors",
              index === active
                ? "bg-foreground text-background"
                : "bg-card text-foreground ring-1 ring-border hover:bg-muted",
            )}
          >
            {league.logoUrl ? (
              <CatalogImage
                src={league.logoUrl}
                alt=""
                width={16}
                height={16}
                className="size-4 object-contain"
              />
            ) : null}
            {league.name}
          </button>
        ))}
      </div>

      <div className="lg:space-y-5">
        {blocks.map((block, index) => (
          <div key={leagues[index]?.id ?? index} className={index === active ? "" : "hidden lg:block"}>
            {block}
          </div>
        ))}
      </div>
    </div>
  )
}
