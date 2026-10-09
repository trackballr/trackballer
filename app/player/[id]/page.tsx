import { notFound } from "next/navigation"

import { CommentThread } from "@/components/comment/comment-thread"
import { PlayerProfileHero } from "@/components/player/player-profile-hero"
import { PlayerRecentMatches } from "@/components/player/player-recent-matches"
import { getComments } from "@/lib/comment/queries"
import { getPlayerProfile } from "@/lib/player/detail"
import { getServerAuth } from "@/lib/auth/server-session"
import { createClient } from "@/lib/supabase/server"

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function PlayerPage({ params }: PageProps) {
  const { id } = await params
  const playerId = Number(id)

  if (!Number.isFinite(playerId) || playerId <= 0) {
    notFound()
  }

  const supabase = await createClient()
  const auth = await getServerAuth(supabase)
  const profile = await getPlayerProfile(playerId, auth?.userId ?? null)
  if (!profile) {
    notFound()
  }

  const commentsPage = await getComments("player", playerId, auth?.userId ?? null)

  return (
    // One centred column, like the profile history pages.
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <PlayerProfileHero profile={profile} canRateCareer={Boolean(auth)} />
      <PlayerRecentMatches profile={profile} />
      <CommentThread
        initialComments={commentsPage.comments}
        initialUserVotes={commentsPage.userVotes}
        totalParentCount={commentsPage.totalParentCount}
        initialParentHasMore={commentsPage.parentHasMore}
        initialParentNextCursor={commentsPage.parentNextCursor}
        initialReplyPagination={commentsPage.replyPagination}
        initialSort={commentsPage.initialSort}
        targetType="player"
        targetId={playerId}
        isLoggedIn={Boolean(auth)}
        currentUserId={auth?.userId ?? null}
      />
    </div>
  )
}
