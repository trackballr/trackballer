"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { NavSearch } from "@/components/search/nav-search"
import { topNavLinks } from "@/components/top-nav-links"
import { TopNavMobileMenu } from "@/components/top-nav-mobile-menu"
import { cn } from "@/lib/utils"

type TopNavChromeProps = {
  showAdminLink?: boolean
}

/** Client: brand, tabs, search (desktop), and mobile menu. */
export function TopNavChrome({ showAdminLink = false }: TopNavChromeProps) {
  const pathname = usePathname()
  const adminActive = pathname === "/admin" || pathname.startsWith("/admin/")

  return (
    <>
      <Link href="/" className="flex shrink-0 items-center gap-0" aria-label="Trackballr home">
        <Image
          src="/logo.png"
          alt="Trackballr"
          width={28}
          height={28}
          className="size-7 shrink-0 object-contain"
          priority
        />
        <span className="font-display text-[19px] font-bold tracking-tight">Trackballr</span>
      </Link>

      <nav
        className="ml-2 hidden min-w-0 flex-1 gap-0.5 overflow-x-auto md:flex"
        aria-label="Main"
      >
        {topNavLinks.map((tab) => {
          const active = tab.match(pathname)
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "relative shrink-0 px-2 py-2 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground",
                active &&
                  "font-semibold text-foreground after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:rounded-full after:bg-primary",
              )}
            >
              {tab.label}
            </Link>
          )
        })}
      </nav>

      {showAdminLink ? (
        <Link
          href="/admin"
          className={cn(
            "relative hidden shrink-0 px-2 py-2 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground md:block",
            adminActive &&
              "font-semibold text-foreground after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:rounded-full after:bg-primary",
          )}
        >
          Admin
        </Link>
      ) : null}

      <div className="hidden min-w-0 max-w-[280px] flex-1 md:block">
        <NavSearch variant="header" />
      </div>

      <TopNavMobileMenu showAdminLink={showAdminLink} className="ml-auto md:hidden" />
    </>
  )
}
