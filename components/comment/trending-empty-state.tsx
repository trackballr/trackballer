import { Flame } from "lucide-react"
import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

type TrendingEmptyStateProps = {
  title: string
  description: string
  /** What to do about it — player chips on home, take prompts on a match. */
  children?: ReactNode
  className?: string
}

/** Shared "no trending comments yet" block: says why it is empty and offers a way to start. */
export function TrendingEmptyState({
  title,
  description,
  children,
  className,
}: TrendingEmptyStateProps) {
  return (
    <div className={cn("flex items-start gap-3.5", className)}>
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-orange-500/15">
        <Flame className="size-5 text-orange-500" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{title}</p>
        <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
        {children ? <div className="mt-3">{children}</div> : null}
      </div>
    </div>
  )
}
