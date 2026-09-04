import { cache } from "react"

import { TERMINAL_STATUSES } from "@/lib/catalog-sync/constants"
import type { FixtureView } from "@/lib/catalog/types"
import { createClient } from "@/lib/supabase/server"

const TERMINAL_LIST = [...TERMINAL_STATUSES]

/**
 * Pick upcoming vs finished when the URL omits ?view=.
 * Completed matchweeks open on results; rounds with games left default to upcoming.
 */
export const resolveRoundFixtureView = cache(
  async (
    seasonId: number,
    roundName: string,
    viewParam: string | undefined,
  ): Promise<FixtureView> => {
    if (viewParam === "finished" || viewParam === "upcoming") {
      return viewParam
    }

    const supabase = await createClient()
    const quoted = TERMINAL_LIST.map((s) => `"${s}"`).join(",")
    const { count, error } = await supabase
      .from("fixtures")
      .select("*", { count: "exact", head: true })
      .eq("season_id", seasonId)
      .eq("round_name", roundName)
      .not("status_short", "in", `(${quoted})`)

    if (error) {
      console.error("resolveRoundFixtureView failed:", error.message)
      return "upcoming"
    }

    return count === 0 ? "finished" : "upcoming"
  },
)
