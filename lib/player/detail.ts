import type { TeamSummary } from "@/lib/catalog/types"
import { getWorldCupSeason } from "@/lib/catalog/fixtures"
import { formatPlayerDisplayName } from "@/lib/player/display-name"
import type {
  PlayerCareerAggregate,
  PlayerFormSnapshot,
  PlayerProfile,
  PlayerRecentMatch,
  PlayerTournamentAggregate,
} from "@/lib/player/types"
import { createClient } from "@/lib/supabase/server"

const TEAM_SELECT = "id, name, logo_url, code, is_national"

type TeamRow = TeamSummary | null

type PlayerRow = {
  id: number
  name: string
  firstname: string | null
  lastname: string | null
  photo_url: string | null
  age: number | null
  birth_date: string | null
  primary_position: string | null
  nationality: string | null
  club_team: TeamRow
  national_team: TeamRow
}

type AggregateRow = {
  vote_count: number
  display_score: number
  is_provisional: boolean
  tier: string
}

type CareerRatingRow = {
  value: number
}

type FormSnapshotRow = {
  last_5_avg: number | null
  last_5_fixture_ids: number[]
}

type TournamentAggregateRow = {
  avg_rating: number | null
  appearances_rated: number
  season_id: number
}

type RecentFixtureRow = {
  id: number
  kickoff_at: string
  status_short: string
  home_goals_ft: number | null
  away_goals_ft: number | null
  home_goals_et: number | null
  away_goals_et: number | null
  home_goals_pen: number | null
  away_goals_pen: number | null
  round_name: string | null
  home_team: TeamSummary | null
  away_team: TeamSummary | null
}

type MatchAggregateRow = {
  fixture_id: number
  avg_rating: number | null
}

const DEFAULT_CAREER: PlayerCareerAggregate = {
  voteCount: 0,
  displayScore: 50,
  isProvisional: true,
  tier: "provisional",
}

const DEFAULT_FORM: PlayerFormSnapshot = {
  last5Avg: null,
  last5FixtureIds: [],
}

const DEFAULT_TOURNAMENT: PlayerTournamentAggregate = {
  avgRating: null,
  appearancesRated: 0,
  seasonId: null,
}

function mapTeam(row: TeamRow): TeamSummary | null {
  if (!row) return null
  return {
    id: row.id,
    name: row.name,
    logo_url: row.logo_url,
    code: row.code,
    is_national: row.is_national,
  }
}

function mapCareer(row: AggregateRow | null): PlayerCareerAggregate {
  if (!row) return DEFAULT_CAREER
  return {
    voteCount: row.vote_count,
    displayScore: Number(row.display_score),
    isProvisional: row.is_provisional,
    tier: row.tier,
  }
}

function mapForm(row: FormSnapshotRow | null): PlayerFormSnapshot {
  if (!row) return DEFAULT_FORM
  return {
    last5Avg: row.last_5_avg == null ? null : Number(row.last_5_avg),
    last5FixtureIds: row.last_5_fixture_ids ?? [],
  }
}

function mapTournament(row: TournamentAggregateRow | null): PlayerTournamentAggregate {
  if (!row) return DEFAULT_TOURNAMENT
  return {
    avgRating: row.avg_rating == null ? null : Number(row.avg_rating),
    appearancesRated: row.appearances_rated,
    seasonId: row.season_id,
  }
}

export async function getPlayerProfile(
  playerId: number,
  userId: string | null = null,
): Promise<PlayerProfile | null> {
  const supabase = await createClient()
  const season = await getWorldCupSeason()
  const seasonId = season?.id ?? null

  const [
    { data: playerRow, error: playerError },
    { data: careerRow },
    { data: formRow },
    tournamentResult,
    userRatingResult,
  ] = await Promise.all([
    supabase
      .from("players")
      .select(
        `
        id,
        name,
        firstname,
        lastname,
        photo_url,
        age,
        birth_date,
        primary_position,
        nationality,
        club_team:teams!players_club_team_id_fkey(${TEAM_SELECT}),
        national_team:teams!players_national_team_id_fkey(${TEAM_SELECT})
      `,
      )
      .eq("id", playerId)
      .maybeSingle(),
    supabase
      .from("player_career_aggregates")
      .select("vote_count, display_score, is_provisional, tier")
      .eq("player_id", playerId)
      .maybeSingle(),
    supabase
      .from("player_form_snapshots")
      .select("last_5_avg, last_5_fixture_ids")
      .eq("player_id", playerId)
      .maybeSingle(),
    loadTournamentAggregate(supabase, playerId, seasonId),
    loadUserCareerRating(supabase, playerId, userId),
  ])

  if (playerError) {
    console.error("getPlayerProfile player:", playerError.message)
    return null
  }
  if (!playerRow) return null

  const row = playerRow as PlayerRow
  const form = mapForm(formRow as FormSnapshotRow | null)
  const recentMatches = await loadRecentMatches(
    supabase,
    playerId,
    form.last5FixtureIds,
  )

  return {
    id: row.id,
    name: row.name,
    displayName: formatPlayerDisplayName(row.firstname, row.lastname, row.name),
    firstname: row.firstname,
    lastname: row.lastname,
    photoUrl: row.photo_url,
    age: row.age,
    birthDate: row.birth_date,
    primaryPosition: row.primary_position,
    nationality: row.nationality,
    clubTeam: mapTeam(row.club_team),
    nationalTeam: mapTeam(row.national_team),
    career: mapCareer(careerRow as AggregateRow | null),
    userCareerRating: userRatingResult,
    form,
    tournament: mapTournament(tournamentResult),
    recentMatches,
  }
}

async function loadTournamentAggregate(
  supabase: Awaited<ReturnType<typeof createClient>>,
  playerId: number,
  seasonId: number | null,
): Promise<TournamentAggregateRow | null> {
  if (!seasonId) return null

  const { data, error } = await supabase
    .from("player_tournament_aggregates")
    .select("avg_rating, appearances_rated, season_id")
    .eq("player_id", playerId)
    .eq("season_id", seasonId)
    .maybeSingle()

  if (error) {
    console.error("getPlayerProfile tournament:", error.message)
    return null
  }

  return data as TournamentAggregateRow | null
}

async function loadRecentMatches(
  supabase: Awaited<ReturnType<typeof createClient>>,
  playerId: number,
  fixtureIds: number[],
): Promise<PlayerRecentMatch[]> {
  if (fixtureIds.length === 0) return []

  const fixtureSelect = `
    id,
    kickoff_at,
    status_short,
    home_goals_ft,
    away_goals_ft,
    home_goals_et,
    away_goals_et,
    home_goals_pen,
    away_goals_pen,
    round_name,
    home_team:teams!fixtures_home_team_id_fkey(id, name, logo_url, code, is_national),
    away_team:teams!fixtures_away_team_id_fkey(id, name, logo_url, code, is_national)
  `

  const [{ data: fixtures, error: fixturesError }, { data: matchAggRows }] = await Promise.all([
    supabase
      .from("fixtures")
      .select(fixtureSelect)
      .in("id", fixtureIds),
    supabase
      .from("player_match_aggregates")
      .select("fixture_id, avg_rating")
      .eq("player_id", playerId)
      .in("fixture_id", fixtureIds),
  ])

  if (fixturesError) {
    console.error("getPlayerProfile recent fixtures:", fixturesError.message)
    return []
  }

  const ratingByFixture = new Map<number, number | null>()
  for (const row of (matchAggRows ?? []) as MatchAggregateRow[]) {
    ratingByFixture.set(row.fixture_id, row.avg_rating == null ? null : Number(row.avg_rating))
  }

  const fixtureById = new Map<number, RecentFixtureRow>()
  for (const fixture of (fixtures ?? []) as RecentFixtureRow[]) {
    if (!fixture.home_team || !fixture.away_team) continue
    fixtureById.set(fixture.id, fixture)
  }

  const ordered: PlayerRecentMatch[] = []
  for (const fixtureId of fixtureIds) {
    const row = fixtureById.get(fixtureId)
    if (!row || !row.home_team || !row.away_team) continue
    ordered.push({
      fixtureId: row.id,
      kickoffAt: row.kickoff_at,
      statusShort: row.status_short,
      homeGoalsFt: row.home_goals_ft,
      awayGoalsFt: row.away_goals_ft,
      homeGoalsEt: row.home_goals_et,
      awayGoalsEt: row.away_goals_et,
      homeGoalsPen: row.home_goals_pen,
      awayGoalsPen: row.away_goals_pen,
      roundName: row.round_name,
      homeTeam: row.home_team,
      awayTeam: row.away_team,
      playerAvgRating: ratingByFixture.get(row.id) ?? null,
    })
  }

  return ordered
}

async function loadUserCareerRating(
  supabase: Awaited<ReturnType<typeof createClient>>,
  playerId: number,
  userId: string | null,
): Promise<number | null> {
  if (!userId) return null

  const { data, error } = await supabase
    .from("career_ratings")
    .select("value")
    .eq("player_id", playerId)
    .eq("user_id", userId)
    .maybeSingle()

  if (error) {
    console.error("getPlayerProfile rating:", error.message)
    return null
  }

  return (data as CareerRatingRow | null)?.value ?? null
}
