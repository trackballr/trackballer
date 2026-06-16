import { cache } from "react"

import { FIXTURE_TEAM_SELECT, mapFixtureRow } from "@/lib/catalog/fixtures"
import { TERMINAL_STATUSES } from "@/lib/catalog-sync/constants"
import type { FixtureView, FixtureWithTeams } from "@/lib/catalog/types"
import { createClient } from "@/lib/supabase/server"

const TERMINAL_LIST = [...TERMINAL_STATUSES]
const NOT_STARTED_STATUSES = ["NS", "TBD"] as const

function teamOrFilter(teamId: number): string {
  return `home_team_id.eq.${teamId},away_team_id.eq.${teamId}`
}

async function fetchTeamFixtures(
  seasonId: number,
  teamId: number,
  options: {
    kickoffOrder: "asc" | "desc"
    terminalOnly?: boolean
    upcomingOnly?: boolean
    notStartedOnly?: boolean
    limit?: number
  },
): Promise<FixtureWithTeams[]> {
  const supabase = await createClient()
  let query = supabase
    .from("fixtures")
    .select(FIXTURE_TEAM_SELECT)
    .eq("season_id", seasonId)
    .or(teamOrFilter(teamId))

  if (options.terminalOnly) {
    query = query.in("status_short", TERMINAL_LIST)
  }
  if (options.upcomingOnly) {
    const quoted = TERMINAL_LIST.map((s) => `"${s}"`).join(",")
    query = query.not("status_short", "in", `(${quoted})`)
  }
  if (options.notStartedOnly) {
    query = query.in("status_short", [...NOT_STARTED_STATUSES])
  }

  query = query.order("kickoff_at", { ascending: options.kickoffOrder === "asc" })

  if (options.limit) {
    query = query.limit(options.limit)
  }

  const { data, error } = await query

  if (error) {
    console.error("fetchTeamFixtures failed:", error.message)
    return []
  }

  return (data ?? [])
    .map(mapFixtureRow)
    .filter((row): row is FixtureWithTeams => row !== null)
}

export const getTeamFixtures = cache(
  async (
    seasonId: number,
    teamId: number,
    view: FixtureView,
  ): Promise<FixtureWithTeams[]> => {
    if (view === "finished") {
      return fetchTeamFixtures(seasonId, teamId, {
        kickoffOrder: "desc",
        terminalOnly: true,
      })
    }

    return fetchTeamFixtures(seasonId, teamId, {
      kickoffOrder: "asc",
      upcomingOnly: true,
    })
  },
)

export const getTeamFixtureBookends = cache(
  async (
    seasonId: number,
    teamId: number,
  ): Promise<{ previous: FixtureWithTeams | null; next: FixtureWithTeams | null }> => {
    const [previousRows, nextRows] = await Promise.all([
      fetchTeamFixtures(seasonId, teamId, {
        kickoffOrder: "desc",
        terminalOnly: true,
        limit: 1,
      }),
      fetchTeamFixtures(seasonId, teamId, {
        kickoffOrder: "asc",
        notStartedOnly: true,
        limit: 1,
      }),
    ])

    return {
      previous: previousRows[0] ?? null,
      next: nextRows[0] ?? null,
    }
  },
)
