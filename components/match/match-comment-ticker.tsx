"use client"

import { ChevronRight, Flame } from "lucide-react"
import { useEffect, useState } from "react"

import {
  TrendingUpvoteButton,
  type TrendingVotes,
} from "@/components/match/match-trending-comments"
import type { MatchTrendingCommentCard } from "@/lib/match/match-trending-comments"

const ROTATE_MS = 5000

type MatchCommentTickerProps = {
  comments: MatchTrendingCommentCard[]
  votes: TrendingVotes
  onOpen: (commentId: number) => void
  onCompose: () => void
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  )
}

/**
 * Score-card strip with the match's top takes. Rotates every 5s (paused on
 * hover/focus and under reduced motion); the chevron steps through by hand.
 */
export function MatchCommentTicker({
  comments,
  votes,
  onOpen,
  onCompose,
}: MatchCommentTickerProps) {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const count = comments.length

  useEffect(() => {
    if (count < 2 || paused || prefersReducedMotion()) return
    const id = window.setInterval(() => setIndex((i) => (i + 1) % count), ROTATE_MS)
    return () => window.clearInterval(id)
  }, [count, paused])

  if (count === 0) {
    return (
      <button
        type="button"
        onClick={onCompose}
        className="flex w-full items-center gap-2.5 border-t border-border px-4 py-3 text-left text-sm transition-colors hover:bg-muted/50 md:px-6"
      >
        <Flame className="size-4 shrink-0 text-orange-500" aria-hidden />
        <span className="min-w-0 flex-1 truncate text-muted-foreground">
          No takes yet — be the first
        </span>
        <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      </button>
    )
  }

  const comment = comments[index % count]!

  return (
    <div
      className="flex items-center gap-2.5 border-t border-border px-4 py-2.5 md:px-6"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <Flame className="size-4 shrink-0 text-orange-500" aria-hidden />
      <button
        type="button"
        onClick={() => onOpen(comment.id)}
        className="min-w-0 flex-1 text-left"
        aria-live={paused ? "off" : "polite"}
      >
        <span
          key={comment.id}
          className="block truncate text-sm font-medium animate-in fade-in slide-in-from-bottom-1 duration-300 motion-reduce:animate-none"
        >
          &ldquo;{comment.body}&rdquo;
        </span>
      </button>
      <TrendingUpvoteButton commentId={comment.id} votes={votes} className="h-7" />
      {count > 1 ? (
        <button
          type="button"
          onClick={() => setIndex((i) => (i + 1) % count)}
          aria-label="Next top comment"
          className="flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ChevronRight className="size-4" aria-hidden />
        </button>
      ) : null}
    </div>
  )
}
