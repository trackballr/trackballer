import { MatchRedCardIcon } from "@/components/match/match-event-badge"
import { formatRedCardLine } from "@/lib/match/match-red-cards"
import type { MatchRedCards } from "@/lib/match/types"
import { cn } from "@/lib/utils"

type MatchRedCardsRowProps = {
  redCards: MatchRedCards
  className?: string
}

function RedCardColumn({
  cards,
  align,
}: {
  cards: MatchRedCards["home"]
  align: "left" | "right"
}) {
  if (cards.length === 0) return null

  return (
    <ul
      className={cn(
        "min-w-0 space-y-0.5 leading-relaxed",
        align === "left" ? "text-left" : "text-right",
      )}
    >
      {cards.map((entry) => (
        <li key={`${entry.playerId}-${entry.minute}-${entry.extraMinute ?? 0}`}>
          {formatRedCardLine(entry)}
        </li>
      ))}
    </ul>
  )
}

export function MatchRedCardsRow({ redCards, className }: MatchRedCardsRowProps) {
  if (redCards.home.length === 0 && redCards.away.length === 0) return null

  return (
    <div
      className={cn(
        "flex items-start px-2 text-xs text-muted-foreground md:text-sm",
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 justify-end pr-3">
        <RedCardColumn cards={redCards.home} align="right" />
      </div>
      <span className="flex size-5 shrink-0 items-center justify-center pt-0.5">
        <MatchRedCardIcon className="h-3.5 w-2.5" />
      </span>
      <div className="flex min-w-0 flex-1 justify-start pl-3">
        <RedCardColumn cards={redCards.away} align="left" />
      </div>
    </div>
  )
}
