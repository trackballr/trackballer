export type LeagueHubTheme = {
  /** Solid brand fill (oklch). UCL still uses this under the prism overlay. */
  brand: string
  foreground: string
  /** Extra background layers after the white-to-brand fade. */
  overlay?: string
  /** White patch behind the crest. Off when the league logo is already light. */
  whiteFade?: boolean
}

const THEMES: Record<string, LeagueHubTheme> = {
  "premier-league": {
    brand: "oklch(0.28 0.11 305)",
    foreground: "oklch(0.99 0 0)",
  },
  "la-liga": {
    brand: "tomato",
    foreground: "oklch(0.99 0 0)",
  },
  bundesliga: {
    brand: "oklch(0.53 0.23 29)",
    foreground: "oklch(0.99 0 0)",
  },
  "serie-a": {
    brand: "oklch(0.59 0.22 255)",
    foreground: "oklch(0.99 0 0)",
  },
  "ligue-1": {
    brand: "oklch(0.18 0 0)",
    foreground: "oklch(0.99 0 0)",
  },
  "champions-league": {
    brand: "oklch(0.42 0.21 255)",
    foreground: "oklch(0.99 0 0)",
    whiteFade: false,
    overlay:
      "linear-gradient(90deg, oklch(0.76 0.11 225) 0%, oklch(0.55 0.17 250) 40%, oklch(0.38 0.18 295) 78%, oklch(0.30 0.16 312) 100%)",
  },
}

const FALLBACK: LeagueHubTheme = {
  brand: "oklch(0.26 0.09 268)",
  foreground: "oklch(0.99 0 0)",
}

export function getLeagueHubTheme(slug: string): LeagueHubTheme {
  return THEMES[slug] ?? FALLBACK
}

/** True when the banner wears the white patch — see `.league-banner-fade`. */
export function hasLeagueHubWhiteFade(slug: string): boolean {
  return getLeagueHubTheme(slug).whiteFade !== false
}

export function getLeagueHubHeaderStyle(slug: string): {
  backgroundColor: string
  backgroundImage?: string
  color: string
} {
  const theme = getLeagueHubTheme(slug)

  return {
    backgroundColor: theme.brand,
    ...(theme.overlay ? { backgroundImage: theme.overlay } : {}),
    color: theme.foreground,
  }
}
