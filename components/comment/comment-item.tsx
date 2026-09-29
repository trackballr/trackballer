"use client"

import { useState } from "react"
import { CommentComposer } from "./comment-composer"
import { CommentFavouriteCrests } from "./comment-favourite-crests"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { CommentAuthorLink } from "@/components/comment/comment-author-link"
import { CommentTime } from "@/components/comment/comment-time"
import { getCommentAuthorDisplay } from "@/lib/comment/author-display"
import { getThreadIndent, type ReplyAddress } from "@/lib/comment/comment-tree"
import { MAX_THREAD_DEPTH } from "@/lib/comment/pagination"
import type { CommentDisplay } from "@/lib/comment/types"

interface CommentItemProps {
  comment: CommentDisplay
  userVote: 1 | -1 | null
  isLoggedIn: boolean
  currentUserId: string | null
  depth?: number
  replyTo?: ReplyAddress | null
  onVote: (commentId: number, value: 1 | -1) => void
  onDelete: (commentId: number) => void
  onPostReply: (body: string, parentId: number) => Promise<{ ok: boolean; error?: string }>
}

export function CommentItem({
  comment,
  userVote,
  isLoggedIn,
  currentUserId,
  depth = 0,
  replyTo = null,
  onVote,
  onDelete,
  onPostReply,
}: CommentItemProps) {
  const [replyOpen, setReplyOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const isPending = comment.isPending === true
  const isDeletedStub = comment.is_deleted
  const isOwner = currentUserId === comment.user_id
  const canReply = comment.thread_depth < MAX_THREAD_DEPTH

  function confirmDelete() {
    onDelete(comment.id)
    setDeleteOpen(false)
  }

  return (
    <>
      <div
        id={`comment-${comment.id}`}
        className={`flex scroll-mt-20 gap-3 transition-opacity ${isPending ? "opacity-50" : ""}`}
        style={depth > 0 ? { marginLeft: getThreadIndent(depth) } : undefined}
      >
        <div className="flex flex-col items-center gap-1 pt-1">
          {!isDeletedStub ? (
            <>
              <button
                type="button"
                disabled={isPending}
                onClick={() => onVote(comment.id, 1)}
                className={`text-lg transition-colors disabled:cursor-not-allowed ${
                  userVote === 1
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                ▲
              </button>
              <span className="text-sm font-medium tabular-nums">{comment.score}</span>
              <button
                type="button"
                disabled={isPending}
                onClick={() => onVote(comment.id, -1)}
                className={`text-lg transition-colors disabled:cursor-not-allowed ${
                  userVote === -1
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                ▼
              </button>
            </>
          ) : (
            <span className="pt-1 text-xs text-muted-foreground">·</span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          {replyTo ? <ReplyingTo replyTo={replyTo} currentUserId={currentUserId} /> : null}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <CommentAuthorLink
              currentUserId={currentUserId}
              authorUserId={comment.user_id}
              username={comment.profile?.username}
              displayName={comment.profile?.display_name}
              avatarUrl={comment.profile?.avatar_url}
            />
            <CommentFavouriteCrests
              club={comment.profile?.favourite_club}
              nationalTeam={comment.profile?.favourite_national_team}
            />
            <CommentTime dateString={comment.created_at} pending={isPending} />
          </div>

          <p className="mt-1 break-words text-sm text-foreground">
            {isDeletedStub ? (
              <span className="italic text-muted-foreground">[deleted]</span>
            ) : (
              comment.body
            )}
          </p>

          {!isDeletedStub && !isPending && (canReply || isOwner) && (
            <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
              {canReply && (
                <button
                  type="button"
                  onClick={() => setReplyOpen(!replyOpen)}
                  className="transition-colors hover:text-foreground"
                >
                  Reply
                </button>
              )}
              {isOwner && (
                <button
                  type="button"
                  onClick={() => setDeleteOpen(true)}
                  className="transition-colors hover:text-red-500"
                >
                  Delete
                </button>
              )}
            </div>
          )}

          {replyOpen && canReply && !isDeletedStub && !isPending && (
            <div className="mt-3">
              <CommentComposer
                isLoggedIn={isLoggedIn}
                compact
                onPost={async (body) => {
                  const result = await onPostReply(body, comment.id)
                  if (result.ok) {
                    setReplyOpen(false)
                  }
                  return result
                }}
              />
            </div>
          )}
        </div>
      </div>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent showCloseButton={false} className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete this comment?</DialogTitle>
            <DialogDescription>
              This will remove your comment from the thread. You cannot undo this.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mx-0 mt-2 mb-0 border-t-0 bg-transparent p-0 sm:justify-end sm:gap-2">
            <Button type="button" variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function ReplyingTo({
  replyTo,
  currentUserId,
}: {
  replyTo: ReplyAddress
  currentUserId: string | null
}) {
  const named =
    replyTo.authorUserId != null
      ? getCommentAuthorDisplay({
          currentUserId,
          authorUserId: replyTo.authorUserId,
          username: replyTo.username,
          displayName: replyTo.displayName,
        }).label
      : null

  function jumpToParent() {
    document.getElementById(`comment-${replyTo.commentId}`)?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    })
  }

  return (
    <p className="mb-1 text-xs text-muted-foreground">
      Replying to{" "}
      <button
        type="button"
        onClick={jumpToParent}
        className="font-medium text-foreground hover:underline"
      >
        {named ?? "an earlier reply"}
      </button>
    </p>
  )
}
