import type { SupabaseClient } from "@supabase/supabase-js"

import type { Database } from "@/lib/database.types"

import type {
  CommentHistoryCursor,
  CommentHistoryPage,
  ProfileTeam,
  RatingHistoryCursor,
  RatingHistoryPage,
  RatingKind,
  RecentCommentItem,
  RecentRatingItem,
} from "./types"

type Client = SupabaseClient<Database>

export const HISTORY_PAGE_SIZE = 20

const TEAM_SELECT = "id, name, logo_url, code"

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

type FixtureTeamsRow = {
  id: number
  home_team_id: number
  away_team_id: number
  home_team: unknown
  away_team: unknown
}

function appearanceKey(fixtureId: number, playerId: number): string {
  return `${fixtureId}:${playerId}`
}

/**
 * One page of a user's ratings, newest first. Match and career ratings are
 * merged in Postgres (get_user_rating_history) so the keyset cursor stays exact.
 */
export async function fetchRatingHistoryPage(
  supabase: Client,
  userId: string,
  options: {
    kind?: RatingKind | null
    cursor?: RatingHistoryCursor | null
    limit?: number
  } = {},
): Promise<RatingHistoryPage> {
  const limit = options.limit ?? HISTORY_PAGE_SIZE
  const cursor = options.cursor ?? null

  const { data, error } = await supabase.rpc("get_user_rating_history", {
    p_user_id: userId,
    p_kind: options.kind ?? undefined,
    p_before_at: cursor?.ratedAt,
    p_before_kind: cursor?.kind,
    p_before_id: cursor?.id,
    p_limit: limit + 1,
  })

  if (error) {
    console.error("fetchRatingHistoryPage failed:", error.message)
    return { items: [], nextCursor: null }
  }

  const rows = data ?? []
  const hasMore = rows.length > limit
  const pageRows = hasMore ? rows.slice(0, limit) : rows
  if (pageRows.length === 0) return { items: [], nextCursor: null }

  const playerIds = [...new Set(pageRows.map((row) => row.player_id))]
  const matchRows = pageRows.filter((row) => row.kind === "match" && row.fixture_id != null)
  const fixtureIds = [...new Set(matchRows.map((row) => row.fixture_id!))]

  const [playersRes, fixturesRes, appearancesRes] = await Promise.all([
    supabase.from("players").select("id, name, photo_url").in("id", playerIds),
    fixtureIds.length > 0
      ? supabase
          .from("fixtures")
          .select(
            `id, home_team_id, away_team_id,
             home_team:teams!fixtures_home_team_id_fkey(${TEAM_SELECT}),
             away_team:teams!fixtures_away_team_id_fkey(${TEAM_SELECT})`,
          )
          .in("id", fixtureIds)
      : Promise.resolve({ data: [], error: null }),
    fixtureIds.length > 0
      ? supabase
          .from("fixture_appearances")
          .select("fixture_id, player_id, team_id")
          .in("fixture_id", fixtureIds)
          .in("player_id", playerIds)
      : Promise.resolve({ data: [], error: null }),
  ])

  if (playersRes.error) console.error("rating history players:", playersRes.error.message)
  if (fixturesRes.error) console.error("rating history fixtures:", fixturesRes.error.message)
  if (appearancesRes.error) {
    console.error("rating history appearances:", appearancesRes.error.message)
  }

  const players = new Map((playersRes.data ?? []).map((p) => [p.id, p]))
  const fixtures = new Map(
    ((fixturesRes.data ?? []) as FixtureTeamsRow[]).map((f) => [f.id, f]),
  )
  const teamByAppearance = new Map<string, number>()
  for (const row of appearancesRes.data ?? []) {
    teamByAppearance.set(appearanceKey(row.fixture_id, row.player_id), row.team_id)
  }

  const items: RecentRatingItem[] = []
  for (const row of pageRows) {
    const player = players.get(row.player_id)
    if (!player) continue

    let oppositionTeam: ProfileTeam | null = null
    if (row.kind === "match" && row.fixture_id != null) {
      const fixture = fixtures.get(row.fixture_id)
      const teamId = teamByAppearance.get(appearanceKey(row.fixture_id, row.player_id))
      if (fixture && teamId === fixture.home_team_id) oppositionTeam = mapTeam(fixture.away_team)
      if (fixture && teamId === fixture.away_team_id) oppositionTeam = mapTeam(fixture.home_team)
    }

    items.push({
      kind: row.kind === "career" ? "career" : "match",
      id: row.id,
      playerId: player.id,
      playerName: player.name,
      photoUrl: player.photo_url,
      value: Number(row.value),
      ratedAt: row.rated_at,
      oppositionTeam,
      fixtureId: row.fixture_id,
    })
  }

  const last = pageRows.at(-1)!
  return {
    items,
    nextCursor: hasMore
      ? {
          ratedAt: last.rated_at,
          kind: last.kind === "career" ? "career" : "match",
          id: last.id,
        }
      : null,
  }
}

type CommentHistoryRow = {
  id: number
  body: string
  upvote_count: number
  created_at: string
  target_type: string
  parent_id: number | null
  thread_root_id: number | null
  player: { id: number; name: string; photo_url: string | null } | null
  fixture: {
    id: number
    home_team: { id: number; name: string; logo_url: string | null; code: string | null } | null
    away_team: { id: number; name: string; logo_url: string | null; code: string | null } | null
  } | null
  parent: {
    profile: { username: string | null; display_name: string } | null
  } | null
}

function mapCommentHistoryRow(row: CommentHistoryRow): RecentCommentItem | null {
  const thread = {
    parentId: row.parent_id,
    threadRootId: row.thread_root_id,
    replyTo: row.parent?.profile
      ? {
          username: row.parent.profile.username,
          displayName: row.parent.profile.display_name,
        }
      : null,
  }

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
      ...thread,
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
      ...thread,
    }
  }

  return null
}

/** One page of a user's comments and replies, newest first. */
export async function fetchCommentHistoryPage(
  supabase: Client,
  userId: string,
  options: { cursor?: CommentHistoryCursor | null; limit?: number } = {},
): Promise<CommentHistoryPage> {
  const limit = options.limit ?? HISTORY_PAGE_SIZE
  const cursor = options.cursor ?? null

  let query = supabase
    .from("comments")
    .select(
      `
      id,
      body,
      upvote_count,
      created_at,
      target_type,
      parent_id,
      thread_root_id,
      player:players!comments_player_id_fkey(id, name, photo_url),
      fixture:fixtures!comments_fixture_id_fkey(
        id,
        home_team:teams!fixtures_home_team_id_fkey(${TEAM_SELECT}),
        away_team:teams!fixtures_away_team_id_fkey(${TEAM_SELECT})
      ),
      parent:parent_id(
        profile:profiles!comments_user_id_fkey(username, display_name)
      )
    `,
    )
    .eq("user_id", userId)
    .eq("is_deleted", false)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })

  if (cursor) {
    query = query.or(
      `created_at.lt.${cursor.createdAt},and(created_at.eq.${cursor.createdAt},id.lt.${cursor.id})`,
    )
  }

  const { data, error } = await query.limit(limit + 1)

  if (error) {
    console.error("fetchCommentHistoryPage failed:", error.message)
    return { items: [], nextCursor: null }
  }

  const rows = (data ?? []) as unknown as CommentHistoryRow[]
  const hasMore = rows.length > limit
  const pageRows = hasMore ? rows.slice(0, limit) : rows
  const last = pageRows.at(-1)

  return {
    items: pageRows
      .map(mapCommentHistoryRow)
      .filter((item): item is RecentCommentItem => item != null),
    nextCursor:
      hasMore && last ? { createdAt: last.created_at, id: last.id } : null,
  }
}
