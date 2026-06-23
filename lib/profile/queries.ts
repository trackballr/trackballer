import { getOnboardingOptions } from "@/lib/onboarding/options"
import { resolveDisplayAvatar, type AvatarSource } from "@/lib/profile/display-avatar"
import { normalizeXAvatarUrl } from "@/lib/profile/normalize-x-avatar-url"
import { createClient } from "@/lib/supabase/server"
import type { SupabaseClient } from "@supabase/supabase-js"

import type {
  ProfilePageData,
  ProfileStats,
  ProfileTeam,
  ProfileView,
  RecentCommentItem,
  RecentRatingItem,
} from "./types"

const PROFILE_SELECT = `
  id,
  username,
  display_name,
  avatar_url,
  google_avatar_url,
  x_avatar_url,
  avatar_source,
  country_code,
  created_at,
  twitter_handle,
  instagram_handle,
  favourite_club:teams!profiles_favourite_club_id_fkey(id, name, logo_url, code),
  favourite_national:teams!profiles_favourite_national_team_id_fkey(id, name, logo_url, code)
`

const TEAM_SELECT = "id, name, logo_url, code"
const PLAYER_RATING_SELECT = `id, name, photo_url`

function mapTeam(raw: unknown): ProfileTeam | null {
  if (!raw || typeof raw !== "object") return null
  const t = raw as Record<string, unknown>
  if (typeof t.id !== "number" || typeof t.name !== "string") return null
  return {
    id: t.id,
    name: t.name,
    logoUrl: typeof t.logo_url === "string" ? t.logo_url : null,
    code: typeof t.code === "string" ? t.code : null,
  }
}

function mapProfileRow(
  row: Record<string, unknown>,
  twitterVerifiedAt: string | null,
): ProfileView {
  const googleAvatarUrl =
    typeof row.google_avatar_url === "string" ? row.google_avatar_url : null
  const xAvatarUrl =
    typeof row.x_avatar_url === "string"
      ? normalizeXAvatarUrl(row.x_avatar_url)
      : null
  const avatarSource =
    row.avatar_source === "google" || row.avatar_source === "x"
      ? (row.avatar_source as AvatarSource)
      : null

  return {
    id: String(row.id),
    username: typeof row.username === "string" ? row.username : null,
    displayName: String(row.display_name),
    avatarUrl: resolveDisplayAvatar({
      avatar_url: typeof row.avatar_url === "string" ? row.avatar_url : null,
      google_avatar_url: googleAvatarUrl,
      x_avatar_url: xAvatarUrl,
      avatar_source: avatarSource,
    }),
    googleAvatarUrl,
    xAvatarUrl,
    avatarSource,
    countryCode: typeof row.country_code === "string" ? row.country_code : null,
    memberSince: String(row.created_at),
    favouriteClub: mapTeam(row.favourite_club),
    favouriteNationalTeam: mapTeam(row.favourite_national),
    twitterHandle: typeof row.twitter_handle === "string" ? row.twitter_handle : null,
    twitterVerifiedAt,
    instagramHandle:
      typeof row.instagram_handle === "string" ? row.instagram_handle : null,
  }
}

async function fetchTwitterVerifiedAt(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<string | null> {
  const { data, error } = await (supabase as SupabaseClient).rpc(
    "get_profile_twitter_verified_at",
    { p_user_id: userId },
  )
  if (error) {
    console.error("fetchTwitterVerifiedAt failed:", error.message)
    return null
  }
  return typeof data === "string" ? data : null
}

export async function getProfileById(userId: string): Promise<ProfileView | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_SELECT)
    .eq("id", userId)
    .maybeSingle()

  if (error || !data) {
    if (error) console.error("getProfileById failed:", error.message)
    return null
  }

  const twitterVerifiedAt = await fetchTwitterVerifiedAt(supabase, userId)
  return mapProfileRow(data as Record<string, unknown>, twitterVerifiedAt)
}

export async function getProfileByUsername(
  username: string,
): Promise<ProfileView | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_SELECT)
    .ilike("username", username)
    .maybeSingle()

  if (error || !data) {
    if (error) console.error("getProfileByUsername failed:", error.message)
    return null
  }

  const row = data as Record<string, unknown>
  const profileId = typeof row.id === "string" ? row.id : String(row.id)
  const twitterVerifiedAt = await fetchTwitterVerifiedAt(supabase, profileId)
  return mapProfileRow(row, twitterVerifiedAt)
}

export async function getProfileStats(userId: string): Promise<ProfileStats> {
  const supabase = await createClient()

  const [matchRes, careerRes, commentsRes, upvotesRes] = await Promise.all([
    supabase
      .from("match_ratings")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase
      .from("career_ratings")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase
      .from("comments")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_deleted", false),
    supabase
      .from("comments")
      .select("upvote_count")
      .eq("user_id", userId)
      .eq("is_deleted", false),
  ])

  const ratingsGiven = (matchRes.count ?? 0) + (careerRes.count ?? 0)
  const commentsCount = commentsRes.count ?? 0
  const upvotesReceived = (upvotesRes.data ?? []).reduce(
    (sum, row) => sum + (row.upvote_count ?? 0),
    0,
  )

  return { ratingsGiven, commentsCount, upvotesReceived }
}

type CareerRatingRow = {
  value: number
  updated_at: string
  player: {
    id: number
    name: string
    photo_url: string | null
  } | null
}

type FixtureTeamsRow = {
  home_team_id: number
  away_team_id: number
  home_team: unknown
  away_team: unknown
}

type MatchRatingRow = {
  value: number
  updated_at: string
  fixture_id: number
  player_id: number
  player: {
    id: number
    name: string
    photo_url: string | null
  } | null
  fixture: FixtureTeamsRow | null
}

function mapCareerRatingRow(row: CareerRatingRow): RecentRatingItem | null {
  if (!row.player) return null
  return {
    kind: "career",
    playerId: row.player.id,
    playerName: row.player.name,
    photoUrl: row.player.photo_url,
    value: row.value,
    ratedAt: row.updated_at,
    oppositionTeam: null,
  }
}

function resolveOppositionTeam(
  fixture: FixtureTeamsRow | null,
  playerTeamId: number | null,
): ProfileTeam | null {
  if (!fixture || playerTeamId == null) return null

  if (playerTeamId === fixture.home_team_id) {
    return mapTeam(fixture.away_team)
  }
  if (playerTeamId === fixture.away_team_id) {
    return mapTeam(fixture.home_team)
  }

  return null
}

function appearanceKey(fixtureId: number, playerId: number): string {
  return `${fixtureId}:${playerId}`
}

export async function getRecentRatings(userId: string): Promise<RecentRatingItem[]> {
  const supabase = await createClient()

  const [matchRes, careerRes] = await Promise.all([
    supabase
      .from("match_ratings")
      .select(
        `
        value,
        updated_at,
        fixture_id,
        player_id,
        player:players!match_ratings_player_id_fkey(${PLAYER_RATING_SELECT}),
        fixture:fixtures!match_ratings_fixture_id_fkey(
          home_team_id,
          away_team_id,
          home_team:teams!fixtures_home_team_id_fkey(${TEAM_SELECT}),
          away_team:teams!fixtures_away_team_id_fkey(${TEAM_SELECT})
        )
      `,
      )
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(3),
    supabase
      .from("career_ratings")
      .select(
        `value, updated_at, player:players!career_ratings_player_id_fkey(${PLAYER_RATING_SELECT})`,
      )
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(3),
  ])

  const matchRows = (matchRes.data ?? []) as MatchRatingRow[]
  const appearanceTeamByKey = new Map<string, number>()

  if (matchRows.length > 0) {
    const fixtureIds = [...new Set(matchRows.map((row) => row.fixture_id))]
    const playerIds = [...new Set(matchRows.map((row) => row.player_id))]

    const { data: appearances, error: appearanceError } = await supabase
      .from("fixture_appearances")
      .select("fixture_id, player_id, team_id")
      .in("fixture_id", fixtureIds)
      .in("player_id", playerIds)

    if (appearanceError) {
      console.error("getRecentRatings appearances:", appearanceError.message)
    } else {
      for (const row of appearances ?? []) {
        appearanceTeamByKey.set(
          appearanceKey(row.fixture_id, row.player_id),
          row.team_id,
        )
      }
    }
  }

  const combined: RecentRatingItem[] = []
  for (const row of matchRows) {
    if (!row.player) continue
    const playerTeamId =
      appearanceTeamByKey.get(appearanceKey(row.fixture_id, row.player_id)) ?? null

    combined.push({
      kind: "match",
      playerId: row.player.id,
      playerName: row.player.name,
      photoUrl: row.player.photo_url,
      value: row.value,
      ratedAt: row.updated_at,
      oppositionTeam: resolveOppositionTeam(row.fixture, playerTeamId),
    })
  }

  for (const row of careerRes.data ?? []) {
    const item = mapCareerRatingRow(row as CareerRatingRow)
    if (item) combined.push(item)
  }

  combined.sort(
    (a, b) => new Date(b.ratedAt).getTime() - new Date(a.ratedAt).getTime(),
  )

  return combined.slice(0, 3)
}

type RecentCommentRow = {
  id: number
  body: string
  upvote_count: number
  created_at: string
  target_type: string
  player: {
    id: number
    name: string
    photo_url: string | null
  } | null
  fixture: {
    id: number
    home_team: {
      id: number
      name: string
      logo_url: string | null
      code: string | null
    } | null
    away_team: {
      id: number
      name: string
      logo_url: string | null
      code: string | null
    } | null
  } | null
}

function mapRecentCommentRow(row: RecentCommentRow): RecentCommentItem | null {
  if (row.target_type === "player" && row.player) {
    return {
      targetType: "player",
      id: row.id,
      body: row.body,
      upvoteCount: row.upvote_count,
      createdAt: row.created_at,
      playerId: row.player.id,
      playerName: row.player.name,
      playerPhotoUrl: row.player.photo_url,
    }
  }

  const fixture = row.fixture
  if (row.target_type === "match" && fixture?.home_team && fixture.away_team) {
    return {
      targetType: "match",
      id: row.id,
      body: row.body,
      upvoteCount: row.upvote_count,
      createdAt: row.created_at,
      fixtureId: fixture.id,
      homeTeam: {
        id: fixture.home_team.id,
        name: fixture.home_team.name,
        logoUrl: fixture.home_team.logo_url,
        code: fixture.home_team.code,
      },
      awayTeam: {
        id: fixture.away_team.id,
        name: fixture.away_team.name,
        logoUrl: fixture.away_team.logo_url,
        code: fixture.away_team.code,
      },
    }
  }

  return null
}

export async function getRecentComments(userId: string): Promise<RecentCommentItem[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("comments")
    .select(
      `
      id,
      body,
      upvote_count,
      created_at,
      target_type,
      player:players!comments_player_id_fkey(id, name, photo_url),
      fixture:fixtures!comments_fixture_id_fkey(
        id,
        home_team:teams!fixtures_home_team_id_fkey(id, name, logo_url, code),
        away_team:teams!fixtures_away_team_id_fkey(id, name, logo_url, code)
      )
    `,
    )
    .eq("user_id", userId)
    .eq("is_deleted", false)
    .order("created_at", { ascending: false })
    .limit(3)

  if (error) {
    console.error("getRecentComments failed:", error.message)
    return []
  }

  return (data ?? [])
    .map((row) => mapRecentCommentRow(row as RecentCommentRow))
    .filter((row): row is RecentCommentItem => row != null)
}

export async function getProfileTeamOptions() {
  return getOnboardingOptions()
}

export async function getProfilePageData(
  profile: ProfileView,
  sessionUserId: string | undefined,
  options?: { isOwner?: boolean },
): Promise<ProfilePageData> {
  const userId = profile.id
  const [stats, recentRatings, recentComments, teamOptions] = await Promise.all([
    getProfileStats(userId),
    getRecentRatings(userId),
    getRecentComments(userId),
    getProfileTeamOptions(),
  ])

  const isOwner =
    options?.isOwner ?? (sessionUserId != null && sessionUserId === userId)

  return {
    profile,
    stats,
    recentRatings,
    recentComments,
    isOwner,
    viewerUserId: sessionUserId ?? null,
    teamOptions,
  }
}
