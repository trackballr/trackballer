"use client"

import { useState, useTransition } from "react"

import {
  addCommentToTree,
  appendThreadComments,
  deleteCommentInTree,
  removeCommentById,
  settlePendingComment,
  updateVoteInTree,
} from "@/lib/comment/comment-tree"
import { fetchThreadCommentsPageAction } from "@/lib/comment/fetch-comments-page"
import { applyUserVoteToMap, computeVoteTransition } from "@/lib/comment/optimistic-vote"
import type { ReplyPaginationMeta } from "@/lib/comment/pagination"
import { submitComment, deleteComment } from "@/lib/comment/submit-comment"
import { submitVote } from "@/lib/comment/submit-vote"
import type { CommentDisplay } from "@/lib/comment/types"

export type CommentTarget = { type: "player" | "match"; id: number }

type UseCommentTreeActionsOptions = {
  initialComments: CommentDisplay[]
  initialUserVotes: Record<number, 1 | -1>
  initialReplyPagination: Record<number, ReplyPaginationMeta>
  target: CommentTarget
  isLoggedIn: boolean
  currentUserId: string | null
  /** Called with +1 / -1 when a top-level comment is added or rolled back. */
  onParentCountChange?: (delta: number) => void
}

export function mergeVoteMaps(
  existing: Record<number, 1 | -1>,
  incoming: Record<number, 1 | -1>,
): Record<number, 1 | -1> {
  return { ...existing, ...incoming }
}

function buildPendingComment(
  body: string,
  target: CommentTarget,
  currentUserId: string,
  parentId?: number,
): CommentDisplay {
  return {
    id: -Date.now(),
    body,
    score: 0,
    upvote_count: 0,
    downvote_count: 0,
    created_at: new Date().toISOString(),
    is_deleted: false,
    parent_id: parentId ?? null,
    user_id: currentUserId,
    player_id: target.type === "player" ? target.id : null,
    fixture_id: target.type === "match" ? target.id : null,
    target_type: target.type,
    thread_root_id: null,
    thread_depth: 0,
    profile: {
      id: currentUserId,
      username: null,
      display_name: "You",
      avatar_url: null,
      favourite_club: null,
      favourite_national_team: null,
    },
    replies: [],
    isPending: true,
  }
}

/**
 * Optimistic vote / delete / reply / load-more-replies over a comment forest.
 * Shared by the match/player comment section and profile comment history.
 */
export function useCommentTreeActions({
  initialComments,
  initialUserVotes,
  initialReplyPagination,
  target,
  isLoggedIn,
  currentUserId,
  onParentCountChange,
}: UseCommentTreeActionsOptions) {
  const [comments, setComments] = useState<CommentDisplay[]>(initialComments)
  const [userVotes, setUserVotes] = useState(initialUserVotes)
  const [replyMeta, setReplyMeta] =
    useState<Record<number, ReplyPaginationMeta>>(initialReplyPagination)
  const [loadingThreadFor, setLoadingThreadFor] = useState<number | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  function handleLoadMoreThread(threadRootId: number) {
    const meta = replyMeta[threadRootId]
    if (!meta?.hasMore || loadingThreadFor != null) return

    setLoadingThreadFor(threadRootId)
    setErrorMessage(null)

    startTransition(async () => {
      const result = await fetchThreadCommentsPageAction({
        thread_root_id: threadRootId,
        cursor: meta.nextCursor ?? undefined,
      })

      setLoadingThreadFor(null)

      if (!result.ok) {
        setErrorMessage(result.error)
        return
      }

      setComments((prev) => appendThreadComments(prev, threadRootId, result.replies))
      setUserVotes((prev) => mergeVoteMaps(prev, result.userVotes))
      setReplyMeta((prev) => ({
        ...prev,
        [threadRootId]: { hasMore: result.hasMore, nextCursor: result.nextCursor },
      }))
    })
  }

  function handleVote(commentId: number, value: 1 | -1) {
    if (!isLoggedIn) {
      window.location.href = "/login"
      return
    }

    const currentVote = userVotes[commentId] ?? null
    const transition = computeVoteTransition(currentVote, value)
    const snapshotComments = comments
    const snapshotVotes = userVotes

    setUserVotes(applyUserVoteToMap(userVotes, commentId, transition.nextVote))
    setComments(updateVoteInTree(comments, commentId, transition))
    setErrorMessage(null)

    startTransition(async () => {
      const result = await submitVote({
        comment_id: commentId,
        value: String(value) as "1" | "-1",
      })

      if (!result.ok) {
        setComments(snapshotComments)
        setUserVotes(snapshotVotes)
        setErrorMessage(result.error)
      }
    })
  }

  function handleDelete(commentId: number) {
    const snapshotComments = comments

    setComments(deleteCommentInTree(comments, commentId))
    setErrorMessage(null)

    startTransition(async () => {
      const result = await deleteComment({ comment_id: commentId })
      if (!result.ok) {
        setComments(snapshotComments)
        setErrorMessage(result.error)
      }
    })
  }

  function handlePostComment(
    body: string,
    parentId?: number,
  ): Promise<{ ok: boolean; error?: string }> {
    if (!isLoggedIn || !currentUserId) {
      return Promise.resolve({ ok: false, error: "Sign in to comment." })
    }

    const pending = buildPendingComment(body, target, currentUserId, parentId)
    const tempId = pending.id

    setComments((prev) => addCommentToTree(prev, pending))
    if (parentId == null) onParentCountChange?.(1)

    return new Promise((resolve) => {
      startTransition(async () => {
        const result = await submitComment({
          body,
          target_type: target.type,
          ...(target.type === "player"
            ? { player_id: target.id }
            : { fixture_id: target.id }),
          ...(parentId != null ? { parent_id: parentId } : {}),
        })

        if (result.ok) {
          setComments((prev) => settlePendingComment(prev, tempId, result.comment))
          resolve({ ok: true })
          return
        }

        setComments((prev) => removeCommentById(prev, tempId))
        if (parentId == null) onParentCountChange?.(-1)
        setErrorMessage(result.error)
        resolve({ ok: false, error: result.error })
      })
    })
  }

  return {
    comments,
    setComments,
    userVotes,
    setUserVotes,
    replyMeta,
    setReplyMeta,
    loadingThreadFor,
    errorMessage,
    setErrorMessage,
    startTransition,
    handleLoadMoreThread,
    handleVote,
    handleDelete,
    handlePostComment,
  }
}
