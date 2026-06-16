import type { ReactNode } from "react"
import Link from "next/link"

import { CatalogImage } from "@/components/catalog-image"
import { TeamFlag } from "@/components/team-flag"
import type { FixtureWithTeams } from "@/lib/catalog/types"
import {
  formatMatchKickoffDateTime,
  formatMatchScore,
} from "@/lib/match/score"
import { cn } from "@/lib/utils"

type CountryFixturePeekCardProps = {
  label: string
  fixture: FixtureWithTeams
  teamId: number
  className?: string
}

function opponentName(fixture: FixtureWithTeams, teamId: number): string {
  return fixture.home_team_id === teamId
    ? fixture.away_team.name
    : fixture.home_team.name
}

export function CountryFixturePeekCard({
  label,
  fixture,
  teamId,
  className,
}: CountryFixturePeekCardProps) {
  const { scoreline, statusLabel } = formatMatchScore(fixture)
  const opponent = opponentName(fixture, teamId)
  const opponentTeam =
    fixture.home_team_id === teamId ? fixture.away_team : fixture.home_team

  return (
    <Link
      href={`/match/${fixture.id}`}
      className={cn(
        "block min-w-0 flex-1 rounded-lg border border-primary-foreground/25 bg-primary-foreground/10 p-3 transition-colors hover:bg-primary-foreground/15",
        className,
      )}
    >
      <p className="text-[10px] font-semibold tracking-wide text-primary-foreground/75 uppercase">
        {label}
      </p>
      <p className="mt-1 truncate text-xs text-primary-foreground/90">
        {fixture.round_name ?? "FIFA World Cup"}
      </p>
      <p className="mt-0.5 text-[11px] text-primary-foreground/80">
        {formatMatchKickoffDateTime(fixture.kickoff_at)}
      </p>

      <div className="mt-2 flex items-center gap-2">
        <TeamFlag team={opponentTeam} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">vs {opponent}</p>
          <p className="mt-0.5 font-mono text-base font-bold tabular-nums">{scoreline}</p>
          <p className="text-[10px] font-semibold tracking-wide text-primary-foreground/75 uppercase">
            {statusLabel}
          </p>
        </div>
      </div>
    </Link>
  )
}

export function CountryFixturePeekPlaceholder({
  label,
  message,
  className,
}: {
  label: string
  message: string
  className?: string
}) {
  return (
    <div
      className={cn(
        "min-w-0 flex-1 rounded-lg border border-primary-foreground/20 bg-primary-foreground/5 p-3",
        className,
      )}
    >
      <p className="text-[10px] font-semibold tracking-wide text-primary-foreground/75 uppercase">
        {label}
      </p>
      <p className="mt-3 text-sm text-primary-foreground/80">{message}</p>
    </div>
  )
}

type CountryProfileHeroProps = {
  name: string
  logoUrl: string | null
  code: string | null
  country: string | null
  coachName: string | null
  coachPhotoUrl: string | null
  homeVenue: string | null
  competitionLabel: string
  previousFixture: FixtureWithTeams | null
  nextFixture: FixtureWithTeams | null
  teamId: number
}

function MetaItem({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0 border-b border-border py-3 last:border-b-0">
      <p className="text-base font-semibold text-foreground">{children}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
    </div>
  )
}

export function CountryProfileHero({
  name,
  logoUrl,
  code,
  country,
  coachName,
  coachPhotoUrl,
  homeVenue,
  competitionLabel,
  previousFixture,
  nextFixture,
  teamId,
}: CountryProfileHeroProps) {
  const fallback = code?.slice(0, 3).toUpperCase() ?? name.slice(0, 2).toUpperCase()

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="flex flex-col gap-4 bg-primary px-4 py-4 text-primary-foreground lg:flex-row lg:items-stretch lg:gap-5 sm:px-5 sm:py-5">
        <div className="flex min-w-0 flex-1 items-start gap-3 sm:gap-4">
          <span className="flex size-[4.5rem] shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-primary-foreground/30 bg-primary-foreground/10">
            {logoUrl ? (
              <CatalogImage
                src={logoUrl}
                alt=""
                width={56}
                height={56}
                className="size-14 object-contain"
              />
            ) : (
              <span className="text-sm font-bold">{fallback}</span>
            )}
          </span>

          <div className="min-w-0 flex-1 text-left">
            <h1 className="truncate text-lg font-bold leading-tight sm:text-xl">{name}</h1>
            {coachName ? (
              <p className="mt-1 flex items-center gap-2 text-sm text-primary-foreground/90">
                {coachPhotoUrl ? (
                  <CatalogImage
                    src={coachPhotoUrl}
                    alt=""
                    width={24}
                    height={24}
                    className="size-6 rounded-full object-cover"
                  />
                ) : (
                  <span className="flex size-6 items-center justify-center rounded-full bg-primary-foreground/15 text-[10px] font-semibold">
                    {coachName.slice(0, 1)}
                  </span>
                )}
                <span className="truncate">{coachName}</span>
                <span className="text-primary-foreground/70">· Coach</span>
              </p>
            ) : null}
            {country ? (
              <p className="mt-1 text-sm text-primary-foreground/80">{country}</p>
            ) : null}
          </div>
        </div>

        <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:w-[min(100%,28rem)] lg:shrink-0">
          {previousFixture ? (
            <CountryFixturePeekCard
              label="Previous match"
              fixture={previousFixture}
              teamId={teamId}
            />
          ) : (
            <CountryFixturePeekPlaceholder
              label="Previous match"
              message="No recent result yet."
            />
          )}
          {nextFixture ? (
            <CountryFixturePeekCard label="Next match" fixture={nextFixture} teamId={teamId} />
          ) : (
            <CountryFixturePeekPlaceholder
              label="Next match"
              message="No upcoming match scheduled."
            />
          )}
        </div>
      </div>

      <div className="px-4 text-left sm:px-5">
        <div className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
          {homeVenue ? <MetaItem label="Home stadium">{homeVenue}</MetaItem> : null}
          <MetaItem label="Competition">{competitionLabel}</MetaItem>
        </div>
      </div>
    </section>
  )
}
