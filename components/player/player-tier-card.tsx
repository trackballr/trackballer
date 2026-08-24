import Link from "next/link"

import {
  PROVISIONAL_CAREER_COPY,
  careerRingCssVar,
  careerRingTier,
  careerTierLabel,
  formatCareerScore,
} from "@/lib/rating/career-tier"
import type { PlayerCareerAggregate } from "@/lib/player/types"
import { cn } from "@/lib/utils"

type PlayerTierCardProps = {
  career: PlayerCareerAggregate
  className?: string
}

export function PlayerTierCard({ career, className }: PlayerTierCardProps) {
  const ringTier = careerRingTier(career.tier, career.displayScore)
  const ringVar = careerRingCssVar(career.tier, career.displayScore)
  const label = careerTierLabel(ringTier)

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card px-4 py-3 shadow-sm",
        className,
      )}
      style={{ ["--tier-accent" as string]: `var(${ringVar})` }}
    >
      <div className="flex items-baseline gap-2">
        <span className="font-mono text-4xl font-bold tabular-nums text-foreground">
          {formatCareerScore(career.displayScore)}
        </span>
        <span className="text-sm font-semibold text-[var(--tier-accent)]">{label}</span>
      </div>
      {career.isProvisional && (
        <p className="mt-1 text-xs leading-snug text-muted-foreground">
          {PROVISIONAL_CAREER_COPY}{" "}
          <Link href="/how-ratings-work" className="text-primary hover:underline">
            How ratings work
          </Link>
        </p>
      )}
    </div>
  )
}
