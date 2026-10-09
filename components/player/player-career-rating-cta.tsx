"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { createPortal } from "react-dom"

import { CareerRatingSlider } from "@/components/player/career-rating-slider"
import { Button, buttonVariants } from "@/components/ui/button"
import { useMounted } from "@/hooks/use-mounted"
import {
  CAREER_RATING_DEFAULT,
  CAREER_RATING_MAX,
  CAREER_RATING_MIN,
  careerTierLabel,
  formatCareerScore,
  tierForScore,
} from "@/lib/rating/career-tier"
import { isValidCareerRatingValue } from "@/lib/rating/engine"
import { submitCareerRating } from "@/lib/rating/submit-career-rating"
import { cn } from "@/lib/utils"

type PlayerCareerRatingCtaProps = {
  playerId: number
  playerName: string
  canRate: boolean
  initialValue: number | null
  /** Header pill (FotMob-style) vs stacked default. */
  layout?: "default" | "header"
  className?: string
  /** Called after a successful submit (e.g. home shuffle loads next player). */
  onRated?: () => void
}

export function PlayerCareerRatingCta({
  playerId,
  playerName,
  canRate,
  initialValue,
  layout = "default",
  className,
  onRated,
}: PlayerCareerRatingCtaProps) {
  const router = useRouter()
  const mounted = useMounted()
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState(
    initialValue != null && isValidCareerRatingValue(initialValue)
      ? initialValue
      : CAREER_RATING_DEFAULT,
  )
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function submit() {
    setError(null)
    startTransition(async () => {
      const result = await submitCareerRating({ playerId, value })
      if (!result.ok) {
        setError(result.error)
        return
      }
      setOpen(false)
      onRated?.()
      router.refresh()
    })
  }

  const isHeader = layout === "header"
  const buttonLabel =
    initialValue == null
      ? isHeader
        ? "Rate"
        : "Rate career"
      : isHeader
        ? "Edit"
        : "Edit career rating"

  const personalCopy =
    initialValue == null
      ? "You have not rated this career yet."
      : `You rated their career: ${formatCareerScore(initialValue)}`

  const tierLabel = careerTierLabel(tierForScore(value))

  const dialog =
    open && mounted
      ? createPortal(
          <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
            role="presentation"
            onClick={() => setOpen(false)}
          >
            <div
              role="dialog"
              aria-labelledby="career-rating-title"
              className="w-full max-w-md rounded-t-2xl border border-border bg-card p-5 text-foreground shadow-lg sm:rounded-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-muted" />
              <h2
                id="career-rating-title"
                className="text-center text-lg font-semibold text-foreground"
              >
                Rate {playerName}
              </h2>
              <p className="mt-1 text-center text-sm text-muted-foreground">
                Rate overall career from 1 to 100.
              </p>

              <p className="mt-4 text-center font-mono text-5xl font-bold tabular-nums text-foreground">
                {value}
              </p>
              <p className="text-center text-sm font-medium text-muted-foreground">
                {tierLabel}
              </p>
              <CareerRatingSlider
                min={CAREER_RATING_MIN}
                max={CAREER_RATING_MAX}
                value={value}
                onValueChange={setValue}
                className="mt-4 w-full"
                aria-label="Career rating value"
              />

              {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}

              <div className="mt-6 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button type="button" onClick={submit} disabled={isPending}>
                  {isPending ? "Saving..." : "Submit rating"}
                </Button>
              </div>
            </div>
          </div>,
          document.body,
        )
      : null

  if (!canRate) {
    return (
      <Link
        href="/login"
        className={cn(
          buttonVariants({
            size: "sm",
            variant: isHeader ? "outline" : "default",
            className: cn(
              // Same white pill as "Rate", so it reads as the action on the navy band.
              isHeader &&
                "shrink-0 border-primary-foreground/40 bg-primary-foreground text-primary hover:bg-primary-foreground/90",
            ),
          }),
          className,
        )}
      >
        {isHeader ? "Sign in" : "Sign in to rate career"}
      </Link>
    )
  }

  return (
    <>
      <div
        className={cn(
          isHeader ? "flex shrink-0 flex-col items-end gap-1" : "mt-2 flex flex-col items-center gap-1",
          className,
        )}
      >
        <Button
          size="sm"
          variant={isHeader ? "outline" : "default"}
          className={cn(
            isHeader &&
              "border-primary-foreground/40 bg-primary-foreground text-primary hover:bg-primary-foreground/90",
          )}
          onClick={() => setOpen(true)}
        >
          {buttonLabel}
        </Button>
        {!isHeader && (
          <p className="text-xs text-muted-foreground">{personalCopy}</p>
        )}
      </div>

      {dialog}
    </>
  )
}
