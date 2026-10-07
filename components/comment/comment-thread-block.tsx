"use client"

import { ViewTransition } from "react"

import { CommentItem } from "./comment-item"
import { Button } from "@/components/ui/button"
import { replyAddress } from "@/lib/comment/comment-tree"
import type { ReplyPaginationMeta } from "@/lib/comment/pagination"
import type { CommentDisplay } from "@/lib/comment/types"

type CommentThreadBlockProps = {
  root: CommentDisplay
  userVotesMap: Record<number, 1 | -1>
  threadMeta?: ReplyPaginationMeta
  isLoadingThread: boolean
  isLoggedIn: boolean
  currentUserId: string | null
  highlightId?: number | null
  onVote: (commentId: number, value: 1 | -1) => void
  onDelete: (commentId: number) => void
  onPostReply: (body: string, parentId: number) => Promise<{ ok: boolean; error?: string }>
  onLoadMoreThread: (threadRootId: number) => void
}

export function CommentThreadBlock({
  root,
  userVotesMap,
  threadMeta,
  isLoadingThread,
  isLoggedIn,
  currentUserId,
  highlightId = null,
  onVote,
  onDelete,
  onPostReply,
  onLoadMoreThread,
}: CommentThreadBlockProps) {
  const threadHasMore = threadMeta?.hasMore ?? false

  return (
    <div className="space-y-4">
      <CommentItem
        comment={root}
        userVote={userVotesMap[root.id] ?? null}
        isLoggedIn={isLoggedIn}
        currentUserId={currentUserId}
        depth={0}
        highlighted={highlightId === root.id}
        onVote={onVote}
        onDelete={onDelete}
        onPostReply={onPostReply}
      />

      {root.replies.length > 0 && (
        <div className="space-y-4">
          {root.replies.map((reply) => (
            <ViewTransition key={reply.id} enter="fade-in" default="none">
              <CommentItem
                comment={reply}
                userVote={userVotesMap[reply.id] ?? null}
                isLoggedIn={isLoggedIn}
                currentUserId={currentUserId}
                depth={reply.thread_depth > 0 ? 1 : 0}
                replyTo={replyAddress(root, reply)}
                highlighted={highlightId === reply.id}
                onVote={onVote}
                onDelete={onDelete}
                onPostReply={onPostReply}
              />
            </ViewTransition>
          ))}
        </div>
      )}

      {threadHasMore && (
        <div className="pl-5">
          <Button
            type="button"
            variant="link"
            size="sm"
            className="h-auto px-0"
            disabled={isLoadingThread}
            onClick={() => onLoadMoreThread(root.id)}
          >
            {isLoadingThread ? "Loading more replies…" : "View more replies"}
          </Button>
        </div>
      )}
    </div>
  )
}
