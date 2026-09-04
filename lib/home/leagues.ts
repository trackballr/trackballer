import { cache } from "react"

import { COMPETITION_HUB_LEAGUES } from "@/lib/catalog/top-leagues"
import type { CompetitionStrip, CompetitionStripItem } from "@/lib/home/types"
import { createClient } from "@/lib/supabase/server"

const SHORT_LABELS: Record<string, string> = {
  "premier-league": "PL",
  "la-liga": "LL",
  "serie-a": "SA",
  bundesliga: "BL",
  "ligue-1": "L1",
  "champions-league": "UCL",
}

type LeagueRow = {
  id: number
  name: string
  slug: string
  is_active: boolean
  logo_url: string | null
}

function shortLabel(slug: string): string {
  return SHORT_LABELS[slug] ?? slug.slice(0, 2).toUpperCase()
}

function mapStripItem(row: LeagueRow): CompetitionStripItem {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    shortLabel: shortLabel(row.slug),
    href: `/league/${row.slug}`,
    isFeatured: false,
    logoUrl: row.logo_url,
  }
}

export const getCompetitionStrip = cache(async (): Promise<CompetitionStrip> => {
  const slugs = COMPETITION_HUB_LEAGUES.map((league) => league.slug)
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("leagues")
    .select("id, name, slug, is_active, logo_url")
    .in("slug", slugs)

  if (error) {
    console.error("getCompetitionStrip failed:", error.message)
    return fallbackStrip()
  }

  const bySlug = new Map((data ?? []).map((row) => [row.slug, row as LeagueRow]))

  const items = COMPETITION_HUB_LEAGUES.map((league) => bySlug.get(league.slug))
    .filter((row): row is LeagueRow => row != null)
    .map(mapStripItem)

  if (items.length === 0) {
    return fallbackStrip()
  }

  return {
    featured: items[0],
    others: items.slice(1),
  }
})

function fallbackStrip(): CompetitionStrip {
  const items = COMPETITION_HUB_LEAGUES.map((league, index) => ({
    id: league.id,
    name: league.name,
    slug: league.slug,
    shortLabel: shortLabel(league.slug),
    href: `/league/${league.slug}`,
    isFeatured: index === 0,
    logoUrl: null,
  }))

  return {
    featured: { ...items[0], isFeatured: true },
    others: items.slice(1).map((item) => ({ ...item, isFeatured: false })),
  }
}
