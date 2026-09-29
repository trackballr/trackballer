/** @vitest-environment node */

import { describe, expect, it } from "vitest"

import {
  addCommentToTree,
  appendThreadComments,
  getThreadIndent,
  replyAddress,
} from "@/lib/comment/comment-tree"
import type { CommentDisplay } from "@/lib/comment/types"

function comment(
  overrides: Partial<CommentDisplay> & { id: number },
): CommentDisplay {
  const { id, body, score, created_at, parent_id, replies, thread_root_id, thread_depth, ...rest } =
    overrides
  return {
    body: body ?? "Hello",
    score: score ?? 0,
    upvote_count: 0,
    downvote_count: 0,
    created_at: created_at ?? "2026-06-01T12:00:00.000Z",
    is_deleted: false,
    parent_id: parent_id ?? null,
    user_id: "user-a",
    player_id: 1,
    fixture_id: null,
    target_type: "player",
    thread_root_id: thread_root_id ?? null,
    thread_depth: thread_depth ?? 0,
    profile: null,
    replies: replies ?? [],
    ...rest,
    id,
  }
}

describe("addCommentToTree", () => {
  it("inserts reply-to-reply under the correct root thread", () => {
    const tree = [
      comment({
        id: 10,
        replies: [
          comment({
            id: 11,
            parent_id: 10,
            thread_root_id: 10,
            thread_depth: 1,
            created_at: "2026-06-01T12:00:00.000Z",
          }),
        ],
      }),
    ]

    const next = addCommentToTree(
      tree,
      comment({
        id: 12,
        parent_id: 11,
        body: "nested",
        created_at: "2026-06-01T13:00:00.000Z",
      }),
    )

    expect(next[0]?.replies.map((row) => row.id)).toEqual([11, 12])
    expect(next[0]?.replies[1]?.thread_root_id).toBe(10)
    expect(next[0]?.replies[1]?.thread_depth).toBe(2)
  })
})

describe("appendThreadComments", () => {
  it("merges mixed-depth replies chronologically", () => {
    const tree = [
      comment({
        id: 10,
        replies: [
          comment({
            id: 11,
            parent_id: 10,
            thread_root_id: 10,
            thread_depth: 1,
            created_at: "2026-06-01T12:00:00.000Z",
          }),
        ],
      }),
    ]

    const next = appendThreadComments(tree, 10, [
      comment({
        id: 12,
        parent_id: 11,
        thread_root_id: 10,
        thread_depth: 2,
        created_at: "2026-06-01T13:00:00.000Z",
      }),
      comment({
        id: 13,
        parent_id: 10,
        thread_root_id: 10,
        thread_depth: 1,
        created_at: "2026-06-01T14:00:00.000Z",
      }),
    ])

    expect(next[0]?.replies.map((row) => row.id)).toEqual([11, 12, 13])
  })
})

describe("replyAddress", () => {
  it("names the reply a later comment answers, and skips the original comment", () => {
    const root = comment({ id: 10, user_id: "root-user" })
    const first = comment({
      id: 11,
      parent_id: 10,
      thread_root_id: 10,
      thread_depth: 1,
      user_id: "alice",
      profile: {
        id: "alice",
        username: "alice",
        display_name: "Alice",
        avatar_url: null,
        favourite_club: null,
        favourite_national_team: null,
      },
    })
    const nested = comment({
      id: 12,
      parent_id: 11,
      thread_root_id: 10,
      thread_depth: 2,
    })
    root.replies = [first, nested]

    expect(replyAddress(root, first)).toBeNull()
    expect(replyAddress(root, nested)?.username).toBe("alice")
    expect(replyAddress(root, nested)?.commentId).toBe(11)
  })
})

describe("getThreadIndent", () => {
  it("uses one indent for every reply", () => {
    expect(getThreadIndent(0)).toBe("0")
    expect(getThreadIndent(1)).toBe("1.25rem")
    expect(getThreadIndent(8)).toBe("1.25rem")
    expect(getThreadIndent(40)).toBe("1.25rem")
  })
})
