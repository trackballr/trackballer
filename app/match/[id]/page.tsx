import { notFound } from "next/navigation"

import { MatchView } from "@/components/match/match-view"
import { getComments } from "@/lib/comment/queries"
import { getServerAuth } from "@/lib/auth/server-session"
import { getMatchDetail } from "@/lib/match/detail"
import { buildMatchTopRatedPayload } from "@/lib/match/match-top-rated"
import { getMatchTrendingComments } from "@/lib/match/match-trending-comments"
import { createClient } from "@/lib/supabase/server"

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function MatchPage({ params }: PageProps) {
  const { id } = await params
  const fixtureId = Number(id)

  if (!Number.isFinite(fixtureId) || fixtureId <= 0) {
    notFound()
  }

  const detail = await getMatchDetail(fixtureId)
  if (!detail) {
    notFound()
  }

  const supabase = await createClient()
  const auth = await getServerAuth(supabase)

  const commentsPage = await getComments("match", fixtureId, auth?.userId ?? null)

  const topRated = buildMatchTopRatedPayload(
    detail.starters,
    detail.substitutesOn,
    detail.fixture.home_team.id,
    detail.fixture.away_team.id,
  )
  const trendingComments = await getMatchTrendingComments(fixtureId)

  return (
    <MatchView
      detail={detail}
      isLoggedIn={auth != null}
      commentsPage={commentsPage}
      currentUserId={auth?.userId ?? null}
      topRated={topRated}
      trendingComments={trendingComments}
    />
  )
}
