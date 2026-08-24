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

const TOP_LEAGUE_BY_SLUG = new Map(TOP_LEAGUE_CLUBS.map((league) => [league.slug, league]))

export function getTopLeagueBySlug(slug: string): TopLeagueDefinition | undefined {
  return TOP_LEAGUE_BY_SLUG.get(slug)
}

export function isTopLeagueSlug(slug: string): boolean {
  return TOP_LEAGUE_BY_SLUG.has(slug)
}
