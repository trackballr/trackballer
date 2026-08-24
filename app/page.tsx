import { CareerShuffleStrip } from "@/components/home/career-shuffle-strip"
import { CompetitionStrip } from "@/components/home/competition-strip"
import { HomeLeagueMatches } from "@/components/home/home-league-matches"
import { TrendingComments } from "@/components/home/trending-comments"
import { TrendingPlayers } from "@/components/home/trending-players"
import { YourTeamToday } from "@/components/home/your-team-today"
import { TeamOfTheWeekComingSoon } from "@/components/league/team-of-the-week-coming-soon"
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

  const [strip, leagueMatches, trendingPlayers, trendingComments, yourTeamToday] =
    await Promise.all([
      getCompetitionStrip(),
      getHomeLeagueMatches(),
      getTrendingPlayers(),
      getTrendingComments(),
      getYourTeamToday(auth?.userId ?? null),
    ])

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <CompetitionStrip strip={strip} />

      <div className="mt-8 space-y-8">
        <YourTeamToday items={yourTeamToday} />
        <HomeLeagueMatches leagues={leagueMatches} />
        <TrendingPlayers players={trendingPlayers} />
        <TrendingComments
          comments={trendingComments}
          currentUserId={auth?.userId ?? null}
        />
        <CareerShuffleStrip isLoggedIn={!!auth} />
        <TeamOfTheWeekComingSoon />
      </div>
    </div>
  )
}
