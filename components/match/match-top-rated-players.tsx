import Link from "next/link"

import { PlayerAvatar } from "@/components/player-avatar"
import { RatingChip } from "@/components/rating/rating-chip"
import { Button } from "@/components/ui/button"
import type { MatchTopRatedPayload } from "@/lib/match/match-top-rated"
import { cn } from "@/lib/utils"

type MatchTopRatedPlayersProps = {
  payload: MatchTopRatedPayload
  canRate: boolean
  onRateAll: () => void
  className?: string
}

function TopRatedSide({
  player,
  align,
}: {
  player: MatchTopRatedPayload["home"][number] | undefined
  align: "left" | "right"
}) {
  if (!player) {
    return <div className="min-w-0 flex-1" aria-hidden />
  }

  const isLeft = align === "left"

  return (
    <Link
      href={`/player/${player.playerId}`}
      className={cn(
        "flex min-w-0 flex-1 items-center gap-2 transition-opacity hover:opacity-80",
        isLeft ? "justify-start" : "justify-end",
      )}
    >
      {isLeft ? (
        <>
          <RatingChip value={player.communityAvg} size="sm" className="shrink-0" />
          <PlayerAvatar
            name={player.name}
            photoUrl={player.photoUrl}
            size="sm"
            className="shrink-0 rounded-full"
          />
          <span className="min-w-0 truncate text-sm font-semibold leading-tight">
            {player.name}
          </span>
        </>
      ) : (
        <>
          <span className="min-w-0 truncate text-right text-sm font-semibold leading-tight">
            {player.name}
          </span>
          <PlayerAvatar
            name={player.name}
            photoUrl={player.photoUrl}
            size="sm"
            className="shrink-0 rounded-full"
          />
          <RatingChip value={player.communityAvg} size="sm" className="shrink-0" />
        </>
      )}
    </Link>
  )
}

export function MatchTopRatedPlayers({
  payload,
  canRate,
  onRateAll,
  className,
}: MatchTopRatedPlayersProps) {
  const rowCount = Math.max(payload.home.length, payload.away.length)

  return (
    <section
      className={cn(
        "flex h-auto flex-col self-start overflow-hidden rounded-xl border border-border bg-card shadow-sm",
        className,
      )}
    >
      <h3 className="shrink-0 border-b border-border px-4 py-3 text-center text-sm font-semibold">
        Highest-rated players
      </h3>

      <div className="space-y-3 px-3 py-4 sm:px-4">
        {Array.from({ length: rowCount }).map((_, index) => (
          <div
            key={index}
            className="grid grid-cols-1 items-center gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] sm:gap-4"
          >
            <TopRatedSide player={payload.home[index]} align="left" />
            <TopRatedSide player={payload.away[index]} align="right" />
          </div>
        ))}
      </div>

      {canRate ? (
        <div className="shrink-0 border-t border-border px-4 py-3">
          <Button type="button" className="w-full" onClick={onRateAll}>
            Rate all players
          </Button>
        </div>
      ) : null}
    </section>
  )
}
