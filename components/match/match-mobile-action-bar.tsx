"use client"

import { Lock, MessageCircle, Share2 } from "lucide-react"
import Link from "next/link"

import type { MatchShareLink, RatingProgressState } from "@/components/match/match-rating-progress"
import { TeamFlag } from "@/components/team-flag"
import { buttonVariants } from "@/components/ui/button"
import type { PitchSide } from "@/lib/match/lineup-position"
import { MATCH_SHARE_UNLOCK } from "@/lib/share/match-share-model"
import { matchSharePath } from "@/lib/share/share-links"

type MatchMobileActionBarProps = {
  state: RatingProgressState
  /** Team currently on the phone lineup. */
  lineupSide: PitchSide
  commentCount: number
  hasNewComments: boolean
  onRateTeam: (side: PitchSide) => void
  share?: MatchShareLink | null
  onComments: () => void
}

function CommentsButton({
  commentCount,
  hasNewComments,
  onComments,
}: {
  commentCount: number
  hasNewComments: boolean
  onComments: () => void
}) {
  return (
    <button
      type="button"
      onClick={onComments}
      aria-label={`Comments (${commentCount})`}
      className="relative flex h-11 shrink-0 items-center gap-1.5 rounded-lg border border-border bg-card px-3.5 text-sm font-semibold"
    >
      <MessageCircle className="size-4" aria-hidden />
      <span className="tabular-nums">{commentCount}</span>
      {hasNewComments ? (
        <span
          className="absolute -top-1 -right-1 size-2.5 rounded-full bg-primary ring-2 ring-background"
          aria-hidden
        />
      ) : null}
    </button>
  )
}

/**
 * Phones only: rate the team on screen, plus a jump to comments.
 * Sits above the home indicator.
 */
export function MatchMobileActionBar({
  state,
  lineupSide,
  commentCount,
  hasNewComments,
  onRateTeam,
  share = null,
  onComments,
}: MatchMobileActionBarProps) {
  if (state.kind === "empty") return null

  const team = state.kind === "teams" ? state.teams.find((row) => row.side === lineupSide) : null
  const shareHref =
    share && team && team.rated >= MATCH_SHARE_UNLOCK
      ? matchSharePath(share.username, share.fixtureId, team.team.id)
      : null
  const comments = (
    <CommentsButton
      commentCount={commentCount}
      hasNewComments={hasNewComments}
      onComments={onComments}
    />
  )

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] backdrop-blur-md md:hidden">
      <div className="flex items-center gap-2">
        {state.kind === "signed-out" ? (
          <Link href="/login" className={buttonVariants({ className: "h-11 flex-1 text-sm" })}>
            Sign in to rate players
          </Link>
        ) : state.kind === "locked" ? (
          <span className="flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-muted text-sm font-medium text-muted-foreground">
            <Lock className="size-4" aria-hidden />
            Ratings open at FT
          </span>
        ) : team && team.rated < team.total ? (
          <button
            type="button"
            onClick={() => onRateTeam(team.side)}
            className="relative flex h-11 flex-1 items-center justify-between gap-3 overflow-hidden rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground"
          >
            <span
              className="absolute inset-y-0 left-0 bg-black/10 transition-[width] duration-500"
              style={{ width: `${(team.rated / team.total) * 100}%` }}
              aria-hidden
            />
            <span className="relative truncate">
              {team.rated === 0 ? `Rate ${team.team.name}` : `Continue ${team.team.name}`}
            </span>
            <span className="relative shrink-0 tabular-nums">
              {team.rated}/{team.total}
            </span>
          </button>
        ) : shareHref ? (
          <Link
            href={shareHref}
            className={buttonVariants({ className: "h-11 flex-1 gap-2 text-sm" })}
          >
            <Share2 className="size-4 shrink-0" aria-hidden />
            {team ? <TeamFlag team={team.team} size="sm" variant="crest" /> : null}
            <span className="truncate">Share {team?.team.name ?? "ratings"}</span>
          </Link>
        ) : (
          <span className="flex h-11 flex-1 items-center justify-center rounded-lg bg-muted text-sm font-medium text-muted-foreground">
            {team ? `${team.team.name} rated` : "Nothing to rate"}
          </span>
        )}
        {shareHref && team && team.rated < team.total ? (
          <Link
            href={shareHref}
            className={buttonVariants({
              variant: "outline",
              className: "h-11 shrink-0 gap-1.5 bg-card px-3 text-sm",
            })}
          >
            <Share2 className="size-4 shrink-0" aria-hidden />
            {team ? <TeamFlag team={team.team} size="sm" variant="crest" /> : null}
            Share
          </Link>
        ) : null}
        {comments}
      </div>
    </div>
  )
}
