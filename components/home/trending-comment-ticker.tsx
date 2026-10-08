"use client"

import { Flame } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"

import { PlayerAvatar } from "@/components/player-avatar"
import { getCommentAuthorDisplay } from "@/lib/comment/author-display"
import type { TrendingCommentCard } from "@/lib/home/types"
import { cn } from "@/lib/utils"

const ROTATE_MS = 5000

type TrendingCommentTickerProps = {
  comments: TrendingCommentCard[]
  currentUserId: string | null
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  )
}

/**
 * Phones and tablets: one trending take at a time, changing every 5s (paused
 * while touched or hovered, and under reduced motion). Dots pick one by hand.
 * Opens the player page at that comment.
 */
export function TrendingCommentTicker({ comments, currentUserId }: TrendingCommentTickerProps) {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const count = comments.length

  useEffect(() => {
    if (count < 2 || paused || prefersReducedMotion()) return
    const id = window.setInterval(() => setIndex((i) => (i + 1) % count), ROTATE_MS)
    return () => window.clearInterval(id)
  }, [count, paused])

  if (count === 0) return null

  const comment = comments[index % count]!
  const author = getCommentAuthorDisplay({
    currentUserId,
    authorUserId: comment.authorUserId,
    username: comment.authorUsername,
    displayName: comment.authorDisplayName,
  }).label

  return (
    <section
      aria-label="Trending comments"
      className="rounded-lg border border-border bg-card px-4 pt-3 pb-3.5"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setPaused(false)}
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="inline-flex items-center gap-1.5 text-xs font-semibold">
          <Flame className="size-3.5 text-orange-500" aria-hidden />
          Trending take
        </h2>
        {count > 1 ? (
          <div className="flex items-center gap-1.5">
            {comments.map((item, i) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Show trending comment ${i + 1} of ${count}`}
                aria-current={i === index % count ? "true" : undefined}
                className="flex h-5 items-center"
              >
                <span
                  className={cn(
                    "h-1.5 rounded-full transition-all",
                    i === index % count ? "w-4 bg-foreground" : "w-1.5 bg-border",
                  )}
                />
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <Link
        key={comment.id}
        href={`/player/${comment.playerId}#comment-${comment.id}`}
        className="mt-2 block animate-in fade-in slide-in-from-bottom-1 duration-300 motion-reduce:animate-none"
      >
        <p className="line-clamp-2 min-h-[2.5rem] text-sm leading-snug font-medium">
          &ldquo;{comment.body}&rdquo;
        </p>
        <p className="mt-2 flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
          <PlayerAvatar
            name={comment.playerName}
            photoUrl={comment.playerPhotoUrl}
            size="sm"
            className="size-5 shrink-0 rounded-full"
          />
          <span className="truncate">
            on <span className="font-semibold text-foreground">{comment.playerName}</span>
          </span>
          <span className="shrink-0">· ▲ {comment.upvoteCount}</span>
          <span className="shrink-0 truncate">· {author}</span>
        </p>
      </Link>
    </section>
  )
}
