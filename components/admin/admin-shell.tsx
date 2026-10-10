"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const adminTabs = [
  {
    href: "/admin",
    label: "Overview",
    match: (path: string) => path === "/admin",
  },
  {
    href: "/admin/trending",
    label: "Trending",
    match: (path: string) => path.startsWith("/admin/trending"),
  },
  {
    href: "/admin/team-of-the-stage",
    label: "Team of the Week",
    match: (path: string) => path.startsWith("/admin/team-of-the-stage"),
  },
  {
    href: "/admin/comments",
    label: "Comments",
    match: (path: string) => path.startsWith("/admin/comments"),
  },
  {
    href: "/admin/data",
    label: "Fix data",
    match: (path: string) => path.startsWith("/admin/data"),
  },
] as const

type AdminShellProps = {
  /** Page heading, shown above the content in the site's display font. */
  title: string
  description?: React.ReactNode
  /** Optional "← back" link above the title. */
  back?: { href: string; label: string }
  children: React.ReactNode
  wide?: boolean
}

export function AdminShell({ title, description, back, children, wide = false }: AdminShellProps) {
  const pathname = usePathname()

  return (
    <div className="flex min-h-svh flex-col">
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/90 backdrop-blur-md">
        <div className="flex h-14 items-center gap-2 px-3 sm:px-4">
          <Link href="/admin" className="flex shrink-0 items-center gap-0" aria-label="Admin home">
            <Image
              src="/logo.png"
              alt=""
              width={28}
              height={28}
              className="size-7 shrink-0 object-contain"
              priority
            />
            <span className="font-display text-[19px] font-bold tracking-tight">Trackballr</span>
            <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold text-primary-foreground">
              Admin
            </span>
          </Link>

          <nav
            className="ml-2 hidden min-w-0 flex-1 justify-center gap-0.5 md:flex"
            aria-label="Admin"
          >
            <AdminTabs pathname={pathname} />
          </nav>

          <Link
            href="/"
            className={buttonVariants({
              variant: "outline",
              size: "sm",
              className: "ml-auto shrink-0 bg-card md:ml-0",
            })}
          >
            Exit to site
          </Link>
        </div>

        {/* Phones: tabs on their own scrolling row, like the main site. */}
        <nav
          className="flex gap-0.5 overflow-x-auto border-t border-border/60 px-3 py-1 [scrollbar-width:none] md:hidden [&::-webkit-scrollbar]:hidden"
          aria-label="Admin"
        >
          <AdminTabs pathname={pathname} />
        </nav>
      </header>

      <main className={cn("mx-auto w-full flex-1 px-4 py-8", wide ? "max-w-6xl" : "max-w-3xl")}>
        <div className="mb-6">
          {back ? (
            <Link
              href={back.href}
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              ← {back.label}
            </Link>
          ) : null}
          <h1 className={cn("h-display", back && "mt-3")}>{title}</h1>
          {description ? (
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {children}
      </main>
    </div>
  )
}

function AdminTabs({ pathname }: { pathname: string }) {
  return (
    <>
      {adminTabs.map((tab) => {
        const active = tab.match(pathname)
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative shrink-0 px-2.5 py-2 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground",
              active &&
                "font-semibold text-foreground after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:rounded-full after:bg-primary",
            )}
          >
            {tab.label}
          </Link>
        )
      })}
    </>
  )
}
