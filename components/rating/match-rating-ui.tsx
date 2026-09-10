"use client"

import { RatingDialog } from "@/components/rating/rating-dialog"
import { RatingDrawer } from "@/components/rating/rating-drawer"
import { useIsMobile } from "@/hooks/use-media-query"
import type { TeamSummary } from "@/lib/catalog/types"
import type { MatchLineupPlayer } from "@/lib/match/types"

export type MatchRatingUIProps = {
  open: boolean
  players: MatchLineupPlayer[]
  activeIndex: number
  matchContext: string
  homeTeam: TeamSummary
  awayTeam: TeamSummary
  onClose: () => void
  onIndexChange: (index: number) => void
  onSubmit: (value: number) => void
  isSubmitting?: boolean
  hasNextPlayer?: boolean
}

/** Mobile drawer or desktop dialog — one shell mounted at a time. */
export function MatchRatingUI(props: MatchRatingUIProps) {
  const isMobile = useIsMobile()

  if (props.players.length === 0) return null

  const open = props.open && props.players[props.activeIndex] != null
  const shellProps = { ...props, open }

  return isMobile ? <RatingDrawer {...shellProps} /> : <RatingDialog {...shellProps} />
}
