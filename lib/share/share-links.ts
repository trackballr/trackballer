/** A career rating this far from the public score (1–100 scale) counts as a hot take. */
export const CAREER_HOT_TAKE_GAP = 15

export function isCareerHotTake(rating: number, publicScore: number): boolean {
  return Math.abs(rating - publicScore) >= CAREER_HOT_TAKE_GAP
}

/** Public page for one user's career rating of one player. */
export function careerSharePath(username: string, playerId: number): string {
  return `/u/${encodeURIComponent(username)}/rated/${playerId}`
}

/**
 * The card picture for that rating. `version` changes whenever the rating does,
 * so previews and saved links never show a stale card.
 */
export function careerShareCardPath(
  username: string,
  playerId: number,
  version?: string | number | null,
): string {
  const path = `${careerSharePath(username, playerId)}/card`
  return version != null ? `${path}?v=${encodeURIComponent(String(version))}` : path
}

/** "3 above the fans" / "Same as the fans" — how the rating sits against the public score. */
export function careerGapLabel(rating: number, publicScore: number, isProvisional: boolean): string {
  const against = isProvisional ? "the base rating" : "the fans"
  const gap = Math.round(rating - publicScore)
  if (gap === 0) return `Same as ${against}`
  return `${Math.abs(gap)} ${gap > 0 ? "above" : "below"} ${against}`
}

/**
 * Post text for X and the phone share sheet. `byUsername` is set when someone
 * shares another person's rating; left out, it reads in the first person.
 */
export function careerShareText(input: {
  playerName: string
  rating: number
  publicScore: number
  isProvisional: boolean
  byUsername?: string | null
}): string {
  const { playerName, rating, publicScore, isProvisional, byUsername } = input
  const who = byUsername ? `@${byUsername}` : "I"
  const versus = isProvisional
    ? `Base rating is ${Math.round(publicScore)}.`
    : `Fans say ${Math.round(publicScore)}.`
  return `${who} rated ${playerName} ${Math.round(rating)} on Trackballr. ${versus} What's yours?`
}

export function xShareUrl(text: string, url: string): string {
  const params = new URLSearchParams({ text, url })
  return `https://x.com/intent/post?${params.toString()}`
}
