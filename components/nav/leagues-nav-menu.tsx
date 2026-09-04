"use client"

import { ChevronDown } from "lucide-react"
import { useRouter } from "nextjs-toploader/app"

import { CatalogImage } from "@/components/catalog-image"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

export type NavLeagueItem = {
  slug: string
  name: string
  href: string
  logoUrl: string | null
}

function LeagueLogo({ league }: { league: NavLeagueItem }) {
  return league.logoUrl ? (
    <CatalogImage
      src={league.logoUrl}
      alt=""
      width={20}
      height={20}
      className="size-5 shrink-0 object-contain"
    />
  ) : (
    <span className="flex size-5 shrink-0 items-center justify-center rounded-sm bg-muted text-[8px] font-bold text-muted-foreground">
      {league.name.slice(0, 2).toUpperCase()}
    </span>
  )
}

export function LeagueNavRow({ league }: { league: NavLeagueItem }) {
  return (
    <>
      <LeagueLogo league={league} />
      <span className="min-w-0 truncate">{league.name}</span>
    </>
  )
}

type LeaguesNavMenuProps = {
  leagues: NavLeagueItem[]
  active?: boolean
  triggerClassName?: string
}

export function LeaguesNavMenu({
  leagues,
  active = false,
  triggerClassName,
}: LeaguesNavMenuProps) {
  const router = useRouter()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className={cn(
              "relative inline-flex shrink-0 items-center gap-0.5 bg-transparent px-2 py-2 text-[13px] font-medium text-muted-foreground transition-colors outline-none hover:text-foreground",
              active &&
                "font-semibold text-foreground after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:rounded-full after:bg-primary",
              triggerClassName,
            )}
          />
        }
      >
        Leagues
        <ChevronDown className="size-3.5 opacity-70" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-56 w-56">
        {leagues.map((league) => (
          <DropdownMenuItem
            key={league.slug}
            className="gap-2.5 py-1.5"
            onClick={() => router.push(league.href)}
          >
            <LeagueNavRow league={league} />
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
