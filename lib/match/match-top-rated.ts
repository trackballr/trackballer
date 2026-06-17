import type { MatchLineupPlayer } from "@/lib/match/types"

export const MATCH_TOP_RATED_LIMIT = 3
export const MATCH_TOP_RATED_MIN_VOTES_PER_TEAM = 3

export type MatchTopRatedPlayer = {
  playerId: number
  name: string
  photoUrl: string | null
  communityAvg: number
  ratingCount: number
}

export type MatchTopRatedPayload = {
  home: MatchTopRatedPlayer[]
  away: MatchTopRatedPlayer[]
}

function lineupPool(starters: MatchLineupPlayer[], substitutesOn: MatchLineupPlayer[]) {
  return [...starters, ...substitutesOn]
}

function countVotedPlayers(players: MatchLineupPlayer[], teamId: number): number {
  return players.filter((p) => p.teamId === teamId && p.ratingCount >= 1).length
}

function topRatedForTeam(
  players: MatchLineupPlayer[],
  teamId: number,
  limit: number,
): MatchTopRatedPlayer[] {
  return players
    .filter(
      (p) =>
        p.teamId === teamId &&
        p.ratingCount >= 1 &&
        p.communityAvg != null &&
        Number.isFinite(p.communityAvg),
    )
    .sort((a, b) => (b.communityAvg ?? 0) - (a.communityAvg ?? 0))
    .slice(0, limit)
    .map((p) => ({
      playerId: p.playerId,
      name: p.name,
      photoUrl: p.photoUrl,
      communityAvg: p.communityAvg as number,
      ratingCount: p.ratingCount,
    }))
}

/** Top 3 per side when each team has at least 3 rated players. */
export function buildMatchTopRatedPayload(
  starters: MatchLineupPlayer[],
  substitutesOn: MatchLineupPlayer[],
  homeTeamId: number,
  awayTeamId: number,
): MatchTopRatedPayload | null {
  const pool = lineupPool(starters, substitutesOn)

  if (
    countVotedPlayers(pool, homeTeamId) < MATCH_TOP_RATED_MIN_VOTES_PER_TEAM ||
    countVotedPlayers(pool, awayTeamId) < MATCH_TOP_RATED_MIN_VOTES_PER_TEAM
  ) {
    return null
  }

  const home = topRatedForTeam(pool, homeTeamId, MATCH_TOP_RATED_LIMIT)
  const away = topRatedForTeam(pool, awayTeamId, MATCH_TOP_RATED_LIMIT)

  if (home.length === 0 || away.length === 0) return null

  return { home, away }
}
