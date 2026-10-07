import { getOnboardingOptions } from "@/lib/onboarding/options"
import { resolveDisplayAvatar, type AvatarSource } from "@/lib/profile/display-avatar"
import { normalizeXAvatarUrl } from "@/lib/profile/normalize-x-avatar-url"
import { fetchCommentHistoryPage, fetchRatingHistoryPage } from "@/lib/profile/history"
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

export const PROFILE_PREVIEW_SIZE = 5

export async function getRecentRatings(userId: string): Promise<RecentRatingItem[]> {
  const supabase = await createClient()
  const page = await fetchRatingHistoryPage(supabase, userId, {
    limit: PROFILE_PREVIEW_SIZE,
  })
  return page.items
}

export async function getRecentComments(userId: string): Promise<RecentCommentItem[]> {
  const supabase = await createClient()
  const page = await fetchCommentHistoryPage(supabase, userId, {
    limit: PROFILE_PREVIEW_SIZE,
  })
  return page.items
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
  const [stats, recentRatings, recentComments] = await Promise.all([
    getProfileStats(userId),
    getRecentRatings(userId),
    getRecentComments(userId),
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
  }
}
