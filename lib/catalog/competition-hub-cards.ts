import { cache } from "react"

import { COMPETITION_HUB_LEAGUES } from "@/lib/catalog/top-leagues"
import { createClient } from "@/lib/supabase/server"

export type CompetitionHubCard = {
  id: number
  name: string
  slug: string
  country: string
  logoUrl: string | null
  href: string
}

type CompetitionHubCardMode = "league" | "admin-totw"

function hrefForSlug(slug: string, mode: CompetitionHubCardMode): string {
  return mode === "league" ? `/league/${slug}` : `/admin/team-of-the-stage/${slug}`
}

export const getCompetitionHubCards = cache(
  async (mode: CompetitionHubCardMode): Promise<CompetitionHubCard[]> => {
    const slugs = COMPETITION_HUB_LEAGUES.map((league) => league.slug)
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("leagues")
      .select("id, name, slug, country, logo_url")
      .in("slug", slugs)

    if (error) {
      console.error("getCompetitionHubCards failed:", error.message)
    }

    const bySlug = new Map((data ?? []).map((row) => [row.slug, row]))

    return COMPETITION_HUB_LEAGUES.map((hub) => {
      const row = bySlug.get(hub.slug)
      return {
        id: row?.id ?? hub.id,
        name: row?.name ?? hub.name,
        slug: hub.slug,
        country: row?.country ?? hub.country,
        logoUrl: row?.logo_url ?? null,
        href: hrefForSlug(hub.slug, mode),
      }
    })
  },
)

export const getFeaturedCompetitionCards = cache(async () =>
  getCompetitionHubCards("league"),
)

export const getAdminTotwCompetitionCards = cache(async () =>
  getCompetitionHubCards("admin-totw"),
)

export const getCompetitionHubLogosBySlug = cache(async (): Promise<Map<string, string | null>> => {
  const cards = await getCompetitionHubCards("league")
  return new Map(cards.map((card) => [card.slug, card.logoUrl]))
})
