"use client"

import { RatingPanel } from "@/components/rating/rating-panel"
import { useRatingPanel } from "@/components/rating/use-rating-panel"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import type { TeamSummary } from "@/lib/catalog/types"
import type { MatchLineupPlayer } from "@/lib/match/types"

type RatingDialogProps = {
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

function teamForPlayer(
  player: MatchLineupPlayer,
  homeTeam: TeamSummary,
  awayTeam: TeamSummary,
): TeamSummary {
  return player.side === "home" ? homeTeam : awayTeam
}

export function RatingDialog({
  open,
  players,
  activeIndex,
  matchContext,
  homeTeam,
  awayTeam,
  onClose,
  onIndexChange,
  onSubmit,
  isSubmitting = false,
  hasNextPlayer = false,
}: RatingDialogProps) {
  const { player, value, setValue, canGoPrev, canGoNext } = useRatingPanel({
    open,
    players,
    activeIndex,
    onClose,
    onIndexChange,
  })

  if (!player) return null

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-w-md sm:max-w-md" showCloseButton={false}>
        <DialogTitle className="sr-only">Rate {player.name}</DialogTitle>
        <DialogDescription className="sr-only">{matchContext}</DialogDescription>
        <RatingPanel
          player={player}
          activeIndex={activeIndex}
          totalPlayers={players.length}
          matchContext={matchContext}
          team={teamForPlayer(player, homeTeam, awayTeam)}
          value={value}
          onValueChange={setValue}
          canGoPrev={canGoPrev}
          canGoNext={canGoNext}
          onPrev={() => onIndexChange(activeIndex - 1)}
          onNext={() => onIndexChange(activeIndex + 1)}
          onClose={onClose}
          onSubmit={onSubmit}
          isSubmitting={isSubmitting}
          hasNextPlayer={hasNextPlayer}
          titleId="rating-dialog-title"
        />
      </DialogContent>
    </Dialog>
  )
}
