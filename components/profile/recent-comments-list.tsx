import Link from "next/link"

import { CommentTime } from "@/components/comment/comment-time"
import { PlayerAvatar } from "@/components/player-avatar"
import { TeamFlag } from "@/components/team-flag"
import { PanelEmpty, PanelList } from "@/components/ui/panel"
import type { RecentCommentItem } from "@/lib/profile/types"
import { cn } from "@/lib/utils"

/** What the comment was posted on — player, or the two sides of a match. */
export function CommentTargetLabel({ comment }: { comment: RecentCommentItem }) {
  if (comment.targetType === "player") {
    return (
      <span className="flex min-w-0 items-center gap-2">
        <PlayerAvatar
          name={comment.playerName}
          photoUrl={comment.playerPhotoUrl}
          size="sm"
          className="shrink-0 rounded-full"
        />
        <span className="truncate text-sm font-semibold">{comment.playerName}</span>
      </span>
    )
  }

  return (
    <span className="flex min-w-0 items-center gap-1.5">
      <TeamFlag
        team={{
          name: comment.homeTeam.name,
          logo_url: comment.homeTeam.logoUrl,
          code: comment.homeTeam.code,
        }}
        size="md"
      />
      <span className="truncate text-sm font-semibold">
        {comment.homeTeam.name} vs {comment.awayTeam.name}
      </span>
      <TeamFlag
        team={{
          name: comment.awayTeam.name,
          logo_url: comment.awayTeam.logoUrl,
          code: comment.awayTeam.code,
        }}
        size="md"
      />
    </span>
  )
}

export function commentTargetHref(comment: RecentCommentItem): string {
  return comment.targetType === "player"
    ? `/player/${comment.playerId}#comment-${comment.id}`
    : `/match/${comment.fixtureId}#comment-${comment.id}`
}

export function CommentHistoryContent({
  comment,
  clamp = false,
}: {
  comment: RecentCommentItem
  clamp?: boolean
}) {
  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <CommentTargetLabel comment={comment} />
        <span className="shrink-0 text-xs text-muted-foreground">
          <CommentTime dateString={comment.createdAt} />
        </span>
      </div>
      {comment.replyTo ? (
        <p className="mt-2 text-xs text-muted-foreground">
          Replying to{" "}
          <span className="font-medium text-foreground">
            {comment.replyTo.username
              ? `@${comment.replyTo.username}`
              : comment.replyTo.displayName}
          </span>
        </p>
      ) : null}
      <p
        className={cn(
          "mt-1.5 wrap-break-word text-sm leading-snug",
          !comment.replyTo && "mt-2",
          clamp && "line-clamp-3",
        )}
      >
        {comment.body}
      </p>
      <p className="mt-2 text-xs font-semibold tabular-nums text-muted-foreground">
        ▲ {comment.upvoteCount}
      </p>
    </>
  )
}

type RecentCommentsListProps = {
  comments: RecentCommentItem[]
  /** Profile comments page; rows open their thread there. */
  historyHref: string | null
}

export function RecentCommentsList({ comments, historyHref }: RecentCommentsListProps) {
  if (comments.length === 0) {
    return <PanelEmpty>No comments yet.</PanelEmpty>
  }

  return (
    <PanelList>
      {comments.map((comment) => (
        <Link
          key={comment.id}
          href={
            historyHref ? `${historyHref}?open=${comment.id}` : commentTargetHref(comment)
          }
          className="block py-3.5 transition-opacity hover:opacity-80"
        >
          <CommentHistoryContent comment={comment} clamp />
        </Link>
      ))}
    </PanelList>
  )
}
