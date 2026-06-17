"use client"

import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useEffect, useState } from "react"

import { CatalogImage } from "@/components/catalog-image"
import type { StandingsPayload } from "@/lib/catalog/standings-types"
import { cn } from "@/lib/utils"
import {
  wcSidebarCardClass,
  wcSidebarTitleClass,
} from "@/lib/world-cup/layout"

type WorldCupStandingsPanelProps = {
  data: StandingsPayload | null
  variant?: "default" | "sidebar"
  className?: string
  showTitle?: boolean
}

const arrowClass =
  "flex shrink-0 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:bg-muted/60 disabled:pointer-events-none disabled:opacity-40"

export function WorldCupStandingsPanel({
  data,
  variant = "default",
  className,
  showTitle = true,
}: WorldCupStandingsPanelProps) {
  const [groupIndex, setGroupIndex] = useState(0)
  const compact = variant === "sidebar"

  useEffect(() => {
    setGroupIndex(0)
  }, [data])

  const thClass = compact
    ? "px-0.5 py-1.5 text-center text-[0.58rem] font-semibold uppercase tracking-wide text-muted-foreground first:pl-1.5 last:pr-1.5"
    : "px-1 py-2 text-center text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground first:pl-2 last:pr-2"

  const tdClass = compact
    ? "px-0.5 py-1 text-center text-[10px] tabular-nums first:pl-1.5 last:pr-1.5"
    : "px-1 py-1.5 text-center text-xs tabular-nums first:pl-2 last:pr-2"

  const arrowSizeClass = compact ? "size-7" : "size-8"
  const flagSize = compact ? 14 : 18

  if (!data || data.groups.length === 0) {
    return (
      <section className={cn("min-w-0", className)}>
        {showTitle ? (
          <h2 className={cn(compact ? cn(wcSidebarTitleClass, "mb-2") : "h3 mb-3")}>
            Standings
          </h2>
        ) : null}
        <p
          className={cn(
            "text-muted-foreground",
            compact
              ? cn(wcSidebarCardClass, "p-3 text-[10px]")
              : "body-sm rounded-lg border border-border bg-card p-4",
          )}
        >
          Could not load standings.
        </p>
      </section>
    )
  }

  const groups = data.groups
  const safeIndex = Math.min(groupIndex, groups.length - 1)
  const group = groups[safeIndex]
  const canGoPrev = safeIndex > 0
  const canGoNext = safeIndex < groups.length - 1

  const cardClass = compact
    ? wcSidebarCardClass
    : "overflow-hidden rounded-lg border border-border bg-card"

  return (
    <section className={cn("flex min-w-0 flex-col", className)}>
      {showTitle ? (
        <h2 className={cn(compact ? cn(wcSidebarTitleClass, "mb-2 shrink-0") : "h3 mb-3")}>
          Standings
        </h2>
      ) : null}

      <div className={cardClass}>
        <div
          className={cn(
            "flex shrink-0 items-center justify-between gap-1 border-b border-border",
            compact ? "px-1.5 py-1.5" : "gap-2 px-2 py-2",
          )}
        >
          <button
            type="button"
            className={cn(arrowClass, arrowSizeClass)}
            aria-label="Previous group"
            disabled={!canGoPrev}
            onClick={() => setGroupIndex((i) => Math.max(0, i - 1))}
          >
            <ChevronLeft className={compact ? "size-3.5" : "size-4"} />
          </button>

          <p
            className={cn(
              "min-w-0 truncate text-center font-semibold",
              compact ? "text-xs" : "text-sm",
            )}
          >
            {group.name}
          </p>

          <button
            type="button"
            className={cn(arrowClass, arrowSizeClass)}
            aria-label="Next group"
            disabled={!canGoNext}
            onClick={() =>
              setGroupIndex((i) => Math.min(groups.length - 1, i + 1))
            }
          >
            <ChevronRight className={compact ? "size-3.5" : "size-4"} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className={cn(thClass, "w-5 text-left")}>#</th>
                <th className={cn(thClass, "min-w-0 text-left")}>Team</th>
                <th className={thClass}>MP</th>
                <th className={thClass}>W</th>
                <th className={thClass}>D</th>
                <th className={thClass}>L</th>
                <th className={thClass}>G</th>
                <th className={thClass}>+/-</th>
                <th className={thClass}>P</th>
              </tr>
            </thead>
            <tbody key={group.name}>
              {group.teams.map((row, index) => (
                <tr
                  key={`${group.name}-${row.teamId}-${index}`}
                  className="border-b border-border/60 last:border-0"
                >
                  <td className={cn(tdClass, "text-left text-muted-foreground")}>
                    {row.rank}
                  </td>
                  <td className={cn(tdClass, "text-left")}>
                    <span className="flex min-w-0 items-center gap-1">
                      {row.logoUrl ? (
                        <CatalogImage
                          src={row.logoUrl}
                          alt=""
                          width={flagSize}
                          height={flagSize}
                          className="shrink-0 rounded-sm object-contain"
                          style={{ width: flagSize, height: flagSize }}
                        />
                      ) : (
                        <span
                          className="shrink-0 rounded-sm bg-muted"
                          style={{ width: flagSize, height: flagSize }}
                        />
                      )}
                      <Link
                        href={`/country/${row.teamId}`}
                        className={cn(
                          "min-w-0 truncate font-medium hover:underline",
                          compact ? "text-[10px]" : "text-xs",
                        )}
                      >
                        {row.teamName}
                      </Link>
                    </span>
                  </td>
                  <td className={tdClass}>{row.played}</td>
                  <td className={tdClass}>{row.win}</td>
                  <td className={tdClass}>{row.draw}</td>
                  <td className={tdClass}>{row.lose}</td>
                  <td className={tdClass}>
                    {row.goalsFor}:{row.goalsAgainst}
                  </td>
                  <td className={tdClass}>
                    {row.goalsDiff > 0 ? `+${row.goalsDiff}` : row.goalsDiff}
                  </td>
                  <td className={cn(tdClass, "font-semibold text-primary")}>
                    {row.points}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
