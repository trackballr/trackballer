"use client"

import { ArrowUp, MessageCircle } from "lucide-react"
import { useState, useTransition } from "react"

import { CommentAuthorLink } from "@/components/comment/comment-author-link"
import { CommentFavouriteCrests } from "@/components/comment/comment-favourite-crests"
import { CommentTime } from "@/components/comment/comment-time"
import { TrendingEmptyState } from "@/components/comment/trending-empty-state"
import { Panel, PanelHeader } from "@/components/ui/panel"
import { computeVoteTransition } from "@/lib/comment/optimistic-vote"
import { submitVote } from "@/lib/comment/submit-vote"
import type { MatchTrendingCommentCard } from "@/lib/match/match-trending-comments"
import { cn } from "@/lib/utils"

export type TrendingVotes = {
  upvotesFor: (commentId: number) => number
  voteFor: (commentId: number) => 1 | -1 | null
  upvote: (commentId: number) => void
}

/** Optimistic upvotes shared by the score-card strip, the carousel and the sidebar. */
export function useTrendingVotes(
  comments: MatchTrendingCommentCard[],
  initialVotes: Record<number, 1 | -1>,
  isLoggedIn: boolean,
): TrendingVotes {
  const [votes, setVotes] = useState(initialVotes)
  const [upvoteDelta, setUpvoteDelta] = useState<Record<number, number>>({})
  const [, startTransition] = useTransition()

  function upvote(commentId: number) {
    if (!isLoggedIn) {
      window.location.href = "/login"
      return
    }

    const current = votes[commentId] ?? null
    const transition = computeVoteTransition(current, 1)
    const snapshotVotes = votes
    const snapshotDelta = upvoteDelta

    setVotes((prev) => {
      const next = { ...prev }
      if (transition.nextVote == null) delete next[commentId]
      else next[commentId] = transition.nextVote
      return next
    })
    setUpvoteDelta((prev) => ({
      ...prev,
      [commentId]: (prev[commentId] ?? 0) + transition.upvoteDelta,
    }))

    startTransition(async () => {
      const result = await submitVote({ comment_id: commentId, value: "1" })
      if (!result.ok) {
        setVotes(snapshotVotes)
        setUpvoteDelta(snapshotDelta)
      }
    })
  }

  return {
    upvotesFor: (commentId) =>
      (comments.find((c) => c.id === commentId)?.upvoteCount ?? 0) +
      (upvoteDelta[commentId] ?? 0),
    voteFor: (commentId) => votes[commentId] ?? null,
    upvote,
  }
}

export function TrendingUpvoteButton({
  commentId,
  votes,
  className,
}: {
  commentId: number
  votes: TrendingVotes
  className?: string
}) {
  const active = votes.voteFor(commentId) === 1
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation()
        votes.upvote(commentId)
      }}
      aria-pressed={active}
      aria-label={active ? "Remove upvote" : "Upvote"}
      className={cn(
        "inline-flex h-8 shrink-0 items-center gap-1 rounded-full px-2.5 text-xs font-semibold tabular-nums transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : "bg-muted text-foreground hover:bg-muted/70",
        className,
      )}
    >
      <ArrowUp className="size-3.5" strokeWidth={2.5} aria-hidden />
      {votes.upvotesFor(commentId)}
    </button>
  )
}

type CardProps = {
  comment: MatchTrendingCommentCard
  votes: TrendingVotes
  currentUserId: string | null
  onOpen: (commentId: number) => void
  className?: string
}

/** Whole card opens the thread; the upvote button votes in place. */
export function TrendingCommentCard({
  comment,
  votes,
  currentUserId,
  onOpen,
  className,
}: CardProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(comment.id)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          onOpen(comment.id)
        }
      }}
      className={cn("flex cursor-pointer flex-col text-left", className)}
    >
      <div
        className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground"
        onClick={(event) => event.stopPropagation()}
      >
        <CommentAuthorLink
          currentUserId={currentUserId}
          authorUserId={comment.authorUserId}
          username={comment.authorUsername}
          displayName={comment.authorDisplayName}
          avatarUrl={comment.authorAvatarUrl}
        />
        <CommentFavouriteCrests
          size="sm"
          club={comment.authorClub}
          nationalTeam={comment.authorNationalTeam}
        />
        <span className="shrink-0">
          · <CommentTime dateString={comment.createdAt} />
        </span>
      </div>
      <p className="mt-2 line-clamp-3 flex-1 wrap-break-word text-sm leading-snug">
        {comment.body}
      </p>
      <div className="mt-3 flex items-center justify-between gap-2">
        <TrendingUpvoteButton commentId={comment.id} votes={votes} />
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
          <MessageCircle className="size-3.5" aria-hidden />
          View thread
        </span>
      </div>
    </div>
  )
}

type ListProps = {
  comments: MatchTrendingCommentCard[]
  votes: TrendingVotes
  currentUserId: string | null
  onOpen: (commentId: number) => void
  onSeeAll: () => void
  /** Empty state only: open the composer with this text ready. */
  onPrompt?: (text: string) => void
}

/** Phones and tablets: swipeable row right under the score card, next card peeking. */
export function MatchTrendingCarousel({
  comments,
  votes,
  currentUserId,
  onOpen,
  onSeeAll,
}: ListProps) {
  if (comments.length === 0) return null

  return (
    <section aria-label="Trending comments" className="mt-4">
      <div className="mb-2 flex items-baseline justify-between">
        <h2 className="text-sm font-semibold">Trending comments</h2>
        <button
          type="button"
          onClick={onSeeAll}
          className="text-xs font-semibold text-primary hover:underline"
        >
          See all
        </button>
      </div>
      <div className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {comments.map((comment) => (
          <TrendingCommentCard
            key={comment.id}
            comment={comment}
            votes={votes}
            currentUserId={currentUserId}
            onOpen={onOpen}
            className="w-[82%] shrink-0 snap-start rounded-lg border border-border bg-card p-4 md:w-[calc(50%-0.375rem)]"
          />
        ))}
      </div>
    </section>
  )
}

/** Starters offered when a match has no comments yet. */
const TAKE_PROMPTS = ["Man of the match", "Biggest letdown", "Turning point"]

/** Desktop sidebar: first thing beside the score card. */
export function MatchTrendingPanel({
  comments,
  votes,
  currentUserId,
  onOpen,
  onSeeAll,
  onPrompt,
}: ListProps) {
  return (
    <Panel>
      <PanelHeader title="Trending comments" />
      {comments.length === 0 ? (
        <TrendingEmptyState
          className="px-5 pt-2 pb-5"
          title="No takes on this match yet"
          description="Call it before anyone else does."
        >
          <div className="flex flex-wrap gap-2">
            {TAKE_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => (onPrompt ? onPrompt(`${prompt}: `) : onSeeAll())}
                className="rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
              >
                {prompt}
              </button>
            ))}
          </div>
        </TrendingEmptyState>
      ) : (
        <>
          <div className="mx-5 divide-y divide-border">
            {comments.map((comment) => (
              <TrendingCommentCard
                key={comment.id}
                comment={comment}
                votes={votes}
                currentUserId={currentUserId}
                onOpen={onOpen}
                className="py-4 transition-opacity hover:opacity-90"
              />
            ))}
          </div>
          <button
            type="button"
            onClick={onSeeAll}
            className="block w-full border-t border-border py-3.5 text-center text-sm font-semibold transition-colors hover:bg-muted/50"
          >
            All comments
          </button>
        </>
      )}
    </Panel>
  )
}
