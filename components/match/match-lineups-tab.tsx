"use client"

import { LineupMobileSection } from "@/components/match/lineup-mobile-section"
import { LineupPitch } from "@/components/match/lineup-pitch"
import { MatchLineupFormationHeader } from "@/components/match/match-lineup-formation-header"
import {
  MatchSubstitutesSection,
  MatchUnusedBenchSection,
} from "@/components/match/match-bench-sections"
import type { FixtureWithTeams } from "@/lib/catalog/types"
import { teamCommunityAvg } from "@/lib/match/team-match-rating"
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
  const sideAvg = (side: "home" | "away") =>
    teamCommunityAvg(
      [...detail.starters, ...detail.substitutesOn].filter((p) => p.side === side),
    )

  return (
    <div>
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

      {/* Desktop: pitch column held to 85% width, Sofascore-style. */}
      <div className="mx-auto hidden w-[85%] md:block">
        {!detail.hasLineups ? (
          <p className="body-sm text-muted-foreground">
            Lineups are not available yet. Check back closer to kickoff.
          </p>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <MatchLineupFormationHeader
              home={{
                team: fixture.home_team,
                formation: detail.homeFormation,
                teamAvg: sideAvg("home"),
              }}
              away={{
                team: fixture.away_team,
                formation: detail.awayFormation,
                teamAvg: sideAvg("away"),
              }}
            />
            <LineupPitch
              starters={detail.starters}
              ratingsLocked={ratingsLocked}
              onPlayerClick={onPlayerClick}
            />
          </div>
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
