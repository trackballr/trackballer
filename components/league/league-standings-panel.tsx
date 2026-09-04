"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { useState } from "react"

import { CatalogImage } from "@/components/catalog-image"
import type { StandingsPayload, StandingsTeamRow } from "@/lib/catalog/standings-types"
import {
  collectQualificationZones,
  getQualificationZone,
} from "@/lib/league/qualification"
import { cn } from "@/lib/utils"

type LeagueStandingsPanelProps = {
  data: StandingsPayload | null
  className?: string
}

const cardClass = "overflow-hidden rounded-xl border border-border bg-card"

const headerClass =
  "flex items-center justify-between gap-2 border-b border-border px-3 py-3 sm:px-4"

const thClass =
  "px-1 py-2.5 text-center text-[10px] font-semibold tracking-wide text-muted-foreground"

const tdClass = "px-1 py-2 text-center text-xs tabular-nums text-muted-foreground"

const arrowClass =
  "flex size-7 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:bg-muted/60 disabled:pointer-events-none disabled:opacity-40"

function StandingsRow({ row }: { row: StandingsTeamRow }) {
  const zone = getQualificationZone(row.description)

  return (
    <tr className="border-b border-border/60 last:border-0 hover:bg-muted/40">
      <td className="relative w-8 py-2 pr-1 pl-3 text-center text-xs tabular-nums text-muted-foreground sm:pl-4">
        {zone ? (
          <span
            aria-hidden
            className="absolute top-1 bottom-1 left-0 w-[3px] rounded-r-full sm:left-1"
            style={{ backgroundColor: zone.color }}
          />
        ) : null}
        {row.rank}
      </td>

      <td className="min-w-0 py-2 pr-1 text-left">
        <span className="flex min-w-0 items-center gap-2">
          {row.logoUrl ? (
            <CatalogImage
              src={row.logoUrl}
              alt=""
              width={18}
              height={18}
              className="size-[18px] shrink-0 rounded-sm object-contain"
            />
          ) : (
            <span className="size-[18px] shrink-0 rounded-sm bg-muted" />
          )}
          <span className="min-w-0 truncate text-xs font-medium text-foreground">
            {row.teamName}
          </span>
        </span>
      </td>

      <td className={tdClass}>{row.played}</td>
      <td className={tdClass}>{row.win}</td>
      <td className={tdClass}>{row.draw}</td>
      <td className={tdClass}>{row.lose}</td>
      <td className={tdClass}>
        {row.goalsDiff > 0 ? `+${row.goalsDiff}` : row.goalsDiff}
      </td>
      <td className="px-1 py-2 pr-3 text-center text-xs font-bold tabular-nums text-foreground sm:pr-4">
        {row.points}
      </td>
    </tr>
  )
}

export function LeagueStandingsPanel({ data, className }: LeagueStandingsPanelProps) {
  const [groupIndex, setGroupIndex] = useState(0)

  if (!data || data.groups.length === 0) {
    return (
      <section className={cn(cardClass, className)}>
        <div className={headerClass}>
          <h2 className="h3">Standings</h2>
        </div>
        <p className="px-4 py-6 text-xs text-muted-foreground">
          Could not load standings.
        </p>
      </section>
    )
  }

  const groups = data.groups
  const safeIndex = Math.min(groupIndex, groups.length - 1)
  const group = groups[safeIndex]
  const hasGroups = groups.length > 1
  const zones = collectQualificationZones(group.teams)

  return (
    <section className={cn(cardClass, className)}>
      <div className={headerClass}>
        <h2 className="h3">Standings</h2>

        {hasGroups ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              className={arrowClass}
              aria-label="Previous group"
              disabled={safeIndex === 0}
              onClick={() => setGroupIndex((i) => Math.max(0, i - 1))}
            >
              <ChevronLeft className="size-3.5" />
            </button>
            <p className="min-w-0 truncate text-xs font-semibold">{group.name}</p>
            <button
              type="button"
              className={arrowClass}
              aria-label="Next group"
              disabled={safeIndex >= groups.length - 1}
              onClick={() => setGroupIndex((i) => Math.min(groups.length - 1, i + 1))}
            >
              <ChevronRight className="size-3.5" />
            </button>
          </div>
        ) : null}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-border bg-muted/60">
              <th className={cn(thClass, "w-8 pl-3 sm:pl-4")}>#</th>
              <th className={cn(thClass, "min-w-0 text-left")}>Team</th>
              <th className={thClass}>MP</th>
              <th className={thClass}>W</th>
              <th className={thClass}>D</th>
              <th className={thClass}>L</th>
              <th className={thClass}>GD</th>
              <th className={cn(thClass, "pr-3 text-foreground sm:pr-4")}>Pts</th>
            </tr>
          </thead>
          <tbody key={group.name}>
            {group.teams.map((row, index) => (
              <StandingsRow key={`${group.name}-${row.teamId}-${index}`} row={row} />
            ))}
          </tbody>
        </table>
      </div>

      {zones.length > 0 ? (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-border px-3 py-2.5 sm:px-4">
          {zones.map((zone) => (
            <span
              key={zone.key}
              className="flex items-center gap-1.5 text-[10px] text-muted-foreground"
            >
              <span
                aria-hidden
                className="size-2 rounded-full"
                style={{ backgroundColor: zone.color }}
              />
              {zone.label}
            </span>
          ))}
        </div>
      ) : null}
    </section>
  )
}
