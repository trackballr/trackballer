import { CommentAuthorLink } from "@/components/comment/comment-author-link"
import { CommentFavouriteCrests } from "@/components/comment/comment-favourite-crests"
import { Button } from "@/components/ui/button"
import { getCommentTimeSince } from "@/lib/comment/format-time"
import type { MatchTrendingCommentCard } from "@/lib/match/match-trending-comments"
import { cn } from "@/lib/utils"

type MatchTrendingCommentsStripProps = {
  comments: MatchTrendingCommentCard[]
  currentUserId: string | null
  onSeeAll: () => void
  className?: string
}

export function MatchTrendingCommentsStrip({
  comments,
  currentUserId,
  onSeeAll,
  className,
}: MatchTrendingCommentsStripProps) {
  return (
    <section
      className={cn(
        "flex h-auto flex-col self-start overflow-hidden rounded-xl border border-border bg-card shadow-sm",
        className,
      )}
    >
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-3">
        <h3 className="text-sm font-semibold">Trending comments</h3>
        <Button type="button" variant="link" size="sm" className="h-auto px-0" onClick={onSeeAll}>
          See all
        </Button>
      </div>

      {comments.length === 0 ? (
        <p className="body-sm flex flex-1 items-center p-4 text-muted-foreground">
          No comments on this match yet. Be the first.
        </p>
      ) : (
        <div className="divide-y divide-border">
          {comments.map((comment) => (
            <div key={comment.id} className="p-4">
              <div className="mb-2 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-muted-foreground">
                <span className="font-mono font-semibold tabular-nums text-foreground">
                  ▲{comment.upvoteCount}
                </span>
                <CommentAuthorLink
                  currentUserId={currentUserId}
                  authorUserId={comment.authorUserId}
                  username={comment.authorUsername}
                  displayName={comment.authorDisplayName}
                  avatarUrl={comment.authorAvatarUrl}
                />
                <CommentFavouriteCrests
                  size="sm"
                  club={comment.authorClub}
                  nationalTeam={comment.authorNationalTeam}
                />
                <span>· {getCommentTimeSince(comment.createdAt)}</span>
              </div>
              <p className="line-clamp-3 text-sm leading-snug">&ldquo;{comment.body}&rdquo;</p>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
