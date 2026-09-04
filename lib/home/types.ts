export type CompetitionStripItem = {
  id: number
  name: string
  slug: string
  shortLabel: string
  href: string
  isFeatured: boolean
  logoUrl: string | null
}

export type CompetitionStrip = {
  featured: CompetitionStripItem
  others: CompetitionStripItem[]
}

export type TrendingPlayerCard = {
  id: number
  /** Catalog name from `players.name` — not firstname + lastname. */
  name: string
  photoUrl: string | null
  tier: string
  displayScore: number
  isProvisional: boolean
  clubTeam: {
    id: number
    name: string
    logo_url: string | null
    code: string | null
  } | null
}

type TrendingCommentTeam = {
  id: number
  name: string
  logo_url: string | null
}

export type TrendingCommentCard = {
  id: number
  body: string
  score: number
  upvoteCount: number
  createdAt: string
  authorUserId: string
  authorUsername: string | null
  authorDisplayName: string
  authorAvatarUrl: string | null
  authorClub: TrendingCommentTeam | null
  authorNationalTeam: TrendingCommentTeam | null
  playerId: number
  /** Catalog name from `players.name`. */
  playerName: string
  playerPhotoUrl: string | null
}

export type YourTeamTodayItem = {
  fixtureId: number
  teamName: string
  teamLogoUrl: string | null
  kickoffAt: string
  roundName: string | null
  opponentName: string
  opponentLogoUrl: string | null
  isHome: boolean
}
