"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"

type ProfilePublicLinkProps = {
  username: string
}

export function ProfilePublicLink({ username }: ProfilePublicLinkProps) {
  const [copied, setCopied] = useState(false)
  const path = `/u/${username}`

  async function copyLink() {
    const url = `${window.location.origin}${path}`
    await navigator.clipboard.writeText(url)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex min-w-0 items-center gap-2">
      <code className="min-w-0 flex-1 truncate rounded-md bg-muted px-3 py-2 text-sm">
        {path}
      </code>
      <Button type="button" variant="outline" onClick={copyLink} className="shrink-0">
        {copied ? "Copied" : "Copy link"}
      </Button>
    </div>
  )
}
