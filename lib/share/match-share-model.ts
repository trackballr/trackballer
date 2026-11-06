import { parseGridSlot } from "@/lib/match/lineup-position"

/** Ratings on one team before the share card unlocks. */
export const MATCH_SHARE_UNLOCK = 5

export type MatchSharePlayer = {
  id: number
  name: string
  photoUrl: string | null
  position: string | null
  shirtNumber: number | null
  isStarter: boolean
  isRateable: boolean
  gridRow: number
  gridCol: number
  subOnMinute: number | null
  /** The viewer's match score, when they have given one. */
  rating: number | null
}

export type MatchShare = {
  fixtureId: number
  username: string
  displayName: string
  team: { id: number; name: string; logoUrl: string | null }
  opponentName: string
  roundLabel: string | null
  /** Rated players, highest score first. */
  ranked: MatchSharePlayer[]
  /** Every starter, attack line first, so the half-pitch keeps its shape. */
  pitchRows: MatchSharePlayer[][]
  /** Subs who played, in the order they came on. */
  subs: MatchSharePlayer[]
  ratedCount: number
  totalRateable: number
  complete: boolean
  ratedAt: string
}

export type MatchShareInput = {
  fixtureId: number
  username: string
  displayName: string
  team: { id: number; name: string; logoUrl: string | null }
  opponentName: string
  roundLabel: string | null
  players: MatchSharePlayer[]
  /** Latest save among this team's ratings. */
  ratedAt: string | null
}

/** "7.5" or "8". */
export function formatShareMatchScore(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}

/** Apostrophes stay as a real character. Some imported names already contain the HTML entity. */
export function shareCardName(name: string): string {
  return name.replaceAll("&apos;", "\u2019").replaceAll("&#39;", "\u2019").replaceAll("'", "\u2019")
}

/** "B. Fernandes" on the pitch, full name on the ranking rows. */
export function sharePitchName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length <= 1) return shareCardName(name.trim())
  const first = parts[0] ?? ""
  const last = parts[parts.length - 1] ?? name
  return shareCardName(`${first[0]}. ${last}`)
}

function byRatingDesc(a: MatchSharePlayer, b: MatchSharePlayer): number {
  const score = (b.rating ?? 0) - (a.rating ?? 0)
  if (score !== 0) return score
  return a.name.localeCompare(b.name)
}

/** Attack at the top, keeper at the bottom. */
export function matchSharePitchRows(starters: MatchSharePlayer[]): MatchSharePlayer[][] {
  const byRow = new Map<number, MatchSharePlayer[]>()
  for (const player of starters) {
    const line = byRow.get(player.gridRow) ?? []
    line.push(player)
    byRow.set(player.gridRow, line)
  }
  return [...byRow.entries()]
    .sort(([a], [b]) => b - a)
    .map(([, line]) => [...line].sort((a, b) => a.gridCol - b.gridCol))
}

/**
 * Card model for one viewer's ratings of one team.
 * Returns null until they have rated five players who got minutes.
 */
export function buildMatchShare(input: MatchShareInput): MatchShare | null {
  const rateable = input.players.filter((player) => player.isRateable)
  const ranked = rateable.filter((player) => player.rating != null).sort(byRatingDesc)
  if (ranked.length < MATCH_SHARE_UNLOCK || !input.ratedAt) return null

  const starters = input.players.filter((player) => player.isStarter)
  const subs = input.players
    .filter((player) => !player.isStarter && player.isRateable && player.rating != null)
    .sort((a, b) => (a.subOnMinute ?? 999) - (b.subOnMinute ?? 999))

  return {
    fixtureId: input.fixtureId,
    username: input.username,
    displayName: input.displayName,
    team: input.team,
    opponentName: input.opponentName,
    roundLabel: input.roundLabel,
    ranked,
    pitchRows: matchSharePitchRows(starters),
    subs,
    ratedCount: ranked.length,
    totalRateable: rateable.length,
    complete: rateable.length > 0 && ranked.length >= rateable.length,
    ratedAt: input.ratedAt,
  }
}

export function lineupGrid(
  grid: string | null,
  fallbackIndex: number,
): { gridRow: number; gridCol: number } {
  const slot = parseGridSlot(grid, fallbackIndex)
  return { gridRow: slot.row, gridCol: slot.col }
}
