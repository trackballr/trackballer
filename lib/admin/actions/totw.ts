"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { assertAdminAction } from "@/lib/admin/assert-admin-action"
import {
  formationSlotKeys,
  type FormationId,
} from "@/lib/admin/formation-slots"
import { FEATURED_MIGRATION_HINT, isMissingFeaturedColumn } from "@/lib/admin/totw-featured"

import { createClient } from "@/lib/supabase/server"

const formationIds = [
  "4-3-3",
  "4-4-2",
  "3-5-2",
  "4-2-3-1",
  "4-1-2-1-2",
  "4-3-1-2",
  "3-4-3",
  "3-4-2-1",
  "3-4-1-2",
  "5-3-2",
  "5-4-1",
  "5-2-3",
  "4-5-1",
  "4-2-2-2",
  "4-1-4-1",
] as const

const publishTotwSchema = z.object({
  seasonId: z.number().int().positive(),
  roundId: z.number().int().positive(),
  title: z.string().trim().min(3).max(120),
  formation: z.enum(formationIds),
  slots: z.record(z.string(), z.number().int().positive()),
})

const featureTotwSchema = z.object({
  seasonId: z.number().int().positive(),
  totwId: z.number().int().positive(),
})

export type PublishTotwResult = { ok: true; id: number } | { ok: false; error: string }

export type FeatureTotwResult = { ok: true } | { ok: false; error: string }

function validateElevenSlots(formation: FormationId, slots: Record<string, number>) {
  const requiredKeys = formationSlotKeys(formation)

  if (Object.keys(slots).length !== 11) {
    return "Select exactly eleven players before publishing."
  }

  for (const key of requiredKeys) {
    if (!slots[key]) {
      return `Missing player for ${key.toUpperCase()}.`
    }
  }

  const playerIds = requiredKeys.map((key) => slots[key]!)
  if (new Set(playerIds).size !== 11) {
    return "Each slot needs a different player."
  }

  return null
}

function revalidateTotwPaths() {
  revalidatePath("/")
  revalidatePath("/world-cup")
  revalidatePath("/admin/team-of-the-stage")
}

export async function publishTeamOfTheStage(
  input: unknown,
): Promise<PublishTotwResult> {
  const gate = await assertAdminAction()
  if (!gate.ok) return gate

  const parsed = publishTotwSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: "Pick a stage, title, formation, and all eleven players." }
  }

  const { seasonId, roundId, title, formation, slots } = parsed.data
  const slotError = validateElevenSlots(formation as FormationId, slots)
  if (slotError) {
    return { ok: false, error: slotError }
  }

  const supabase = await createClient()
  const requiredKeys = formationSlotKeys(formation as FormationId)

  const { data: existingRows, error: lookupError } = await supabase
    .from("team_of_the_week")
    .select("id")
    .eq("season_id", seasonId)
    .eq("round_id", roundId)
    .order("id", { ascending: false })
    .limit(1)

  if (lookupError) {
    return { ok: false, error: "Could not look up saved team for this stage." }
  }

  const existing = existingRows?.[0]
  let totwId: number

  if (existing) {
    const { error: updateError } = await supabase
      .from("team_of_the_week")
      .update({
        title,
        formation,
        round_id: roundId,
        published_at: new Date().toISOString(),
        created_by: gate.admin.userId,
      })
      .eq("id", existing.id)

    if (updateError) {
      return { ok: false, error: updateError.message || "Could not update team." }
    }

    totwId = existing.id

    const { error: deleteError } = await supabase
      .from("team_of_the_week_players")
      .delete()
      .eq("team_of_the_week_id", totwId)

    if (deleteError) {
      return { ok: false, error: deleteError.message || "Could not replace players." }
    }
  } else {
    const { data: inserted, error: insertError } = await supabase
      .from("team_of_the_week")
      .insert({
        season_id: seasonId,
        round_id: roundId,
        title,
        formation,
        published_at: new Date().toISOString(),
        created_by: gate.admin.userId,
      })
      .select("id")
      .single()

    if (insertError || !inserted) {
      return {
        ok: false,
        error: insertError?.message || "Could not publish team.",
      }
    }

    totwId = inserted.id
  }

  const rows = requiredKeys.map((slot, index) => ({
    team_of_the_week_id: totwId,
    slot,
    player_id: slots[slot]!,
    sort_order: index,
  }))

  const { error: playersError } = await supabase
    .from("team_of_the_week_players")
    .insert(rows)

  if (playersError) {
    return { ok: false, error: playersError.message || "Could not save players." }
  }

  revalidateTotwPaths()
  return { ok: true, id: totwId }
}

/** Mark one published stage as live on home and World Cup; clears featured on other stages. */
export async function featureTeamOfTheStage(
  input: unknown,
): Promise<FeatureTotwResult> {
  const gate = await assertAdminAction()
  if (!gate.ok) return gate

  const parsed = featureTotwSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: "Invalid team selection." }
  }

  const { seasonId, totwId } = parsed.data
  const supabase = await createClient()

  const { data: row, error: fetchError } = await supabase
    .from("team_of_the_week")
    .select("id, published_at, season_id")
    .eq("id", totwId)
    .single()

  if (fetchError || !row || row.season_id !== seasonId || !row.published_at) {
    return { ok: false, error: "Publish this stage first, then set it live." }
  }

  const { error: clearError } = await supabase
    .from("team_of_the_week")
    .update({ featured_at: null })
    .eq("season_id", seasonId)
    .not("featured_at", "is", null)

  if (clearError) {
    if (isMissingFeaturedColumn(clearError.message)) {
      return { ok: false, error: FEATURED_MIGRATION_HINT }
    }
    return { ok: false, error: "Could not update featured team." }
  }

  const { error: featureError } = await supabase
    .from("team_of_the_week")
    .update({ featured_at: new Date().toISOString() })
    .eq("id", totwId)

  if (featureError) {
    if (isMissingFeaturedColumn(featureError.message)) {
      return { ok: false, error: FEATURED_MIGRATION_HINT }
    }
    return { ok: false, error: featureError.message || "Could not set live team." }
  }

  revalidateTotwPaths()
  return { ok: true }
}

/** Hide a stage from home and World Cup by clearing its featured flag. */
export async function unfeatureTeamOfTheStage(
  input: unknown,
): Promise<FeatureTotwResult> {
  const gate = await assertAdminAction()
  if (!gate.ok) return gate

  const parsed = featureTotwSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: "Invalid team selection." }
  }

  const { seasonId, totwId } = parsed.data
  const supabase = await createClient()

  const { error: clearError } = await supabase
    .from("team_of_the_week")
    .update({ featured_at: null })
    .eq("id", totwId)
    .eq("season_id", seasonId)

  if (clearError) {
    if (isMissingFeaturedColumn(clearError.message)) {
      return { ok: false, error: FEATURED_MIGRATION_HINT }
    }
    return { ok: false, error: "Could not hide this team." }
  }

  revalidateTotwPaths()
  return { ok: true }
}
