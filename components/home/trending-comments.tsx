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
        // Phones and tablets: swipeable row with the next card peeking; desktop: stacked list.
        <div className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] lg:mx-0 lg:block lg:space-y-3 lg:overflow-visible lg:px-0 lg:pb-0 [&::-webkit-scrollbar]:hidden">
          {comments.map((comment) => (
            <PlayerCommentPreviewCard
              key={comment.id}
              className="w-[82%] shrink-0 snap-start md:w-[calc(50%-0.375rem)] lg:w-auto"
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
