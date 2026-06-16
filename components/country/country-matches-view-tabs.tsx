"use client"

import { useRouter } from "nextjs-toploader/app"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { FixtureView } from "@/lib/catalog/types"
import { buildCountryHref } from "@/lib/country/query"

type CountryMatchesViewTabsProps = {
  teamId: number
  view: FixtureView
}

const VIEW_TABS: { value: FixtureView; label: string }[] = [
  { value: "finished", label: "Finished" },
  { value: "upcoming", label: "Upcoming" },
]

export function CountryMatchesViewTabs({ teamId, view }: CountryMatchesViewTabsProps) {
  const router = useRouter()

  function goToView(nextView: FixtureView) {
    if (nextView === view) return
    router.push(buildCountryHref(teamId, { view: nextView, page: 1 }))
  }

  return (
    <Tabs value={view} onValueChange={(nextView) => goToView(nextView as FixtureView)}>
      <TabsList className="h-8 w-full">
        {VIEW_TABS.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value} className="flex-1 text-xs">
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}
