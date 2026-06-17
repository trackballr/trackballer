"use client"

import { LineupMobileSection } from "@/components/match/lineup-mobile-section"
import { LineupPitch } from "@/components/match/lineup-pitch"
import { MatchLineupFormationHeader } from "@/components/match/match-lineup-formation-header"
import {
  MatchSubstitutesSection,
  MatchUnusedBenchSection,
} from "@/components/match/match-bench-sections"
import type { FixtureWithTeams } from "@/lib/catalog/types"
import type { MatchCoach, MatchLineupPlayer } from "@/lib/match/types"

type MatchLineupsTabProps = {
  fixture: FixtureWithTeams
  detail: {
    hasLineups: boolean
    starters: MatchLineupPlayer[]
    substitutesOn: MatchLineupPlayer[]
    benchUnused: MatchLineupPlayer[]
    coaches: MatchCoach[]
    homeFormation: string | null
    awayFormation: string | null
  }
  canRate: boolean
  ratingsLocked: boolean
  onPlayerClick: (player: MatchLineupPlayer) => void
}

export function MatchLineupsTab({
  fixture,
  detail,
  canRate,
  ratingsLocked,
  onPlayerClick,
}: MatchLineupsTabProps) {
  return (
    <div>
      <MatchLineupFormationHeader
        homeFormation={detail.homeFormation}
        awayFormation={detail.awayFormation}
      />

      <div className="md:hidden">
        <LineupMobileSection
          fixture={fixture}
          starters={detail.starters}
          substitutesOn={detail.substitutesOn}
          benchUnused={detail.benchUnused}
          coaches={detail.coaches}
          homeFormation={detail.homeFormation}
          awayFormation={detail.awayFormation}
          hasLineups={detail.hasLineups}
          ratingsLocked={ratingsLocked}
          canRate={canRate}
          onPlayerClick={onPlayerClick}
        />
      </div>

      <div className="hidden md:block">
        {!detail.hasLineups ? (
          <p className="body-sm text-muted-foreground">
            Lineups are not available yet. Check back closer to kickoff.
          </p>
        ) : (
          <LineupPitch
            starters={detail.starters}
            ratingsLocked={ratingsLocked}
            onPlayerClick={onPlayerClick}
          />
        )}
        <MatchSubstitutesSection
          fixture={fixture}
          coaches={detail.coaches}
          substitutesOn={detail.substitutesOn}
          canRate={canRate}
          onPlayerSelect={onPlayerClick}
        />
        <MatchUnusedBenchSection
          fixture={fixture}
          benchUnused={detail.benchUnused}
          onPlayerSelect={onPlayerClick}
        />
      </div>
    </div>
  )
}
