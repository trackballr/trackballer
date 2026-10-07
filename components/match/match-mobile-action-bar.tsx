"use client"

import { Lock, MessageCircle } from "lucide-react"
import Link from "next/link"

import type { RatingProgressState } from "@/components/match/match-rating-progress"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type MatchMobileActionBarProps = {
  state: RatingProgressState
  commentCount: number
  hasNewComments: boolean
  onRate: () => void
  onComments: () => void
}

/**
 * Phones only: rating progress and a jump to comments, pinned above the home
 * indicator. Hidden once every player is rated.
 */
export function MatchMobileActionBar({
  state,
  commentCount,
  hasNewComments,
  onRate,
  onComments,
}: MatchMobileActionBarProps) {
  if (state.kind === "done" || state.kind === "empty") return null

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
        ) : (
          <button
            type="button"
            onClick={onRate}
            className="relative flex h-11 flex-1 items-center justify-between gap-3 overflow-hidden rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground"
          >
            <span
              className="absolute inset-y-0 left-0 bg-black/10 transition-[width] duration-500"
              style={{ width: `${(state.rated / state.total) * 100}%` }}
              aria-hidden
            />
            <span className="relative">
              {state.rated === 0 ? "Rate players" : "Continue rating"}
            </span>
            <span className="relative tabular-nums">
              {state.rated}/{state.total}
            </span>
          </button>
        )}

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
              className={cn("absolute -top-1 -right-1 size-2.5 rounded-full bg-primary ring-2 ring-background")}
              aria-hidden
            />
          ) : null}
        </button>
      </div>
    </div>
  )
}
