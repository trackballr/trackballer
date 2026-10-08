import { PlayerCommentPreviewCard } from "@/components/comment/player-comment-preview-card"
import type { TrendingCommentCard } from "@/lib/home/types"

type TrendingCommentsProps = {
  comments: TrendingCommentCard[]
  currentUserId: string | null
}

export function TrendingComments({ comments, currentUserId }: TrendingCommentsProps) {
  return (
    <section>
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="h3">Trending comments</h2>
      </div>

      {comments.length === 0 ? (
        <p className="body-sm rounded-lg border border-border bg-card p-4 text-muted-foreground">
          No hot takes this week yet.
        </p>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => (
            <PlayerCommentPreviewCard
              key={comment.id}
              body={comment.body}
              upvoteCount={comment.upvoteCount}
              createdAt={comment.createdAt}
              authorUserId={comment.authorUserId}
              authorUsername={comment.authorUsername}
              authorDisplayName={comment.authorDisplayName}
              authorAvatarUrl={comment.authorAvatarUrl}
              authorClub={comment.authorClub}
              authorNationalTeam={comment.authorNationalTeam}
              playerId={comment.playerId}
              playerName={comment.playerName}
              playerPhotoUrl={comment.playerPhotoUrl}
              currentUserId={currentUserId}
            />
          ))}
        </div>
      )}
    </section>
  )
}
