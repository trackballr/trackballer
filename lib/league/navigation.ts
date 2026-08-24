import type { FixtureView } from "@/lib/catalog/types"

/** Build a /league/[slug] link for a given round + view. */
export function buildLeagueHref(
  slug: string,
  round: string,
  view: FixtureView,
): string {
  const params = new URLSearchParams()
  params.set("round", round)
  if (view === "finished") {
    params.set("view", view)
  }
  return `/league/${slug}?${params.toString()}`
}
