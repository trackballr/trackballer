"use client"

import { useCallback, useEffect, useMemo, useState, useTransition, ViewTransition } from "react"

import { CommentThreadBlock } from "./comment-thread-block"
import { CommentComposer } from "./comment-composer"
import { mergeVoteMaps, useCommentTreeActions } from "./use-comment-tree-actions"
import { useInfiniteScroll } from "./use-infinite-scroll"
import {
  appendUniqueParents,
  mergeServerWithPendingComments,
  pruneDeletedComments,
} from "@/lib/comment/comment-tree"
import { fetchParentCommentsPageAction } from "@/lib/comment/fetch-comments-page"
import type {
  CommentSort,
  ParentCursor,
  ReplyPaginationMeta,
} from "@/lib/comment/pagination"
import type { CommentWithProfile } from "@/lib/comment/types"

interface CommentThreadProps {
  initialComments: CommentWithProfile[]
  initialUserVotes: Record<number, 1 | -1>
  totalParentCount: number
  initialParentHasMore: boolean
  initialParentNextCursor: ParentCursor | null
  initialReplyPagination: Record<number, ReplyPaginationMeta>
  initialSort?: CommentSort
  targetType: "player" | "match"
  targetId: number
  isLoggedIn: boolean
  currentUserId: string | null
}

export function CommentThread({
  initialComments,
  initialUserVotes,
  totalParentCount: initialTotalParentCount,
  initialParentHasMore,
  initialParentNextCursor,
  initialReplyPagination,
  initialSort = "top",
  targetType,
  targetId,
  isLoggedIn,
  currentUserId,
}: CommentThreadProps) {
  const [sort, setSort] = useState<CommentSort>(initialSort)
  const [totalParentCount, setTotalParentCount] = useState(initialTotalParentCount)
  const [parentHasMore, setParentHasMore] = useState(initialParentHasMore)
  const [parentCursor, setParentCursor] = useState<ParentCursor | null>(
    initialParentNextCursor,
  )
  const [isLoadingParents, setIsLoadingParents] = useState(false)
  const [isLoadingSort, setIsLoadingSort] = useState(false)
  const [, startTransition] = useTransition()

  const {
    comments,
    setComments,
    userVotes,
    setUserVotes,
    replyMeta,
    setReplyMeta,
    loadingThreadFor,
    errorMessage,
    setErrorMessage,
    handleLoadMoreThread,
    handleVote,
    handleDelete,
    handlePostComment,
  } = useCommentTreeActions({
    initialComments,
    initialUserVotes,
    initialReplyPagination,
    target: { type: targetType, id: targetId },
    isLoggedIn,
    currentUserId,
    onParentCountChange: (delta) =>
      setTotalParentCount((count) => Math.max(0, count + delta)),
  })

  useEffect(() => {
    setComments((prev) =>
      mergeServerWithPendingComments(pruneDeletedComments(initialComments), prev),
    )
    setUserVotes(initialUserVotes)
    setTotalParentCount(initialTotalParentCount)
    setParentHasMore(initialParentHasMore)
    setParentCursor(initialParentNextCursor)
    setReplyMeta(initialReplyPagination)
    setSort(initialSort)
  }, [
    initialComments,
    initialUserVotes,
    initialTotalParentCount,
    initialParentHasMore,
    initialParentNextCursor,
    initialReplyPagination,
    initialSort,
    setComments,
    setUserVotes,
    setReplyMeta,
  ])

  const visibleComments = useMemo(
    () => pruneDeletedComments(comments),
    [comments],
  )

  const loadMoreParents = useCallback(() => {
    if (!parentHasMore || isLoadingParents || isLoadingSort) return

    setIsLoadingParents(true)
    startTransition(async () => {
      const result = await fetchParentCommentsPageAction({
        target_type: targetType,
        target_id: targetId,
        sort,
        cursor: parentCursor ?? undefined,
      })

      setIsLoadingParents(false)

      if (!result.ok) {
        setErrorMessage(result.error)
        return
      }

      setComments((prev) =>
        appendUniqueParents(prev, pruneDeletedComments(result.comments)),
      )
      setUserVotes((prev) => mergeVoteMaps(prev, result.userVotes))
      setParentHasMore(result.hasMore)
      setParentCursor(result.nextCursor)
      setReplyMeta((prev) => ({ ...prev, ...result.replyPagination }))
    })
  }, [
    parentHasMore,
    isLoadingParents,
    isLoadingSort,
    targetType,
    targetId,
    sort,
    parentCursor,
    startTransition,
    setComments,
    setUserVotes,
    setReplyMeta,
    setErrorMessage,
  ])

  const parentSentinelRef = useInfiniteScroll({
    hasMore: parentHasMore,
    isLoading: isLoadingParents || isLoadingSort,
    onLoadMore: loadMoreParents,
  })

  function handleSortChange(nextSort: CommentSort) {
    if (nextSort === sort || isLoadingSort) return

    setSort(nextSort)
    setIsLoadingSort(true)
    setErrorMessage(null)

    startTransition(async () => {
      const result = await fetchParentCommentsPageAction({
        target_type: targetType,
        target_id: targetId,
        sort: nextSort,
      })

      setIsLoadingSort(false)

      if (!result.ok) {
        setErrorMessage(result.error)
        return
      }

      setComments((prev) =>
        mergeServerWithPendingComments(pruneDeletedComments(result.comments), prev),
      )
      setUserVotes((prev) => mergeVoteMaps(prev, result.userVotes))
      setParentHasMore(result.hasMore)
      setParentCursor(result.nextCursor)
      setReplyMeta(result.replyPagination)
    })
  }

  return (
    <section className="mt-8 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Comments ({totalParentCount})</h3>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handleSortChange("top")}
            disabled={isLoadingSort}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50 ${
              sort === "top"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            Top
          </button>
          <button
            type="button"
            onClick={() => handleSortChange("new")}
            disabled={isLoadingSort}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50 ${
              sort === "new"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            New
          </button>
        </div>
      </div>

      <CommentComposer
        isLoggedIn={isLoggedIn}
        onPost={(body) => handlePostComment(body)}
      />

      {errorMessage && (
        <p className="text-sm text-destructive" role="alert">
          {errorMessage}
        </p>
      )}

      {visibleComments.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No comments yet. Be the first to comment!
        </p>
      ) : (
        <div className={`space-y-6 ${isLoadingSort ? "opacity-60" : ""}`}>
          {visibleComments.map((comment) => (
            <ViewTransition key={comment.id} enter="fade-in" default="none">
              <CommentThreadBlock
                root={comment}
                userVotesMap={userVotes}
                threadMeta={replyMeta[comment.id]}
                isLoadingThread={loadingThreadFor === comment.id}
                isLoggedIn={isLoggedIn}
                currentUserId={currentUserId}
                onVote={handleVote}
                onDelete={handleDelete}
                onPostReply={(body, parentId) => handlePostComment(body, parentId)}
                onLoadMoreThread={handleLoadMoreThread}
              />
            </ViewTransition>
          ))}

          {parentHasMore && (
            <div ref={parentSentinelRef} className="flex justify-center py-4">
              {isLoadingParents && (
                <p className="text-sm text-muted-foreground">Loading more comments…</p>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  )
}
