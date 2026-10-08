import Link from "next/link"

import { PlayerClubCrestBadge } from "@/components/player/player-club-crest-badge"
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
          ? "flex items-center gap-2 rounded-lg border border-border bg-card px-2 py-1 transition-colors hover:bg-muted/30"
          : // Below lg: bare ring + name in a swipe row. lg: boxed card in a 4-up grid.
            "group flex w-[4.75rem] shrink-0 snap-start flex-col items-center gap-2.5 lg:w-auto lg:gap-3.5 lg:rounded-lg lg:border lg:border-border lg:bg-card lg:p-3 lg:transition-colors lg:hover:bg-muted/30"
      }
    >
      <div className="relative shrink-0">
        <CareerRing
          name={player.name}
          photoUrl={player.photoUrl}
          tier={player.tier}
          displayScore={player.displayScore}
          size={sidebar ? "quarter" : "compact"}
          compact={!sidebar}
          // Phones and tablets: three quarters of the desktop ring.
          ringClassName={sidebar ? undefined : "size-[3.375rem] lg:size-[4.5rem]"}
        />
        {player.clubTeam ? (
          <PlayerClubCrestBadge team={player.clubTeam} size={sidebar ? "xs" : "sm"} />
        ) : null}
      </div>
      <p
        className={
          sidebar
            ? "line-clamp-2 min-w-0 flex-1 text-xs font-semibold leading-tight"
            : "line-clamp-2 w-full text-center text-[11px] font-semibold leading-tight group-hover:underline lg:text-xs lg:group-hover:no-underline"
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
    <section
      className={
        sidebar
          ? undefined
          : // Below lg the whole strip is one card; on desktop each player is.
            "overflow-hidden rounded-lg border border-border bg-card pt-3.5 pb-3 lg:overflow-visible lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0"
      }
    >
      {!sidebar ? (
        <div className="mb-3 flex items-baseline justify-between gap-3 px-4 lg:px-0">
          <h2 className="font-display text-sm font-semibold lg:text-lg lg:tracking-tight">
            Trending players
          </h2>
          <Link href="/players" className="text-xs font-medium text-primary hover:underline">
            See all
          </Link>
        </div>
      ) : (
        <h2 className="mb-3 text-sm font-semibold">Trending players</h2>
      )}

      {players.length === 0 ? (
        <div
          className={
            sidebar
              ? "rounded-lg border border-border bg-card p-4 text-center"
              : "px-4 pb-1 text-center lg:rounded-lg lg:border lg:border-border lg:bg-card lg:p-4"
          }
        >
          <p className="text-sm font-medium">No trending players yet</p>
          <p className="body-sm mt-1 text-muted-foreground">
            Featured players will show here once an admin pins them.
          </p>
        </div>
      ) : sidebar ? (
        <div className="space-y-1.5">
          {players.slice(0, 6).map((player) => (
            <TrendingPlayerCardItem key={player.id} player={player} sidebar />
          ))}
        </div>
      ) : (
        <div className="flex snap-x scroll-px-4 gap-1.5 overflow-x-auto px-4 pt-0.5 pb-2 [scrollbar-width:none] lg:grid lg:grid-cols-4 lg:gap-3 lg:overflow-visible lg:p-0 [&::-webkit-scrollbar]:hidden">
          {players.map((player) => (
            <TrendingPlayerCardItem key={player.id} player={player} />
          ))}
        </div>
      )}
    </section>
  )
}
