import Link from "next/link"
import { countries } from "country-data-list"

import { TeamFlag } from "@/components/team-flag"
import { Panel } from "@/components/ui/panel"
import type { ProfileStats, ProfileView } from "@/lib/profile/types"
import { socialProfileUrl } from "@/lib/profile/validate-social-handles"
import { cn } from "@/lib/utils"

function formatMemberSince(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    }).format(new Date(iso))
  } catch {
    return ""
  }
}

export function countryNameFor(code: string | null): string | null {
  if (!code) return null
  return (
    countries.all.find((c) => c.alpha2?.toUpperCase() === code.toUpperCase())?.name ??
    null
  )
}

export function ProfileAvatar({
  profile,
  className,
}: {
  profile: Pick<ProfileView, "avatarUrl" | "displayName">
  className?: string
}) {
  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded-full border border-border bg-muted",
        className,
      )}
    >
      {profile.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- OAuth avatar hosts vary
        <img
          src={profile.avatarUrl}
          alt=""
          className="size-full object-cover"
          referrerPolicy="no-referrer"
        />
      ) : (
        <span className="flex size-full items-center justify-center font-semibold text-muted-foreground">
          {profile.displayName.slice(0, 2).toUpperCase()}
        </span>
      )}
    </div>
  )
}

function MetaItem({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
      {children}
    </span>
  )
}

type ProfileHeaderProps = {
  profile: ProfileView
  stats: ProfileStats
}

export function ProfileHeader({ profile, stats }: ProfileHeaderProps) {
  const teams = [profile.favouriteClub, profile.favouriteNationalTeam].filter(
    Boolean,
  ) as NonNullable<ProfileView["favouriteClub"]>[]
  const countryLabel = countryNameFor(profile.countryCode)
  const base = profile.username ? `/u/${profile.username}` : null

  const socials: { label: string; href: string; verified?: boolean }[] = []
  if (profile.twitterHandle && profile.twitterVerifiedAt) {
    socials.push({
      label: `@${profile.twitterHandle}`,
      href: socialProfileUrl("twitter", profile.twitterHandle),
      verified: true,
    })
  }
  if (profile.instagramHandle) {
    socials.push({
      label: `@${profile.instagramHandle}`,
      href: socialProfileUrl("instagram", profile.instagramHandle),
    })
  }

  const statItems = [
    { label: "Ratings", value: stats.ratingsGiven, href: base && `${base}/ratings` },
    { label: "Comments", value: stats.commentsCount, href: base && `${base}/comments` },
    { label: "Upvotes received", value: stats.upvotesReceived, href: null },
  ]

  return (
    <Panel>
      <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-start sm:p-6">
        <ProfileAvatar profile={profile} className="size-20 text-xl sm:size-24" />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="h-display truncate">{profile.displayName}</h1>
              {profile.username ? (
                <p className="mt-1 text-sm text-muted-foreground">@{profile.username}</p>
              ) : null}
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
            {teams.map((team) => (
              <MetaItem key={team.id}>
                <TeamFlag
                  team={{ name: team.name, logo_url: team.logoUrl, code: team.code }}
                  size="sm"
                />
                <span className="font-medium text-foreground">{team.name}</span>
              </MetaItem>
            ))}
            {countryLabel ? <MetaItem>{countryLabel}</MetaItem> : null}
            <MetaItem>Joined {formatMemberSince(profile.memberSince)}</MetaItem>
          </div>

          {socials.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
              {socials.map((s) => (
                <span key={s.href} className="inline-flex items-center gap-1.5">
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                  >
                    {s.label}
                  </a>
                  {s.verified ? (
                    <span className="text-xs text-emerald-600 dark:text-emerald-400">
                      Verified
                    </span>
                  ) : null}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-3 divide-x divide-border border-t border-border">
        {statItems.map((item) => {
          const content = (
            <>
              <span className="block text-xl font-bold tabular-nums sm:text-2xl">
                {item.value}
              </span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                {item.label}
              </span>
            </>
          )
          return item.href ? (
            <Link
              key={item.label}
              href={item.href}
              className="px-2 py-4 text-center transition-colors hover:bg-muted/50"
            >
              {content}
            </Link>
          ) : (
            <div key={item.label} className="px-2 py-4 text-center">
              {content}
            </div>
          )
        })}
      </div>
    </Panel>
  )
}
