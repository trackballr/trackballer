import Link from "next/link"

import type { LeagueDetail } from "@/lib/league/detail"

type LeagueComingSoonProps = {
  league: LeagueDetail
}

export function LeagueComingSoon({ league }: LeagueComingSoonProps) {
  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <p className="eyebrow mb-2">{league.country ?? "League"}</p>
      <h1 className="h-display mb-4">{league.name}</h1>

      <div className="rounded-xl border border-border bg-card px-6 py-10">
        <p className="text-lg font-semibold">Coming soon</p>
        <p className="body-sm mt-2 text-muted-foreground">
          This competition is not available yet.
        </p>
      </div>

      <p className="body-sm mt-8">
        <Link href="/" className="text-primary underline-offset-4 hover:underline">
          Back to home
        </Link>
      </p>
    </div>
  )
}
