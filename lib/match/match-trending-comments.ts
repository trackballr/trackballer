import { cache } from "react"

import { COMMENT_PROFILE_SELECT } from "@/lib/comment/profile-select"
import { createClient } from "@/lib/supabase/server"

const FIXTURE_TRENDING_COMMENT_LIMIT = 3

export type MatchTrendingCommentCard = {
  id: number
  body: string
  upvoteCount: number
  createdAt: string
  authorUserId: string
  authorUsername: string | null
  authorDisplayName: string
  authorAvatarUrl: string | null
  authorClub: { id: number; name: string; logo_url: string | null } | null
  authorNationalTeam: { id: number; name: string; logo_url: string | null } | null
}

type CommentRow = {
  id: number
  body: string
  upvote_count: number
  created_at: string
  user_id: string
  profile: {
    username: string | null
    display_name: string
    avatar_url: string | null
    favourite_club: { id: number; name: string; logo_url: string | null } | null
    favourite_national_team: { id: number; name: string; logo_url: string | null } | null
  } | null
}

const COMMENT_SELECT = `
  id,
  body,
  upvote_count,
  created_at,
  user_id,
  profile:profiles!comments_user_id_fkey(${COMMENT_PROFILE_SELECT})
`

function mapRow(row: CommentRow): MatchTrendingCommentCard {
  return {
    id: row.id,
    body: row.body,
    upvoteCount: row.upvote_count,
    createdAt: row.created_at,
    authorUserId: row.user_id,
    authorUsername: row.profile?.username ?? null,
    authorDisplayName: row.profile?.display_name ?? "user",
    authorAvatarUrl: row.profile?.avatar_url ?? null,
    authorClub: row.profile?.favourite_club ?? null,
    authorNationalTeam: row.profile?.favourite_national_team ?? null,
  }
}

/** Top upvotes on this match — up to 3, any age (fixture-scoped, not the home 7-day window). */
export const getMatchTrendingComments = cache(
  async (fixtureId: number): Promise<MatchTrendingCommentCard[]> => {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("comments")
      .select(COMMENT_SELECT)
      .eq("target_type", "match")
      .eq("fixture_id", fixtureId)
      .eq("is_deleted", false)
      .is("parent_id", null)
      .order("score", { ascending: false })
      .limit(FIXTURE_TRENDING_COMMENT_LIMIT)

    if (error) {
      console.error("getMatchTrendingComments failed:", error.message)
      return []
    }

    return (data ?? []).map((row) => mapRow(row as CommentRow))
  },
)
