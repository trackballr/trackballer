export type SubstitutionEventRow = {
  player_id: number | null
  assist_player_id: number | null
  minute: number
  extra_minute: number | null
  type: string
}

export type SubOnInfo = {
  minute: number
  /** Starter who left when this sub entered (API-Football: `player` on subst events). */
  replacedPlayerId: number | null
}

/**
 * API-Football subst events: `player` leaves, `assist` enters (same shape as goal assists).
 * We store them as player_id / assist_player_id in fixture_events.
 */
export function buildSubOnInfoMap(
  events: SubstitutionEventRow[],
): Map<number, SubOnInfo> {
  const map = new Map<number, SubOnInfo>()
  for (const event of events) {
    if (event.type.toLowerCase() !== "subst") continue
    const enteringId = event.assist_player_id
    if (enteringId == null) continue
    const total = event.minute + (event.extra_minute ?? 0)
    if (!map.has(enteringId)) {
      map.set(enteringId, {
        minute: total,
        replacedPlayerId: event.player_id,
      })
    }
  }
  return map
}

/** Minute each player left the pitch (API-Football subst `player`). First event wins. */
export function buildSubOffMinuteMap(
  events: SubstitutionEventRow[],
): Map<number, number> {
  const map = new Map<number, number>()
  for (const event of events) {
    if (event.type.toLowerCase() !== "subst") continue
    const leavingId = event.player_id
    if (leavingId == null || map.has(leavingId)) continue
    map.set(leavingId, event.minute + (event.extra_minute ?? 0))
  }
  return map
}
