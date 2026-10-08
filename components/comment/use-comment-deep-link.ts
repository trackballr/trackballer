"use client"

import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react"

import { mergeVoteMaps } from "@/components/comment/use-comment-tree-actions"
import type { CommentTarget } from "@/components/comment/use-comment-tree-actions"
import { commentExistsInTree, mergeDeepLinkThreadRoot } from "@/lib/comment/comment-tree"
import { fetchCommentDeepLinkAction } from "@/lib/comment/fetch-comments-page"
import type { ReplyPaginationMeta } from "@/lib/comment/pagination"
import { parseCommentHashFromLocation } from "@/lib/comment/parse-comment-hash"
import { scrollCommentIntoView } from "@/lib/comment/scroll-to-comment"
import type { CommentDisplay } from "@/lib/comment/types"

type UseCommentDeepLinkOptions = {
  target: CommentTarget
  comments: CommentDisplay[]
  setComments: Dispatch<SetStateAction<CommentDisplay[]>>
  setUserVotes: Dispatch<SetStateAction<Record<number, 1 | -1>>>
  setReplyMeta: Dispatch<SetStateAction<Record<number, ReplyPaginationMeta>>>
}

export function useCommentDeepLink({
  target,
  comments,
  setComments,
  setUserVotes,
  setReplyMeta,
}: UseCommentDeepLinkOptions) {
  const [hashCommentId, setHashCommentId] = useState<number | null>(null)
  const fetchKeyRef = useRef<string | null>(null)
  const scrolledIdRef = useRef<number | null>(null)

  useEffect(() => {
    function syncHash() {
      const nextId = parseCommentHashFromLocation()
      setHashCommentId(nextId)
      fetchKeyRef.current = null
      scrolledIdRef.current = null
    }
    syncHash()
    window.addEventListener("hashchange", syncHash)
    return () => window.removeEventListener("hashchange", syncHash)
  }, [])

  useEffect(() => {
    if (hashCommentId == null) return

    if (commentExistsInTree(comments, hashCommentId)) {
      // Scroll once per link: the list changes on every vote or reply, and those
      // must not drag the page back to the linked comment.
      if (scrolledIdRef.current !== hashCommentId) {
        scrolledIdRef.current = hashCommentId
        scrollCommentIntoView(hashCommentId)
      }
      return
    }

    const fetchKey = `${target.type}:${target.id}:${hashCommentId}`
    if (fetchKeyRef.current === fetchKey) return
    fetchKeyRef.current = fetchKey

    // Guard on the request key rather than cancelling on every re-run: the comment
    // list can change while this loads, and the answer must still be applied.
    fetchCommentDeepLinkAction({
      target_type: target.type,
      target_id: target.id,
      comment_id: hashCommentId,
    }).then((result) => {
      if (fetchKeyRef.current !== fetchKey || !result.ok) return
      setComments((prev) => mergeDeepLinkThreadRoot(prev, result.root))
      setUserVotes((prev) => mergeVoteMaps(prev, result.userVotes))
      setReplyMeta((prev) => ({
        ...prev,
        [result.root.id]: result.replyPagination,
      }))
      scrolledIdRef.current = hashCommentId
      scrollCommentIntoView(hashCommentId)
    })
  }, [hashCommentId, comments, target.id, target.type, setComments, setUserVotes, setReplyMeta])

  return hashCommentId
}
