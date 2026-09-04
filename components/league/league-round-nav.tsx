"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { useRouter } from "nextjs-toploader/app"

import { OptionMenuSelect } from "@/components/ui/option-menu-select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { FixtureView } from "@/lib/catalog/types"
import { buildLeagueHref } from "@/lib/league/navigation"
import { buildLeagueRoundMenuGroups } from "@/lib/league/round-groups"

type LeagueRoundNavProps = {
  slug: string
  rounds: { name: string }[]
  activeRound: string
  view: FixtureView
}

const VIEW_TABS: { value: FixtureView; label: string }[] = [
  { value: "finished", label: "Results" },
  { value: "upcoming", label: "Upcoming" },
]

const arrowClass =
  "flex size-8 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:bg-muted/60 disabled:pointer-events-none disabled:opacity-40 md:size-7"

export function LeagueRoundNav({
  slug,
  rounds,
  activeRound,
  view,
}: LeagueRoundNavProps) {
  const router = useRouter()

  const activeIndex = rounds.findIndex((round) => round.name === activeRound)
  const prevRound = activeIndex > 0 ? rounds[activeIndex - 1] : null
  const nextRound =
    activeIndex >= 0 && activeIndex < rounds.length - 1
      ? rounds[activeIndex + 1]
      : null

  const menuGroups = buildLeagueRoundMenuGroups(rounds)

  function goToRound(round: string) {
    router.push(buildLeagueHref(slug, round, view))
  }

  function goToView(nextView: FixtureView) {
    if (nextView === view) return
    router.push(buildLeagueHref(slug, activeRound, nextView))
  }

  return (
    <div className="flex w-full flex-wrap items-center justify-between gap-3">
      <Tabs
        value={view}
        onValueChange={(nextView) => goToView(nextView as FixtureView)}
        className="w-auto gap-0"
      >
        <TabsList className="h-8">
          {VIEW_TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="text-xs">
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="flex min-w-0 items-center gap-2">
        <button
          type="button"
          className={arrowClass}
          onClick={() => prevRound && goToRound(prevRound.name)}
          disabled={!prevRound}
          aria-label="Previous round"
        >
          <ChevronLeft className="size-4" />
        </button>

        <OptionMenuSelect
          value={activeRound}
          onValueChange={goToRound}
          groups={menuGroups}
          ariaLabel="Select matchweek"
          triggerClassName="h-8 min-w-0 max-w-[14rem] text-xs md:text-[0.7rem] sm:max-w-[18rem]"
        />

        <button
          type="button"
          className={arrowClass}
          onClick={() => nextRound && goToRound(nextRound.name)}
          disabled={!nextRound}
          aria-label="Next round"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  )
}
