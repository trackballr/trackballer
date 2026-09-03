import { HomeLeagueMatches } from "@/components/home/home-league-matches"
import type { LeagueHomeMatches } from "@/lib/home/league-matches"

type HomeLeagueSidebarProps = {
  leagues: LeagueHomeMatches[]
}

/** Home right column — latest results and upcoming kickoffs per T5 league. */
export function HomeLeagueSidebar({ leagues }: HomeLeagueSidebarProps) {
  return (
    <aside className="min-w-0 lg:sticky lg:top-20">
      <HomeLeagueMatches leagues={leagues} variant="sidebar" />
    </aside>
  )
}
