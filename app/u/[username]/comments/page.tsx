import { CommentHistoryList } from "@/components/profile/comment-history-list"
import { ProfileHistoryShell } from "@/components/profile/profile-history-shell"
import { fetchCommentHistoryPage } from "@/lib/profile/history"
import { loadProfileHistoryContext } from "@/lib/profile/history-page"

type PageProps = {
  params: Promise<{ username: string }>
  searchParams: Promise<{ open?: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { username } = await params
  return { title: `Comments by @${username} | Trackballr` }
}

export default async function UserCommentsPage({ params, searchParams }: PageProps) {
  const [{ username }, { open }] = await Promise.all([params, searchParams])
  const openId = Number(open)

  const { supabase, profile, stats, isOwner, viewerUserId } =
    await loadProfileHistoryContext(username)
  const firstPage = await fetchCommentHistoryPage(supabase, profile.id)

  return (
    <ProfileHistoryShell profile={profile} stats={stats} active="comments" isOwner={isOwner}>
      <CommentHistoryList
        userId={profile.id}
        initialPage={firstPage}
        initialOpenId={Number.isInteger(openId) && openId > 0 ? openId : null}
        isLoggedIn={viewerUserId != null}
        currentUserId={viewerUserId}
      />
    </ProfileHistoryShell>
  )
}
