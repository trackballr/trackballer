import { CatalogImage } from "@/components/catalog-image"
import { cn } from "@/lib/utils"

type PlayerAvatarProps = {
  name: string
  photoUrl: string | null
  shirtNumber?: number | null
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
}

const sizePx = { sm: 28, md: 36, lg: 44, xl: 108 } as const

const sizeClass = {
  sm: "size-7 text-[10px]",
  md: "size-9 text-xs",
  lg: "size-11 text-sm",
  xl: "size-[6.75rem] text-lg",
} as const

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase()
}

export function PlayerAvatar({
  name,
  photoUrl,
  shirtNumber,
  size = "md",
  className,
}: PlayerAvatarProps) {
  const px = sizePx[size]
  const fallbackLabel =
    shirtNumber != null ? String(shirtNumber) : initialsFromName(name)

  if (photoUrl) {
    return (
      <CatalogImage
        src={photoUrl}
        alt=""
        width={px}
        height={px}
        className={cn(
          "shrink-0 rounded-md border border-border bg-card object-cover",
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
        "flex shrink-0 items-center justify-center rounded-md border border-border bg-card font-bold tabular-nums text-muted-foreground",
        sizeClass[size],
        className,
      )}
    >
      {fallbackLabel}
    </span>
  )
}
