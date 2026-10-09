import Link from "next/link"

import { TrendingEmptyState } from "@/components/comment/trending-empty-state"
import { PlayerAvatar } from "@/components/player-avatar"
import { PlayerCommentPreviewCard } from "@/components/comment/player-comment-preview-card"
import type { TrendingCommentCard, TrendingPlayerCard } from "@/lib/home/types"

type TrendingCommentsProps = {
  comments: TrendingCommentCard[]
  currentUserId: string | null
  /** Shown in the empty state as places to post the first take. */
  suggestedPlayers?: TrendingPlayerCard[]
}

export function TrendingComments({
  comments,
  currentUserId,
  suggestedPlayers = [],
}: TrendingCommentsProps) {
  return (
    <section>
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="h3">Trending comments</h2>
      </div>

      {comments.length === 0 ? (
        <TrendingEmptyState
          className="rounded-lg border border-border bg-card p-5"
          title="No hot takes this week"
          description="The most upvoted comments from the last 7 days land here."
        >
          {suggestedPlayers.length > 0 ? (
            <>
              <p className="text-xs font-medium text-muted-foreground">Start one on</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {suggestedPlayers.map((player) => (
                  <Link
                    key={player.id}
                    href={`/player/${player.id}#comments-section`}
                    className="inline-flex items-center gap-2 rounded-full bg-primary py-1 pr-3 pl-1 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                  >
                    <PlayerAvatar
                      name={player.name}
                      photoUrl={player.photoUrl}
                      size="sm"
                      className="size-6 rounded-full ring-1 ring-primary-foreground/30"
                    />
                    {player.name}
                  </Link>
                ))}
              </div>
            </>
          ) : null}
        </TrendingEmptyState>
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
