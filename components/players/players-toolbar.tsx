import { PlayersFiltersSheet } from "@/components/players/players-filters-sheet"
import { PlayersSortSelect } from "@/components/players/players-sort-select"
import { buildPlayersBrowseHref } from "@/lib/search/query"
import type { BrowseFilterOptions, BrowseFilters } from "@/lib/search/types"

type PlayersToolbarProps = {
  filters: BrowseFilters
  options: BrowseFilterOptions
  resultCount: number | null
}

export function PlayersToolbar({ filters, options, resultCount }: PlayersToolbarProps) {
  const countLabel =
    resultCount == null ? "- players" : `${resultCount} player${resultCount === 1 ? "" : "s"}`

  return (
    <div className="flex flex-wrap items-center gap-2">
      <PlayersFiltersSheet filters={filters} options={options} />
      <PlayersSortSelect filters={filters} className="flex-1 lg:flex-none" />
      <span className="ml-auto shrink-0 text-xs text-muted-foreground">
        <span className="font-mono font-semibold tabular-nums text-foreground">
          {countLabel}
        </span>
      </span>
    </div>
  )
}

export function PlayersPagination({
  filters,
  total,
  page,
  pageSize,
}: {
  filters: BrowseFilters
  total: number | null
  page: number
  pageSize: number
}) {
  if (total == null || total <= pageSize) return null

  const totalPages = Math.ceil(total / pageSize)
  const prevPage = page > 1 ? page - 1 : null
  const nextPage = page < totalPages ? page + 1 : null

  return (
    <nav
      className="flex items-center justify-between gap-4 border-t border-border pt-4"
      aria-label="Players pagination"
    >
      {prevPage ? (
        <a
          href={buildPlayersBrowseHref({ ...filters, page: prevPage })}
          className="text-sm font-medium text-primary hover:underline"
        >
          Previous
        </a>
      ) : (
        <span className="text-sm text-muted-foreground">Previous</span>
      )}
      <span className="text-xs text-muted-foreground">
        Page {page} of {totalPages}
      </span>
      {nextPage ? (
        <a
          href={buildPlayersBrowseHref({ ...filters, page: nextPage })}
          className="text-sm font-medium text-primary hover:underline"
        >
          Next
        </a>
      ) : (
        <span className="text-sm text-muted-foreground">Next</span>
      )}
    </nav>
  )
}
