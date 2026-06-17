"use client"

import { useRouter } from "next/navigation"
import { useCallback, useEffect, useState, useTransition } from "react"

import { MatchHero } from "@/components/match/match-hero"
import { MatchPageTabs } from "@/components/match/match-page-tabs"
import { PenaltyShootoutSection } from "@/components/match/penalty-shootout-section"
import { MatchRatingUI } from "@/components/rating/match-rating-ui"
import { formatMatchHeroScore } from "@/lib/match/hero-score"
import type { CommentsPageData } from "@/lib/comment/queries"
import type { MatchTopRatedPayload } from "@/lib/match/match-top-rated"
import type { MatchTrendingCommentCard } from "@/lib/match/match-trending-comments"
import type { MatchDetail, MatchLineupPlayer } from "@/lib/match/types"
import { submitMatchRating } from "@/lib/rating/submit-match-rating"
import { formatFixtureRoundLabel } from "@/lib/world-cup/round-label"

type MatchViewProps = {
  detail: MatchDetail
  isLoggedIn: boolean
  commentsPage?: CommentsPageData
  currentUserId?: string | null
  topRated: MatchTopRatedPayload | null
  trendingComments: MatchTrendingCommentCard[]
}

function matchContextLabel(detail: MatchDetail): string {
  const { fixture } = detail
  const vs = `${fixture.home_team.name} vs ${fixture.away_team.name}`
  const round = fixture.round_name
    ? (formatFixtureRoundLabel(fixture.round_name) ?? fixture.round_name)
    : null
  return round ? `${vs} · ${round}` : vs
}

function updatePlayerInList(
  list: MatchLineupPlayer[],
  playerId: number,
  patch: Partial<MatchLineupPlayer>,
): MatchLineupPlayer[] {
  return list.map((p) => (p.playerId === playerId ? { ...p, ...patch } : p))
}

function findRateableIndex(queue: MatchLineupPlayer[], playerId: number): number {
  return queue.findIndex((p) => p.playerId === playerId)
}

export function MatchView({
  detail: initialDetail,
  isLoggedIn,
  commentsPage,
  currentUserId = null,
  topRated,
  trendingComments,
}: MatchViewProps) {
  const router = useRouter()
  const [detail, setDetail] = useState(initialDetail)
  const [ratingIndex, setRatingIndex] = useState<number | null>(null)
  const [advanceOnSubmit, setAdvanceOnSubmit] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    setDetail(initialDetail)
  }, [initialDetail])

  const { fixture } = detail
  const heroScore = formatMatchHeroScore(fixture)
  const contextLabel = matchContextLabel(detail)
  const canRate = isLoggedIn && detail.ratingsUnlocked
  const ratingsLocked = !canRate
  const ratingOpen = ratingIndex != null && detail.rateableQueue[ratingIndex] != null

  const closeRatingSheet = useCallback(() => {
    setRatingIndex(null)
    setAdvanceOnSubmit(false)
  }, [])

  const openRatingSheet = useCallback(
    (player: MatchLineupPlayer, options?: { advanceOnSubmit?: boolean }) => {
      if (!canRate) {
        if (!isLoggedIn) {
          setErrorMessage("Sign in to rate players.")
        } else if (!detail.ratingsUnlocked) {
          setErrorMessage("Ratings unlock when the match finishes.")
        } else if (!player.isRateable) {
          setErrorMessage("Only players who got minutes can be rated.")
        }
        return
      }
      if (!player.isRateable) {
        setErrorMessage("This player did not play enough minutes to rate.")
        return
      }

      const index = findRateableIndex(detail.rateableQueue, player.playerId)
      if (index < 0) {
        setErrorMessage("This player cannot be rated for this match.")
        return
      }

      setErrorMessage(null)
      setAdvanceOnSubmit(options?.advanceOnSubmit ?? false)
      setRatingIndex(index)
    },
    [canRate, detail.rateableQueue, detail.ratingsUnlocked, isLoggedIn],
  )

  function handleRateAll() {
    if (detail.rateableQueue.length === 0) {
      setErrorMessage("No rateable players for this match yet.")
      return
    }
    setAdvanceOnSubmit(true)
    setRatingIndex(0)
    setErrorMessage(null)
  }

  function applyLocalRating(playerId: number, value: number, communityAvg: number | null) {
    setDetail((prev) => ({
      ...prev,
      starters: updatePlayerInList(prev.starters, playerId, {
        userRating: value,
        communityAvg,
      }),
      substitutesOn: updatePlayerInList(prev.substitutesOn, playerId, {
        userRating: value,
        communityAvg,
      }),
      benchUnused: updatePlayerInList(prev.benchUnused, playerId, {
        userRating: value,
        communityAvg,
      }),
      rateableQueue: updatePlayerInList(prev.rateableQueue, playerId, {
        userRating: value,
        communityAvg,
      }),
    }))
  }

  function handleSubmit(value: number) {
    if (ratingIndex == null) return

    const player = detail.rateableQueue[ratingIndex]
    if (!player) return

    const snapshotIndex = ratingIndex
    const shouldAdvance = advanceOnSubmit

    startTransition(async () => {
      const result = await submitMatchRating({
        fixtureId: fixture.id,
        playerId: player.playerId,
        value,
      })

      if (!result.ok) {
        setErrorMessage(result.error)
        return
      }

      const prevAvg = player.communityAvg
      const prevCount = player.ratingCount ?? 0
      let nextAvg = value
      if (player.userRating != null && prevCount > 0) {
        const total = (prevAvg ?? 0) * prevCount - player.userRating + value
        nextAvg = Math.round((total / prevCount) * 100) / 100
      } else if (prevCount > 0 && prevAvg != null) {
        nextAvg = Math.round(((prevAvg * prevCount + value) / (prevCount + 1)) * 100) / 100
      }

      applyLocalRating(player.playerId, value, nextAvg)
      router.refresh()

      if (shouldAdvance && snapshotIndex < detail.rateableQueue.length - 1) {
        setRatingIndex(snapshotIndex + 1)
      } else {
        closeRatingSheet()
      }
    })
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-8 md:max-w-5xl">
      <MatchHero fixture={fixture} detail={detail} heroScore={heroScore} />

      {detail.penaltyShootout && (
        <PenaltyShootoutSection shootout={detail.penaltyShootout} />
      )}

      <MatchPageTabs
        fixture={fixture}
        detail={detail}
        canRate={canRate}
        ratingsLocked={ratingsLocked}
        isLoggedIn={isLoggedIn}
        commentsPage={commentsPage}
        currentUserId={currentUserId}
        errorMessage={errorMessage}
        topRated={topRated}
        trendingComments={trendingComments}
        onRateAll={handleRateAll}
        onPlayerClick={(player) => openRatingSheet(player)}
      />

      <MatchRatingUI
        open={ratingOpen}
        players={detail.rateableQueue}
        activeIndex={ratingIndex ?? 0}
        matchContext={contextLabel}
        homeTeam={fixture.home_team}
        awayTeam={fixture.away_team}
        onClose={closeRatingSheet}
        onIndexChange={setRatingIndex}
        onSubmit={handleSubmit}
        isSubmitting={isPending}
      />
    </div>
  )
}
