"use server"

import { z } from "zod"

import {
  enrichParentsWithReplyPreviews,
  fetchCommentById,
  fetchParentCommentsPage,
  fetchThreadCommentsPage,
  fetchVotesForComments,
} from "@/lib/comment/queries"
import {
  INITIAL_REPLY_PREVIEW,
  type ParentCursor,
  type ReplyCursor,
} from "@/lib/comment/pagination"
import { pruneDeletedComments } from "@/lib/comment/comment-tree"
import { getServerAuth } from "@/lib/auth/server-session"
import { createClient } from "@/lib/supabase/server"
import type { CommentWithProfile } from "@/lib/comment/types"

const targetSchema = z.object({
  target_type: z.enum(["player", "match"]),
  target_id: z.number().int().positive(),
})

const parentCursorSchema = z.discriminatedUnion("sort", [
  z.object({
    sort: z.literal("top"),
    score: z.number().int(),
    id: z.number().int().positive(),
  }),
  z.object({
    sort: z.literal("new"),
    created_at: z.string(),
    id: z.number().int().positive(),
  }),
])

const fetchParentPageSchema = targetSchema.extend({
  sort: z.enum(["top", "new"]),
  cursor: parentCursorSchema.nullable().optional(),
})

const threadCursorSchema = z.object({
  created_at: z.string(),
  id: z.number().int().positive(),
})

const fetchThreadPageSchema = z.object({
  thread_root_id: z.number().int().positive(),
  cursor: threadCursorSchema.nullable().optional(),
})

export type FetchParentCommentsPageResult =
  | {
      ok: true
      comments: CommentWithProfile[]
      userVotes: Record<number, 1 | -1>
      nextCursor: ParentCursor | null
      hasMore: boolean
      replyPagination: Record<
        number,
        { hasMore: boolean; nextCursor: ReplyCursor | null }
      >
    }
  | { ok: false; error: string }

export async function fetchParentCommentsPageAction(
  input: unknown,
): Promise<FetchParentCommentsPageResult> {
  const parsed = fetchParentPageSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: "Invalid request." }
  }

  const { target_type, target_id, sort, cursor } = parsed.data
  const supabase = await createClient()
  const auth = await getServerAuth(supabase)

  const parentPage = await fetchParentCommentsPage(
    supabase,
    { targetType: target_type, targetId: target_id },
    sort,
    cursor ?? null,
  )

  if (parentPage.parents.length === 0) {
    return {
      ok: true,
      comments: [],
      userVotes: {},
      nextCursor: null,
      hasMore: false,
      replyPagination: {},
    }
  }

  const { parents, replyPagination } = await enrichParentsWithReplyPreviews(
    supabase,
    parentPage.parents,
    INITIAL_REPLY_PREVIEW,
  )

  const comments = pruneDeletedComments(parents)
  const userVotes = await fetchVotesForComments(
    supabase,
    auth?.userId ?? null,
    comments,
  )

  return {
    ok: true,
    comments,
    userVotes,
    nextCursor: parentPage.nextCursor,
    hasMore: parentPage.hasMore,
    replyPagination,
  }
}

export type FetchThreadCommentsPageResult =
  | {
      ok: true
      replies: CommentWithProfile[]
      userVotes: Record<number, 1 | -1>
      nextCursor: ReplyCursor | null
      hasMore: boolean
    }
  | { ok: false; error: string }

export async function fetchThreadCommentsPageAction(
  input: unknown,
): Promise<FetchThreadCommentsPageResult> {
  const parsed = fetchThreadPageSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: "Invalid request." }
  }

  const { thread_root_id, cursor } = parsed.data
  const supabase = await createClient()
  const auth = await getServerAuth(supabase)

  const page = await fetchThreadCommentsPage(supabase, thread_root_id, cursor ?? null)

  const userVotes = await fetchVotesForComments(
    supabase,
    auth?.userId ?? null,
    page.replies,
  )

  return {
    ok: true,
    replies: page.replies,
    userVotes,
    nextCursor: page.nextCursor,
    hasMore: page.hasMore,
  }
}

/** @deprecated Use fetchThreadCommentsPageAction */
export const fetchReplyCommentsPageAction = fetchThreadCommentsPageAction

const fetchThreadSchema = z.object({
  thread_root_id: z.number().int().positive(),
})

export type FetchCommentThreadResult =
  | {
      ok: true
      root: CommentWithProfile
      userVotes: Record<number, 1 | -1>
      replyPagination: { hasMore: boolean; nextCursor: ReplyCursor | null }
    }
  | { ok: false; error: string }

/** A whole thread opened from outside its page (profile comment history). */
export async function fetchCommentThreadAction(
  input: unknown,
): Promise<FetchCommentThreadResult> {
  const parsed = fetchThreadSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: "Invalid request." }
  }

  const supabase = await createClient()
  const auth = await getServerAuth(supabase)

  const root = await fetchCommentById(supabase, parsed.data.thread_root_id)
  if (!root) {
    return { ok: false, error: "This thread is no longer available." }
  }

  const page = await fetchThreadCommentsPage(supabase, root.id, null)
  const [withReplies] = pruneDeletedComments([{ ...root, replies: page.replies }])
  if (!withReplies) {
    return { ok: false, error: "This thread is no longer available." }
  }

  const userVotes = await fetchVotesForComments(supabase, auth?.userId ?? null, [
    withReplies,
  ])

  return {
    ok: true,
    root: withReplies,
    userVotes,
    replyPagination: { hasMore: page.hasMore, nextCursor: page.nextCursor },
  }
}

const fetchDeepLinkSchema = z.object({
  target_type: z.enum(["player", "match"]),
  target_id: z.number().int().positive(),
  comment_id: z.number().int().positive(),
})

export type FetchCommentDeepLinkResult = FetchCommentThreadResult

const DEEP_LINK_THREAD_PAGE_CAP = 25

async function loadThreadForDeepLink(
  supabase: Awaited<ReturnType<typeof createClient>>,
  threadRootId: number,
  commentId: number,
) {
  const root = await fetchCommentById(supabase, threadRootId)
  if (!root || root.is_deleted) {
    return null
  }

  if (threadRootId === commentId) {
    const page = await fetchThreadCommentsPage(supabase, threadRootId, null)
    return {
      root: { ...root, replies: page.replies },
      replyPagination: { hasMore: page.hasMore, nextCursor: page.nextCursor },
    }
  }

  const replies: CommentWithProfile[] = []
  let cursor: ReplyCursor | null = null
  let hasMore = true
  let lastPagination = { hasMore: false, nextCursor: null as ReplyCursor | null }

  for (let pageIndex = 0; pageIndex < DEEP_LINK_THREAD_PAGE_CAP && hasMore; pageIndex++) {
    const page = await fetchThreadCommentsPage(supabase, threadRootId, cursor)
    replies.push(...page.replies)
    lastPagination = { hasMore: page.hasMore, nextCursor: page.nextCursor }
    if (page.replies.some((reply) => reply.id === commentId)) {
      break
    }
    cursor = page.nextCursor
    hasMore = page.hasMore
  }

  return {
    root: { ...root, replies },
    replyPagination: lastPagination,
  }
}

/** Match/player `#comment-{id}` — validate target and load enough thread to show that row. */
export async function fetchCommentDeepLinkAction(
  input: unknown,
): Promise<FetchCommentDeepLinkResult> {
  const parsed = fetchDeepLinkSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: "Invalid request." }
  }

  const { target_type, target_id, comment_id } = parsed.data
  const supabase = await createClient()
  const auth = await getServerAuth(supabase)

  const comment = await fetchCommentById(supabase, comment_id)
  if (!comment || comment.is_deleted) {
    return { ok: false, error: "This comment is no longer available." }
  }

  if (target_type === "match") {
    if (comment.fixture_id !== target_id) {
      return { ok: false, error: "This comment is not on this match." }
    }
  } else if (comment.player_id !== target_id) {
    return { ok: false, error: "This comment is not on this player page." }
  }

  const threadRootId = comment.thread_root_id ?? comment.id
  const loaded = await loadThreadForDeepLink(supabase, threadRootId, comment_id)
  if (!loaded) {
    return { ok: false, error: "This thread is no longer available." }
  }

  const [withReplies] = pruneDeletedComments([loaded.root])
  if (!withReplies) {
    return { ok: false, error: "This thread is no longer available." }
  }

  const userVotes = await fetchVotesForComments(supabase, auth?.userId ?? null, [
    withReplies,
  ])

  return {
    ok: true,
    root: withReplies,
    userVotes,
    replyPagination: loaded.replyPagination,
  }
}
