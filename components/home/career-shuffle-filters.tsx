"use client"

import { useState } from "react"

import { CareerShuffleClubsDialog } from "@/components/home/career-shuffle-clubs-dialog"
import { Button } from "@/components/ui/button"
import { TOP_LEAGUE_CLUBS } from "@/lib/catalog/top-leagues"
import {
  formatShuffleClubSummary,
  isBigClubSelection,
  type ShuffleClubOption,
  type ShuffleFilterState,
} from "@/lib/home/shuffle-filter-state"

const LEAGUE_CHIPS: { id: number | null; label: string }[] = [
  { id: null, label: "All" },
  ...TOP_LEAGUE_CLUBS.map((league) => ({ id: league.id, label: league.name })),
]

type CareerShuffleFiltersProps = {
  clubs: ShuffleClubOption[]
  filter: ShuffleFilterState
  onLeague: (leagueId: number | null) => void
  onToggleBigClubs: () => void
  onApplyClubs: (teamIds: number[]) => void
}

export function CareerShuffleFilters({
  clubs,
  filter,
  onLeague,
  onToggleBigClubs,
  onApplyClubs,
}: CareerShuffleFiltersProps) {
  const [clubsOpen, setClubsOpen] = useState(false)
  const summary = formatShuffleClubSummary(filter.teamIds, clubs)
  const bigClubsOn = isBigClubSelection(filter)

  return (
    <div className="mb-3 space-y-2">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {LEAGUE_CHIPS.map((chip) => {
          const selected = filter.leagueId === chip.id
          return (
            <Button
              key={chip.label}
              type="button"
              size="sm"
              variant={selected ? "default" : "outline"}
              aria-pressed={selected}
              className="shrink-0"
              onClick={() => onLeague(chip.id)}
            >
              {chip.label}
            </Button>
          )
        })}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant={bigClubsOn ? "default" : "outline"}
          aria-pressed={bigClubsOn}
          onClick={onToggleBigClubs}
        >
          Big clubs
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={() => setClubsOpen(true)}>
          {filter.teamIds.length > 0 ? `Clubs (${filter.teamIds.length})` : "Clubs"}
        </Button>
      </div>

      {summary ? <p className="text-xs text-muted-foreground">{summary}</p> : null}

      <CareerShuffleClubsDialog
        open={clubsOpen}
        onOpenChange={setClubsOpen}
        clubs={clubs}
        leagueId={filter.leagueId}
        teamIds={filter.teamIds}
        onApply={onApplyClubs}
      />
    </div>
  )
}
