"use client"

import { useRouter } from "nextjs-toploader/app"

import { OptionMenuSelect } from "@/components/ui/option-menu-select"
import { buildCountryHref } from "@/lib/country/query"
import type { PlayerBrowseSort } from "@/lib/search/types"
import { cn } from "@/lib/utils"

const SORT_OPTIONS = [
  { value: "rating-desc", label: "Rating: high to low" },
  { value: "rating-asc", label: "Rating: low to high" },
]

type CountrySquadSortSelectProps = {
  teamId: number
  sort: PlayerBrowseSort
  view: "upcoming" | "finished"
  className?: string
}

export function CountrySquadSortSelect({
  teamId,
  sort,
  view,
  className,
}: CountrySquadSortSelectProps) {
  const router = useRouter()

  function handleSortChange(nextSort: string) {
    if (nextSort === sort) return
    router.push(
      buildCountryHref(teamId, {
        view,
        sort: nextSort as PlayerBrowseSort,
        page: 1,
      }),
    )
  }

  return (
    <div className={cn("flex min-w-0 items-center gap-1.5", className)}>
      <OptionMenuSelect
        value={sort}
        onValueChange={handleSortChange}
        groups={[{ options: SORT_OPTIONS }]}
        ariaLabel="Sort squad by rating"
        triggerClassName="h-8 text-xs"
      />
    </div>
  )
}
