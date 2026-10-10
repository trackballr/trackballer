import { AdminShell } from "@/components/admin/admin-shell"
import { CommentModList } from "@/components/admin/comment-mod-list"
import { listRecentCommentsForAdmin } from "@/lib/admin/comment-moderation"

export default async function AdminCommentsPage() {
  const comments = await listRecentCommentsForAdmin()

  return (
    <AdminShell
      title="Comments"
      description="Recent comments across player and match pages. Deleting hides the comment but keeps its replies. Banning stops that account from posting."
    >
      <CommentModList comments={comments} />
    </AdminShell>
  )
}
