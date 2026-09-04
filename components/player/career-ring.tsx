import { PlayerAvatar } from "@/components/player-avatar"
import { careerRingCssVar, formatCareerScore } from "@/lib/rating/career-tier"
import { cn } from "@/lib/utils"

type CareerRingSize = "default" | "compact" | "mini"

type CareerRingProps = {
  name: string
  photoUrl: string | null
  tier: string
  displayScore: number
  className?: string
  /** Compact size for horizontal profile header. */
  compact?: boolean
  /** Mini size for search dropdown rows (~⅓ of compact). */
  size?: CareerRingSize
}

const ringSizeClass: Record<CareerRingSize, string> = {
  default: "size-[7.5rem]",
  compact: "size-[4.5rem]",
  mini: "size-6",
}

const ringBorderClass: Record<CareerRingSize, string> = {
  default: "border-[5px]",
  compact: "border-[3px]",
  mini: "border",
}

const avatarSize: Record<CareerRingSize, "sm" | "lg" | "xl"> = {
  default: "xl",
  compact: "lg",
  mini: "sm",
}

const scoreBadgeClass: Record<CareerRingSize, string> = {
  default: "min-w-[1.75rem] px-1.5 py-0.5 text-xs",
  compact: "min-w-[1.35rem] px-1 py-0.5 text-[10px]",
  mini: "min-w-[1rem] px-0.5 py-px text-[8px]",
}

export function CareerRing({
  name,
  photoUrl,
  tier,
  displayScore,
  className,
  compact = false,
  size,
}: CareerRingProps) {
  const ringSize: CareerRingSize = size ?? (compact ? "compact" : "default")
  const ringVar = careerRingCssVar(tier, displayScore)
  const scoreLabel = formatCareerScore(displayScore)

  return (
    <div className={cn("inline-flex flex-col items-center", className)}>
      <div
        className={cn(
          "relative isolate flex items-center justify-center",
          ringSizeClass[ringSize],
        )}
        style={{ ["--career-ring-color" as string]: `var(${ringVar})` }}
      >
        <span
          aria-hidden
          className={cn(
            "absolute inset-0 rounded-full border-[var(--career-ring-color)]",
            ringBorderClass[ringSize],
          )}
        />
        <PlayerAvatar
          name={name}
          photoUrl={photoUrl}
          size={avatarSize[ringSize]}
          className={cn(
            "relative rounded-full object-cover",
            ringSize === "default"
              ? "border-2 border-background shadow-sm"
              : ringSize === "compact"
                ? "size-[calc(100%-6px)] border-0 shadow-none"
                : "size-[calc(100%-4px)] border-0 shadow-none",
          )}
        />
        <span
          className={cn(
            "absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 rounded-sm font-mono font-bold leading-none tabular-nums text-white shadow-sm",
            scoreBadgeClass[ringSize],
          )}
          style={{ backgroundColor: `var(${ringVar})` }}
          aria-label={`Career rating ${scoreLabel}`}
        >
          {scoreLabel}
        </span>
      </div>
    </div>
  )
}
