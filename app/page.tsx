import { CareerShuffleStrip } from "@/components/home/career-shuffle-strip"
import { CompetitionStrip } from "@/components/home/competition-strip"
import { FeaturedCompetitions } from "@/components/home/featured-competitions"
import { HomeLeagueSidebar } from "@/components/home/home-league-sidebar"
import { TrendingCommentTicker } from "@/components/home/trending-comment-ticker"
import { TrendingComments } from "@/components/home/trending-comments"
import { TrendingPlayers } from "@/components/home/trending-players"
import { YourTeamToday } from "@/components/home/your-team-today"
import { TeamOfTheWeekComingSoon } from "@/components/league/team-of-the-week-coming-soon"
import { getFeaturedCompetitionCards } from "@/lib/catalog/competition-hub-cards"
import { getHomeLeagueMatches } from "@/lib/home/league-matches"
import { getCompetitionStrip } from "@/lib/home/leagues"
import { getTrendingComments } from "@/lib/home/trending-comments"
import { getTrendingPlayers } from "@/lib/home/trending-players"
import { getShuffleClubs, getShuffleLeagueLogos } from "@/lib/home/shuffle-clubs"
import { getYourTeamToday } from "@/lib/home/your-team-today"
import { getServerAuth } from "@/lib/auth/server-session"
import { createClient } from "@/lib/supabase/server"

export default async function HomePage() {
  const supabase = await createClient()
  const auth = await getServerAuth(supabase)

  const [
    strip,
    leagueMatches,
    trendingPlayers,
    trendingComments,
    yourTeamToday,
    featuredCompetitions,
    shuffleClubs,
    shuffleLeagueLogos,
  ] = await Promise.all([
    getCompetitionStrip(),
    getHomeLeagueMatches(),
    getTrendingPlayers(),
    getTrendingComments(),
    getYourTeamToday(auth?.userId ?? null),
    getFeaturedCompetitionCards(),
    getShuffleClubs(),
    getShuffleLeagueLogos(),
  ])

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Desktop: trending players fill the space beside the competition crests. */}
      <div className="lg:flex lg:items-start lg:gap-8">
        <div className="min-w-0 lg:shrink-0">
          <CompetitionStrip strip={strip} />
        </div>
        <div className="hidden min-w-0 flex-1 border-l border-border pl-8 empty:hidden lg:block">
          <TrendingPlayers players={trendingPlayers} variant="strip" />
        </div>
      </div>

      {/*
        Phones and tablets: one column in a deliberate order — trending take,
        trending players, shuffle, then one league of matches at a time. The main
        column uses display:contents below lg so its sections can interleave with
        the matches block. Desktop keeps the two-column layout.
      */}
      <div className="mt-8 flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(280px,22rem)] lg:items-start lg:gap-8">
        <div className="contents lg:block lg:min-w-0 lg:space-y-8">
          <div className="order-1 empty:hidden lg:order-none">
            <YourTeamToday items={yourTeamToday} />
          </div>
          <div className="order-2 empty:hidden lg:hidden">
            <TrendingCommentTicker
              comments={trendingComments}
              currentUserId={auth?.userId ?? null}
            />
          </div>
          <div className="order-3 lg:hidden">
            <TrendingPlayers players={trendingPlayers} />
          </div>
          {/* Desktop keeps the full list here; smaller screens get the ticker above. */}
          <div className="hidden lg:block">
            <TrendingComments
              comments={trendingComments}
              currentUserId={auth?.userId ?? null}
            />
          </div>
          <div className="order-4 lg:order-none">
            <CareerShuffleStrip
              isLoggedIn={!!auth}
              clubs={shuffleClubs}
              leagueLogos={shuffleLeagueLogos}
            />
          </div>
          <div className="order-6 lg:order-none">
            <FeaturedCompetitions cards={featuredCompetitions} />
          </div>
          <div className="order-7 lg:order-none">
            <TeamOfTheWeekComingSoon />
          </div>
        </div>

        <div className="order-5 min-w-0 lg:order-none">
          <HomeLeagueSidebar leagues={leagueMatches} />
        </div>
      </div>
    </div>
  )
}
