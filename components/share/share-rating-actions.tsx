"use client"

import { Check, Download, Image as ImageIcon, Link2, Share2 } from "lucide-react"
import { useState } from "react"

import { XIcon } from "@/components/login/oauth-provider-icons"
import { Button, buttonVariants } from "@/components/ui/button"
import { useMounted } from "@/hooks/use-mounted"
import { xShareUrl } from "@/lib/share/share-links"
import { cn } from "@/lib/utils"

type ShareRatingActionsProps = {
  /** Public page for the rating, e.g. /u/name/rated/874. */
  sharePath: string
  /** Card picture address, already versioned. */
  cardPath: string
  /** Text for the post and the phone share sheet. */
  text: string
  className?: string
}

type Notice = { kind: "ok" | "error"; text: string } | null

function withParam(path: string, param: string): string {
  return `${path}${path.includes("?") ? "&" : "?"}${param}`
}

async function fetchCard(cardPath: string): Promise<Blob> {
  const response = await fetch(cardPath)
  if (!response.ok) throw new Error("Card unavailable")
  return response.blob()
}

/**
 * Share on X (link — the card shows as its preview), copy the link, copy or
 * download the picture, and the phone share sheet with the picture attached.
 */
export function ShareRatingActions({
  sharePath,
  cardPath,
  text,
  className,
}: ShareRatingActionsProps) {
  const mounted = useMounted()
  const [notice, setNotice] = useState<Notice>(null)
  const [busy, setBusy] = useState<"copy-image" | "share" | null>(null)

  // Browser features, checked only after load so the first paint matches the server.
  const canCopyImage =
    mounted && typeof ClipboardItem !== "undefined" && Boolean(navigator.clipboard?.write)
  const canNativeShare = mounted && typeof navigator.share === "function"

  function shareUrl(): string {
    return `${window.location.origin}${sharePath}`
  }

  function flash(next: Notice) {
    setNotice(next)
    window.setTimeout(() => setNotice(null), 2500)
  }

  function shareOnX() {
    window.open(xShareUrl(text, shareUrl()), "_blank", "noopener,noreferrer")
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl())
      flash({ kind: "ok", text: "Link copied" })
    } catch {
      flash({ kind: "error", text: "Could not copy the link" })
    }
  }

  async function copyImage() {
    setBusy("copy-image")
    try {
      // Hand the clipboard a promise: Safari only allows the write if it starts
      // inside the tap, before the picture has finished loading.
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": fetchCard(cardPath) }),
      ])
      flash({ kind: "ok", text: "Image copied — paste it into your post" })
    } catch {
      flash({ kind: "error", text: "Could not copy the image — try Download" })
    } finally {
      setBusy(null)
    }
  }

  async function nativeShare() {
    setBusy("share")
    try {
      const url = shareUrl()
      let files: File[] | undefined
      try {
        const file = new File([await fetchCard(cardPath)], "trackballr-rating.png", {
          type: "image/png",
        })
        if (navigator.canShare?.({ files: [file] })) files = [file]
      } catch {
        // No picture: share the link and text on their own.
      }
      await navigator.share(files ? { files, text, url } : { text, url })
    } catch {
      // Closing the share sheet rejects too — nothing to report.
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className={cn("space-y-2.5", className)}>
      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={shareOnX} className="h-10 gap-2 px-4">
          <XIcon className="size-3.5" />
          Share on X
        </Button>
        {canNativeShare ? (
          <Button
            type="button"
            variant="outline"
            onClick={nativeShare}
            disabled={busy === "share"}
            className="h-10 gap-2 bg-card px-4 sm:hidden"
          >
            <Share2 aria-hidden />
            Share
          </Button>
        ) : null}
        <Button type="button" variant="outline" onClick={copyLink} className="h-10 gap-2 bg-card px-4">
          <Link2 aria-hidden />
          Copy link
        </Button>
        {canCopyImage ? (
          <Button
            type="button"
            variant="outline"
            onClick={copyImage}
            disabled={busy === "copy-image"}
            className="h-10 gap-2 bg-card px-4"
          >
            <ImageIcon aria-hidden />
            {busy === "copy-image" ? "Copying…" : "Copy image"}
          </Button>
        ) : null}
        <a
          href={withParam(cardPath, "download=1")}
          download
          className={buttonVariants({ variant: "outline", className: "h-10 gap-2 bg-card px-4" })}
        >
          <Download aria-hidden />
          Download
        </a>
      </div>

      {/* Always present so screen readers hear updates; empty takes no room. */}
      <p
        role="status"
        className={cn(
          "flex items-center gap-1.5 text-xs empty:hidden",
          notice?.kind === "error" ? "text-destructive" : "text-muted-foreground",
        )}
      >
        {notice ? (
          <>
            {notice.kind === "ok" ? <Check className="size-3.5" aria-hidden /> : null}
            {notice.text}
          </>
        ) : null}
      </p>
    </div>
  )
}
