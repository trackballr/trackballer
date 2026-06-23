import type { BrowseFilters, PlayerBrowseSort } from "./types"

export const SEARCH_MIN_LENGTH = 1
export const SEARCH_MAX_LENGTH = 64
export const BROWSE_PAGE_SIZE = 50
export const SEARCH_RESULTS_LIMIT = 20

/** Escape wildcards for SQL ILIKE patterns. */
export function escapeIlikePattern(raw: string): string {
  return raw.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_")
}

export function normalizeSearchQuery(raw: string | null | undefined): string | null {
  const trimmed = raw?.trim() ?? ""
  if (trimmed.length < SEARCH_MIN_LENGTH) return null
  return trimmed.slice(0, SEARCH_MAX_LENGTH)
}

export function buildIlikePattern(query: string): string {
  return `%${escapeIlikePattern(query)}%`
}

/** PostgREST or-filter for name fields; quotes pattern when it contains commas. */
export function nameIlikeOrFilter(query: string): string {
  const pattern = buildIlikePattern(query)
  const quoted = `"${pattern.replace(/"/g, '""')}"`
  return `name.ilike.${quoted},firstname.ilike.${quoted},lastname.ilike.${quoted}`
}

function parseOptionalInt(value: string | null | undefined): number | null {
  if (value == null || value === "") return null
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) ? parsed : null
}

function parseOptionalFloat(value: string | null | undefined): number | null {
  if (value == null || value === "") return null
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) ? parsed : null
}

const VALID_SORTS: PlayerBrowseSort[] = ["rating-desc", "rating-asc"]

function parseBrowseSort(value: string | null | undefined): PlayerBrowseSort {
  const raw = value?.trim()
  if (raw && VALID_SORTS.includes(raw as PlayerBrowseSort)) {
    return raw as PlayerBrowseSort
  }
  return "rating-desc"
}

export function parseBrowseFilters(
  params: Record<string, string | string[] | undefined>,
): BrowseFilters {
  const pick = (key: string): string | undefined => {
    const value = params[key]
    return Array.isArray(value) ? value[0] : value
  }

  const pageRaw = parseOptionalInt(pick("page"))
  const page = pageRaw != null && pageRaw > 0 ? pageRaw : 1

  const legacyNationality = pick("nationality")?.trim()
  const nationalTeamId =
    parseOptionalInt(pick("nationalTeamId")) ??
    parseOptionalInt(legacyNationality)

  return {
    q: normalizeSearchQuery(pick("q")),
    nationalTeamId,
    position: pick("position")?.trim() || null,
    clubId: parseOptionalInt(pick("clubId")),
    leagueSlug: pick("league")?.trim() || "world-cup",
    ageMin: parseOptionalInt(pick("ageMin")),
    ageMax: parseOptionalInt(pick("ageMax")),
    minRating: parseOptionalFloat(pick("minRating")),
    sort: parseBrowseSort(pick("sort")),
    page,
  }
}

export function browseOffset(page: number): number {
  return (page - 1) * BROWSE_PAGE_SIZE
}

export function buildPlayersBrowseHref(filters: BrowseFilters): string {
  const search = new URLSearchParams()
  if (filters.q) search.set("q", filters.q)
  if (filters.nationalTeamId != null) {
    search.set("nationalTeamId", String(filters.nationalTeamId))
  }
  if (filters.position) search.set("position", filters.position)
  if (filters.clubId != null) search.set("clubId", String(filters.clubId))
  if (filters.leagueSlug && filters.leagueSlug !== "world-cup") {
    search.set("league", filters.leagueSlug)
  }
  if (filters.ageMin != null) search.set("ageMin", String(filters.ageMin))
  if (filters.ageMax != null) search.set("ageMax", String(filters.ageMax))
  if (filters.minRating != null) search.set("minRating", String(filters.minRating))
  if (filters.sort !== "rating-desc") search.set("sort", filters.sort)
  if (filters.page > 1) search.set("page", String(filters.page))
  const qs = search.toString()
  return qs ? `/players?${qs}` : "/players"
}
