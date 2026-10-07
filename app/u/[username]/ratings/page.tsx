import Link from "next/link"

import { ProfileHistoryShell } from "@/components/profile/profile-history-shell"
import { RatingHistoryList } from "@/components/profile/rating-history-list"
import { fetchRatingHistoryPage } from "@/lib/profile/history"
import { loadProfileHistoryContext } from "@/lib/profile/history-page"
import type { RatingKind } from "@/lib/profile/types"
import { cn } from "@/lib/utils"

type PageProps = {
  params: Promise<{ username: string }>
  searchParams: Promise<{ kind?: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { username } = await params
  return { title: `Ratings by @${username} | Trackballr` }
}

const FILTERS: { label: string; kind: RatingKind | null }[] = [
  { label: "All", kind: null },
  { label: "Match", kind: "match" },
  { label: "Career", kind: "career" },
]

export default async function UserRatingsPage({ params, searchParams }: PageProps) {
  const [{ username }, { kind: kindParam }] = await Promise.all([params, searchParams])
  const kind: RatingKind | null =
    kindParam === "match" || kindParam === "career" ? kindParam : null

  const { supabase, profile, stats, isOwner } = await loadProfileHistoryContext(username)
  const firstPage = await fetchRatingHistoryPage(supabase, profile.id, { kind })
  const base = `/u/${profile.username}/ratings`

  return (
    <ProfileHistoryShell profile={profile} stats={stats} active="ratings" isOwner={isOwner}>
      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((filter) => {
          const isActive = filter.kind === kind
          return (
            <Link
              key={filter.label}
              href={filter.kind ? `${base}?kind=${filter.kind}` : base}
              scroll={false}
              aria-current={isActive ? "true" : undefined}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground",
              )}
            >
              {filter.label}
            </Link>
          )
        })}
      </div>

      <RatingHistoryList
        key={kind ?? "all"}
        userId={profile.id}
        kind={kind}
        initialPage={firstPage}
      />
    </ProfileHistoryShell>
  )
}
