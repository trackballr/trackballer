import Link from "next/link"

import { CareerRing } from "@/components/player/career-ring"
import type { TrendingPlayerCard } from "@/lib/home/types"

type TrendingPlayersProps = {
  players: TrendingPlayerCard[]
  variant?: "default" | "sidebar"
}

function TrendingPlayerCardItem({
  player,
  sidebar,
}: {
  player: TrendingPlayerCard
  sidebar?: boolean
}) {
  return (
    <Link
      href={`/player/${player.id}`}
      className={
        sidebar
          ? "flex items-center gap-3 rounded-lg border border-border bg-card p-2 transition-colors hover:bg-muted/30"
          : "flex w-[7.5rem] shrink-0 flex-col items-center gap-3.5 rounded-lg border border-border bg-card p-3 transition-colors hover:bg-muted/30 sm:w-auto"
      }
    >
      <CareerRing
        name={player.name}
        photoUrl={player.photoUrl}
        tier={player.tier}
        displayScore={player.displayScore}
        compact
      />
      <p
        className={
          sidebar
            ? "line-clamp-2 min-w-0 flex-1 text-xs font-semibold leading-tight"
            : "line-clamp-2 w-full text-center text-xs font-semibold leading-tight"
        }
      >
        {player.name}
      </p>
    </Link>
  )
}

export function TrendingPlayers({ players, variant = "default" }: TrendingPlayersProps) {
  const sidebar = variant === "sidebar"

  return (
    <section>
      {!sidebar ? (
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h2 className="h3">Trending players</h2>
          <Link href="/players" className="text-xs font-medium text-primary hover:underline">
            See all
          </Link>
        </div>
      ) : (
        <h2 className="mb-3 text-sm font-semibold">Trending players</h2>
      )}

      {players.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-4 text-center">
          <p className="text-sm font-medium">No trending players yet</p>
          <p className="body-sm mt-1 text-muted-foreground">
            Featured players will show here once an admin pins them.
          </p>
        </div>
      ) : sidebar ? (
        <div className="space-y-2">
          {players.slice(0, 6).map((player) => (
            <TrendingPlayerCardItem key={player.id} player={player} sidebar />
          ))}
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-1 lg:grid lg:grid-cols-4 lg:overflow-visible">
          {players.map((player) => (
            <TrendingPlayerCardItem key={player.id} player={player} />
          ))}
        </div>
      )}
    </section>
  )
}
