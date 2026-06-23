"use server"

import { revalidatePath } from "next/cache"
import { normalizeCommentRow } from "@/lib/comment/normalize"
import { readIsAdmin, readIsBanned } from "@/lib/auth/rpc-gates"
import { requireServerAuth } from "@/lib/auth/server-session"
import type { Database } from "@/lib/database.types"
import { createClient } from "@/lib/supabase/server"
import { MAX_THREAD_DEPTH } from "@/lib/comment/pagination"
import { COMMENT_PROFILE_SELECT } from "./profile-select"
import {
  submitCommentSchema,
  deleteCommentSchema,
  type CommentWithProfile,
  type SubmitCommentInput,
  type DeleteCommentInput,
} from "./types"

export type SubmitCommentResult =
  | { ok: true; comment: CommentWithProfile }
  | { ok: false; error: string }

export async function submitComment(input: unknown): Promise<SubmitCommentResult> {
  const parsed = submitCommentSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }

  const { body, target_type, player_id, fixture_id, parent_id } = parsed.data

  const supabase = await createClient()
  const gate = await requireServerAuth(supabase)

  if (!gate.ok) {
    return { ok: false, error: "Sign in to comment." }
  }

  const { userId } = gate.auth

  if (await readIsBanned(supabase)) {
    return { ok: false, error: "You cannot comment at this time." }
  }

  let thread_root_id: number | null = null
  let thread_depth = 0

  if (parent_id) {
    const { data: parent, error: parentError } = await supabase
      .from("comments")
      .select("id, thread_root_id, thread_depth, is_deleted")
      .eq("id", parent_id)
      .maybeSingle()

    if (parentError || !parent || parent.is_deleted) {
      return { ok: false, error: "Could not reply to that comment." }
    }

    const nextDepth = parent.thread_depth + 1
    if (nextDepth > MAX_THREAD_DEPTH) {
      return { ok: false, error: "This thread is too deep to reply further." }
    }

    thread_root_id = parent.thread_root_id ?? parent.id
    thread_depth = nextDepth
  }

  const commentData: Database["public"]["Tables"]["comments"]["Insert"] = {
    user_id: userId,
    body,
    target_type,
    parent_id: parent_id || null,
    thread_root_id,
    thread_depth,
  }

  if (target_type === "player" && player_id) {
    commentData.player_id = player_id
    commentData.fixture_id = null
  } else if (target_type === "match" && fixture_id) {
    commentData.fixture_id = fixture_id
    commentData.player_id = null
  } else {
    return { ok: false, error: "Invalid target." }
  }

  const { error, data } = await supabase
    .from("comments")
    .insert(commentData)
    .select(
      `
      *,
      profile:profiles!comments_user_id_fkey(${COMMENT_PROFILE_SELECT})
    `,
    )
    .single()

  if (error || !data) {
    return { ok: false, error: "Could not save comment. Try again." }
  }

  if (target_type === "player" && player_id) {
    revalidatePath(`/player/${player_id}`)
  } else if (target_type === "match" && fixture_id) {
    revalidatePath(`/match/${fixture_id}`)
  }

  return { ok: true, comment: normalizeCommentRow(data) }
}

export type DeleteCommentResult = { ok: true } | { ok: false; error: string }

export async function deleteComment(input: unknown): Promise<DeleteCommentResult> {
  const parsed = deleteCommentSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: "Invalid input" }
  }

  const { comment_id } = parsed.data

  const supabase = await createClient()
  const gate = await requireServerAuth(supabase)

  if (!gate.ok) {
    return { ok: false, error: "Sign in to delete comments." }
  }

  const { userId } = gate.auth

  const { data: comment, error: fetchError } = await supabase
    .from("comments")
    .select("user_id, target_type, player_id, fixture_id")
    .eq("id", comment_id)
    .single()

  if (fetchError || !comment) {
    return { ok: false, error: "Comment not found." }
  }

  const isAdmin = await readIsAdmin(supabase)
  const isOwner = comment.user_id === userId

  if (!isOwner && !isAdmin) {
    return { ok: false, error: "You cannot delete this comment." }
  }

  const { error } = await supabase
    .from("comments")
    .update({ is_deleted: true })
    .eq("id", comment_id)

  if (error) {
    return { ok: false, error: "Could not delete comment. Try again." }
  }

  const targetType = comment.target_type as "player" | "match"
  const targetId = targetType === "player" ? comment.player_id : comment.fixture_id

  if (targetId) {
    revalidatePath(`/${targetType}/${targetId}`)
  }

  return { ok: true }
}
