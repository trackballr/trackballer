import Link from "next/link"
import { notFound } from "next/navigation"

import { AdminShell } from "@/components/admin/admin-shell"
import { TotwEditor } from "@/components/admin/totw-editor"
import { LEAGUE_TOTW_COPY } from "@/lib/admin/totw-copy"
import { getFeaturedTotwId, getAdminTeamsByRound } from "@/lib/admin/totw-queries"
import { getT5SeasonYear } from "@/lib/catalog/config"
import { getRounds, getSeasonByLeagueId } from "@/lib/catalog/fixtures"
import { getCompetitionHubBySlug, isCompetitionHubSlug } from "@/lib/catalog/top-leagues"

type PageProps = {
  params: Promise<{ slug: string }>
}

export default async function AdminTeamOfTheWeekLeaguePage({ params }: PageProps) {
  const { slug } = await params

  if (!isCompetitionHubSlug(slug)) {
    notFound()
  }

  const hub = getCompetitionHubBySlug(slug)!
  const seasonYear = getT5SeasonYear()
  const season = await getSeasonByLeagueId(hub.id, seasonYear)
  const rounds = season ? await getRounds(season.id) : []

  const [publishedDrafts, featuredTotwId] = season
    ? await Promise.all([
        getAdminTeamsByRound(season.id),
        getFeaturedTotwId(season.id),
      ])
    : [[], null]

  return (
    <AdminShell wide>
      <div className="mb-6 space-y-2">
        <Link
          href="/admin/team-of-the-stage"
          className="text-sm font-medium text-primary hover:underline"
        >
          ← Featured Competitions
        </Link>
        <h1 className="h-display">{hub.name}</h1>
        <p className="body-sm text-muted-foreground">
          {season ? `${hub.name} ${seasonYear}` : "Season not synced yet"}
        </p>
      </div>

      {!season ? (
        <p className="text-sm text-muted-foreground">
          No {seasonYear} season found for this league. Run fixture bootstrap first.
        </p>
      ) : (
        <TotwEditor
          seasonId={season.id}
          seasonLabel={`${hub.name} ${seasonYear}`}
          leagueSlug={slug}
          rounds={rounds.map((round) => ({ id: round.id, name: round.name }))}
          publishedDrafts={publishedDrafts}
          featuredTotwId={featuredTotwId}
          copy={LEAGUE_TOTW_COPY}
        />
      )}
    </AdminShell>
  )
}
