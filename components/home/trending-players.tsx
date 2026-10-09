import Link from "next/link"

import { PlayerClubCrestBadge } from "@/components/player/player-club-crest-badge"
import { CareerRing } from "@/components/player/career-ring"
import { CareerRatingChip } from "@/components/rating/career-rating-chip"
import { TeamFlag } from "@/components/team-flag"
import type { TrendingPlayerCard } from "@/lib/home/types"

type TrendingPlayersProps = {
  players: TrendingPlayerCard[]
  /** default: phone/tablet card. strip: desktop row beside Competitions. sidebar: players directory. */
  variant?: "default" | "sidebar" | "strip"
}

/** Players-directory sidebar: face, club crest + name, score at the right edge. */
function SidebarPlayerRow({ player }: { player: TrendingPlayerCard }) {
  return (
    <Link href={`/player/${player.id}`} className="group flex items-center gap-2.5 py-2">
      <CareerRing
        name={player.name}
        photoUrl={player.photoUrl}
        tier={player.tier}
        displayScore={player.displayScore}
        compact
        ringClassName="size-7"
        hideScore
        className="shrink-0"
      />
      {player.clubTeam ? (
        <TeamFlag team={player.clubTeam} size="sm" variant="crest" className="size-4 shrink-0" />
      ) : null}
      <p className="min-w-0 flex-1 truncate text-sm font-semibold group-hover:underline">
        {player.name}
      </p>
      <CareerRatingChip
        score={player.displayScore}
        tier={player.tier}
        size="sm"
        className="shrink-0 shadow-none"
      />
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

/** Desktop strip beside Competitions: ring, score and club crest — the name is the tooltip. */
function StripPlayer({ player, rank }: { player: TrendingPlayerCard; rank: number }) {
  const label = [`${rank}. ${player.name}`, player.clubTeam?.name].filter(Boolean).join(" · ")

  return (
    <Link
      href={`/player/${player.id}`}
      title={label}
      aria-label={label}
      className="group flex shrink-0 snap-start items-end"
    >
      {/* Big rank numeral in metallic grey that fades out towards its foot. */}
      <span
        aria-hidden
        className="relative z-0 -mr-1 bg-[linear-gradient(180deg,oklch(0.62_0.01_260)_0%,oklch(0.88_0.005_260)_38%,oklch(0.55_0.01_260)_62%,transparent_100%)] bg-clip-text font-display text-[3.25rem] leading-[0.85] font-extrabold tracking-tighter text-transparent tabular-nums select-none"
      >
        {rank}
      </span>
      <span className="relative z-10 transition-transform group-hover:-translate-y-0.5">
        <CareerRing
          name={player.name}
          photoUrl={player.photoUrl}
          tier={player.tier}
          displayScore={player.displayScore}
          compact
          // Same 48px as the competition crests it sits beside.
          ringClassName="size-12"
        />
        {player.clubTeam ? (
          <PlayerClubCrestBadge
            team={player.clubTeam}
            size="xs"
            corner="top"
            // One and a half times the tiny crest: with no name, the club has to read.
            crestClassName="size-[0.9375rem]"
          />
        ) : null}
      </span>
    </Link>
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
        <h2 className="mb-1 text-base font-semibold">Trending players</h2>
        {players.length === 0 ? (
          <EmptyState className="pt-2" />
        ) : (
          <div className="divide-y divide-border">
            {players.map((player) => (
              <SidebarPlayerRow key={player.id} player={player} />
            ))}
          </div>
        )}
      </section>
    )
  }

  if (variant === "strip") {
    if (players.length === 0) return null

    return (
      // w-fit: the header ends where the last ring does, so "See all" sits above it.
      <section aria-label="Trending players" className="w-fit max-w-full min-w-0">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="eyebrow">Trending players</h2>
          <Link href="/players" className="text-xs font-medium text-primary hover:underline">
            See all
          </Link>
        </div>
        {/* pt/pb leave room for the crest above and the score badge below each ring. */}
        <div className="flex snap-x gap-3 overflow-x-auto pt-1 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {players.map((player, index) => (
            <StripPlayer key={player.id} player={player} rank={index + 1} />
          ))}
        </div>
      </section>
    )
  }

  // Phones and tablets: one card with a swipe row of rings.
  return (
    <section className="overflow-hidden rounded-lg border border-border bg-card pt-3.5 pb-3">
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
  )
}
