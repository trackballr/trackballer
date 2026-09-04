"use client"

import { Menu } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"

import { LeagueNavRow, type NavLeagueItem } from "@/components/nav/leagues-nav-menu"
import { NavSearch } from "@/components/search/nav-search"
import { topNavLinks } from "@/components/top-nav-links"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

type TopNavMobileMenuProps = {
  showAdminLink?: boolean
  leagues: NavLeagueItem[]
  className?: string
}

export function TopNavMobileMenu({
  showAdminLink = false,
  leagues,
  className,
}: TopNavMobileMenuProps) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const adminActive = pathname === "/admin" || pathname.startsWith("/admin/")

  function closeMenu() {
    setOpen(false)
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className={cn("shrink-0 text-muted-foreground", className)}
          />
        }
      >
        <Menu className="size-5" strokeWidth={2} />
        <span className="sr-only">Open menu</span>
      </SheetTrigger>
      <SheetContent side="right" className="w-[min(100%,18rem)] gap-0 p-0">
        <SheetTitle className="sr-only">Menu</SheetTitle>
        <SheetDescription className="sr-only">
          Search players and browse main sections
        </SheetDescription>

        <div className="border-b border-border px-4 py-4">
          <p className="mb-3 text-sm font-semibold text-foreground">Search players</p>
          <NavSearch variant="menu" onResultSelect={closeMenu} />
        </div>

        <div className="px-2 py-3">
          <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Browse
          </p>
          <nav className="flex flex-col gap-0.5" aria-label="Main">
            {topNavLinks
              .filter((tab) => tab.label !== "Leagues")
              .map((tab) => {
                const active = tab.match(pathname)
                return (
                  <Link
                    key={tab.href}
                    href={tab.href}
                    onClick={closeMenu}
                    className={cn(
                      "rounded-lg px-3 py-2.5 text-[15px] font-medium text-foreground transition-colors hover:bg-muted",
                      active && "bg-muted font-semibold",
                    )}
                  >
                    {tab.label}
                  </Link>
                )
              })}
            {showAdminLink ? (
              <Link
                href="/admin"
                onClick={closeMenu}
                className={cn(
                  "rounded-lg px-3 py-2.5 text-[15px] font-medium text-foreground transition-colors hover:bg-muted",
                  adminActive && "bg-muted font-semibold",
                )}
              >
                Admin
              </Link>
            ) : null}
          </nav>

          <p className="px-3 pt-4 pb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Leagues
          </p>
          <nav className="flex flex-col gap-0.5" aria-label="Leagues">
            {leagues.map((league) => {
              const active = pathname === league.href
              return (
                <Link
                  key={league.slug}
                  href={league.href}
                  onClick={closeMenu}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[15px] font-medium text-foreground transition-colors hover:bg-muted",
                    active && "bg-muted font-semibold",
                  )}
                >
                  <LeagueNavRow league={league} />
                </Link>
              )
            })}
          </nav>
        </div>
      </SheetContent>
    </Sheet>
  )
}
