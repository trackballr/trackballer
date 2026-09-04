import { TOP_LEAGUE_CLUBS } from "@/lib/catalog/top-leagues"

type TeamOfTheWeekComingSoonProps = {
  /** When set, only show the card for this league slug (league hub page). */
  leagueSlug?: string
}

export function TeamOfTheWeekComingSoon({ leagueSlug }: TeamOfTheWeekComingSoonProps) {
  const leagues = leagueSlug
    ? TOP_LEAGUE_CLUBS.filter((league) => league.slug === leagueSlug)
    : TOP_LEAGUE_CLUBS

  if (leagues.length === 0) return null

  return (
    <section>
      <div className="mb-3">
        <h2 className="h3">Team of the Week</h2>
        <p className="text-xs text-muted-foreground">
          Weekly best XIs for each top league launching soon.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {leagues.map((league) => (
          <div
            key={league.id}
            className="rounded-lg border border-dashed border-border bg-muted/30 px-4 py-6 text-center"
          >
            <p className="text-sm font-semibold">{league.name}</p>
            <p className="mt-1 text-xs text-muted-foreground">Coming soon</p>
          </div>
        ))}
      </div>
    </section>
  )
}
