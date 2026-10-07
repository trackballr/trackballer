import type { AvatarSource } from "@/lib/profile/display-avatar"

export type ProfileTeam = {
  id: number
  name: string
  logoUrl: string | null
  code: string | null
}

export type ProfileView = {
  id: string
  username: string | null
  displayName: string
  avatarUrl: string | null
  googleAvatarUrl: string | null
  xAvatarUrl: string | null
  avatarSource: AvatarSource | null
  countryCode: string | null
  memberSince: string
  favouriteClub: ProfileTeam | null
  favouriteNationalTeam: ProfileTeam | null
  twitterHandle: string | null
  twitterVerifiedAt: string | null
  instagramHandle: string | null
}

export type ProfileStats = {
  ratingsGiven: number
  commentsCount: number
  upvotesReceived: number
}

export type RatingKind = "match" | "career"

export type RecentRatingItem = {
  kind: RatingKind
  /** Row id in match_ratings or career_ratings — unique together with kind. */
  id: number
  playerId: number
  playerName: string
  photoUrl: string | null
  value: number
  ratedAt: string
  /** Set for match ratings — the team the rated player faced. */
  oppositionTeam: ProfileTeam | null
  fixtureId: number | null
}

export type RatingHistoryCursor = {
  ratedAt: string
  kind: RatingKind
  id: number
}

export type RatingHistoryPage = {
  items: RecentRatingItem[]
  nextCursor: RatingHistoryCursor | null
}

/** Thread context shared by player and match comment rows. */
type RecentCommentThread = {
  parentId: number | null
  threadRootId: number | null
  /** Author of the comment this one replies to; null for top-level comments. */
  replyTo: { username: string | null; displayName: string } | null
}

type RecentCommentTeam = {
  id: number
  name: string
  logoUrl: string | null
  code: string | null
}

export type RecentPlayerCommentItem = {
  targetType: "player"
  id: number
  body: string
  upvoteCount: number
  createdAt: string
  playerId: number
  playerName: string
  playerPhotoUrl: string | null
} & RecentCommentThread

export type RecentMatchCommentItem = {
  targetType: "match"
  id: number
  body: string
  upvoteCount: number
  createdAt: string
  fixtureId: number
  homeTeam: RecentCommentTeam
  awayTeam: RecentCommentTeam
} & RecentCommentThread

export type RecentCommentItem = RecentPlayerCommentItem | RecentMatchCommentItem

export type CommentHistoryCursor = { createdAt: string; id: number }

export type CommentHistoryPage = {
  items: RecentCommentItem[]
  nextCursor: CommentHistoryCursor | null
}

export type ProfilePageData = {
  profile: ProfileView
  stats: ProfileStats
  recentRatings: RecentRatingItem[]
  recentComments: RecentCommentItem[]
  isOwner: boolean
  viewerUserId: string | null
}
