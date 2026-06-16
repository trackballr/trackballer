import Link from "next/link"

import { MatchRowScoreBlock } from "@/components/match/match-row-score-block"
import { NationalTeamNameLink } from "@/components/national-team-name-link"
import { TeamFlag } from "@/components/team-flag"
import type { FixtureWithTeams } from "@/lib/catalog/types"
import { formatMatchKickoffDate, formatMatchScore } from "@/lib/match/score"
import { formatFixtureRoundLabel } from "@/lib/world-cup/round-label"
import { cn } from "@/lib/utils"

type MatchRowProps = {
  fixture: FixtureWithTeams
  /** Show the round label under the row (for mixed-round lists like home). */
  showContext?: boolean
  /** Show the kickoff day under the row (for single-round lists that span dates). */
  showKickoff?: boolean
  /** Tighter row for World Cup fixture lists — ~20% smaller type and padding. */
  compact?: boolean
  /** Show kickoff time in the viewer's local timezone (browser-only island). */
  localTime?: boolean
  /** Square crest flags — home / World Cup fixture tables. */
  crestFlags?: boolean
  /** Use parent `MatchRowList` subgrid so columns align across rows. */
  aligned?: boolean
  className?: string
}

/** Shared column template — pair with `MatchRowList` + `aligned` for cross-row alignment. */
export const matchRowGridClass =
  "grid grid-cols-[minmax(0,1fr)_1.25rem_minmax(4.5rem,auto)_1.25rem_minmax(0,1fr)] items-center gap-x-2"

const FRIENDLY_STATUS_LABELS = new Set(["Yet to start"])

const teamNameClass = (compact: boolean, align: "left" | "right") =>
  cn(
    "block w-full min-w-0 font-semibold",
    align === "right" ? "text-right" : "text-left",
    compact ? "text-[12px]" : "text-[15px]",
  )

export function MatchRow({
  fixture,
  showContext = false,
  showKickoff = false,
  compact = false,
  localTime = false,
  crestFlags = false,
  aligned = false,
  className,
}: MatchRowProps) {
  const { scoreline, statusLabel, isLive } = formatMatchScore(fixture)
  const shouldUppercase =
    !statusLabel.startsWith("PEN (") && !FRIENDLY_STATUS_LABELS.has(statusLabel)
  const matchHref = `/match/${fixture.id}`
  const flagVariant = crestFlags ? "crest" : "circle"
  const roundLabel = formatFixtureRoundLabel(fixture.round_name)

  return (
    <div
      className={cn(
        aligned
          ? "col-span-full grid grid-cols-subgrid items-center"
          : matchRowGridClass,
        compact
          ? "border-b border-border px-4 py-2.5 transition-colors last:border-b-0 hover:bg-muted/60"
          : "border-b border-border px-6 py-3.5 transition-colors last:border-b-0 hover:bg-muted/60",
        className,
      )}
    >
      <NationalTeamNameLink
        team={fixture.home_team}
        className={teamNameClass(compact, "right")}
      />
      <TeamFlag
        team={fixture.home_team}
        size={compact ? "sm" : "md"}
        variant={flagVariant}
        className="justify-self-end"
      />

      {localTime ? (
        <Link href={matchHref} className="contents">
          <MatchRowScoreBlock fixture={fixture} compact={compact} />
        </Link>
      ) : (
        <Link href={matchHref} className="contents">
          <span
            className={cn(
              "justify-self-center px-3 font-bold tracking-tight tabular-nums",
              compact ? "text-[14.4px]" : "text-lg",
            )}
          >
            {scoreline}
          </span>

          <span
            className={cn(
              "col-start-3 row-start-2 justify-self-center px-3 whitespace-nowrap font-semibold tracking-wider",
              compact ? "text-[8px]" : "text-[10px]",
              isLive ? "text-primary" : "text-muted-foreground",
              shouldUppercase && "uppercase",
            )}
          >
            {statusLabel}
          </span>
        </Link>
      )}

      <TeamFlag
        team={fixture.away_team}
        size={compact ? "sm" : "md"}
        variant={flagVariant}
        className="justify-self-start"
      />
      <NationalTeamNameLink
        team={fixture.away_team}
        className={teamNameClass(compact, "left")}
      />

      {showKickoff ? (
        <p
          className={cn(
            "col-span-5 row-start-3 mt-1 text-center text-muted-foreground",
            compact ? "text-[8.8px]" : "text-[11px]",
          )}
        >
          {formatMatchKickoffDate(fixture.kickoff_at)}
        </p>
      ) : (
        showContext &&
        roundLabel && (
          <p className="col-span-5 row-start-3 mt-1 text-left text-[11px] text-muted-foreground">
            {roundLabel}
          </p>
        )
      )}
    </div>
  )
}
