"use client"

import { Check, Lock, Share2 } from "lucide-react"
import Link from "next/link"

import { TeamFlag } from "@/components/team-flag"
import { Button, buttonVariants } from "@/components/ui/button"
import { Panel, PanelHeader } from "@/components/ui/panel"
import type { TeamSummary } from "@/lib/catalog/types"
import type { PitchSide } from "@/lib/match/lineup-position"
import { teamRatingRows, type TeamRatingCounts } from "@/lib/match/team-rating-progress"
import type { MatchLineupPlayer } from "@/lib/match/types"
import { MATCH_SHARE_UNLOCK } from "@/lib/share/match-share-model"
import { matchSharePath } from "@/lib/share/share-links"

export type MatchShareLink = {
  username: string
  fixtureId: number
}

export type RatingProgressState =
  | { kind: "signed-out" }
  | { kind: "locked" }
  | { kind: "empty" }
  | { kind: "teams"; teams: TeamRatingCounts[] }

export function ratingProgressState(
  queue: MatchLineupPlayer[],
  isLoggedIn: boolean,
  ratingsUnlocked: boolean,
  home: TeamSummary,
  away: TeamSummary,
): RatingProgressState {
  if (!isLoggedIn) return { kind: "signed-out" }
  if (!ratingsUnlocked) return { kind: "locked" }
  const teams = teamRatingRows(queue, home, away)
  if (teams.length === 0) return { kind: "empty" }
  return { kind: "teams", teams }
}

export function RatingProgressBar({
  rated,
  total,
  label,
}: {
  rated: number
  total: number
  label: string
}) {
  return (
    <div
      className="h-2 w-full overflow-hidden rounded-full bg-muted"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={rated}
      aria-label={label}
    >
      <div
        className="h-full rounded-full bg-primary transition-[width] duration-500"
        style={{ width: `${total === 0 ? 0 : (rated / total) * 100}%` }}
      />
    </div>
  )
}

function rateLabel(team: TeamSummary, rated: number) {
  return rated === 0 ? `Rate ${team.name}` : `Continue ${team.name}`
}

function TeamRateBlock({
  row,
  onRateTeam,
  share,
}: {
  row: TeamRatingCounts
  onRateTeam: (side: PitchSide) => void
  share: MatchShareLink | null
}) {
  const done = row.rated >= row.total
  const shareHref =
    share && row.rated >= MATCH_SHARE_UNLOCK
      ? matchSharePath(share.username, share.fixtureId, row.team.id)
      : null

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <TeamFlag team={row.team} size="sm" variant="crest" />
        <span className="min-w-0 flex-1 truncate text-sm font-semibold">{row.team.name}</span>
        <span className="text-sm font-semibold tabular-nums">
          {row.rated}
          <span className="text-muted-foreground"> / {row.total}</span>
        </span>
      </div>
      <RatingProgressBar
        rated={row.rated}
        total={row.total}
        label={`${row.rated} of ${row.total} ${row.team.name} players rated`}
      />
      {done ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Check className="size-3" strokeWidth={3} aria-hidden />
          </span>
          All rated
        </p>
      ) : (
        <Button type="button" className="h-9 w-full" onClick={() => onRateTeam(row.side)}>
          {rateLabel(row.team, row.rated)}
        </Button>
      )}
      {shareHref ? (
        <Link
          href={shareHref}
          className={buttonVariants({ variant: "outline", className: "h-9 w-full gap-2" })}
        >
          <Share2 className="size-4 shrink-0" aria-hidden />
          <TeamFlag team={row.team} size="sm" variant="crest" />
          <span className="truncate">Share {row.team.name}</span>
        </Link>
      ) : null}
    </div>
  )
}

type MatchRatingProgressProps = {
  state: RatingProgressState
  onRateTeam: (side: PitchSide) => void
  /** Set once the viewer has a username, so Share can point at their card. */
  share?: MatchShareLink | null
}

export function MatchRatingProgress({
  state,
  onRateTeam,
  share = null,
}: MatchRatingProgressProps) {
  if (state.kind === "empty") return null

  return (
    <Panel>
      <PanelHeader title="Your ratings" />
      <div className="flex flex-col gap-4 px-5 pt-1 pb-5">
        {state.kind === "signed-out" ? (
          <>
            <p className="text-sm text-muted-foreground">
              Rate one team, or tap a player, and see how your takes stack up.
            </p>
            <Link href="/login" className={buttonVariants({ className: "h-10 w-full" })}>
              Sign in to rate
            </Link>
          </>
        ) : state.kind === "locked" ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Lock className="size-4 shrink-0" aria-hidden />
            Ratings open at full time.
          </p>
        ) : (
          state.teams.map((row) => (
            <TeamRateBlock key={row.side} row={row} onRateTeam={onRateTeam} share={share} />
          ))
        )}
      </div>
    </Panel>
  )
}
