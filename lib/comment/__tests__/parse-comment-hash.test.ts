import { describe, expect, it } from "vitest"

import { parseCommentHash } from "@/lib/comment/parse-comment-hash"

describe("parseCommentHash", () => {
  it("reads a comment id from the hash", () => {
    expect(parseCommentHash("#comment-12")).toBe(12)
    expect(parseCommentHash(" #comment-99 ")).toBe(99)
  })

  it("returns null for other hashes", () => {
    expect(parseCommentHash("")).toBeNull()
    expect(parseCommentHash("#comments")).toBeNull()
    expect(parseCommentHash("#comment-0")).toBeNull()
    expect(parseCommentHash("#comment-abc")).toBeNull()
  })
})
