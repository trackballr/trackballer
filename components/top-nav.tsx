import { TopNavAuth } from "@/components/top-nav-auth"
import { TopNavChrome } from "@/components/top-nav-chrome"
import { TopNavMobileTabs } from "@/components/top-nav-mobile-tabs"
import { getServerAuth } from "@/lib/auth/server-session"
import { getFeaturedCompetitionCards } from "@/lib/catalog/competition-hub-cards"
import { createClient } from "@/lib/supabase/server"

export async function TopNav() {
  const supabase = await createClient()
  const [auth, leagues] = await Promise.all([
    getServerAuth(supabase),
    getFeaturedCompetitionCards(),
  ])

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/90 backdrop-blur-md">
      <div className="flex h-14 items-center gap-1.5 px-3 sm:gap-2 sm:px-4">
        <TopNavChrome showAdminLink={auth?.isAdmin ?? false} leagues={leagues} />
        <TopNavAuth userId={auth?.userId ?? null} />
      </div>
      <TopNavMobileTabs showAdminLink={auth?.isAdmin ?? false} leagues={leagues} />
    </header>
  )
}
