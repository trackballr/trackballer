import { CareerShuffleStrip } from "@/components/home/career-shuffle-strip"
import { CompetitionStrip } from "@/components/home/competition-strip"
import { FeaturedCompetitions } from "@/components/home/featured-competitions"
import { HomeLeagueSidebar } from "@/components/home/home-league-sidebar"
import { TrendingComments } from "@/components/home/trending-comments"
import { TrendingPlayers } from "@/components/home/trending-players"
import { YourTeamToday } from "@/components/home/your-team-today"
import { TeamOfTheWeekComingSoon } from "@/components/league/team-of-the-week-coming-soon"
import { getFeaturedCompetitionCards } from "@/lib/catalog/competition-hub-cards"
import { getHomeLeagueMatches } from "@/lib/home/league-matches"
import { getCompetitionStrip } from "@/lib/home/leagues"
import { getTrendingComments } from "@/lib/home/trending-comments"
import { getTrendingPlayers } from "@/lib/home/trending-players"
import { getYourTeamToday } from "@/lib/home/your-team-today"
import { getServerAuth } from "@/lib/auth/server-session"
import { createClient } from "@/lib/supabase/server"

export default async function HomePage() {
  const supabase = await createClient()
  const auth = await getServerAuth(supabase)

  const [strip, leagueMatches, trendingPlayers, trendingComments, yourTeamToday, featuredCompetitions] =
    await Promise.all([
      getCompetitionStrip(),
      getHomeLeagueMatches(),
      getTrendingPlayers(),
      getTrendingComments(),
      getYourTeamToday(auth?.userId ?? null),
      getFeaturedCompetitionCards(),
    ])

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <CompetitionStrip strip={strip} />

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(280px,22rem)] lg:items-start">
        <div className="order-2 min-w-0 space-y-8 lg:order-none">
          <YourTeamToday items={yourTeamToday} />
          <TrendingPlayers players={trendingPlayers} />
          <TrendingComments
            comments={trendingComments}
            currentUserId={auth?.userId ?? null}
          />
          <CareerShuffleStrip isLoggedIn={!!auth} />
          <FeaturedCompetitions cards={featuredCompetitions} />
          <TeamOfTheWeekComingSoon />
        </div>

        <div className="order-1 lg:order-none">
          <HomeLeagueSidebar leagues={leagueMatches} />
        </div>
      </div>
    </div>
  )
}
