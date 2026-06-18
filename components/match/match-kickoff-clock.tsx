"use client"

import { useMounted } from "@/hooks/use-mounted"
import { formatKickoffClockLocal } from "@/lib/match/score"

type MatchKickoffClockProps = {
  iso: string
  /** Shown before mount to keep server/client markup identical. */
  fallback: string
}

/** Kickoff clock (e.g. "16:00") in the viewer's local timezone. */
export function MatchKickoffClock({ iso, fallback }: MatchKickoffClockProps) {
  const mounted = useMounted()
  return <>{mounted ? formatKickoffClockLocal(iso) : fallback}</>
}
