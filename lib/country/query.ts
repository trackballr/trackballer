import type { FixtureView } from "@/lib/catalog/types"
import type { PlayerBrowseSort } from "@/lib/search/types"

import type { CountryPageParams } from "./types"

const VALID_SORTS: PlayerBrowseSort[] = ["rating-desc", "rating-asc"]

function parseOptionalInt(value: string | null | undefined): number | null {
  if (value == null || value === "") return null
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) ? parsed : null
}

export function parseCountryPageParams(
  params: Record<string, string | string[] | undefined>,
): CountryPageParams {
  const pick = (key: string): string | undefined => {
    const value = params[key]
    return Array.isArray(value) ? value[0] : value
  }

  const viewRaw = pick("view")
  const view: FixtureView = viewRaw === "finished" ? "finished" : "upcoming"

  const pageRaw = parseOptionalInt(pick("page"))
  const page = pageRaw != null && pageRaw > 0 ? pageRaw : 1

  const sortRaw = pick("sort")?.trim()
  const sort: PlayerBrowseSort =
    sortRaw && VALID_SORTS.includes(sortRaw as PlayerBrowseSort)
      ? (sortRaw as PlayerBrowseSort)
      : "rating-desc"

  return { view, page, sort }
}

export function buildCountryHref(
  teamId: number,
  options: Partial<CountryPageParams> = {},
): string {
  const search = new URLSearchParams()
  const view = options.view ?? "upcoming"
  const page = options.page ?? 1
  const sort = options.sort ?? "rating-desc"

  if (view !== "upcoming") search.set("view", view)
  if (page > 1) search.set("page", String(page))
  if (sort !== "rating-desc") search.set("sort", sort)

  const qs = search.toString()
  return qs ? `/country/${teamId}?${qs}` : `/country/${teamId}`
}
