import { PlayersDirectory } from "@/components/players/players-directory"
import { browsePlayers } from "@/lib/search/browse-players"
import { getBrowseFilterOptions } from "@/lib/search/filter-options"
import { parseBrowseFilters } from "@/lib/search/query"
import { getTrendingPlayers } from "@/lib/home/trending-players"

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function PlayersPage({ searchParams }: PageProps) {
  const params = await searchParams
  const filters = parseBrowseFilters(params)

  const [options, result, trendingPlayers] = await Promise.all([
    getBrowseFilterOptions(),
    browsePlayers(filters),
    getTrendingPlayers(),
  ])

  return (
    <PlayersDirectory
      filters={filters}
      options={options}
      result={result}
      trendingPlayers={trendingPlayers}
    />
  )
}
