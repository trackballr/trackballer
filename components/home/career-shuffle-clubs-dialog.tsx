"use client"

import { useEffect, useMemo, useState } from "react"

import { TeamFlag } from "@/components/team-flag"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { TOP_LEAGUE_CLUBS } from "@/lib/catalog/top-leagues"
import type { ShuffleClubOption } from "@/lib/home/shuffle-filter-state"

type CareerShuffleClubsDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  clubs: ShuffleClubOption[]
  leagueId: number | null
  teamIds: number[]
  onApply: (teamIds: number[]) => void
}

export function CareerShuffleClubsDialog({
  open,
  onOpenChange,
  clubs,
  leagueId,
  teamIds,
  onApply,
}: CareerShuffleClubsDialogProps) {
  const [draft, setDraft] = useState<number[]>(teamIds)
  const [query, setQuery] = useState("")

  useEffect(() => {
    if (!open) return
    setDraft(teamIds)
    setQuery("")
  }, [open, teamIds])

  const visible = useMemo(() => {
    const inLeague = leagueId == null ? clubs : clubs.filter((club) => club.leagueId === leagueId)
    const needle = query.trim().toLowerCase()
    if (!needle) return inLeague
    return inLeague.filter((club) => club.name.toLowerCase().includes(needle))
  }, [clubs, leagueId, query])

  const groups = useMemo(() => {
    if (leagueId != null) {
      return [{ id: leagueId, name: null as string | null, clubs: visible }]
    }
    return TOP_LEAGUE_CLUBS.map((league) => ({
      id: league.id,
      name: league.name,
      clubs: visible.filter((club) => club.leagueId === league.id),
    })).filter((group) => group.clubs.length > 0)
  }, [leagueId, visible])

  function toggleClub(id: number) {
    setDraft((current) =>
      current.includes(id) ? current.filter((teamId) => teamId !== id) : [...current, id],
    )
  }

  const emptyCopy =
    leagueId == null
      ? "Shuffle uses every club in the top leagues."
      : "Shuffle uses every club in this league."

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(32rem,calc(100%-2rem))] flex-col gap-3 sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Clubs</DialogTitle>
          <DialogDescription>
            {draft.length === 0 ? emptyCopy : `${draft.length} selected.`}
          </DialogDescription>
        </DialogHeader>

        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search clubs"
          aria-label="Search clubs"
        />

        <div className="min-h-0 flex-1 overflow-y-auto">
          {groups.length === 0 || groups.every((group) => group.clubs.length === 0) ? (
            <p className="text-sm text-muted-foreground">
              {clubs.length === 0
                ? "Clubs for this league are still syncing."
                : "No clubs match that search."}
            </p>
          ) : (
            groups.map((group) => (
              <div key={group.id} className="mb-3 last:mb-0">
                {group.name ? (
                  <p className="mb-1 text-xs font-medium text-muted-foreground">{group.name}</p>
                ) : null}
                <ul>
                  {group.clubs.map((club) => (
                    <li key={club.id}>
                      <label className="flex cursor-pointer items-center gap-2 rounded-md px-1 py-1.5 hover:bg-muted">
                        <input
                          type="checkbox"
                          className="size-4 shrink-0 accent-primary"
                          checked={draft.includes(club.id)}
                          onChange={() => toggleClub(club.id)}
                        />
                        <TeamFlag
                          team={{ name: club.name, logo_url: club.logoUrl, code: null }}
                          size="sm"
                          variant="crest"
                        />
                        <span className="truncate">{club.name}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setDraft([])}>
            Clear
          </Button>
          <Button
            type="button"
            onClick={() => {
              onApply(draft)
              onOpenChange(false)
            }}
          >
            Apply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
