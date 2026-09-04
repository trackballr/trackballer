import Link from "next/link"
import { MessageSquare, Pin, Settings2, Users } from "lucide-react"

const tiles = [
  {
    href: "/admin/trending",
    title: "Trending players",
    description: "Pin and order players on the home page.",
    icon: Pin,
  },
  {
    href: "/admin/team-of-the-stage",
    title: "Team of the Week",
    description: "Pick a competition, then a matchday XI.",
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
    description: "Correct player names and photos after sync errors.",
    icon: Settings2,
  },
] as const

export function AdminHub() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {tiles.map((tile) => {
        const Icon = tile.icon
        return (
          <Link
            key={tile.href}
            href={tile.href}
            className="flex flex-col gap-2 rounded-lg border border-border bg-card p-5 transition-colors hover:bg-muted/40"
          >
            <Icon className="size-5 text-primary" aria-hidden />
            <span className="font-semibold">{tile.title}</span>
            <span className="text-sm text-muted-foreground">{tile.description}</span>
          </Link>
        )
      })}
    </div>
  )
}
