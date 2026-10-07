"use client"

import { Check, Lock } from "lucide-react"
import Link from "next/link"

import { Button, buttonVariants } from "@/components/ui/button"
import { Panel, PanelHeader } from "@/components/ui/panel"
import type { MatchLineupPlayer } from "@/lib/match/types"

export type RatingProgressState =
  | { kind: "signed-out" }
  | { kind: "locked" }
  | { kind: "empty" }
  | { kind: "in-progress"; rated: number; total: number }
  | { kind: "done"; total: number }

export function ratingProgressState(
  queue: MatchLineupPlayer[],
  isLoggedIn: boolean,
  ratingsUnlocked: boolean,
): RatingProgressState {
  if (!isLoggedIn) return { kind: "signed-out" }
  if (!ratingsUnlocked) return { kind: "locked" }
  if (queue.length === 0) return { kind: "empty" }
  const rated = queue.filter((p) => p.userRating != null).length
  return rated >= queue.length
    ? { kind: "done", total: queue.length }
    : { kind: "in-progress", rated, total: queue.length }
}

export function RatingProgressBar({ rated, total }: { rated: number; total: number }) {
  return (
    <div
      className="h-2 w-full overflow-hidden rounded-full bg-muted"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={rated}
      aria-label={`${rated} of ${total} players rated`}
    >
      <div
        className="h-full rounded-full bg-primary transition-[width] duration-500"
        style={{ width: `${total === 0 ? 0 : (rated / total) * 100}%` }}
      />
    </div>
  )
}

type MatchRatingProgressProps = {
  state: RatingProgressState
  onContinue: () => void
}

export function MatchRatingProgress({ state, onContinue }: MatchRatingProgressProps) {
  if (state.kind === "empty") return null

  return (
    <Panel>
      <PanelHeader
        title="Your ratings"
        action={
          state.kind === "in-progress" ? (
            <span className="text-sm font-semibold tabular-nums">
              {state.rated}
              <span className="text-muted-foreground"> / {state.total}</span>
            </span>
          ) : null
        }
      />
      <div className="px-5 pt-1 pb-5">
        {state.kind === "signed-out" ? (
          <>
            <p className="text-sm text-muted-foreground">
              Rate every player and see how your takes stack up against the fans.
            </p>
            <Link href="/login" className={buttonVariants({ className: "mt-4 h-10 w-full" })}>
              Sign in to rate
            </Link>
          </>
        ) : state.kind === "locked" ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Lock className="size-4 shrink-0" aria-hidden />
            Ratings open at full time.
          </p>
        ) : state.kind === "done" ? (
          <p className="flex items-center gap-2 text-sm">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Check className="size-3.5" strokeWidth={3} aria-hidden />
            </span>
            All {state.total} rated. Tap any player to compare with the fans.
          </p>
        ) : (
          <>
            <RatingProgressBar rated={state.rated} total={state.total} />
            <p className="mt-2 text-xs text-muted-foreground">
              {state.total - state.rated} player{state.total - state.rated === 1 ? "" : "s"} left
            </p>
            <Button type="button" className="mt-4 h-10 w-full" onClick={onContinue}>
              {state.rated === 0 ? "Start rating" : "Continue rating"}
            </Button>
          </>
        )}
      </div>
    </Panel>
  )
}
