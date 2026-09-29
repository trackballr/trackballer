import type { CommentWithProfile } from "./types"

export const PARENT_PAGE_SIZE = 20
export const REPLY_PAGE_SIZE = 10
export const INITIAL_REPLY_PREVIEW = 5
/** Abuse guard only. The screen never stops a normal debate at this depth. */
export const MAX_THREAD_DEPTH = 100

export type CommentSort = "top" | "new"

export type TopParentCursor = { sort: "top"; score: number; id: number }
export type NewParentCursor = { sort: "new"; created_at: string; id: number }
export type ParentCursor = TopParentCursor | NewParentCursor

export type ReplyCursor = { created_at: string; id: number }

export type ReplyPaginationMeta = {
  hasMore: boolean
  nextCursor: ReplyCursor | null
}

export function parentCursorFromComment(
  comment: CommentWithProfile,
  sort: CommentSort,
): ParentCursor {
  if (sort === "top") {
    return { sort: "top", score: comment.score, id: comment.id }
  }
  return { sort: "new", created_at: comment.created_at, id: comment.id }
}

export function replyCursorFromComment(comment: CommentWithProfile): ReplyCursor {
  return { created_at: comment.created_at, id: comment.id }
}

type KeysetQuery = {
  or: (filter: string) => KeysetQuery
}

/** Keyset filter for the next parent page (Top or New sort). */
export function applyParentKeysetFilter<T extends KeysetQuery>(
  query: T,
  sort: CommentSort,
  cursor: ParentCursor | null | undefined,
): T {
  if (!cursor) return query

  if (sort === "top" && cursor.sort === "top") {
    return query.or(
      `score.lt.${cursor.score},and(score.eq.${cursor.score},id.lt.${cursor.id})`,
    ) as T
  }

  if (sort === "new" && cursor.sort === "new") {
    return query.or(
      `created_at.lt.${cursor.created_at},and(created_at.eq.${cursor.created_at},id.lt.${cursor.id})`,
    ) as T
  }

  return query
}

/** Keyset filter for the next reply page (oldest-first). */
export function applyReplyKeysetFilter<T extends KeysetQuery>(
  query: T,
  cursor: ReplyCursor | null | undefined,
): T {
  if (!cursor) return query

  return query.or(
    `created_at.gt.${cursor.created_at},and(created_at.eq.${cursor.created_at},id.gt.${cursor.id})`,
  ) as T
}
