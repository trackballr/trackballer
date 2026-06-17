import { CatalogImage } from "@/components/catalog-image"
import { cn } from "@/lib/utils"

type MatchEventBadgeProps = {
  iconSrc: string
  label: string
  count: number
  side: "left" | "right"
  /** Pitch corners: icon stays put; 2+ count grows away from the face. */
  layout?: "default" | "corner"
  className?: string
}

function EventBadgePill({
  iconSrc,
  label,
  count,
  expandFrom,
}: {
  iconSrc: string
  label: string
  count: number
  expandFrom?: "left" | "right"
}) {
  const showCount = count >= 2

  return (
    <span
      className={cn(
        "flex items-center rounded-full border border-border bg-card shadow-sm",
        showCount ? "gap-0.5 py-0.5 pl-0.5 pr-1" : "size-5 justify-center",
        expandFrom === "left" && showCount && "flex-row-reverse pl-1 pr-0.5",
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

/** Goal or assist marker beside a player avatar (icon + count in one pill when 2+). */
export function MatchEventBadge({
  iconSrc,
  label,
  count,
  side,
  layout = "default",
  className,
}: MatchEventBadgeProps) {
  if (count < 1) return null

  const cornerPosition =
    layout === "corner"
      ? side === "right"
        ? "bottom-auto top-0.5 left-[calc(100%-6px)]"
        : "bottom-auto top-0.5 right-[calc(100%-6px)]"
      : null

  return (
    <span
      className={cn(
        "pointer-events-none absolute z-20",
        cornerPosition ??
          cn("bottom-0", side === "left" ? "-left-1" : "-right-1"),
        className,
      )}
    >
      <EventBadgePill
        iconSrc={iconSrc}
        label={label}
        count={count}
        expandFrom={layout === "corner" ? side : undefined}
      />
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

/** Red or yellow card marker on the bottom corners of a lineup puck. */
export function MatchCardBadge({
  kind,
  show,
  side,
  className,
}: {
  kind: "red" | "yellow"
  show: boolean
  side: "left" | "right"
  className?: string
}) {
  if (!show) return null

  const label = kind === "red" ? "Red card" : "Yellow card"
  const cornerPosition =
    side === "right"
      ? "top-auto bottom-0.5 left-[calc(100%-6px)]"
      : "top-auto bottom-0.5 right-[calc(100%-6px)]"

  return (
    <span className={cn("pointer-events-none absolute z-20", cornerPosition, className)}>
      <CardBadgePill kind={kind} label={label} />
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
