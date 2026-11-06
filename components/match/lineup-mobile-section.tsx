"use client"

import { LineupSingleTeamPitch } from "@/components/match/lineup-single-team-pitch"
import { LineupTeamSummary } from "@/components/match/lineup-team-summary"
import { LineupTeamSwitcher } from "@/components/match/lineup-team-switcher"
import { MatchCoachCard } from "@/components/match/match-coach-card"
import { SubstitutionListRow } from "@/components/match/substitution-list-row"
import { PlayerAvatar } from "@/components/player-avatar"
import type { FixtureWithTeams } from "@/lib/catalog/types"
import type { PitchSide } from "@/lib/match/lineup-position"
import { teamCommunityAvg } from "@/lib/match/team-match-rating"
import type { MatchCoach, MatchLineupPlayer } from "@/lib/match/types"

type LineupMobileSectionProps = {
  fixture: FixtureWithTeams
  starters: MatchLineupPlayer[]
  substitutesOn: MatchLineupPlayer[]
  benchUnused: MatchLineupPlayer[]
  coaches: MatchCoach[]
  homeFormation: string | null
  awayFormation: string | null
  hasLineups: boolean
  ratingsLocked: boolean
  canRate: boolean
  selectedSide: PitchSide
  onSelectSide: (side: PitchSide) => void
  onPlayerClick?: (player: MatchLineupPlayer) => void
}

function playersForSide(players: MatchLineupPlayer[], side: PitchSide) {
  return players.filter((p) => p.side === side)
}

function coachForSide(coaches: MatchCoach[], side: PitchSide) {
  return coaches.find((c) => c.side === side) ?? null
}

function UnusedBenchList({
  players,
}: {
  players: MatchLineupPlayer[]
}) {
  if (players.length === 0) return null

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <p className="border-b border-border px-3 py-2 text-xs font-semibold text-muted-foreground">
        Unused bench
      </p>
      <ul>
        {players.map((player) => (
          <li
            key={player.playerId}
            className="flex items-center gap-3 border-b border-border px-3 py-2.5 last:border-b-0"
          >
            <PlayerAvatar
              name={player.name}
              photoUrl={player.photoUrl}
              shirtNumber={player.shirtNumber}
              size="sm"
            />
            <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
              {player.shirtNumber != null ? `${player.shirtNumber} ` : ""}
              {player.name}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function LineupMobileSection({
  fixture,
  starters,
  substitutesOn,
  benchUnused,
  coaches,
  homeFormation,
  awayFormation,
  hasLineups,
  ratingsLocked,
  canRate,
  selectedSide,
  onSelectSide,
  onPlayerClick,
}: LineupMobileSectionProps) {

  if (!hasLineups) {
    return (
      <p className="body-sm text-muted-foreground">
        Lineups are not available yet. Check back closer to kickoff.
      </p>
    )
  }

  const team = selectedSide === "home" ? fixture.home_team : fixture.away_team
  const formation = selectedSide === "home" ? homeFormation : awayFormation
  const sideStarters = playersForSide(starters, selectedSide)
  const sideSubs = playersForSide(substitutesOn, selectedSide)
  const sideBench = playersForSide(benchUnused, selectedSide)
  const sideCoach = coachForSide(coaches, selectedSide)
  const teamAvg = teamCommunityAvg([...sideStarters, ...sideSubs])

  return (
    <div className="flex flex-col gap-4">
      <LineupTeamSwitcher
        homeTeam={fixture.home_team}
        awayTeam={fixture.away_team}
        selected={selectedSide}
        onSelect={onSelectSide}
      />

      <LineupSingleTeamPitch
        starters={starters}
        side={selectedSide}
        ratingsLocked={ratingsLocked}
        onPlayerClick={onPlayerClick}
      />

      <LineupTeamSummary team={team} formation={formation} teamAvg={teamAvg} />

      <MatchCoachCard coach={sideCoach} />

      {sideSubs.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold">Substitutions</h3>
          <div className="overflow-hidden rounded-lg border border-border bg-card">
            {sideSubs.map((player) => (
              <SubstitutionListRow
                key={player.playerId}
                player={player}
                disabled={!canRate}
                onSelect={(p) => onPlayerClick?.(p)}
              />
            ))}
          </div>
        </div>
      )}

      <UnusedBenchList players={sideBench} />
    </div>
  )
}
