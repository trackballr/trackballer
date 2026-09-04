export type TopLeagueDefinition = {
  id: number
  name: string
  slug: string
  country: string
}

/** API-Football league ids for top-5 domestic leagues. */
export const TOP_LEAGUE_CLUBS: TopLeagueDefinition[] = [
  { id: 39, name: "Premier League", slug: "premier-league", country: "England" },
  { id: 140, name: "La Liga", slug: "la-liga", country: "Spain" },
  { id: 135, name: "Serie A", slug: "serie-a", country: "Italy" },
  { id: 78, name: "Bundesliga", slug: "bundesliga", country: "Germany" },
  { id: 61, name: "Ligue 1", slug: "ligue-1", country: "France" },
]

/** UEFA Champions League — fixtures + hub UI; no T5 club/player bulk seed. */
export const UCL_COMPETITION: TopLeagueDefinition = {
  id: 2,
  name: "UEFA Champions League",
  slug: "champions-league",
  country: "Europe",
}

/** Leagues with a /league/[slug] hub (T5 + UCL). */
export const COMPETITION_HUB_LEAGUES: TopLeagueDefinition[] = [
  ...TOP_LEAGUE_CLUBS,
  UCL_COMPETITION,
]

const COMPETITION_HUB_BY_SLUG = new Map(
  COMPETITION_HUB_LEAGUES.map((league) => [league.slug, league]),
)

export function getCompetitionHubBySlug(slug: string): TopLeagueDefinition | undefined {
  return COMPETITION_HUB_BY_SLUG.get(slug)
}

export function isCompetitionHubSlug(slug: string): boolean {
  return COMPETITION_HUB_BY_SLUG.has(slug)
}

/** @deprecated Use getCompetitionHubBySlug — kept for T5-only call sites. */
export function getTopLeagueBySlug(slug: string): TopLeagueDefinition | undefined {
  return getCompetitionHubBySlug(slug)
}

/** @deprecated Use isCompetitionHubSlug. */
export function isTopLeagueSlug(slug: string): boolean {
  return isCompetitionHubSlug(slug)
}
