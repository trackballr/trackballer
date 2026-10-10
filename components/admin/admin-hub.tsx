import { ChevronRight, MessageSquare, Pin, Settings2, Users } from "lucide-react"
import Link from "next/link"

import { Panel } from "@/components/ui/panel"

const tiles = [
  {
    href: "/admin/trending",
    title: "Trending players",
    description: "Pin players on the home page and drag them into order.",
    icon: Pin,
  },
  {
    href: "/admin/team-of-the-stage",
    title: "Team of the Week",
    description: "Pick a competition and matchday, then build the XI on the pitch.",
    icon: Users,
  },
  {
    href: "/admin/comments",
    title: "Comments",
    description: "Delete comments and ban abusive accounts.",
    icon: MessageSquare,
  },
  {
    href: "/admin/data",
    title: "Fix data",
    description: "Correct player names, clubs, positions and photos after sync errors.",
    icon: Settings2,
  },
] as const

export function AdminHub() {
  return (
    <Panel>
      <div className="mx-5 divide-y divide-border">
        {tiles.map((tile) => {
          const Icon = tile.icon
          return (
            <Link key={tile.href} href={tile.href} className="group flex items-center gap-4 py-4">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Icon className="size-5" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold group-hover:underline">
                  {tile.title}
                </span>
                <span className="mt-0.5 block text-sm text-muted-foreground">
                  {tile.description}
                </span>
              </span>
              <ChevronRight
                className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                aria-hidden
              />
            </Link>
          )
        })}
      </div>
    </Panel>
  )
}
