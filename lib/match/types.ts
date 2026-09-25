import type { FixtureWithTeams } from "@/lib/catalog/types"
import type { PitchSide } from "@/lib/match/lineup-position"

export type MatchLineupPlayer = {
  playerId: number
  name: string
  photoUrl: string | null
  shirtNumber: number | null
  side: PitchSide
  teamId: number
  isStarter: boolean
  isRateable: boolean
  /** Normalized GK/DEF/MID/FWD when known. */
  position: string | null
  minutesPlayed: number
  /** Set when a sub entered from the bench; null for starters and unused bench. */
  subOnMinute: number | null
  /** Starter subbed off when this player came on; null if unknown. */
  subReplacedPlayerName: string | null
  /** Minute this player was substituted off; null if they finished the match. */
  subOffMinute: number | null
  /** Formation line: 1 = goalkeeper, increasing toward attack. */
  gridRow: number
  /** Position within the line, left to right. */
  gridCol: number
  communityAvg: number | null
  ratingCount: number
  userRating: number | null
  /** Scored goals in this match (from fixture_events). */
  goalCount: number
  /** Assists in this match (from fixture_events). */
  assistCount: number
  /** Yellow cards in this match (from fixture_events). */
  yellowCardCount: number
  /** Red cards in this match, including second yellow (from fixture_events). */
  redCardCount: number
}

export type MatchCoach = {
  side: PitchSide
  teamId: number
  name: string
  photoUrl: string | null
}

export type MatchGoalEntry = {
  playerId: number
  displayName: string
  minute: number
  extraMinute: number | null
  isPenalty: boolean
  isOwnGoal: boolean
}

export type MatchGroupedScorer = {
  playerId: number
  displayName: string
  goals: MatchGoalEntry[]
}

export type MatchGoalScorers = {
  home: MatchGoalEntry[]
  away: MatchGoalEntry[]
}

export type MatchRedCardEntry = {
  playerId: number
  displayName: string
  minute: number
  extraMinute: number | null
}

export type MatchRedCards = {
  home: MatchRedCardEntry[]
  away: MatchRedCardEntry[]
}

export type PenaltyKick = {
  side: PitchSide
  playerId: number
  playerName: string
  /** This team's nth penalty (1–5). */
  kickNumber: number
  /** Overall shootout order from API extra_minute. */
  sequenceOrder: number
  scored: boolean
  homeScoreAfter: number
  awayScoreAfter: number
}

export type PenaltyShootout = {
  homePenScore: number
  awayPenScore: number
  /** true = scored, false = missed, null = not taken (up to 5 slots). */
  homeKicks: (boolean | null)[]
  awayKicks: (boolean | null)[]
  sequence: PenaltyKick[]
}

export type MatchDetail = {
  fixture: FixtureWithTeams
  competitionLabel: string | null
  goalScorers: MatchGoalScorers
  redCards: MatchRedCards
  penaltyShootout: PenaltyShootout | null
  ratingsUnlocked: boolean
  hasLineups: boolean
  starters: MatchLineupPlayer[]
  /** Bench players who came on (minutes > 0). */
  substitutesOn: MatchLineupPlayer[]
  /** Named subs who did not play. */
  benchUnused: MatchLineupPlayer[]
  coaches: MatchCoach[]
  /** Rateable players in guided-flow order (starters then subs). */
  rateableQueue: MatchLineupPlayer[]
  /** e.g. "4-2-3-1" derived from the starting grid; null when unknown. */
  homeFormation: string | null
  awayFormation: string | null
}
