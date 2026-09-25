import { describe, expect, it } from "vitest"

import { bigClubIdsForLeague } from "@/lib/home/shuffle-big-clubs"
import {
  formatShuffleClubSummary,
  isBigClubSelection,
  parseShuffleFilters,
  readShuffleFilters,
  sanitizeShuffleFilter,
  selectShuffleLeague,
  SHUFFLE_FILTERS_STORAGE_KEY,
  SHUFFLE_TEAM_ID_CAP,
  toggleShuffleBigClubs,
  withShuffleClubTicks,
  writeShuffleFilters,
} from "@/lib/home/shuffle-filter-state"

describe("shuffle filters", () => {
  it("lists Premier League giants and every giant when no league is set", () => {
    expect(bigClubIdsForLeague(39)).toEqual([33, 40, 42, 47, 49, 50])
    expect(bigClubIdsForLeague(null)).toHaveLength(15)
    expect(bigClubIdsForLeague(999)).toEqual([])
  })

  it("toggles big clubs on and off without changing the league", () => {
    const premier = selectShuffleLeague({ leagueId: null, teamIds: [541] }, 39)
    expect(premier).toEqual({ leagueId: 39, teamIds: [] })

    const on = toggleShuffleBigClubs(premier)
    expect(on.teamIds).toEqual(bigClubIdsForLeague(39))
    expect(isBigClubSelection(on)).toBe(true)

    const off = toggleShuffleBigClubs(on)
    expect(off).toEqual({ leagueId: 39, teamIds: [] })
    expect(isBigClubSelection(off)).toBe(false)
  })

  it("rejects a league outside the top five and caps club ids", () => {
    expect(sanitizeShuffleFilter({ leagueId: 1, teamIds: [] })).toEqual({ ok: false })

    const ids = Array.from({ length: SHUFFLE_TEAM_ID_CAP + 5 }, (_, index) => index + 1)
    ids.push(1, 0, 1.5)
    const sanitized = sanitizeShuffleFilter({ leagueId: 140, teamIds: ids })
    expect(sanitized.ok).toBe(true)
    if (!sanitized.ok) return
    expect(sanitized.filter.teamIds).toHaveLength(SHUFFLE_TEAM_ID_CAP)
    expect(sanitized.filter.teamIds[0]).toBe(1)
  })

  it("drops a stored filter when the league id is not a top league", () => {
    expect(parseShuffleFilters('{"leagueId":2,"teamIds":[85]}')).toEqual({
      leagueId: null,
      teamIds: [],
    })
    expect(parseShuffleFilters("not-json")).toEqual({ leagueId: null, teamIds: [] })
    expect(parseShuffleFilters('{"leagueId":61,"teamIds":[85,85,"psg"]}')).toEqual({
      leagueId: 61,
      teamIds: [85],
    })
  })

  it("reads and writes the browser filter", () => {
    const saved = new Map<string, string>()
    const storage = {
      getItem: (key: string) => saved.get(key) ?? null,
      setItem: (key: string, value: string) => {
        saved.set(key, value)
      },
    }

    writeShuffleFilters(storage, { leagueId: 78, teamIds: [157] })
    expect(saved.get(SHUFFLE_FILTERS_STORAGE_KEY)).toContain("157")
    expect(readShuffleFilters(storage)).toEqual({ leagueId: 78, teamIds: [157] })
  })

  it("formats a short club summary", () => {
    const clubs = [
      { id: 42, name: "Arsenal", logoUrl: null, leagueId: 39 },
      { id: 40, name: "Liverpool", logoUrl: null, leagueId: 39 },
      { id: 50, name: "Manchester City", logoUrl: null, leagueId: 39 },
      { id: 49, name: "Chelsea", logoUrl: null, leagueId: 39 },
    ]
    expect(formatShuffleClubSummary([42, 40, 50, 49], clubs)).toBe("Arsenal, Chelsea +2")
    expect(formatShuffleClubSummary([], clubs)).toBeNull()
  })

  it("applies dialog ticks onto the current league", () => {
    expect(withShuffleClubTicks({ leagueId: 140, teamIds: [] }, [541, 529])).toEqual({
      leagueId: 140,
      teamIds: [541, 529],
    })
  })
})
