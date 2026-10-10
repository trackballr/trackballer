"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"

import { CommentTime } from "@/components/comment/comment-time"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Panel, PanelEmpty, PanelHeader } from "@/components/ui/panel"
import { adminBanUser, adminDeleteComment } from "@/lib/admin/actions/moderation"
import type { AdminCommentRow } from "@/lib/admin/comment-moderation"
import { cn } from "@/lib/utils"

type CommentModListProps = {
  comments: AdminCommentRow[]
}

/** What the confirm dialog is about to do. */
type PendingAction =
  | { kind: "delete"; row: AdminCommentRow }
  | { kind: "ban"; row: AdminCommentRow }

function targetHref(row: AdminCommentRow): string | null {
  if (row.targetId == null) return null
  return row.targetType === "player"
    ? `/player/${row.targetId}#comment-${row.id}`
    : `/match/${row.targetId}#comment-${row.id}`
}

export function CommentModList({ comments }: CommentModListProps) {
  const router = useRouter()
  const [notice, setNotice] = useState<{ text: string; error: boolean } | null>(null)
  const [confirm, setConfirm] = useState<PendingAction | null>(null)
  const [pending, startTransition] = useTransition()

  function runConfirmed() {
    if (!confirm) return
    const action = confirm
    setConfirm(null)

    startTransition(async () => {
      const result =
        action.kind === "delete"
          ? await adminDeleteComment(action.row.id)
          : await adminBanUser({ userId: action.row.authorId })

      if (!result.ok) {
        setNotice({ text: result.error ?? "Something went wrong.", error: true })
        return
      }
      setNotice({
        text:
          action.kind === "delete"
            ? "Comment deleted."
            : `${action.row.authorName ?? "User"} is banned from posting.`,
        error: false,
      })
      router.refresh()
    })
  }

  const author = confirm?.row.authorName ?? "this user"

  return (
    <>
      <Panel>
        <PanelHeader
          title="Recent comments"
          description={
            notice ? (
              <span className={cn(notice.error && "text-destructive")} role="status">
                {notice.text}
              </span>
            ) : (
              "Newest first."
            )
          }
        />
        {comments.length === 0 ? (
          <PanelEmpty>No comments yet.</PanelEmpty>
        ) : (
          <ul className="mx-5 mb-2 divide-y divide-border">
            {comments.map((row) => {
              const href = targetHref(row)
              return (
                <li key={row.id} className="py-4">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">
                      {row.authorName ?? "User"}
                    </span>
                    <span aria-hidden>·</span>
                    <CommentTime dateString={row.createdAt} />
                    <span aria-hidden>·</span>
                    <span className="tabular-nums">Score {row.score}</span>
                    {row.isDeleted ? (
                      <span className="rounded-full bg-muted px-2 py-0.5 font-semibold text-foreground">
                        Deleted
                      </span>
                    ) : null}
                  </div>

                  <p
                    className={cn(
                      "mt-1.5 text-sm leading-snug wrap-break-word",
                      row.isDeleted && "text-muted-foreground italic",
                    )}
                  >
                    {row.isDeleted ? "[deleted]" : row.body}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {!row.isDeleted ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={pending}
                        onClick={() => setConfirm({ kind: "delete", row })}
                        className="h-8 bg-card px-3 text-destructive hover:text-destructive"
                      >
                        Delete
                      </Button>
                    ) : null}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={pending}
                      onClick={() => setConfirm({ kind: "ban", row })}
                      className="h-8 bg-card px-3"
                    >
                      Ban user
                    </Button>
                    {href ? (
                      <Link
                        href={href}
                        className="ml-auto text-xs font-semibold text-primary hover:underline"
                      >
                        Open on {row.targetType} page →
                      </Link>
                    ) : null}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </Panel>

      <Dialog open={confirm != null} onOpenChange={(open) => (open ? null : setConfirm(null))}>
        <DialogContent showCloseButton={false} className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {confirm?.kind === "ban" ? `Ban ${author}?` : "Delete this comment?"}
            </DialogTitle>
            <DialogDescription>
              {confirm?.kind === "ban"
                ? "They will not be able to post new comments. Their existing comments stay."
                : "It will show as [deleted] in the thread. Replies under it stay."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mx-0 mt-2 mb-0 border-t-0 bg-transparent p-0 sm:justify-end sm:gap-2">
            <Button type="button" variant="outline" onClick={() => setConfirm(null)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={runConfirmed}>
              {confirm?.kind === "ban" ? "Ban user" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
