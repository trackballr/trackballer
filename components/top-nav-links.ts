export type TopNavLink = {
  href: string
  label: string
  match: (path: string) => boolean
}

export const topNavLinks: TopNavLink[] = [
  { href: "/", label: "Home", match: (path) => path === "/" },
  { href: "/players", label: "Players", match: (path) => path.startsWith("/players") },
  {
    href: "/league/premier-league",
    label: "Leagues",
    match: (path) => path.startsWith("/league"),
  },
]
