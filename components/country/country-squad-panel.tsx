import { PlayerResultRow } from "@/components/search/player-result-row"
import { buildCountryHref } from "@/lib/country/query"
import type { CountryPageParams } from "@/lib/country/types"
import { BROWSE_PAGE_SIZE } from "@/lib/search/query"
import type { BrowsePlayersResult } from "@/lib/search/types"

import { CountrySquadSortSelect } from "./country-squad-sort-select"

type CountrySquadPanelProps = {
  teamId: number
  pageParams: CountryPageParams
  result: BrowsePlayersResult
}

function SquadPagination({
  teamId,
  pageParams,
  total,
  page,
  pageSize,
}: {
  teamId: number
  pageParams: CountryPageParams
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
      aria-label="Squad pagination"
    >
      {prevPage ? (
        <a
          href={buildCountryHref(teamId, { ...pageParams, page: prevPage })}
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
          href={buildCountryHref(teamId, { ...pageParams, page: nextPage })}
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

export function CountrySquadPanel({ teamId, pageParams, result }: CountrySquadPanelProps) {
  const countLabel =
    result.total == null
      ? "— players"
      : `${result.total} player${result.total === 1 ? "" : "s"}`

  return (
    <section className="min-w-0">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <h2 className="h3">Squad</h2>
        <CountrySquadSortSelect
          teamId={teamId}
          sort={pageParams.sort}
          view={pageParams.view}
          className="ml-auto"
        />
      </div>

      <p className="body-sm mb-3 text-muted-foreground">
        <span className="font-mono font-semibold tabular-nums text-foreground">
          {countLabel}
        </span>
      </p>

      {result.players.length === 0 ? (
        <p className="body-sm rounded-lg border border-border bg-card p-6 text-center text-muted-foreground">
          No squad players linked to this national team yet.
        </p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          {result.players.map((player) => (
            <PlayerResultRow key={player.id} player={player} />
          ))}
        </div>
      )}

      <div className="mt-4">
        <SquadPagination
          teamId={teamId}
          pageParams={pageParams}
          total={result.total}
          page={result.page}
          pageSize={BROWSE_PAGE_SIZE}
        />
      </div>
    </section>
  )
}
