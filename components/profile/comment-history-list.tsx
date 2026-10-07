"use client"

import Link from "next/link"
import { useCallback, useEffect, useState, useTransition } from "react"

import { CommentThreadBlock } from "@/components/comment/comment-thread-block"
import {
  useCommentTreeActions,
  type CommentTarget,
} from "@/components/comment/use-comment-tree-actions"
import { useInfiniteScroll } from "@/components/comment/use-infinite-scroll"
import {
  CommentHistoryContent,
  commentTargetHref,
} from "@/components/profile/recent-comments-list"
import { Panel, PanelEmpty } from "@/components/ui/panel"
import { pruneDeletedComments } from "@/lib/comment/comment-tree"
import {
  fetchCommentThreadAction,
  type FetchCommentThreadResult,
} from "@/lib/comment/fetch-comments-page"
import { fetchCommentHistoryPageAction } from "@/lib/profile/actions/fetch-history"
import type {
  CommentHistoryCursor,
  CommentHistoryPage,
  RecentCommentItem,
} from "@/lib/profile/types"
import { cn } from "@/lib/utils"

function targetFor(comment: RecentCommentItem): CommentTarget {
  return comment.targetType === "player"
    ? { type: "player", id: comment.playerId }
    : { type: "match", id: comment.fixtureId }
}

function targetName(comment: RecentCommentItem): string {
  return comment.targetType === "player"
    ? `${comment.playerName}'s page`
    : `${comment.homeTeam.name} vs ${comment.awayTeam.name}`
}

type ViewerProps = {
  isLoggedIn: boolean
  currentUserId: string | null
}

/** Thread state lives here so vote / reply / delete behave as on the match page. */
function HistoryThreadView({
  comment,
  thread,
  isLoggedIn,
  currentUserId,
}: ViewerProps & {
  comment: RecentCommentItem
  thread: Extract<FetchCommentThreadResult, { ok: true }>
}) {
  const {
    comments,
    userVotes,
    replyMeta,
    loadingThreadFor,
    errorMessage,
    handleLoadMoreThread,
    handleVote,
    handleDelete,
    handlePostComment,
  } = useCommentTreeActions({
    initialComments: [thread.root],
    initialUserVotes: thread.userVotes,
    initialReplyPagination: { [thread.root.id]: thread.replyPagination },
    target: targetFor(comment),
    isLoggedIn,
    currentUserId,
  })

  const root = pruneDeletedComments(comments)[0]

  return (
    <div className="space-y-3">
      {errorMessage ? (
        <p className="text-sm text-destructive" role="alert">
          {errorMessage}
        </p>
      ) : null}
      {root ? (
        <CommentThreadBlock
          root={root}
          userVotesMap={userVotes}
          threadMeta={replyMeta[root.id]}
          isLoadingThread={loadingThreadFor === root.id}
          isLoggedIn={isLoggedIn}
          currentUserId={currentUserId}
          highlightId={comment.id}
          onVote={handleVote}
          onDelete={handleDelete}
          onPostReply={handlePostComment}
          onLoadMoreThread={handleLoadMoreThread}
        />
      ) : (
        <p className="text-sm text-muted-foreground">This thread was deleted.</p>
      )}
    </div>
  )
}

function HistoryThread({ comment, ...viewer }: ViewerProps & { comment: RecentCommentItem }) {
  const [result, setResult] = useState<FetchCommentThreadResult | null>(null)

  useEffect(() => {
    let cancelled = false
    fetchCommentThreadAction({ thread_root_id: comment.threadRootId ?? comment.id }).then(
      (next) => {
        if (!cancelled) setResult(next)
      },
    )
    return () => {
      cancelled = true
    }
  }, [comment.id, comment.threadRootId])

  return (
    <div className="mb-4 rounded-lg bg-muted/50 p-4">
      {result == null ? (
        <p className="text-sm text-muted-foreground">Loading thread…</p>
      ) : result.ok ? (
        <HistoryThreadView comment={comment} thread={result} {...viewer} />
      ) : (
        <p className="text-sm text-muted-foreground">{result.error}</p>
      )}
      <Link
        href={commentTargetHref(comment)}
        className="mt-4 inline-block text-xs font-semibold text-primary hover:underline"
      >
        Open on {targetName(comment)} →
      </Link>
    </div>
  )
}

type CommentHistoryListProps = ViewerProps & {
  userId: string
  initialPage: CommentHistoryPage
  /** Comment to expand on arrival, from ?open= on the profile page links. */
  initialOpenId: number | null
}

export function CommentHistoryList({
  userId,
  initialPage,
  initialOpenId,
  isLoggedIn,
  currentUserId,
}: CommentHistoryListProps) {
  const [items, setItems] = useState(initialPage.items)
  const [cursor, setCursor] = useState<CommentHistoryCursor | null>(initialPage.nextCursor)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [openIds, setOpenIds] = useState<Set<number>>(
    () => new Set(initialOpenId != null ? [initialOpenId] : []),
  )
  const [, startTransition] = useTransition()

  useEffect(() => {
    if (initialOpenId == null) return
    document
      .getElementById(`history-comment-${initialOpenId}`)
      ?.scrollIntoView({ block: "start" })
  }, [initialOpenId])

  const loadMore = useCallback(() => {
    if (!cursor || isLoading) return
    setIsLoading(true)
    startTransition(async () => {
      const result = await fetchCommentHistoryPageAction({ userId, cursor })
      setIsLoading(false)
      if (!result.ok) {
        setError(result.error)
        return
      }
      setItems((prev) => {
        const seen = new Set(prev.map((item) => item.id))
        return [...prev, ...result.items.filter((item) => !seen.has(item.id))]
      })
      setCursor(result.nextCursor)
    })
  }, [cursor, isLoading, userId])

  const sentinelRef = useInfiniteScroll({
    hasMore: cursor != null && error == null,
    isLoading,
    onLoadMore: loadMore,
  })

  function toggle(id: number) {
    setOpenIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  if (items.length === 0) {
    return (
      <Panel className="pt-4">
        <PanelEmpty>No comments yet.</PanelEmpty>
      </Panel>
    )
  }

  return (
    <Panel>
      <div className="mx-5 divide-y divide-border">
        {items.map((comment) => {
          const isOpen = openIds.has(comment.id)
          return (
            <div
              key={comment.id}
              id={`history-comment-${comment.id}`}
              className="scroll-mt-20"
            >
              <button
                type="button"
                onClick={() => toggle(comment.id)}
                aria-expanded={isOpen}
                className="block w-full py-4 text-left"
              >
                <CommentHistoryContent comment={comment} />
                <span
                  className={cn(
                    "mt-2 inline-block text-xs font-semibold",
                    isOpen ? "text-muted-foreground" : "text-primary",
                  )}
                >
                  {isOpen ? "Hide thread" : "View thread"}
                </span>
              </button>
              {isOpen ? (
                <HistoryThread
                  comment={comment}
                  isLoggedIn={isLoggedIn}
                  currentUserId={currentUserId}
                />
              ) : null}
            </div>
          )
        })}
      </div>

      {error ? (
        <p className="px-5 py-4 text-center text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : cursor ? (
        <div ref={sentinelRef} className="py-4 text-center text-sm text-muted-foreground">
          {isLoading ? "Loading older comments…" : null}
        </div>
      ) : null}
    </Panel>
  )
}
