export type LeagueHubTheme = {
  /** Solid brand fill (oklch). UCL still uses this under the prism overlay. */
  brand: string
  foreground: string
  /** Extra background layers after the white-to-brand fade. */
  overlay?: string
  /** White patch behind the crest. Off when the league logo is already light. */
  whiteFade?: boolean
}

const WHITE_FADE = "linear-gradient(90deg, #fff 0%, #fff 7rem, transparent 18rem)"

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
    whiteFade: false,
  },
  "champions-league": {
    brand: "oklch(0.42 0.21 255)",
    foreground: "oklch(0.99 0 0)",
    whiteFade: false,
    overlay:
      "linear-gradient(115deg, oklch(0.62 0.28 330 / 0.55) 0%, transparent 28%, oklch(0.72 0.16 200 / 0.45) 42%, transparent 55%, oklch(0.55 0.24 300 / 0.4) 68%, oklch(0.85 0.18 95 / 0.35) 82%, oklch(0.62 0.24 25 / 0.4) 100%)",
  },
}

const FALLBACK: LeagueHubTheme = {
  brand: "oklch(0.26 0.09 268)",
  foreground: "oklch(0.99 0 0)",
}

export function getLeagueHubTheme(slug: string): LeagueHubTheme {
  return THEMES[slug] ?? FALLBACK
}

export function getLeagueHubHeaderStyle(slug: string): {
  backgroundColor: string
  backgroundImage?: string
  color: string
} {
  const theme = getLeagueHubTheme(slug)
  const layers = [
    theme.whiteFade === false ? null : WHITE_FADE,
    theme.overlay ?? null,
  ].filter((layer): layer is string => layer != null)

  return {
    backgroundColor: theme.brand,
    ...(layers.length > 0 ? { backgroundImage: layers.join(", ") } : {}),
    color: theme.foreground,
  }
}
