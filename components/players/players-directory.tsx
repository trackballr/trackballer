import { PlayerResultRow } from "@/components/search/player-result-row"
import { TrendingPlayers } from "@/components/home/trending-players"
import type { TrendingPlayerCard } from "@/lib/home/types"
import type { BrowseFilterOptions, BrowseFilters, BrowsePlayersResult } from "@/lib/search/types"

import { PlayersFiltersForm } from "./players-filters-form"
import { PlayersPagination, PlayersToolbar } from "./players-toolbar"

type PlayersDirectoryProps = {
  filters: BrowseFilters
  options: BrowseFilterOptions
  result: BrowsePlayersResult
  trendingPlayers: TrendingPlayerCard[]
}

export function PlayersDirectory({
  filters,
  options,
  result,
  trendingPlayers,
}: PlayersDirectoryProps) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-4 lg:py-5">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_minmax(0,1fr)_220px] lg:items-start">
        <aside className="hidden lg:block">
          <div className="sticky top-16 rounded-lg border border-border bg-card p-4">
            <PlayersFiltersForm
              filters={filters}
              options={options}
              idPrefix="desktop"
              showFilterHeading
              actionsPosition="top"
            />
          </div>
        </aside>

        <div className="min-w-0">
          <PlayersToolbar
            filters={filters}
            options={options}
            resultCount={result.total}
          />

          {result.players.length === 0 ? (
            <p className="body-sm mt-6 rounded-lg border border-border bg-card p-6 text-center text-muted-foreground">
              No players match these filters. Try clearing filters or another search.
            </p>
          ) : (
            <div className="mt-4 overflow-hidden rounded-lg border border-border bg-card">
              {result.players.map((player) => (
                <PlayerResultRow key={player.id} player={player} />
              ))}
            </div>
          )}

          <div className="mt-4">
            <PlayersPagination
              filters={filters}
              total={result.total}
              page={result.page}
              pageSize={result.pageSize}
            />
          </div>
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-16 rounded-lg border border-border bg-card p-4">
            <TrendingPlayers players={trendingPlayers} variant="sidebar" />
          </div>
        </aside>
      </div>
    </div>
  )
}
