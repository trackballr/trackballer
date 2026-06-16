"use client"

import Link from "next/link"
import { Loader2, Shuffle } from "lucide-react"
import { useCallback, useEffect, useState, useTransition } from "react"

import { CareerRing } from "@/components/player/career-ring"
import { PlayerCareerRatingCta } from "@/components/player/player-career-rating-cta"
import { Button, buttonVariants } from "@/components/ui/button"
import { fetchShuffleCareerPlayer } from "@/lib/home/shuffle-career-player"
import type { ShufflePlayerCard } from "@/lib/home/shuffle-career-player-map"
import { positionDisplayLabel } from "@/lib/match/position-label"
import { cn } from "@/lib/utils"

type CareerShuffleStripProps = {
  isLoggedIn: boolean
}

const primaryOutlineBtn =
  "border-primary-foreground/40 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20"

function ShuffleSkeleton() {
  return (
    <div className="flex flex-col items-center gap-4 md:flex-row md:items-center">
      <div className="size-[4.5rem] shrink-0 animate-pulse rounded-full bg-primary-foreground/20" />
      <div className="flex-1 space-y-2 text-center md:text-left">
        <div className="mx-auto h-5 w-40 animate-pulse rounded bg-primary-foreground/20 md:mx-0" />
        <div className="mx-auto h-4 w-28 animate-pulse rounded bg-primary-foreground/15 md:mx-0" />
      </div>
    </div>
  )
}

function GuestBanner() {
  return (
    <div className="flex flex-col items-center gap-4 text-center md:flex-row md:text-left">
      <div className="flex size-[4.5rem] shrink-0 items-center justify-center rounded-full border-2 border-primary-foreground/30 bg-primary-foreground/10">
        <Shuffle className="size-6 text-primary-foreground/80" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-base font-semibold">Sign in to shuffle players</p>
        <p className="mt-1 text-sm text-primary-foreground/80">
          Discover someone new and rate their career.
        </p>
      </div>
      <Link
        href="/login"
        className={cn(
          buttonVariants({ size: "sm", variant: "outline" }),
          "shrink-0",
          primaryOutlineBtn,
        )}
      >
        Sign in
      </Link>
    </div>
  )
}

function PlayerBanner({
  player,
  onShuffle,
  onRated,
  shufflePending,
}: {
  player: ShufflePlayerCard
  onShuffle: () => void
  onRated: () => void
  shufflePending: boolean
}) {
  const positionLabel = positionDisplayLabel(player.position)
  const meta = [player.clubName, positionLabel].filter(Boolean).join(" · ")

  return (
    <div className="flex flex-col items-center gap-4 md:flex-row md:items-center">
      <Link href={`/player/${player.id}`} className="shrink-0">
        <CareerRing
          name={player.displayName}
          photoUrl={player.photoUrl}
          tier={player.tier}
          displayScore={player.displayScore}
          compact
        />
      </Link>

      <div className="min-w-0 flex-1 text-center md:text-left">
        <Link
          href={`/player/${player.id}`}
          className="text-base font-bold leading-tight hover:underline sm:text-lg"
        >
          {player.displayName}
        </Link>
        {meta ? (
          <p className="mt-1 truncate text-sm text-primary-foreground/85">{meta}</p>
        ) : null}
      </div>

      <div className="flex w-full shrink-0 flex-col gap-2 sm:flex-row md:w-auto">
        <PlayerCareerRatingCta
          playerId={player.id}
          playerName={player.displayName}
          canRate
          initialValue={null}
          layout="header"
          onRated={onRated}
          className="w-full [&_button]:w-full sm:w-auto sm:[&_button]:w-auto"
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          className={cn("w-full sm:w-auto", primaryOutlineBtn)}
          onClick={onShuffle}
          disabled={shufflePending}
        >
          {shufflePending ? (
            <Loader2 className="animate-spin" data-icon="inline-start" aria-hidden />
          ) : (
            <Shuffle data-icon="inline-start" aria-hidden />
          )}
          Shuffle
        </Button>
      </div>
    </div>
  )
}

function EmptyBanner({ onShuffle, shufflePending }: { onShuffle: () => void; shufflePending: boolean }) {
  return (
    <div className="flex flex-col items-center gap-4 text-center md:flex-row md:text-left">
      <div className="min-w-0 flex-1">
        <p className="text-base font-semibold">
          You&apos;ve rated every top-league player in the pool — nice work.
        </p>
        <p className="mt-1 text-sm text-primary-foreground/80">
          Browse players or check back when squads refresh.
        </p>
      </div>
      <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
        <Link
          href="/players"
          className={cn(
            buttonVariants({ size: "sm", variant: "outline" }),
            primaryOutlineBtn,
          )}
        >
          Browse players
        </Link>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className={cn(primaryOutlineBtn)}
          onClick={onShuffle}
          disabled={shufflePending}
        >
          {shufflePending ? (
            <Loader2 className="animate-spin" data-icon="inline-start" aria-hidden />
          ) : (
            <Shuffle data-icon="inline-start" aria-hidden />
          )}
          Shuffle
        </Button>
      </div>
    </div>
  )
}

export function CareerShuffleStrip({ isLoggedIn }: CareerShuffleStripProps) {
  const [player, setPlayer] = useState<ShufflePlayerCard | null>(null)
  const [poolEmpty, setPoolEmpty] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [initialLoad, setInitialLoad] = useState(isLoggedIn)
  const [isPending, startTransition] = useTransition()

  const loadPlayer = useCallback(() => {
    startTransition(async () => {
      setError(null)
      const result = await fetchShuffleCareerPlayer()
      setInitialLoad(false)
      if (!result.ok) {
        setError(result.error)
        return
      }
      setPlayer(result.player)
      setPoolEmpty(result.player == null)
    })
  }, [])

  useEffect(() => {
    if (isLoggedIn) {
      loadPlayer()
    }
  }, [isLoggedIn, loadPlayer])

  return (
    <section>
      <div className="mb-3">
        <h2 className="h3">Shuffle ratings</h2>
        <p className="body-sm mt-1 text-muted-foreground">
          Rate top-league careers for players you haven&apos;t scored yet.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl bg-primary px-4 py-4 text-primary-foreground shadow-sm sm:px-5 sm:py-5">
        {!isLoggedIn ? (
          <GuestBanner />
        ) : initialLoad && isPending ? (
          <ShuffleSkeleton />
        ) : error ? (
          <div className="flex flex-col items-center gap-3 text-center md:flex-row md:justify-between md:text-left">
            <p className="text-sm text-primary-foreground/90">{error}</p>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className={cn("shrink-0", primaryOutlineBtn)}
              onClick={loadPlayer}
              disabled={isPending}
            >
              Try again
            </Button>
          </div>
        ) : poolEmpty ? (
          <EmptyBanner onShuffle={loadPlayer} shufflePending={isPending} />
        ) : player ? (
          <PlayerBanner
            player={player}
            onShuffle={loadPlayer}
            onRated={loadPlayer}
            shufflePending={isPending}
          />
        ) : (
          <ShuffleSkeleton />
        )}
      </div>
    </section>
  )
}
