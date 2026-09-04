import { cache } from "react"

import { COMPETITION_HUB_LEAGUES } from "@/lib/catalog/top-leagues"
import { createClient } from "@/lib/supabase/server"

export type TotwCompetitionCard = {
  id: number
  name: string
  slug: string
  country: string
  logoUrl: string | null
  href: string
}

export const getTotwCompetitionCards = cache(async (): Promise<TotwCompetitionCard[]> => {
  const slugs = COMPETITION_HUB_LEAGUES.map((league) => league.slug)
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("leagues")
    .select("id, name, slug, country, logo_url")
    .in("slug", slugs)

  if (error) {
    console.error("getTotwCompetitionCards failed:", error.message)
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
      href: `/admin/team-of-the-stage/${hub.slug}`,
    }
  })
})
