import { ArrowLeft } from "lucide-react"

import { CatalogImage } from "@/components/catalog-image"
import { formatMatchAggregate } from "@/lib/rating/engine"
import { matchRatingTierChipClass } from "@/lib/rating/match-rating-tier"
import { cn } from "@/lib/utils"

/**
 * Small Sofascore-style markers that sit around a player's face on the pitch:
 * rating (top-right), subbed-off minute (top-left), card (left), assist
 * (bottom-left) and goals (bottom-right).
 */

const markerShell =
  "flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-white shadow-[0_1px_2px_rgb(0_0_0/0.25)] dark:bg-zinc-900"

export function PitchRatingMarker({ value }: { value: number | null }) {
  if (value == null) return null

  return (
    <span
      className={cn(
        "inline-flex min-w-[1.625rem] items-center justify-center rounded-[5px] px-1 py-px text-[10px] font-bold leading-[1.2] tabular-nums shadow-[0_1px_2px_rgb(0_0_0/0.2)]",
        matchRatingTierChipClass(value),
        "border-0",
      )}
    >
      {formatMatchAggregate(value)}
    </span>
  )
}

export function PitchSubOffMarker({ minute }: { minute: number | null }) {
  if (minute == null) return null

  return (
    <span className="relative flex flex-col items-center" aria-label={`Subbed off ${minute}'`}>
      <span className="absolute bottom-full mb-px text-[9px] font-semibold leading-none tabular-nums text-foreground/80">
        {minute}&apos;
      </span>
      <span className={cn(markerShell, "text-red-500")}>
        <ArrowLeft className="size-2.5" strokeWidth={3} />
      </span>
    </span>
  )
}

export function PitchIconMarker({
  iconSrc,
  label,
  count,
}: {
  iconSrc: string
  label: string
  count: number
}) {
  if (count < 1) return null

  return (
    <span
      className={cn(markerShell, count >= 2 && "gap-px pr-1 pl-0.5")}
      aria-label={`${count} ${label}${count === 1 ? "" : "s"}`}
    >
      <CatalogImage
        src={iconSrc}
        alt=""
        width={10}
        height={10}
        className="size-2.5 object-contain dark:invert"
      />
      {count >= 2 && (
        <span className="text-[8px] font-bold leading-none tabular-nums text-foreground">
          {count}
        </span>
      )}
    </span>
  )
}

export function PitchCardMarker({
  yellow,
  red,
}: {
  yellow: number
  red: number
}) {
  if (red < 1 && yellow < 1) return null

  const isRed = red > 0
  return (
    <span className={markerShell} aria-label={isRed ? "Red card" : "Yellow card"}>
      <span
        className={cn("h-2.5 w-[7px] rounded-[1.5px]", isRed ? "bg-red-600" : "bg-yellow-400")}
      />
    </span>
  )
}
