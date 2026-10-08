const COMMENT_HASH_RE = /^#comment-(\d+)$/

/** `#comment-12` → 12, or null when missing / invalid. */
export function parseCommentHash(hash: string): number | null {
  const trimmed = hash.trim()
  if (!trimmed) return null
  const match = COMMENT_HASH_RE.exec(trimmed)
  if (!match) return null
  const id = Number(match[1])
  return Number.isInteger(id) && id > 0 ? id : null
}

export function parseCommentHashFromLocation(): number | null {
  if (typeof window === "undefined") return null
  return parseCommentHash(window.location.hash)
}
