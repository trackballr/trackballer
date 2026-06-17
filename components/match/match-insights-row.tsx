"use client"

import { MatchTopRatedPlayers } from "@/components/match/match-top-rated-players"
import { MatchTrendingCommentsStrip } from "@/components/match/match-trending-comments-strip"
import { Button } from "@/components/ui/button"
import type { MatchTopRatedPayload } from "@/lib/match/match-top-rated"
import type { MatchTrendingCommentCard } from "@/lib/match/match-trending-comments"
import { cn } from "@/lib/utils"

type MatchInsightsRowProps = {
  topRated: MatchTopRatedPayload | null
  trendingComments: MatchTrendingCommentCard[]
  currentUserId: string | null
  canRate: boolean
  showRateAllFallback: boolean
  onRateAll: () => void
  onSeeAllComments: () => void
}

function RateAllFallbackCard({ onRateAll }: { onRateAll: () => void }) {
  return (
    <section className="flex h-auto flex-col self-start overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <h3 className="border-b border-border px-4 py-3 text-center text-sm font-semibold">
        Player ratings
      </h3>
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 py-6 text-center">
        <p className="text-sm text-muted-foreground">
          Rate everyone who played. Ratings unlock after full time.
        </p>
        <Button type="button" className="w-full max-w-xs" onClick={onRateAll}>
          Rate all players
        </Button>
      </div>
    </section>
  )
}

export function MatchInsightsRow({
  topRated,
  trendingComments,
  currentUserId,
  canRate,
  showRateAllFallback,
  onRateAll,
  onSeeAllComments,
}: MatchInsightsRowProps) {
  const showLeftColumn = topRated != null || showRateAllFallback
  const trendingFullWidth = !showLeftColumn

  return (
    <div
      className={cn(
        "mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 md:items-start",
        trendingFullWidth && "md:grid-cols-1",
      )}
    >
      {topRated ? (
        <MatchTopRatedPlayers
          payload={topRated}
          canRate={canRate}
          onRateAll={onRateAll}
          className="h-auto self-start"
        />
      ) : showRateAllFallback ? (
        <RateAllFallbackCard onRateAll={onRateAll} />
      ) : null}

      <MatchTrendingCommentsStrip
        comments={trendingComments}
        currentUserId={currentUserId}
        onSeeAll={onSeeAllComments}
        className={cn("h-auto self-start", trendingFullWidth && "md:max-w-none")}
      />
    </div>
  )
}
