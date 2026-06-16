import type { ReactNode } from "react"
import Link from "next/link"

import { CareerRing } from "@/components/player/career-ring"
import { PlayerCareerRatingCta } from "@/components/player/player-career-rating-cta"
import { PlayerTierCard } from "@/components/player/player-tier-card"
import { TeamFlag } from "@/components/team-flag"
import { positionDisplayLabel } from "@/lib/match/position-label"
import type { PlayerProfile } from "@/lib/player/types"
import { formatCareerScore } from "@/lib/rating/career-tier"

type PlayerProfileHeroProps = {
  profile: PlayerProfile
  canRateCareer: boolean
}

function formatOneDecimal(value: number | null): string {
  if (value == null || Number.isNaN(value)) return "—"
  return value.toFixed(1)
}

function formatBirthDateLabel(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(iso))
}

function StatCell({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0 border-b border-border py-3 last:border-b-0">
      <p className="text-base font-semibold text-foreground">{children}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
    </div>
  )
}

export function PlayerProfileHero({ profile, canRateCareer }: PlayerProfileHeroProps) {
  const positionLabel = positionDisplayLabel(profile.primaryPosition)

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="flex items-center gap-3 bg-primary px-4 py-4 text-primary-foreground sm:gap-4">
        <CareerRing
          name={profile.displayName}
          photoUrl={profile.photoUrl}
          tier={profile.career.tier}
          displayScore={profile.career.displayScore}
          compact
        />
        <div className="min-w-0 flex-1 text-left">
          <h1 className="truncate text-lg font-bold leading-tight sm:text-xl">
            {profile.displayName}
          </h1>
          {profile.clubTeam ? (
            <p className="mt-1 flex items-center gap-1.5 text-sm text-primary-foreground/90">
              <TeamFlag team={profile.clubTeam} size="sm" />
              <span className="truncate">{profile.clubTeam.name}</span>
            </p>
          ) : null}
          {canRateCareer && profile.userCareerRating != null ? (
            <p className="mt-1 text-xs text-primary-foreground/75">
              You rated their career: {formatCareerScore(profile.userCareerRating)}
            </p>
          ) : null}
        </div>
        <PlayerCareerRatingCta
          playerId={profile.id}
          playerName={profile.displayName}
          canRate={canRateCareer}
          initialValue={profile.userCareerRating}
          layout="header"
        />
      </div>

      <div className="px-4 text-left">
        <div className="grid grid-cols-1 gap-x-6 sm:grid-cols-3">
          {profile.age != null ? (
            <StatCell label={profile.birthDate ? formatBirthDateLabel(profile.birthDate) : "Age"}>
              {profile.age} years
            </StatCell>
          ) : profile.birthDate ? (
            <StatCell label="Date of birth">{formatBirthDateLabel(profile.birthDate)}</StatCell>
          ) : null}
          {positionLabel ? <StatCell label="Position">{positionLabel}</StatCell> : null}
          {(profile.nationalTeam || profile.nationality) ? (
            <StatCell label="Country">
              <span className="inline-flex items-center gap-1.5">
                {profile.nationalTeam ? <TeamFlag team={profile.nationalTeam} size="sm" /> : null}
                {profile.nationalTeam ? (
                  <Link
                    href={`/country/${profile.nationalTeam.id}`}
                    className="hover:underline"
                  >
                    {profile.nationalTeam.name}
                  </Link>
                ) : (
                  <span>{profile.nationality}</span>
                )}
              </span>
            </StatCell>
          ) : null}
        </div>
      </div>

      <div className="border-t border-border px-4 pb-4">
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <PlayerTierCard career={profile.career} className="border-0 bg-muted/20 shadow-none" />
          <div className="flex flex-col justify-between gap-3 px-1 py-2">
            <div className="min-w-[12rem]">
              <p className="text-[11px] font-semibold tracking-wide text-primary uppercase">
                Recent form (last 5 matches)
              </p>
              <p className="mt-0.5 font-mono text-3xl font-bold tabular-nums">
                {formatOneDecimal(profile.form.last5Avg)}
              </p>
            </div>
            <div className="min-w-[8rem]">
              <p className="text-[11px] font-semibold tracking-wide text-primary uppercase">
                WC Form
              </p>
              <p className="mt-0.5 font-mono text-3xl font-bold tabular-nums">
                {formatOneDecimal(profile.tournament.avgRating)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
