import { CircleFlag } from "react-circle-flags"

import { nationalityToAlpha2 } from "@/lib/country/nationality-alpha2"
import { cn } from "@/lib/utils"

type PlayerNationalityFlagProps = {
  nationality: string | null
  size?: "sm" | "md"
  className?: string
}

const sizePx = { sm: 14, md: 18 } as const

export function PlayerNationalityFlag({
  nationality,
  size = "sm",
  className,
}: PlayerNationalityFlagProps) {
  const code = nationalityToAlpha2(nationality)
  if (!code) return null

  return (
    <CircleFlag
      countryCode={code}
      height={sizePx[size]}
      className={cn("shrink-0", className)}
    />
  )
}
