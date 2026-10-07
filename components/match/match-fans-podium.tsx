import Link from "next/link"

import { PlayerAvatar } from "@/components/player-avatar"
import { RatingChip } from "@/components/rating/rating-chip"
import { TeamFlag } from "@/components/team-flag"
import { Panel, PanelHeader } from "@/components/ui/panel"
import type { FixtureWithTeams } from "@/lib/catalog/types"
import type { MatchTopRatedPayload, MatchTopRatedPlayer } from "@/lib/match/match-top-rated"
import { cn } from "@/lib/utils"

type PodiumPlayer = MatchTopRatedPlayer & { team: FixtureWithTeams["home_team"] }

function podiumPlayers(
  payload: MatchTopRatedPayload,
  fixture: FixtureWithTeams,
): PodiumPlayer[] {
  return [
    ...payload.home.map((p) => ({ ...p, team: fixture.home_team })),
    ...payload.away.map((p) => ({ ...p, team: fixture.away_team })),
  ]
    .sort((a, b) => b.communityAvg - a.communityAvg || b.ratingCount - a.ratingCount)
    .slice(0, 3)
}

const PLACE_STYLES = {
  1: { avatar: "size-16", block: "h-16", label: "1st" },
  2: { avatar: "size-12", block: "h-11", label: "2nd" },
  3: { avatar: "size-12", block: "h-8", label: "3rd" },
} as const

function PodiumSpot({ player, place }: { player: PodiumPlayer; place: 1 | 2 | 3 }) {
  const style = PLACE_STYLES[place]
  return (
    <Link
      href={`/player/${player.playerId}`}
      className="group flex min-w-0 flex-1 flex-col items-center text-center"
    >
      <span className="relative">
        <PlayerAvatar
          name={player.name}
          photoUrl={player.photoUrl}
          size="lg"
          className={cn(
            "rounded-full border-2 border-card shadow-sm",
            style.avatar,
            place === 1 && "ring-2 ring-amber-400",
          )}
        />
        <span className="absolute -right-1 -bottom-1 rounded-full bg-card p-0.5">
          <TeamFlag team={player.team} size="sm" />
        </span>
      </span>
      <span className="mt-2 w-full truncate text-xs font-semibold group-hover:underline">
        {player.name}
      </span>
      <RatingChip value={player.communityAvg} size="sm" className="mt-1" />
      <span
        className={cn(
          "mt-2 flex w-full items-start justify-center rounded-t-md pt-1 text-[11px] font-bold text-muted-foreground",
          place === 1 ? "bg-amber-400/20 text-amber-700 dark:text-amber-300" : "bg-muted",
          style.block,
        )}
      >
        {style.label}
      </span>
    </Link>
  )
}

type MatchFansPodiumProps = {
  payload: MatchTopRatedPayload | null
  fixture: FixtureWithTeams
}

/** Fans' top three across both sides, laid out 2-1-3. */
export function MatchFansPodium({ payload, fixture }: MatchFansPodiumProps) {
  const players = payload ? podiumPlayers(payload, fixture) : []
  const [first, second, third] = players

  return (
    <Panel>
      <PanelHeader
        title="Fans' top rated"
        description={first ? `${first.name} is the fans' Man of the Match` : undefined}
      />
      {first && second && third ? (
        <div className="flex items-end gap-2 px-5 pt-3">
          <PodiumSpot player={second} place={2} />
          <PodiumSpot player={first} place={1} />
          <PodiumSpot player={third} place={3} />
        </div>
      ) : (
        <p className="px-5 pt-1 pb-5 text-sm text-muted-foreground">
          The podium appears once fans have rated a few players from each side.
        </p>
      )}
    </Panel>
  )
}
