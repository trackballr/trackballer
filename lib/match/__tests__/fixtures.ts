import type { FixtureWithTeams } from "@/lib/catalog/types"

const matchRowDefaults: Omit<FixtureWithTeams, "id"> = {
  season_id: 1,
  round_id: 1,
  round_name: "Group A - 1",
  home_team_id: 1,
  away_team_id: 2,
  winner_team_id: 1,
  kickoff_at: "2026-06-15T18:00:00.000Z",
  status_short: "FT",
  status_long: "Match Finished",
  home_goals_ft: 2,
  away_goals_ft: 1,
  home_goals_et: null,
  away_goals_et: null,
  home_goals_pen: null,
  away_goals_pen: null,
  venue: null,
  ratings_unlocked_at: null,
  lineups_synced_at: null,
  appearances_synced_at: null,
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
  home_team: { id: 1, name: "Brazil", logo_url: null, code: "BRA", is_national: true },
  away_team: { id: 2, name: "Serbia", logo_url: null, code: "SRB", is_national: true },
}

/** Minimal fixture row for MatchRow / score tests */
export function matchRowFixture(
  overrides: Partial<FixtureWithTeams> & { id: number },
): FixtureWithTeams {
  const { id, ...rest } = overrides
  return { ...matchRowDefaults, id, ...rest }
}
