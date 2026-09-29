"use client"

import { useState } from "react"
import { X } from "lucide-react"

import { CatalogImage } from "@/components/catalog-image"
import { CareerShuffleClubsDialog } from "@/components/home/career-shuffle-clubs-dialog"
import { TeamFlag } from "@/components/team-flag"
import { Button } from "@/components/ui/button"
import { TOP_LEAGUE_CLUBS } from "@/lib/catalog/top-leagues"
import type { ShuffleLeagueLogos } from "@/lib/home/shuffle-clubs"
import { bigClubIdsForLeague, bigClubName } from "@/lib/home/shuffle-big-clubs"
import {
  describeShuffleScope,
  formatShuffleClubSummary,
  isBigClubSelection,
  type ShuffleClubOption,
  type ShuffleFilterState,
} from "@/lib/home/shuffle-filter-state"
import { cn } from "@/lib/utils"

const LEAGUE_CHIPS: { id: number | null; label: string }[] = [
  { id: null, label: "All leagues" },
  ...TOP_LEAGUE_CLUBS.map((league) => ({ id: league.id, label: league.name })),
]

type CareerShuffleFiltersProps = {
  clubs: ShuffleClubOption[]
  leagueLogos: ShuffleLeagueLogos
  filter: ShuffleFilterState
  onLeague: (leagueId: number | null) => void
  onToggleBigClubs: () => void
  onApplyClubs: (teamIds: number[]) => void
}

type ClubChoice = "any" | "big" | "custom"

export function CareerShuffleFilters({
  clubs,
  leagueLogos,
  filter,
  onLeague,
  onToggleBigClubs,
  onApplyClubs,
}: CareerShuffleFiltersProps) {
  const [clubsOpen, setClubsOpen] = useState(false)
  const bigClubsOn = isBigClubSelection(filter)
  const choice: ClubChoice =
    filter.teamIds.length === 0 ? "any" : bigClubsOn ? "big" : "custom"
  const leagueName = TOP_LEAGUE_CLUBS.find((league) => league.id === filter.leagueId)?.name ?? null
  const picked = pickedClubs(filter.teamIds, clubs)
  const customSummary = formatShuffleClubSummary(filter.teamIds, clubs)

  return (
    <div className="mb-3 space-y-4">
      <div>
        <p className="text-sm font-medium">Show me a player from</p>
        <div className="mt-2 flex gap-2 overflow-x-auto pb-1" role="group" aria-label="League">
          {LEAGUE_CHIPS.map((chip) => {
            const selected = filter.leagueId === chip.id
            const logoUrl = chip.id != null ? leagueLogos[chip.id] : null
            return (
              <Button
                key={chip.label}
                type="button"
                size="sm"
                variant={selected ? "default" : "outline"}
                aria-pressed={selected}
                className="shrink-0 gap-1.5"
                onClick={() => onLeague(chip.id)}
              >
                {chip.id != null ? (
                  <LeagueChipLogo label={chip.label} logoUrl={logoUrl ?? null} selected={selected} />
                ) : null}
                {chip.label}
              </Button>
            )
          })}
        </div>
      </div>

      <div>
        <p className="text-sm font-medium">Who should they play for?</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Leave this on anyone if you don&apos;t mind the club.
        </p>
        <div className="mt-2 grid gap-2 sm:grid-cols-3" role="group" aria-label="Clubs">
          <ChoiceCard
            title="Anyone"
            hint={leagueName ? `Every ${leagueName} club` : "Every club in the top leagues"}
            selected={choice === "any"}
            onClick={() => {
              if (choice !== "any") onApplyClubs([])
            }}
          />
          <ChoiceCard
            title="Big clubs"
            hint={bigClubHint(filter.leagueId, clubs)}
            selected={choice === "big"}
            onClick={() => {
              if (choice !== "big") onToggleBigClubs()
            }}
          />
          <ChoiceCard
            title="I'll pick"
            hint={choice === "custom" && customSummary ? customSummary : "Tick the clubs you follow"}
            selected={choice === "custom"}
            onClick={() => setClubsOpen(true)}
          />
        </div>

        {picked.length > 0 ? (
          <ul className="mt-2 flex flex-wrap gap-1.5" aria-label="Clubs in this shuffle">
            {picked.map((club) => (
              <li
                key={club.id}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card py-1 pr-1 pl-1.5 text-sm"
              >
                <TeamFlag
                  team={{ name: club.name, logo_url: club.logoUrl, code: null }}
                  size="sm"
                  variant="crest"
                />
                <span className="max-w-40 truncate">{club.name}</span>
                {choice === "custom" ? (
                  <button
                    type="button"
                    className="rounded-full p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                    aria-label={`Remove ${club.name}`}
                    onClick={() => onApplyClubs(filter.teamIds.filter((id) => id !== club.id))}
                  >
                    <X className="size-3.5" aria-hidden />
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <p className="text-sm text-muted-foreground">{describeShuffleScope(filter, clubs)}</p>

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

function LeagueChipLogo({
  label,
  logoUrl,
  selected,
}: {
  label: string
  logoUrl: string | null
  selected: boolean
}) {
  if (logoUrl) {
    return (
      <CatalogImage
        src={logoUrl}
        alt=""
        width={16}
        height={16}
        className="size-4 shrink-0 object-contain"
      />
    )
  }

  return (
    <span
      className={cn(
        "flex size-4 shrink-0 items-center justify-center rounded-sm text-[7px] font-bold leading-none",
        selected ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground",
      )}
    >
      {label.slice(0, 2).toUpperCase()}
    </span>
  )
}

function ShuffleChoiceIndicator({ selected }: { selected: boolean }) {
  return (
    <span
      className={cn(
        "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
        selected ? "border-primary" : "border-muted-foreground/45",
      )}
      aria-hidden
    >
      {selected ? <span className="size-2 rounded-full bg-primary" /> : null}
    </span>
  )
}

function ChoiceCard({
  title,
  hint,
  selected,
  onClick,
}: {
  title: string
  hint: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        "flex gap-2.5 rounded-xl border px-3 py-2.5 text-left",
        selected ? "border-primary bg-primary/5" : "border-border bg-card hover:bg-muted/60",
      )}
    >
      <ShuffleChoiceIndicator selected={selected} />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold">{title}</span>
        <span className="mt-0.5 block text-xs text-muted-foreground">{hint}</span>
      </span>
    </button>
  )
}

function bigClubHint(leagueId: number | null, clubs: ShuffleClubOption[]): string {
  const names = bigClubIdsForLeague(leagueId)
    .map((id) => clubs.find((club) => club.id === id)?.name ?? bigClubName(id))
    .filter((name): name is string => Boolean(name))

  if (names.length === 0) return "The famous clubs"
  if (names.length <= 3) return names.join(", ")
  return `${names.slice(0, 2).join(", ")} and ${names.length - 2} more`
}

function pickedClubs(teamIds: number[], clubs: ShuffleClubOption[]) {
  return teamIds
    .map((id) => {
      const club = clubs.find((item) => item.id === id)
      return {
        id,
        name: club?.name ?? bigClubName(id) ?? "Club",
        logoUrl: club?.logoUrl ?? null,
      }
    })
    .sort((a, b) => a.name.localeCompare(b.name))
}
