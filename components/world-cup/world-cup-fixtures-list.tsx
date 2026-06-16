"use client"

import { useMemo } from "react"

import { MatchRow } from "@/components/match-row"
import { MatchRowList } from "@/components/match/match-row-list"
import { useMounted } from "@/hooks/use-mounted"
import type { FixtureWithTeams } from "@/lib/catalog/types"
import {
  formatMatchKickoffDateHeadingLocal,
  kickoffLocalDateKey,
} from "@/lib/match/score"

type WorldCupFixturesListProps = {
  fixtures: FixtureWithTeams[]
}

function groupFixturesByLocalDate(fixtures: FixtureWithTeams[]) {
  const groups: { key: string; label: string; fixtures: FixtureWithTeams[] }[] = []
  let currentKey: string | null = null

  for (const fixture of fixtures) {
    const key = kickoffLocalDateKey(fixture.kickoff_at)
    if (key !== currentKey) {
      groups.push({
        key,
        label: formatMatchKickoffDateHeadingLocal(fixture.kickoff_at),
        fixtures: [fixture],
      })
      currentKey = key
    } else {
      groups[groups.length - 1].fixtures.push(fixture)
    }
  }

  return groups
}

export function WorldCupFixturesList({ fixtures }: WorldCupFixturesListProps) {
  const mounted = useMounted()
  const groups = useMemo(() => {
    if (!mounted) {
      return [{ key: "pending", label: "", fixtures }]
    }
    return groupFixturesByLocalDate(fixtures)
  }, [mounted, fixtures])

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <div key={group.key}>
          {group.label ? (
            <div className="mb-2 rounded-lg bg-muted px-3 py-2 text-xs font-medium text-foreground md:text-[0.7rem]">
              <time>{group.label}</time>
            </div>
          ) : null}
          <MatchRowList className="overflow-hidden rounded-lg border border-border bg-card">
            {group.fixtures.map((fixture) => (
              <MatchRow
                key={fixture.id}
                fixture={fixture}
                aligned
                compact
                localTime
                crestFlags
              />
            ))}
          </MatchRowList>
        </div>
      ))}
    </div>
  )
}
