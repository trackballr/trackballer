import { describe, expect, it } from "vitest"

import {
  browseOffset,
  buildIlikePattern,
  buildPlayersBrowseHref,
  escapeIlikePattern,
  nameIlikeOrFilter,
  normalizeSearchQuery,
  parseBrowseFilters,
} from "@/lib/search/query"

describe("search query helpers", () => {
  it("normalizeSearchQuery rejects empty strings", () => {
    expect(normalizeSearchQuery("")).toBeNull()
    expect(normalizeSearchQuery("  ")).toBeNull()
    expect(normalizeSearchQuery("a")).toBe("a")
    expect(normalizeSearchQuery("  ka  ")).toBe("ka")
  })

  it("normalizeSearchQuery truncates overly long input", () => {
    const long = "a".repeat(100)
    expect(normalizeSearchQuery(long)).toHaveLength(64)
  })

  it("escapeIlikePattern escapes wildcards", () => {
    expect(escapeIlikePattern("100%_")).toBe("100\\%\\_")
    expect(buildIlikePattern("100%_")).toBe("%100\\%\\_%")
  })

  it("nameIlikeOrFilter quotes patterns for PostgREST", () => {
    expect(nameIlikeOrFilter("kane")).toContain('name.ilike."%kane%"')
    expect(nameIlikeOrFilter('a"b')).toContain('""')
  })

  it("parseBrowseFilters maps URL params", () => {
    const filters = parseBrowseFilters({
      q: "  mbappé ",
      nationalTeamId: "42",
      position: "FWD",
      clubId: "99",
      ageMin: "18",
      ageMax: "35",
      minRating: "75",
      page: "2",
    })

    expect(filters.q).toBe("mbappé")
    expect(filters.nationalTeamId).toBe(42)
    expect(filters.position).toBe("FWD")
    expect(filters.clubId).toBe(99)
    expect(filters.ageMin).toBe(18)
    expect(filters.ageMax).toBe(35)
    expect(filters.minRating).toBe(75)
    expect(filters.sort).toBe("rating-desc")
    expect(filters.page).toBe(2)
    expect(filters.leagueSlug).toBe("world-cup")
  })

  it("parseBrowseFilters reads sort param", () => {
    expect(parseBrowseFilters({ sort: "rating-asc" }).sort).toBe("rating-asc")
    expect(parseBrowseFilters({ sort: "invalid" }).sort).toBe("rating-desc")
  })

  it("browseOffset uses page size", () => {
    expect(browseOffset(1)).toBe(0)
    expect(browseOffset(3)).toBe(100)
  })

  it("buildPlayersBrowseHref round-trips active filters", () => {
    const href = buildPlayersBrowseHref({
      q: "kane",
      nationalTeamId: 10,
      position: null,
      clubId: null,
      leagueSlug: "world-cup",
      ageMin: null,
      ageMax: null,
      minRating: 6,
      sort: "rating-asc",
      page: 1,
    })

    expect(href).toContain("q=kane")
    expect(href).toContain("nationalTeamId=10")
    expect(href).toContain("minRating=6")
    expect(href).toContain("sort=rating-asc")
    expect(href).not.toContain("league=")
  })

  it("buildPlayersBrowseHref omits default sort", () => {
    const href = buildPlayersBrowseHref({
      q: null,
      nationalTeamId: null,
      position: null,
      clubId: null,
      leagueSlug: "world-cup",
      ageMin: null,
      ageMax: null,
      minRating: null,
      sort: "rating-desc",
      page: 1,
    })

    expect(href).toBe("/players")
  })
})
