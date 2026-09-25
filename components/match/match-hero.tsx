import type { ReactNode } from "react"

import { CatalogImage } from "@/components/catalog-image"
import { MatchKickoffClock } from "@/components/match/match-kickoff-clock"
import { MatchKickoffDateTime } from "@/components/match/match-kickoff-datetime"
import { MatchRedCardsRow } from "@/components/match/match-red-cards-row"
import { MatchScorersRow } from "@/components/match/match-scorers-row"
import { NationalTeamNameLink } from "@/components/national-team-name-link"
import { TeamFlag } from "@/components/team-flag"
import type { FixtureWithTeams } from "@/lib/catalog/types"
import { matchHeroStatusLabel, type MatchHeroScore } from "@/lib/match/hero-score"
import type { MatchDetail } from "@/lib/match/types"
import { cn } from "@/lib/utils"

type MatchHeroProps = {
  fixture: FixtureWithTeams
  detail: Pick<MatchDetail, "competitionLabel" | "goalScorers" | "redCards">
  heroScore: MatchHeroScore
  /** Rendered flush with the bottom edge (FotMob-style tabs). */
  tabBar?: ReactNode
  className?: string
}

const STADIUM_ICON = "/stadium-svgrepo-com.svg"

function MatchTrophyIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("size-4 shrink-0 text-primary", className)}
      aria-hidden
    >
      <path
        d="M6.74534 4H17.3132C17.3132 4 16.4326 17.2571 12.0293 17.2571C9.87826 17.2571 8.56786 14.0935 7.79011 10.8571C6.97574 7.46844 6.74534 4 6.74534 4Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M17.3132 4C17.3132 4 18.2344 3.01733 19 2.99999C20.5 2.96603 20.7773 4 20.7773 4C21.0709 4.60953 21.3057 6.19429 19.8967 7.65715C18.4876 9.12 16.9103 10.4 16.2684 10.8571"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.74527 4.00001C6.74527 4.00001 5.78547 3.00614 4.99995 3.00001C3.49995 2.9883 3.22264 4.00001 3.22264 4.00001C2.92908 4.60953 2.69424 6.19429 4.1033 7.65715C5.51235 9.12001 7.14823 10.4 7.79004 10.8572"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8.50662 20C8.50662 18.1714 12.0292 17.2571 12.0292 17.2571C12.0292 17.2571 15.5519 18.1714 15.5519 20H8.50662Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function HeroTeam({
  team,
  side,
}: {
  team: FixtureWithTeams["home_team"]
  side: "home" | "away"
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-col items-center gap-2 md:flex-row md:gap-4",
        side === "home" && "md:justify-end",
      )}
    >
      <TeamFlag
        team={team}
        size="lg"
        variant="crest"
        className={cn("size-10 md:size-12", side === "home" && "md:order-last")}
      />
      <NationalTeamNameLink
        team={team}
        className={cn(
          "block max-w-full text-center font-display text-sm font-semibold md:text-2xl",
          side === "home" ? "md:text-right" : "md:text-left",
        )}
      />
    </div>
  )
}

function HeroScore({
  fixture,
  heroScore,
}: {
  fixture: FixtureWithTeams
  heroScore: MatchHeroScore
}) {
  const statusLabel = matchHeroStatusLabel(fixture.status_short)

  return (
    <div className="flex flex-col items-center px-1 text-center">
      <p className="font-display text-3xl font-bold leading-none tabular-nums tracking-tight md:text-5xl">
        {heroScore.isUpcoming && fixture.kickoff_at ? (
          <MatchKickoffClock iso={fixture.kickoff_at} fallback={heroScore.mainScore} />
        ) : (
          heroScore.mainScore
        )}
      </p>
      {heroScore.penLine && (
        <p className="mt-1.5 text-xs font-semibold text-foreground/80 md:text-sm">
          {heroScore.penLine}
        </p>
      )}
      {statusLabel && (
        <p
          className={cn(
            "mt-1.5 inline-flex items-center gap-1.5 text-xs font-medium md:text-sm",
            heroScore.isLive ? "text-primary" : "text-muted-foreground",
          )}
        >
          {heroScore.isLive && (
            <span className="size-1.5 animate-pulse rounded-full bg-primary" aria-hidden />
          )}
          {statusLabel}
        </p>
      )}
    </div>
  )
}

/**
 * Match header card: competition bar, date + venue, teams and score, scorers,
 * and an optional tab bar pinned to the bottom edge.
 */
export function MatchHero({ fixture, detail, heroScore, tabBar, className }: MatchHeroProps) {
  const hasScorers =
    detail.goalScorers.home.length > 0 || detail.goalScorers.away.length > 0

  return (
    <section
      className={cn(
        "mb-4 overflow-hidden rounded-2xl border border-border bg-card shadow-sm",
        className,
      )}
    >
      {detail.competitionLabel && (
        <div className="flex items-center justify-center gap-2 border-b border-border px-4 py-3">
          <MatchTrophyIcon />
          <p className="truncate text-sm font-semibold text-foreground md:text-base">
            {detail.competitionLabel}
          </p>
        </div>
      )}

      {(fixture.kickoff_at || fixture.venue) && (
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 border-b border-border px-4 py-2.5 text-xs text-muted-foreground">
          {fixture.kickoff_at && <MatchKickoffDateTime iso={fixture.kickoff_at} />}
          {fixture.venue && (
            <span className="inline-flex items-center gap-1.5">
              <CatalogImage
                src={STADIUM_ICON}
                alt=""
                width={14}
                height={14}
                className="shrink-0 object-contain opacity-60 dark:invert"
              />
              {fixture.venue}
            </span>
          )}
        </div>
      )}

      <div className="px-3 pt-5 pb-4 md:px-8 md:pt-7 md:pb-5">
        <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-2 md:items-center md:gap-8">
          <HeroTeam team={fixture.home_team} side="home" />
          <HeroScore fixture={fixture} heroScore={heroScore} />
          <HeroTeam team={fixture.away_team} side="away" />
        </div>

        <MatchScorersRow scorers={detail.goalScorers} className="mt-4 md:mt-5" />
        <MatchRedCardsRow
          redCards={detail.redCards}
          className={hasScorers ? "mt-1.5" : "mt-4 md:mt-5"}
        />
      </div>

      {tabBar && <div className="px-3 md:px-6">{tabBar}</div>}
    </section>
  )
}
