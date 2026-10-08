"use client"

import { useState } from "react"
import Link from "next/link"

interface CommentComposerProps {
  isLoggedIn: boolean
  compact?: boolean
  /** Text to start with, e.g. a prompt picked from an empty state. */
  initialBody?: string
  onPost: (body: string) => Promise<{ ok: boolean; error?: string }>
}

export function CommentComposer({
  isLoggedIn,
  compact = false,
  initialBody = "",
  onPost,
}: CommentComposerProps) {
  const [body, setBody] = useState(initialBody)
  const [error, setError] = useState("")
  const [isPending, setIsPending] = useState(false)

  if (!isLoggedIn) {
    return (
      <div className="flex items-center gap-2 py-3">
        <Link
          href="/login"
          className="rounded-full border border-border px-4 py-2 text-sm font-medium text-primary hover:bg-muted"
        >
          Sign in to comment
        </Link>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")

    const trimmed = body.trim()
    if (!trimmed) {
      setError("Comment cannot be empty")
      return
    }

    const savedBody = trimmed
    setBody("")
    setIsPending(true)

    const result = await onPost(savedBody)

    setIsPending(false)
    if (!result.ok) {
      setBody(savedBody)
      setError(result.error ?? "Could not post comment.")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="relative">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={280}
          placeholder="Add a comment…"
          disabled={isPending}
          className="w-full rounded-lg border border-border bg-card p-3 text-sm placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60"
          rows={compact ? 2 : 3}
        />
        <div className="absolute right-2 bottom-2 text-xs text-muted-foreground">
          {body.length}/280
        </div>
      </div>

      {error && <div className="text-xs text-red-500">{error}</div>}

      <div className="flex justify-end gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {isPending ? "Posting…" : "Post"}
        </button>
      </div>
    </form>
  )
}
