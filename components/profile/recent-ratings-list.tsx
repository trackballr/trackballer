import { Share2 } from "lucide-react"
import Link from "next/link"

import { CommentTime } from "@/components/comment/comment-time"
import { PlayerAvatar } from "@/components/player-avatar"
import { CareerRatingChip } from "@/components/rating/career-rating-chip"
import { RatingChip } from "@/components/rating/rating-chip"
import { TeamFlag } from "@/components/team-flag"
import { PanelEmpty, PanelList } from "@/components/ui/panel"
import type { RecentRatingItem } from "@/lib/profile/types"
import { tierForScore } from "@/lib/rating/career-tier"
import { careerSharePath } from "@/lib/share/share-links"

export function ratingKey(rating: RecentRatingItem): string {
  return `${rating.kind}-${rating.id}`
}

/** Match ratings open the match; career ratings open the player. */
function ratingHref(rating: RecentRatingItem): string {
  if (rating.kind === "match" && rating.fixtureId != null) {
    return `/match/${rating.fixtureId}`
  }
  return `/player/${rating.playerId}`
}

type RatingHistoryRowProps = {
  rating: RecentRatingItem
  /** Whose ratings these are — career rows link to that person's share card. */
  username?: string | null
}

export function RatingHistoryRow({ rating, username = null }: RatingHistoryRowProps) {
  const shareHref =
    username && rating.kind === "career" ? careerSharePath(username, rating.playerId) : null

  return (
    <div className="flex items-center gap-1">
      <RatingRowLink rating={rating} />
      {shareHref ? (
        <Link
          href={shareHref}
          aria-label={`Share card for ${rating.playerName}`}
          title="Share card"
          className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Share2 className="size-4" aria-hidden />
        </Link>
      ) : null}
    </div>
  )
}

function RatingRowLink({ rating }: { rating: RecentRatingItem }) {
  return (
    <Link
      href={ratingHref(rating)}
      className="group flex min-w-0 flex-1 items-center gap-3 py-3"
    >
      <PlayerAvatar
        name={rating.playerName}
        photoUrl={rating.photoUrl}
        size="lg"
        className="rounded-full"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold leading-tight group-hover:underline">
          {rating.playerName}
        </p>
        <p className="mt-0.5 flex min-w-0 items-center gap-1 text-xs text-muted-foreground">
          {rating.kind === "match" ? (
            rating.oppositionTeam ? (
              <>
                <span className="shrink-0">vs</span>
                <TeamFlag
                  team={{
                    name: rating.oppositionTeam.name,
                    logo_url: rating.oppositionTeam.logoUrl,
                    code: rating.oppositionTeam.code,
                  }}
                  size="sm"
                />
                <span className="truncate">{rating.oppositionTeam.name}</span>
              </>
            ) : (
              <span className="shrink-0">Match rating</span>
            )
          ) : (
            <span className="shrink-0">Career rating</span>
          )}
          <span className="shrink-0">·</span>
          <span className="shrink-0">
            <CommentTime dateString={rating.ratedAt} />
          </span>
        </p>
      </div>
      {rating.kind === "career" ? (
        <CareerRatingChip
          score={rating.value}
          tier={tierForScore(rating.value)}
          size="sm"
          className="shrink-0"
        />
      ) : (
        <RatingChip value={rating.value} size="sm" className="shrink-0" />
      )}
    </Link>
  )
}

export function RecentRatingsList({
  ratings,
  username = null,
}: {
  ratings: RecentRatingItem[]
  username?: string | null
}) {
  if (ratings.length === 0) {
    return <PanelEmpty>No ratings yet.</PanelEmpty>
  }

  return (
    <PanelList>
      {ratings.map((rating) => (
        <RatingHistoryRow key={ratingKey(rating)} rating={rating} username={username} />
      ))}
    </PanelList>
  )
}
