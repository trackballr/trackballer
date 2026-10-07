"use server"

import { z } from "zod"

import { fetchCommentHistoryPage, fetchRatingHistoryPage } from "@/lib/profile/history"
import type { CommentHistoryPage, RatingHistoryPage } from "@/lib/profile/types"
import { createClient } from "@/lib/supabase/server"

const ratingPageSchema = z.object({
  userId: z.string().uuid(),
  kind: z.enum(["match", "career"]).nullable(),
  cursor: z
    .object({
      ratedAt: z.string(),
      kind: z.enum(["match", "career"]),
      id: z.number().int().positive(),
    })
    .nullable(),
})

const commentPageSchema = z.object({
  userId: z.string().uuid(),
  cursor: z
    .object({
      createdAt: z.string(),
      id: z.number().int().positive(),
    })
    .nullable(),
})

export async function fetchRatingHistoryPageAction(
  input: unknown,
): Promise<({ ok: true } & RatingHistoryPage) | { ok: false; error: string }> {
  const parsed = ratingPageSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: "Invalid request." }

  const supabase = await createClient()
  const page = await fetchRatingHistoryPage(supabase, parsed.data.userId, {
    kind: parsed.data.kind,
    cursor: parsed.data.cursor,
  })
  return { ok: true, ...page }
}

export async function fetchCommentHistoryPageAction(
  input: unknown,
): Promise<({ ok: true } & CommentHistoryPage) | { ok: false; error: string }> {
  const parsed = commentPageSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: "Invalid request." }

  const supabase = await createClient()
  const page = await fetchCommentHistoryPage(supabase, parsed.data.userId, {
    cursor: parsed.data.cursor,
  })
  return { ok: true, ...page }
}
