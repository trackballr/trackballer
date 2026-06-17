import { MatchCoachRow } from "@/components/match/match-coaches"
import { TeamFlag } from "@/components/team-flag"
import type { FixtureWithTeams } from "@/lib/catalog/types"
import type { PitchSide } from "@/lib/match/lineup-position"
import type { MatchCoach, MatchLineupPlayer } from "@/lib/match/types"

import { MatchBenchPlayerRow } from "./match-bench-player-row"

type MatchBenchSectionsProps = {
  fixture: FixtureWithTeams
  substitutesOn: MatchLineupPlayer[]
  benchUnused: MatchLineupPlayer[]
  canRate: boolean
  onPlayerSelect: (player: MatchLineupPlayer) => void
}

function playersForSide(players: MatchLineupPlayer[], side: PitchSide) {
  return players.filter((p) => p.side === side)
}

function TeamBenchColumn({
  team,
  players,
  showSubInfo,
  canRate,
  onPlayerSelect,
}: {
  team: FixtureWithTeams["home_team"]
  players: MatchLineupPlayer[]
  showSubInfo: boolean
  canRate: boolean
  onPlayerSelect: (player: MatchLineupPlayer) => void
}) {
  if (players.length === 0) return null

  return (
    <div className="min-w-0">
      <div className="flex items-center gap-2 border-b border-border px-3 py-2">
        <TeamFlag team={team} size="sm" />
        <span className="truncate text-xs font-semibold">{team.name}</span>
      </div>
      <ul className="divide-y divide-border">
        {players.map((player) => (
          <li key={player.playerId}>
            <MatchBenchPlayerRow
              player={player}
              showSubInfo={showSubInfo}
              disabled={!canRate}
              onSelect={onPlayerSelect}
            />
          </li>
        ))}
      </ul>
    </div>
  )
}

type MatchSubstitutesSectionProps = Pick<
  MatchBenchSectionsProps,
  "fixture" | "substitutesOn" | "canRate" | "onPlayerSelect"
> & {
  coaches: MatchCoach[]
}

export function MatchSubstitutesSection({
  fixture,
  coaches,
  substitutesOn,
  canRate,
  onPlayerSelect,
}: MatchSubstitutesSectionProps) {
  const hasCoaches = coaches.length > 0
  const hasSubs = substitutesOn.length > 0
  if (!hasCoaches && !hasSubs) return null

  const home = playersForSide(substitutesOn, "home")
  const away = playersForSide(substitutesOn, "away")

  return (
    <section className="mt-4 mb-6">
      {hasCoaches && (
        <>
          <h3 className="mb-2 text-center text-sm font-semibold text-foreground">
            Coach
          </h3>
          <div className="mb-4 overflow-hidden rounded-lg border border-border bg-card">
            <MatchCoachRow coaches={coaches} />
          </div>
        </>
      )}
      {hasSubs && (
        <>
          <h3 className="mb-2 text-center text-sm font-semibold text-foreground">
            Substitutes
          </h3>
          <div className="overflow-hidden rounded-lg border border-border bg-card md:grid md:grid-cols-2 md:divide-x md:divide-border">
            <TeamBenchColumn
              team={fixture.home_team}
              players={home}
              showSubInfo
              canRate={canRate}
              onPlayerSelect={onPlayerSelect}
            />
            <TeamBenchColumn
              team={fixture.away_team}
              players={away}
              showSubInfo
              canRate={canRate}
              onPlayerSelect={onPlayerSelect}
            />
          </div>
        </>
      )}
    </section>
  )
}

export function MatchUnusedBenchSection({
  fixture,
  benchUnused,
  onPlayerSelect,
}: Pick<MatchBenchSectionsProps, "fixture" | "benchUnused" | "onPlayerSelect">) {
  if (benchUnused.length === 0) return null

  const home = playersForSide(benchUnused, "home")
  const away = playersForSide(benchUnused, "away")

  return (
    <section className="mb-8">
      <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Bench</h3>
      <p className="mb-2 text-xs text-muted-foreground">
        Did not play - Not rateable.
      </p>
      <div className="overflow-hidden rounded-lg border border-border bg-card md:grid md:grid-cols-2 md:divide-x md:divide-border">
        <TeamBenchColumn
          team={fixture.home_team}
          players={home}
          showSubInfo={false}
          canRate={false}
          onPlayerSelect={onPlayerSelect}
        />
        <TeamBenchColumn
          team={fixture.away_team}
          players={away}
          showSubInfo={false}
          canRate={false}
          onPlayerSelect={onPlayerSelect}
        />
      </div>
    </section>
  )
}
