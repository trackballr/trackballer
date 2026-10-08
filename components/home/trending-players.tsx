import Link from "next/link"

import { PlayerClubCrestBadge } from "@/components/player/player-club-crest-badge"
import { CareerRing } from "@/components/player/career-ring"
import { CareerRatingChip } from "@/components/rating/career-rating-chip"
import { Panel, PanelFooterLink, PanelHeader } from "@/components/ui/panel"
import type { TrendingPlayerCard } from "@/lib/home/types"
import { careerRingTier, careerTierLabel } from "@/lib/rating/career-tier"
import { cn } from "@/lib/utils"

type TrendingPlayersProps = {
  players: TrendingPlayerCard[]
  variant?: "default" | "sidebar"
}

/** Slim row for the players-directory sidebar. */
function SidebarPlayerRow({ player }: { player: TrendingPlayerCard }) {
  return (
    <Link
      href={`/player/${player.id}`}
      className="flex items-center gap-2 rounded-lg border border-border bg-card px-2 py-1 transition-colors hover:bg-muted/30"
    >
      <div className="relative shrink-0">
        <CareerRing
          name={player.name}
          photoUrl={player.photoUrl}
          tier={player.tier}
          displayScore={player.displayScore}
          size="quarter"
        />
        {player.clubTeam ? <PlayerClubCrestBadge team={player.clubTeam} size="xs" /> : null}
      </div>
      <p className="line-clamp-2 min-w-0 flex-1 text-xs font-semibold leading-tight">
        {player.name}
      </p>
    </Link>
  )
}

/** Phones and tablets: bare ring + name in a swipe row. */
function SwipePlayer({ player }: { player: TrendingPlayerCard }) {
  return (
    <Link
      href={`/player/${player.id}`}
      className="group flex w-[4.75rem] shrink-0 snap-start flex-col items-center gap-2.5"
    >
      <div className="relative shrink-0">
        <CareerRing
          name={player.name}
          photoUrl={player.photoUrl}
          tier={player.tier}
          displayScore={player.displayScore}
          compact
          // Three quarters of the full compact ring.
          ringClassName="size-[3.375rem]"
        />
        {player.clubTeam ? (
          <PlayerClubCrestBadge team={player.clubTeam} size="xs" corner="top" />
        ) : null}
      </div>
      <p className="line-clamp-2 w-full text-center text-[11px] font-semibold leading-tight group-hover:underline">
        {player.name}
      </p>
    </Link>
  )
}

/** Desktop: one ranked row — position, ring, name + club and tier, score. */
function RankedPlayerRow({
  player,
  rank,
  className,
}: {
  player: TrendingPlayerCard
  rank: number
  className?: string
}) {
  const tierLabel = careerTierLabel(careerRingTier(player.tier, player.displayScore))
  const meta = [player.clubTeam?.name, tierLabel].filter(Boolean).join(" · ")

  return (
    <Link
      href={`/player/${player.id}`}
      className={cn("group flex items-center gap-3 py-2.5", className)}
    >
      <span className="w-5 shrink-0 text-center text-sm font-semibold tabular-nums text-muted-foreground">
        {rank}
      </span>
      <div className="relative shrink-0">
        <CareerRing
          name={player.name}
          photoUrl={player.photoUrl}
          tier={player.tier}
          displayScore={player.displayScore}
          compact
          ringClassName="size-11"
          hideScore
        />
        {player.clubTeam ? <PlayerClubCrestBadge team={player.clubTeam} size="xs" /> : null}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold leading-tight group-hover:underline">
          {player.name}
        </p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">{meta}</p>
      </div>
      <CareerRatingChip
        score={player.displayScore}
        tier={player.tier}
        size="md"
        className="shrink-0 shadow-none"
      />
    </Link>
  )
}

/** Two columns read top to bottom (1–4, then 5–8); short lists stay in one. */
function RankedPlayerList({ players }: { players: TrendingPlayerCard[] }) {
  const twoColumns = players.length >= 5
  const rowsPerColumn = twoColumns ? Math.ceil(players.length / 2) : players.length

  return (
    <div
      className={cn(
        "relative mx-5 grid grid-flow-col gap-x-10",
        // Hairline between the two columns.
        twoColumns &&
          "before:absolute before:inset-y-2 before:left-1/2 before:w-px before:bg-border",
      )}
      style={{
        gridTemplateRows: `repeat(${rowsPerColumn}, auto)`,
        gridTemplateColumns: twoColumns ? "repeat(2, minmax(0, 1fr))" : "minmax(0, 1fr)",
      }}
    >
      {players.map((player, index) => (
        <RankedPlayerRow
          key={player.id}
          player={player}
          rank={index + 1}
          // Divider above every row except the first in each column.
          className={index % rowsPerColumn === 0 ? undefined : "border-t border-border"}
        />
      ))}
    </div>
  )
}

function EmptyState({ className }: { className?: string }) {
  return (
    <div className={className}>
      <p className="text-sm font-medium">No trending players yet</p>
      <p className="body-sm mt-1 text-muted-foreground">
        Featured players will show here once an admin pins them.
      </p>
    </div>
  )
}

export function TrendingPlayers({ players, variant = "default" }: TrendingPlayersProps) {
  if (variant === "sidebar") {
    return (
      <section>
        <h2 className="mb-3 text-sm font-semibold">Trending players</h2>
        {players.length === 0 ? (
          <EmptyState className="rounded-lg border border-border bg-card p-4 text-center" />
        ) : (
          <div className="space-y-1.5">
            {players.slice(0, 6).map((player) => (
              <SidebarPlayerRow key={player.id} player={player} />
            ))}
          </div>
        )}
      </section>
    )
  }

  return (
    <>
      {/* Phones and tablets: one card with a swipe row of rings. */}
      <section className="overflow-hidden rounded-lg border border-border bg-card pt-3.5 pb-3 lg:hidden">
        <div className="mb-3 flex items-baseline justify-between gap-3 px-4">
          <h2 className="font-display text-sm font-semibold">Trending players</h2>
          <Link href="/players" className="text-xs font-medium text-primary hover:underline">
            See all
          </Link>
        </div>
        {players.length === 0 ? (
          <EmptyState className="px-4 pb-1 text-center" />
        ) : (
          <div className="flex snap-x scroll-px-4 gap-1.5 overflow-x-auto px-4 pt-0.5 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {players.map((player) => (
              <SwipePlayer key={player.id} player={player} />
            ))}
          </div>
        )}
      </section>

      {/* Desktop: ranked list in one card. */}
      <Panel className="hidden lg:block">
        <PanelHeader title="Trending players" />
        {players.length === 0 ? (
          <EmptyState className="px-5 pt-1 pb-5" />
        ) : (
          <>
            <RankedPlayerList players={players} />
            <PanelFooterLink href="/players" className="mt-2">
              All players
            </PanelFooterLink>
          </>
        )}
      </Panel>
    </>
  )
}
