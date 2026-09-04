"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { useMemo } from "react"

import { TeamFlag } from "@/components/team-flag"
import { useMounted } from "@/hooks/use-mounted"
import type { FixtureWithTeams } from "@/lib/catalog/types"
import {
  formatKickoffClockLocal,
  formatKickoffClockUtc,
  formatMatchKickoffDateHeading,
  formatMatchKickoffDateHeadingLocal,
  formatMatchScore,
  kickoffLocalDateKey,
} from "@/lib/match/score"
import { cn } from "@/lib/utils"

type LeagueFixturesListProps = {
  fixtures: FixtureWithTeams[]
}

const UPCOMING = new Set(["NS", "TBD"])

/** time · home name · crest · score/vs · crest · away name · details link */
const rowGridClass =
  "grid grid-cols-[3.25rem_minmax(0,1fr)_auto_minmax(2.5rem,auto)_auto_minmax(0,1fr)_auto] items-center gap-x-2 sm:gap-x-3"

function groupFixturesByDate(fixtures: FixtureWithTeams[], local: boolean) {
  const groups: { key: string; label: string; fixtures: FixtureWithTeams[] }[] = []
  let currentKey: string | null = null

  for (const fixture of fixtures) {
    const key = local
      ? kickoffLocalDateKey(fixture.kickoff_at)
      : fixture.kickoff_at.slice(0, 10)

    if (key !== currentKey) {
      groups.push({
        key,
        label: local
          ? formatMatchKickoffDateHeadingLocal(fixture.kickoff_at)
          : formatMatchKickoffDateHeading(fixture.kickoff_at),
        fixtures: [fixture],
      })
      currentKey = key
    } else {
      groups[groups.length - 1].fixtures.push(fixture)
    }
  }

  return groups
}

function LeagueFixtureRow({
  fixture,
  mounted,
}: {
  fixture: FixtureWithTeams
  mounted: boolean
}) {
  const { scoreline, statusLabel, isLive } = formatMatchScore(fixture)
  const isUpcoming = UPCOMING.has(fixture.status_short)
  const clock = mounted
    ? formatKickoffClockLocal(fixture.kickoff_at)
    : formatKickoffClockUtc(fixture.kickoff_at)

  return (
    <Link
      href={`/match/${fixture.id}`}
      className={cn(
        rowGridClass,
        "col-span-full grid-cols-subgrid border-b border-border px-3 py-2.5 transition-colors last:border-b-0 hover:bg-muted/50 sm:px-4",
      )}
    >
      <span className="flex flex-col">
        <time
          dateTime={fixture.kickoff_at}
          className="text-[13px] font-semibold tabular-nums"
        >
          {clock}
        </time>
      </span>

      <span className="truncate text-right text-[13px] font-medium sm:text-sm">
        {fixture.home_team.name}
      </span>
      <TeamFlag team={fixture.home_team} size="md" variant="crest" />

      <span className="flex flex-col items-center justify-center">
        <span
          className={cn(
            "whitespace-nowrap tabular-nums",
            isUpcoming
              ? "text-[11px] font-medium text-muted-foreground"
              : "text-sm font-bold",
            isLive && "text-primary",
          )}
        >
          {isUpcoming ? "vs" : scoreline}
        </span>
        {!isUpcoming ? (
          <span
            className={cn(
              "mt-0.5 text-[9px] font-semibold tracking-wider uppercase",
              isLive ? "text-primary" : "text-muted-foreground",
            )}
          >
            {statusLabel}
          </span>
        ) : null}
      </span>

      <TeamFlag team={fixture.away_team} size="md" variant="crest" />
      <span className="truncate text-left text-[13px] font-medium sm:text-sm">
        {fixture.away_team.name}
      </span>

      <span className="hidden items-center gap-1 text-xs font-medium text-primary sm:inline-flex">
        View details
        <ArrowRight className="size-3.5" />
      </span>
    </Link>
  )
}

export function LeagueFixturesList({ fixtures }: LeagueFixturesListProps) {
  const mounted = useMounted()
  const groups = useMemo(
    () => groupFixturesByDate(fixtures, mounted),
    [fixtures, mounted],
  )

  return (
    <div className={rowGridClass}>
      {groups.map((group) => (
        <div key={group.key} className="col-span-full grid grid-cols-subgrid">
          <div className="col-span-full bg-muted px-3 py-2 text-xs font-semibold text-foreground sm:px-4">
            <time>{group.label}</time>
          </div>
          {group.fixtures.map((fixture) => (
            <LeagueFixtureRow key={fixture.id} fixture={fixture} mounted={mounted} />
          ))}
        </div>
      ))}
    </div>
  )
}
