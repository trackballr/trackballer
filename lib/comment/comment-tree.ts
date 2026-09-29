import type { CommentDisplay } from "./types"
import type { VoteTransition } from "./optimistic-vote"

function sortThreadChronologically(replies: CommentDisplay[]): CommentDisplay[] {
  return [...replies].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  )
}

function findCommentInForest(
  comments: CommentDisplay[],
  commentId: number,
): CommentDisplay | null {
  for (const root of comments) {
    if (root.id === commentId) return root
    const reply = root.replies.find((row) => row.id === commentId)
    if (reply) return reply
  }
  return null
}

function threadRootIdForParent(
  comments: CommentDisplay[],
  parentId: number,
): number | null {
  const parent = findCommentInForest(comments, parentId)
  if (!parent) return null
  return parent.thread_root_id ?? parent.id
}

function hasDirectChildrenInThread(
  replies: CommentDisplay[],
  commentId: number,
): boolean {
  return replies.some((reply) => reply.parent_id === commentId)
}

function patchRootComment(
  root: CommentDisplay,
  commentId: number,
  patch: (node: CommentDisplay) => CommentDisplay,
): CommentDisplay {
  if (root.id === commentId) {
    return patch(root)
  }

  if (root.replies.length === 0) {
    return root
  }

  return {
    ...root,
    replies: root.replies.map((reply) =>
      reply.id === commentId ? patch(reply) : reply,
    ),
  }
}

/** Every reply sits one step in, no matter how deep the debate goes. */
export const REPLY_INDENT = "1.25rem"

export function getThreadIndent(depth: number): string {
  if (depth <= 0) return "0"
  return REPLY_INDENT
}

export type ReplyAddress = {
  commentId: number
  authorUserId: string | null
  username: string | null
  displayName: string | null
}

/** Set when this reply answers another reply, not the original comment. */
export function replyAddress(root: CommentDisplay, reply: CommentDisplay): ReplyAddress | null {
  if (reply.parent_id == null || reply.parent_id === root.id) return null

  const parent =
    root.replies.find((row) => row.id === reply.parent_id) ??
    (root.id === reply.parent_id ? root : null)

  if (!parent) {
    return {
      commentId: reply.parent_id,
      authorUserId: null,
      username: null,
      displayName: null,
    }
  }

  return {
    commentId: parent.id,
    authorUserId: parent.user_id,
    username: parent.profile?.username ?? null,
    displayName: parent.profile?.display_name ?? null,
  }
}

export function updateVoteInTree(
  comments: CommentDisplay[],
  commentId: number,
  transition: VoteTransition,
): CommentDisplay[] {
  return comments.map((root) =>
    patchRootComment(root, commentId, (node) => ({
      ...node,
      score: node.score + transition.scoreDelta,
      upvote_count: Math.max(0, node.upvote_count + transition.upvoteDelta),
      downvote_count: Math.max(0, node.downvote_count + transition.downvoteDelta),
    })),
  )
}

export function softDeleteInTree(
  comments: CommentDisplay[],
  commentId: number,
): CommentDisplay[] {
  return comments.map((root) =>
    patchRootComment(root, commentId, (node) => ({
      ...node,
      is_deleted: true,
      body: node.body,
    })),
  )
}

/**
 * Remove a comment from the list, or leave a [deleted] stub when replies remain
 * (keeps thread structure per product spec).
 */
export function deleteCommentInTree(
  comments: CommentDisplay[],
  commentId: number,
): CommentDisplay[] {
  const next = comments
    .map((root) => {
      if (root.id === commentId) {
        const visibleReplies = root.replies.filter((reply) => !reply.is_deleted)
        if (visibleReplies.length === 0) {
          return null
        }
        return { ...root, is_deleted: true, replies: visibleReplies }
      }

      const replyIdx = root.replies.findIndex((reply) => reply.id === commentId)
      if (replyIdx < 0) {
        return root
      }

      if (hasDirectChildrenInThread(root.replies, commentId)) {
        return {
          ...root,
          replies: root.replies.map((reply) =>
            reply.id === commentId ? { ...reply, is_deleted: true } : reply,
          ),
        }
      }

      return {
        ...root,
        replies: root.replies.filter((reply) => reply.id !== commentId),
      }
    })
    .filter((comment): comment is CommentDisplay => comment != null)

  return next
}

/** Hide deleted comments unless they still anchor visible replies. */
export function pruneDeletedComments(comments: CommentDisplay[]): CommentDisplay[] {
  return comments
    .map((root) => ({
      ...root,
      replies: root.replies.filter(
        (reply) => !reply.is_deleted || hasDirectChildrenInThread(root.replies, reply.id),
      ),
    }))
    .filter((root) => !root.is_deleted || root.replies.length > 0)
}

export function removeCommentById(
  comments: CommentDisplay[],
  commentId: number,
): CommentDisplay[] {
  return comments
    .filter((root) => root.id !== commentId)
    .map((root) => ({
      ...root,
      replies: root.replies.filter((reply) => reply.id !== commentId),
    }))
}

export function commentExistsInTree(
  comments: CommentDisplay[],
  commentId: number,
): boolean {
  return findCommentInForest(comments, commentId) != null
}

export function collectPendingComments(comments: CommentDisplay[]): CommentDisplay[] {
  const pending: CommentDisplay[] = []
  for (const root of comments) {
    if (root.isPending || root.id < 0) pending.push(root)
    for (const reply of root.replies) {
      if (reply.isPending || reply.id < 0) pending.push(reply)
    }
  }
  return pending
}

function commentsMatchPending(pending: CommentDisplay, saved: CommentDisplay): boolean {
  return (
    !saved.isPending &&
    pending.user_id === saved.user_id &&
    pending.body === saved.body &&
    pending.parent_id === saved.parent_id
  )
}

function findMatchingSavedComment(
  comments: CommentDisplay[],
  pending: CommentDisplay,
): CommentDisplay | null {
  for (const root of comments) {
    if (commentsMatchPending(pending, root)) return root
    for (const reply of root.replies) {
      if (commentsMatchPending(pending, reply)) return reply
    }
  }
  return null
}

/** Keep in-flight pending rows when server props refresh mid-post. */
export function mergeServerWithPendingComments(
  serverComments: CommentDisplay[],
  localComments: CommentDisplay[],
): CommentDisplay[] {
  const pending = collectPendingComments(localComments)
  let merged = serverComments

  for (const row of pending) {
    if (findMatchingSavedComment(merged, row)) continue
    if (!commentExistsInTree(merged, row.id)) {
      merged = addCommentToTree(merged, row)
    }
  }

  return merged
}

/** Swap a temp row for the saved comment without duplicating after revalidation. */
export function settlePendingComment(
  comments: CommentDisplay[],
  tempId: number,
  real: CommentDisplay,
): CommentDisplay[] {
  const withoutTemp = removeCommentById(comments, tempId)
  if (commentExistsInTree(withoutTemp, real.id)) {
    return withoutTemp
  }
  if (findMatchingSavedComment(withoutTemp, { ...real, isPending: true, id: tempId })) {
    return withoutTemp
  }
  return addCommentToTree(withoutTemp, real)
}

export function replaceCommentInTree(
  comments: CommentDisplay[],
  tempId: number,
  real: CommentDisplay,
): CommentDisplay[] {
  return settlePendingComment(comments, tempId, real)
}

export function addCommentToTree(
  comments: CommentDisplay[],
  comment: CommentDisplay,
): CommentDisplay[] {
  if (comment.parent_id == null) {
    return [
      {
        ...comment,
        thread_root_id: null,
        thread_depth: 0,
        replies: comment.replies ?? [],
      },
      ...comments,
    ]
  }

  const rootId =
    comment.thread_root_id ?? threadRootIdForParent(comments, comment.parent_id)
  if (!rootId) return comments

  const parent = findCommentInForest(comments, comment.parent_id)
  const resolvedDepth =
    comment.thread_root_id != null
      ? (comment.thread_depth ?? 0)
      : (parent?.thread_depth ?? 0) + 1
  const withThreadFields: CommentDisplay = {
    ...comment,
    thread_root_id: rootId,
    thread_depth: resolvedDepth,
  }

  return comments.map((root) => {
    if (root.id !== rootId) return root
    return {
      ...root,
      replies: sortThreadChronologically([...root.replies, withThreadFields]),
    }
  })
}

export function appendUniqueParents(
  existing: CommentDisplay[],
  incoming: CommentDisplay[],
): CommentDisplay[] {
  const seen = new Set(existing.map((comment) => comment.id))
  const merged = [...existing]

  for (const comment of incoming) {
    if (seen.has(comment.id)) continue
    seen.add(comment.id)
    merged.push(comment)
  }

  return merged
}

export function appendThreadComments(
  comments: CommentDisplay[],
  threadRootId: number,
  incoming: CommentDisplay[],
): CommentDisplay[] {
  if (incoming.length === 0) return comments

  const seen = new Set<number>()
  for (const root of comments) {
    if (root.id !== threadRootId) continue
    for (const reply of root.replies) {
      seen.add(reply.id)
    }
  }

  return comments.map((root) => {
    if (root.id !== threadRootId) return root

    const nextReplies = [...root.replies]
    for (const reply of incoming) {
      if (seen.has(reply.id)) continue
      seen.add(reply.id)
      nextReplies.push(reply)
    }

    return {
      ...root,
      replies: sortThreadChronologically(nextReplies),
    }
  })
}

/** @deprecated Use appendThreadComments */
export const appendRepliesToParent = appendThreadComments

export function sortComments(
  comments: CommentDisplay[],
  sort: "top" | "new",
): CommentDisplay[] {
  const sorted = [...comments]
  if (sort === "top") {
    return sorted.sort((a, b) => b.score - a.score)
  }
  return sorted.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  )
}
