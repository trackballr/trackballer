"use client"

import { RatingPanel } from "@/components/rating/rating-panel"
import { useRatingPanel } from "@/components/rating/use-rating-panel"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from "@/components/ui/drawer"
import type { TeamSummary } from "@/lib/catalog/types"
import type { MatchLineupPlayer } from "@/lib/match/types"

type RatingDrawerProps = {
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

export function RatingDrawer({
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
}: RatingDrawerProps) {
  const { player, value, setValue, canGoPrev, canGoNext } = useRatingPanel({
    open,
    players,
    activeIndex,
    onClose,
    onIndexChange,
  })

  if (!player) return null

  return (
    <Drawer open={open} onOpenChange={(next) => !next && onClose()}>
      <DrawerContent className="max-h-[85vh] px-4 pb-6">
        <DrawerTitle className="sr-only">Rate {player.name}</DrawerTitle>
        <DrawerDescription className="sr-only">{matchContext}</DrawerDescription>
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
          titleId="rating-drawer-title"
        />
      </DrawerContent>
    </Drawer>
  )
}
