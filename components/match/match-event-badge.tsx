import { CatalogImage } from "@/components/catalog-image"
import { cn } from "@/lib/utils"

function EventBadgePill({
  iconSrc,
  label,
  count,
}: {
  iconSrc: string
  label: string
  count: number
}) {
  const showCount = count >= 2

  return (
    <span
      className={cn(
        "flex items-center rounded-full border border-border bg-card shadow-sm",
        showCount ? "gap-0.5 py-0.5 pl-0.5 pr-1" : "size-5 justify-center",
      )}
      aria-label={`${count} ${label}${count === 1 ? "" : "s"}`}
    >
      <span className="flex size-4 shrink-0 items-center justify-center">
        <CatalogImage
          src={iconSrc}
          alt=""
          width={12}
          height={12}
          className="object-contain dark:invert"
        />
      </span>
      {showCount && (
        <span className="pr-0.5 font-mono text-[9px] font-bold leading-none tabular-nums text-foreground">
          {count}
        </span>
      )}
    </span>
  )
}

const GOAL_ICON = "/football-svgrepo-com.svg"
const ASSIST_ICON = "/american-football-black-shoe-svgrepo-com.svg"

function RedCardIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 10 14" className={cn("h-3.5 w-2.5 shrink-0", className)} aria-hidden>
      <rect x="0" y="0" width="10" height="14" rx="1" fill="#DC2626" />
    </svg>
  )
}

function YellowCardIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 10 14" className={cn("h-3.5 w-2.5 shrink-0", className)} aria-hidden>
      <rect x="0" y="0" width="10" height="14" rx="1" fill="#EAB308" />
    </svg>
  )
}

function CardBadgePill({
  kind,
  label,
}: {
  kind: "red" | "yellow"
  label: string
}) {
  return (
    <span
      className="flex size-5 items-center justify-center rounded-sm border border-border bg-card shadow-sm"
      aria-label={label}
    >
      {kind === "red" ? <RedCardIcon /> : <YellowCardIcon />}
    </span>
  )
}

export function MatchRedCardIcon({ className }: { className?: string }) {
  return <RedCardIcon className={className} />
}

/** Inline goal, assist, and cards for bench/sub rows. */
export function MatchContributionBadgesInline({
  goalCount,
  assistCount,
  yellowCardCount = 0,
  redCardCount = 0,
}: {
  goalCount: number
  assistCount: number
  yellowCardCount?: number
  redCardCount?: number
}) {
  const hasGoals = goalCount > 0
  const hasAssists = assistCount > 0
  const hasYellow = yellowCardCount > 0
  const hasRed = redCardCount > 0

  if (!hasGoals && !hasAssists && !hasYellow && !hasRed) return null

  return (
    <span className="flex shrink-0 items-center gap-1">
      {hasGoals && (
        <EventBadgePill iconSrc={GOAL_ICON} label="goal" count={goalCount} />
      )}
      {hasAssists && (
        <EventBadgePill iconSrc={ASSIST_ICON} label="assist" count={assistCount} />
      )}
      {hasYellow && (
        <CardBadgePill kind="yellow" label="Yellow card" />
      )}
      {hasRed && (
        <CardBadgePill kind="red" label="Red card" />
      )}
    </span>
  )
}
