import type { SupabaseClient } from "@supabase/supabase-js"

import type { Database } from "@/lib/database.types"
import { createClient } from "@/lib/supabase/server"
import { pruneDeletedComments } from "@/lib/comment/comment-tree"
import {
  buildUserVotesMap,
  collectCommentIds,
  normalizeCommentRow,
} from "@/lib/comment/normalize"
import {
  applyParentKeysetFilter,
  applyReplyKeysetFilter,
  INITIAL_REPLY_PREVIEW,
  parentCursorFromComment,
  PARENT_PAGE_SIZE,
  REPLY_PAGE_SIZE,
  replyCursorFromComment,
  type CommentSort,
  type ParentCursor,
  type ReplyCursor,
  type ReplyPaginationMeta,
} from "@/lib/comment/pagination"
import { COMMENT_PROFILE_SELECT } from "@/lib/comment/profile-select"
import type { CommentWithProfile } from "@/lib/comment/types"

export const COMMENT_WITH_PROFILE = `
  *,
  profile:profiles!comments_user_id_fkey(${COMMENT_PROFILE_SELECT})
`

export type CommentsPageData = {
  comments: CommentWithProfile[]
  userVotes: Record<number, 1 | -1>
  totalParentCount: number
  parentHasMore: boolean
  parentNextCursor: ParentCursor | null
  replyPagination: Record<number, ReplyPaginationMeta>
  initialSort: CommentSort
}

type TargetFilter = {
  targetType: "player" | "match"
  targetId: number
}

function targetColumn(targetType: "player" | "match"): "player_id" | "fixture_id" {
  return targetType === "player" ? "player_id" : "fixture_id"
}

function baseParentQuery(
  supabase: SupabaseClient<Database>,
  { targetType, targetId }: TargetFilter,
) {
  const column = targetColumn(targetType)
  return supabase
    .from("comments")
    .select(COMMENT_WITH_PROFILE)
    .eq("target_type", targetType)
    .eq(column, targetId)
    .is("parent_id", null)
}

function orderParents(query: ReturnType<typeof baseParentQuery>, sort: CommentSort) {
  if (sort === "top") {
    return query.order("score", { ascending: false }).order("id", { ascending: false })
  }
  return query.order("created_at", { ascending: false }).order("id", { ascending: false })
}

export async function countParentComments(
  supabase: SupabaseClient<Database>,
  target: TargetFilter,
): Promise<number> {
  const column = targetColumn(target.targetType)
  const { count, error } = await supabase
    .from("comments")
    .select("id", { count: "exact", head: true })
    .eq("target_type", target.targetType)
    .eq(column, target.targetId)
    .is("parent_id", null)
    .eq("is_deleted", false)

  if (error) {
    console.error("countParentComments failed:", error.message)
    return 0
  }

  return count ?? 0
}

export async function fetchParentCommentsPage(
  supabase: SupabaseClient<Database>,
  target: TargetFilter,
  sort: CommentSort,
  cursor?: ParentCursor | null,
  limit = PARENT_PAGE_SIZE,
): Promise<{
  parents: CommentWithProfile[]
  nextCursor: ParentCursor | null
  hasMore: boolean
}> {
  let query = orderParents(baseParentQuery(supabase, target), sort)
  query = applyParentKeysetFilter(query, sort, cursor)
  query = query.limit(limit + 1)

  const { data, error } = await query

  if (error) {
    console.error("fetchParentCommentsPage failed:", error.message)
    return { parents: [], nextCursor: null, hasMore: false }
  }

  const rows = (data ?? []).map((row) => normalizeCommentRow(row))
  const hasMore = rows.length > limit
  const parents = hasMore ? rows.slice(0, limit) : rows
  const last = parents.at(-1)

  return {
    parents,
    hasMore,
    nextCursor: last && hasMore ? parentCursorFromComment(last, sort) : null,
  }
}

export async function fetchThreadCommentsPage(
  supabase: SupabaseClient<Database>,
  threadRootId: number,
  cursor?: ReplyCursor | null,
  limit = REPLY_PAGE_SIZE,
): Promise<{
  replies: CommentWithProfile[]
  nextCursor: ReplyCursor | null
  hasMore: boolean
}> {
  let query = supabase
    .from("comments")
    .select(COMMENT_WITH_PROFILE)
    .eq("thread_root_id", threadRootId)
    .eq("is_deleted", false)
    .order("created_at", { ascending: true })
    .order("id", { ascending: true })

  query = applyReplyKeysetFilter(query, cursor)
  query = query.limit(limit + 1)

  const { data, error } = await query

  if (error) {
    console.error("fetchThreadCommentsPage failed:", error.message)
    return { replies: [], nextCursor: null, hasMore: false }
  }

  const rows = (data ?? []).map((row) => normalizeCommentRow(row))
  const hasMore = rows.length > limit
  const replies = hasMore ? rows.slice(0, limit) : rows
  const last = replies.at(-1)

  return {
    replies,
    hasMore,
    nextCursor: last && hasMore ? replyCursorFromComment(last) : null,
  }
}

export async function fetchCommentById(
  supabase: SupabaseClient<Database>,
  commentId: number,
): Promise<CommentWithProfile | null> {
  const { data, error } = await supabase
    .from("comments")
    .select(COMMENT_WITH_PROFILE)
    .eq("id", commentId)
    .maybeSingle()

  if (error) {
    console.error("fetchCommentById failed:", error.message)
    return null
  }

  return data ? normalizeCommentRow(data) : null
}

async function fetchThreadPreviewForRoot(
  supabase: SupabaseClient<Database>,
  threadRootId: number,
  previewSize = INITIAL_REPLY_PREVIEW,
): Promise<{
  replies: CommentWithProfile[]
  meta: ReplyPaginationMeta
}> {
  const { replies, nextCursor, hasMore } = await fetchThreadCommentsPage(
    supabase,
    threadRootId,
    null,
    previewSize,
  )

  return {
    replies,
    meta: { hasMore, nextCursor },
  }
}

export async function enrichParentsWithReplyPreviews(
  supabase: SupabaseClient<Database>,
  parents: CommentWithProfile[],
  previewSize = INITIAL_REPLY_PREVIEW,
): Promise<{
  parents: CommentWithProfile[]
  replyPagination: Record<number, ReplyPaginationMeta>
}> {
  if (parents.length === 0) {
    return { parents: [], replyPagination: {} }
  }

  const previews = await Promise.all(
    parents.map((parent) => fetchThreadPreviewForRoot(supabase, parent.id, previewSize)),
  )

  const replyPagination: Record<number, ReplyPaginationMeta> = {}
  const parentsWithReplies = parents.map((parent, index) => {
    const preview = previews[index]!
    replyPagination[parent.id] = preview.meta
    return { ...parent, replies: preview.replies }
  })

  return { parents: parentsWithReplies, replyPagination }
}

export async function fetchVotesForComments(
  supabase: SupabaseClient<Database>,
  userId: string | null,
  comments: CommentWithProfile[],
): Promise<Record<number, 1 | -1>> {
  const allCommentIds = collectCommentIds(comments)

  if (!userId || allCommentIds.length === 0) {
    return {}
  }

  const { data: votes, error } = await supabase
    .from("comment_votes")
    .select("comment_id, value")
    .eq("user_id", userId)
    .in("comment_id", allCommentIds)

  if (error) {
    console.error("fetchVotesForComments failed:", error.message)
    return {}
  }

  return buildUserVotesMap(votes ?? [])
}

const emptyPage: CommentsPageData = {
  comments: [],
  userVotes: {},
  totalParentCount: 0,
  parentHasMore: false,
  parentNextCursor: null,
  replyPagination: {},
  initialSort: "top",
}

export async function getComments(
  targetType: "player" | "match",
  targetId: number,
  userId: string | null,
  sort: CommentSort = "top",
): Promise<CommentsPageData> {
  const supabase = await createClient()
  const target: TargetFilter = { targetType, targetId }

  const [totalParentCount, parentPage] = await Promise.all([
    countParentComments(supabase, target),
    fetchParentCommentsPage(supabase, target, sort),
  ])

  if (parentPage.parents.length === 0) {
    return { ...emptyPage, totalParentCount }
  }

  const { parents, replyPagination } = await enrichParentsWithReplyPreviews(
    supabase,
    parentPage.parents,
  )

  const comments = pruneDeletedComments(parents)
  const userVotes = await fetchVotesForComments(supabase, userId, comments)

  return {
    comments,
    userVotes,
    totalParentCount,
    parentHasMore: parentPage.hasMore,
    parentNextCursor: parentPage.nextCursor,
    replyPagination,
    initialSort: sort,
  }
}
