import { CatalogImage } from "@/components/catalog-image"
import type { TeamSummary } from "@/lib/catalog/types"
import { cn } from "@/lib/utils"

type TeamFlagProps = {
  team: Pick<TeamSummary, "name" | "logo_url" | "code">
  size?: "sm" | "md"
  /** Circle for lineups; crest matches standings / fixture tables. */
  variant?: "circle" | "crest"
  className?: string
}

const sizePx = { sm: 20, md: 24 } as const

const sizeClass = { sm: "size-5 text-[8px]", md: "size-6 text-[9px]" } as const

export function TeamFlag({
  team,
  size = "md",
  variant = "circle",
  className,
}: TeamFlagProps) {
  const px = sizePx[size]
  const fallback = team.code?.slice(0, 3).toUpperCase() ?? team.name.slice(0, 2).toUpperCase()
  const isCrest = variant === "crest"

  if (team.logo_url) {
    return (
      <CatalogImage
        src={team.logo_url}
        alt=""
        width={px}
        height={px}
        className={cn(
          "shrink-0 bg-transparent",
          isCrest ? "rounded-sm object-contain" : "rounded-full object-cover",
          sizeClass[size],
          className,
        )}
      />
    )
  }

  return (
    <span
      aria-hidden
      className={cn(
        "flex shrink-0 items-center justify-center border border-border/60 bg-muted font-mono font-semibold uppercase text-muted-foreground",
        isCrest ? "rounded-sm" : "rounded-full",
        sizeClass[size],
        className,
      )}
    >
      {fallback}
    </span>
  )
}
