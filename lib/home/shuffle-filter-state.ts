import { TOP_LEAGUE_CLUBS } from "@/lib/catalog/top-leagues"

import { bigClubIdsForLeague, bigClubName } from "@/lib/home/shuffle-big-clubs"

export type ShuffleClubOption = {
  id: number
  name: string
  logoUrl: string | null
  leagueId: number
}

export type ShuffleFilterState = {
  leagueId: number | null
  teamIds: number[]
}

export const EMPTY_SHUFFLE_FILTER: ShuffleFilterState = {
  leagueId: null,
  teamIds: [],
}

export const SHUFFLE_FILTERS_STORAGE_KEY = "shuffleFilters"
export const SHUFFLE_TEAM_ID_CAP = 40

const SHUFFLE_LEAGUE_IDS = new Set(TOP_LEAGUE_CLUBS.map((league) => league.id))

export function isShuffleLeagueId(leagueId: number): boolean {
  return SHUFFLE_LEAGUE_IDS.has(leagueId)
}

export function sanitizeShuffleFilter(input: {
  leagueId: number | null
  teamIds: number[]
}): { ok: true; filter: ShuffleFilterState } | { ok: false } {
  if (input.leagueId != null && !SHUFFLE_LEAGUE_IDS.has(input.leagueId)) {
    return { ok: false }
  }

  const teamIds = [...new Set(input.teamIds.filter((id) => Number.isInteger(id) && id > 0))].slice(
    0,
    SHUFFLE_TEAM_ID_CAP,
  )

  return {
    ok: true,
    filter: { leagueId: input.leagueId, teamIds },
  }
}

export function parseShuffleFilters(raw: string | null): ShuffleFilterState {
  if (!raw) return EMPTY_SHUFFLE_FILTER

  try {
    const data = JSON.parse(raw) as { leagueId?: unknown; teamIds?: unknown }
    if (typeof data.leagueId === "number" && !SHUFFLE_LEAGUE_IDS.has(data.leagueId)) {
      return EMPTY_SHUFFLE_FILTER
    }

    const leagueId = typeof data.leagueId === "number" ? data.leagueId : null
    const teamIds = Array.isArray(data.teamIds)
      ? data.teamIds.filter((id): id is number => typeof id === "number")
      : []
    const sanitized = sanitizeShuffleFilter({ leagueId, teamIds })
    return sanitized.ok ? sanitized.filter : EMPTY_SHUFFLE_FILTER
  } catch {
    return EMPTY_SHUFFLE_FILTER
  }
}

export function readShuffleFilters(storage: Pick<Storage, "getItem"> | null): ShuffleFilterState {
  if (!storage) return EMPTY_SHUFFLE_FILTER
  return parseShuffleFilters(storage.getItem(SHUFFLE_FILTERS_STORAGE_KEY))
}

export function writeShuffleFilters(
  storage: Pick<Storage, "setItem">,
  state: ShuffleFilterState,
): void {
  storage.setItem(SHUFFLE_FILTERS_STORAGE_KEY, JSON.stringify(state))
}

export function sameShuffleFilter(a: ShuffleFilterState, b: ShuffleFilterState): boolean {
  if (a.leagueId !== b.leagueId || a.teamIds.length !== b.teamIds.length) return false
  const left = [...a.teamIds].sort((x, y) => x - y)
  const right = [...b.teamIds].sort((x, y) => x - y)
  return left.every((id, index) => id === right[index])
}

export function selectShuffleLeague(
  state: ShuffleFilterState,
  leagueId: number | null,
): ShuffleFilterState {
  if (leagueId != null && !SHUFFLE_LEAGUE_IDS.has(leagueId)) return state
  if (state.leagueId === leagueId) return state
  return { leagueId, teamIds: [] }
}

export function isBigClubSelection(state: ShuffleFilterState): boolean {
  return sameIdSet(state.teamIds, bigClubIdsForLeague(state.leagueId))
}

export function toggleShuffleBigClubs(state: ShuffleFilterState): ShuffleFilterState {
  if (isBigClubSelection(state)) {
    return { ...state, teamIds: [] }
  }
  return { ...state, teamIds: bigClubIdsForLeague(state.leagueId) }
}

export function withShuffleClubTicks(
  state: ShuffleFilterState,
  teamIds: number[],
): ShuffleFilterState {
  const sanitized = sanitizeShuffleFilter({ leagueId: state.leagueId, teamIds })
  return sanitized.ok ? sanitized.filter : state
}

export function formatShuffleClubSummary(
  teamIds: number[],
  clubs: ShuffleClubOption[],
): string | null {
  if (teamIds.length === 0) return null

  const names = teamIds
    .map((id) => clubs.find((club) => club.id === id)?.name ?? bigClubName(id))
    .filter((name): name is string => Boolean(name))
    .sort((a, b) => a.localeCompare(b))

  if (names.length === 0) return null
  if (names.length <= 2) return names.join(", ")
  return `${names[0]}, ${names[1]} +${names.length - 2}`
}

function sameIdSet(leftIds: number[], rightIds: number[]): boolean {
  if (leftIds.length === 0 || leftIds.length !== rightIds.length) return false
  const left = [...leftIds].sort((a, b) => a - b)
  const right = [...rightIds].sort((a, b) => a - b)
  return left.every((id, index) => id === right[index])
}
