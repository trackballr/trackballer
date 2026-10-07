import Link from "next/link"

import { ProfileAvatar } from "@/components/profile/profile-header"
import type { ProfileStats, ProfileView } from "@/lib/profile/types"
import { cn } from "@/lib/utils"

type ProfileHistoryShellProps = {
  profile: ProfileView
  stats: ProfileStats
  active: "ratings" | "comments"
  isOwner: boolean
  children: React.ReactNode
}

/** Shared frame for /u/[username]/ratings and /u/[username]/comments. */
export function ProfileHistoryShell({
  profile,
  stats,
  active,
  isOwner,
  children,
}: ProfileHistoryShellProps) {
  const base = `/u/${profile.username}`
  const profileHref = isOwner ? "/profile" : base

  const tabs = [
    { key: "ratings", label: "Ratings", count: stats.ratingsGiven, href: `${base}/ratings` },
    { key: "comments", label: "Comments", count: stats.commentsCount, href: `${base}/comments` },
  ] as const

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link
        href={profileHref}
        className="text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        ← Back to profile
      </Link>

      <Link href={profileHref} className="mt-4 flex items-center gap-3">
        <ProfileAvatar profile={profile} className="size-12 text-sm" />
        <div className="min-w-0">
          <h1 className="h3 truncate">{profile.displayName}</h1>
          <p className="text-sm text-muted-foreground">@{profile.username}</p>
        </div>
      </Link>

      <nav aria-label="Profile history" className="mt-5 flex gap-2">
        {tabs.map((tab) => {
          const isActive = tab.key === active
          return (
            <Link
              key={tab.key}
              href={tab.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                isActive
                  ? "bg-foreground text-background"
                  : "bg-card text-foreground ring-1 ring-border hover:bg-muted",
              )}
            >
              {tab.label}
              <span
                className={cn(
                  "ml-1.5 tabular-nums",
                  isActive ? "text-background/70" : "text-muted-foreground",
                )}
              >
                {tab.count}
              </span>
            </Link>
          )
        })}
      </nav>

      <div className="mt-5">{children}</div>
    </div>
  )
}
