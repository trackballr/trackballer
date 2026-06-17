"use client"

import Link from "next/link"

import { TeamFlag } from "@/components/team-flag"
import { useMounted } from "@/hooks/use-mounted"
import type { YourTeamTodayItem } from "@/lib/home/types"
import { formatMatchKickoffLocal } from "@/lib/match/score"
import { formatFixtureRoundLabel } from "@/lib/world-cup/round-label"

type YourTeamTodayProps = {
  items: YourTeamTodayItem[]
}

export function YourTeamToday({ items }: YourTeamTodayProps) {
  const mounted = useMounted()

  if (items.length === 0) return null

  return (
    <section className="rounded-lg border border-primary/30 bg-primary/5 p-4">
      <h2 className="mb-3 text-sm font-semibold">Your teams today</h2>
      <ul className="space-y-3">
        {items.map((item) => {
          const roundLabel = formatFixtureRoundLabel(item.roundName)

          return (
            <li key={`${item.fixtureId}-${item.teamName}`}>
              <Link
                href={`/match/${item.fixtureId}`}
                className="flex items-center gap-3 rounded-sm p-2 transition-colors hover:bg-primary/10"
              >
                {item.teamLogoUrl ? (
                  <TeamFlag
                    team={{
                      name: item.teamName,
                      logo_url: item.teamLogoUrl,
                      code: item.teamName.slice(0, 3),
                    }}
                    size="md"
                    variant="crest"
                  />
                ) : null}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {item.teamName} {item.isHome ? "vs" : "at"} {item.opponentName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    <time dateTime={item.kickoffAt}>
                      {mounted ? formatMatchKickoffLocal(item.kickoffAt) : "–"}
                    </time>
                    {roundLabel ? ` · ${roundLabel}` : ""}
                  </p>
                </div>
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
