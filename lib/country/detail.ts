import { cache } from "react"

import { getCatalogSeasonYear } from "@/lib/catalog/config"
import { createClient } from "@/lib/supabase/server"

import type { CountryCoach, NationalTeamProfile } from "./types"

const TEAM_SELECT = "id, name, code, logo_url, country, is_national"

async function fetchLatestCoach(teamId: number): Promise<CountryCoach | null> {
  const supabase = await createClient()

  const { data: coachRows, error: coachError } = await supabase
    .from("fixture_coaches")
    .select("name, photo_url, fixture:fixtures!inner(kickoff_at)")
    .eq("team_id", teamId)
    .order("kickoff_at", { ascending: false, foreignTable: "fixtures" })
    .limit(1)

  if (coachError) {
    console.error("fetchLatestCoach failed:", coachError.message)
    return null
  }

  const row = coachRows?.[0]
  if (!row?.name) return null

  return {
    name: row.name,
    photoUrl: row.photo_url,
  }
}

async function fetchLatestHomeVenue(teamId: number): Promise<string | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("fixtures")
    .select("venue")
    .eq("home_team_id", teamId)
    .not("venue", "is", null)
    .order("kickoff_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error("fetchLatestHomeVenue failed:", error.message)
    return null
  }

  return data?.venue?.trim() || null
}

export const getNationalTeamProfile = cache(
  async (teamId: number): Promise<NationalTeamProfile | null> => {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("teams")
      .select(TEAM_SELECT)
      .eq("id", teamId)
      .eq("is_national", true)
      .maybeSingle()

    if (error) {
      console.error("getNationalTeamProfile failed:", error.message)
      return null
    }

    if (!data) return null

    const [coach, homeVenue] = await Promise.all([
      fetchLatestCoach(teamId),
      fetchLatestHomeVenue(teamId),
    ])

    return {
      id: data.id,
      name: data.name,
      code: data.code,
      logoUrl: data.logo_url,
      country: data.country,
      coach,
      homeVenue,
      competitionLabel: `FIFA World Cup ${getCatalogSeasonYear()}`,
    }
  },
)
