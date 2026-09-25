import { TOP_LEAGUE_CLUBS } from "@/lib/catalog/top-leagues"

/** Confirmed against 2026 squads: API-Football team ids, not display names. */
export const SHUFFLE_BIG_CLUBS: { leagueId: number; teamId: number; name: string }[] = [
  { leagueId: 39, teamId: 50, name: "Manchester City" },
  { leagueId: 39, teamId: 42, name: "Arsenal" },
  { leagueId: 39, teamId: 40, name: "Liverpool" },
  { leagueId: 39, teamId: 33, name: "Manchester United" },
  { leagueId: 39, teamId: 49, name: "Chelsea" },
  { leagueId: 39, teamId: 47, name: "Tottenham" },
  { leagueId: 140, teamId: 541, name: "Real Madrid" },
  { leagueId: 140, teamId: 529, name: "Barcelona" },
  { leagueId: 140, teamId: 530, name: "Atletico Madrid" },
  { leagueId: 135, teamId: 496, name: "Juventus" },
  { leagueId: 135, teamId: 505, name: "Inter" },
  { leagueId: 135, teamId: 489, name: "AC Milan" },
  { leagueId: 78, teamId: 157, name: "Bayern München" },
  { leagueId: 78, teamId: 165, name: "Borussia Dortmund" },
  { leagueId: 61, teamId: 85, name: "Paris Saint Germain" },
]

const SHUFFLE_LEAGUE_IDS = new Set(TOP_LEAGUE_CLUBS.map((league) => league.id))

export function bigClubIdsForLeague(leagueId: number | null): number[] {
  if (leagueId != null && !SHUFFLE_LEAGUE_IDS.has(leagueId)) return []
  return SHUFFLE_BIG_CLUBS.filter((club) => leagueId == null || club.leagueId === leagueId)
    .map((club) => club.teamId)
    .sort((a, b) => a - b)
}

export function bigClubName(teamId: number): string | null {
  return SHUFFLE_BIG_CLUBS.find((club) => club.teamId === teamId)?.name ?? null
}
