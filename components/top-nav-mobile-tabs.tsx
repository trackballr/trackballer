"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { LeaguesNavMenu, type NavLeagueItem } from "@/components/nav/leagues-nav-menu"
import { topNavLinks } from "@/components/top-nav-links"
import { cn } from "@/lib/utils"

type TopNavMobileTabsProps = {
  showAdminLink?: boolean
  leagues: NavLeagueItem[]
}

/** Always-visible section links on phone — no hamburger needed to browse. */
export function TopNavMobileTabs({ showAdminLink = false, leagues }: TopNavMobileTabsProps) {
  const pathname = usePathname()
  const adminActive = pathname === "/admin" || pathname.startsWith("/admin/")
  const leaguesActive = pathname.startsWith("/league")

  return (
    <nav
      className="flex gap-0.5 overflow-x-auto border-t border-border/60 px-3 py-1 md:hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      aria-label="Main"
    >
      {topNavLinks
        .filter((tab) => tab.label !== "Leagues")
        .map((tab) => {
          const active = tab.match(pathname)
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "relative shrink-0 px-2.5 py-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground",
                active &&
                  "font-semibold text-foreground after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:rounded-full after:bg-primary",
              )}
            >
              {tab.label}
            </Link>
          )
        })}
      <LeaguesNavMenu
        leagues={leagues}
        active={leaguesActive}
        triggerClassName="px-2.5 py-1.5"
      />
      {showAdminLink ? (
        <Link
          href="/admin"
          className={cn(
            "relative shrink-0 px-2.5 py-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground",
            adminActive &&
              "font-semibold text-foreground after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:rounded-full after:bg-primary",
          )}
        >
          Admin
        </Link>
      ) : null}
    </nav>
  )
}
