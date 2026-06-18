import { CatalogImage } from "@/components/catalog-image"
import { MatchKickoffClock } from "@/components/match/match-kickoff-clock"
import { MatchKickoffDateTime } from "@/components/match/match-kickoff-datetime"
import { MatchRedCardsRow } from "@/components/match/match-red-cards-row"
import { MatchScorersRow } from "@/components/match/match-scorers-row"
import { NationalTeamNameLink } from "@/components/national-team-name-link"
import { TeamFlag } from "@/components/team-flag"
import type { FixtureWithTeams } from "@/lib/catalog/types"
import type { MatchHeroScore } from "@/lib/match/hero-score"
import type { MatchDetail } from "@/lib/match/types"
import { cn } from "@/lib/utils"

type MatchHeroProps = {
  fixture: FixtureWithTeams
  detail: Pick<MatchDetail, "competitionLabel" | "goalScorers" | "redCards">
  heroScore: MatchHeroScore
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

export function MatchHero({ fixture, detail, heroScore, className }: MatchHeroProps) {
  return (
    <section
      className={cn(
        "mb-6 overflow-hidden rounded-xl border border-border bg-card shadow-sm",
        className,
      )}
    >
      <div className="bg-gradient-to-br from-muted/40 via-card to-muted/20 px-4 py-4 md:px-6 md:py-5">
        {detail.competitionLabel && (
          <div className="mb-3 flex items-center justify-center gap-1.5 text-center">
            <MatchTrophyIcon />
            <p className="text-sm font-semibold text-foreground">{detail.competitionLabel}</p>
          </div>
        )}

        {(fixture.kickoff_at || fixture.venue) && (
          <div className="mb-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {fixture.kickoff_at && <MatchKickoffDateTime iso={fixture.kickoff_at} />}
            {fixture.venue && (
              <span className="inline-flex items-center gap-1">
                <CatalogImage
                  src={STADIUM_ICON}
                  alt=""
                  width={14}
                  height={14}
                  className="shrink-0 object-contain opacity-70 dark:invert"
                />
                {fixture.venue}
              </span>
            )}
          </div>
        )}

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 md:gap-6">
          <div className="flex min-w-0 items-center justify-end gap-2 md:gap-3">
            <div className="min-w-0 text-right">
              <NationalTeamNameLink
                team={fixture.home_team}
                className="block truncate font-display text-base font-bold md:text-xl"
              />
            </div>
            <TeamFlag team={fixture.home_team} size="md" className="shrink-0" />
          </div>

          <div className="text-center">
            <p className="font-display text-3xl font-bold tabular-nums tracking-tight md:text-4xl">
              {heroScore.isUpcoming && fixture.kickoff_at ? (
                <MatchKickoffClock
                  iso={fixture.kickoff_at}
                  fallback={heroScore.mainScore}
                />
              ) : (
                heroScore.mainScore
              )}
            </p>
            {heroScore.penLine && (
              <p className="mt-0.5 text-xs font-medium text-muted-foreground md:text-sm">
                {heroScore.penLine}
              </p>
            )}
            {heroScore.isLive && (
              <p className="mt-0.5 text-xs font-semibold uppercase text-primary">
                {heroScore.statusText}
              </p>
            )}
          </div>

          <div className="flex min-w-0 items-center gap-2 md:gap-3">
            <TeamFlag team={fixture.away_team} size="md" className="shrink-0" />
            <div className="min-w-0 text-left">
              <NationalTeamNameLink
                team={fixture.away_team}
                className="block truncate font-display text-base font-bold md:text-xl"
              />
            </div>
          </div>
        </div>

        <MatchScorersRow scorers={detail.goalScorers} className="mt-1" />
        <MatchRedCardsRow
          redCards={detail.redCards}
          className={
            detail.goalScorers.home.length > 0 || detail.goalScorers.away.length > 0
              ? "border-t-0 pt-2"
              : undefined
          }
        />
      </div>
    </section>
  )
}
