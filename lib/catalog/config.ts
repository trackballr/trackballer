import { DEFAULT_LEAGUE_ID, DEFAULT_SEASON_YEAR } from "@/lib/catalog-sync/constants"

const DEFAULT_T5_SEASON_YEAR = 2026

/** Current top-5 league season year (2026/27 European season). */
export function getT5SeasonYear(): number {
  const raw = process.env.T5_SEASON_YEAR ?? process.env.API_FOOTBALL_SEASON
  if (!raw) return DEFAULT_T5_SEASON_YEAR
  const year = Number(raw)
  return Number.isFinite(year) ? year : DEFAULT_T5_SEASON_YEAR
}

export function getCatalogLeagueId(): number {
  const raw = process.env.API_FOOTBALL_LEAGUE_ID
  if (!raw) return DEFAULT_LEAGUE_ID
  const id = Number(raw)
  return Number.isFinite(id) ? id : DEFAULT_LEAGUE_ID
}

export function getCatalogSeasonYear(): number {
  const raw = process.env.API_FOOTBALL_SEASON
  if (!raw) return DEFAULT_SEASON_YEAR
  const year = Number(raw)
  return Number.isFinite(year) ? year : DEFAULT_SEASON_YEAR
}
