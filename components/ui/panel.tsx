import Link from "next/link"
import type * as React from "react"

import { cn } from "@/lib/utils"

/**
 * FotMob-style surface: the title sits inside the card, rows are split by
 * inset hairlines, and an optional centred footer link closes it off.
 */
export function Panel({ className, ...props }: React.ComponentProps<"section">) {
  return (
    <section
      data-slot="panel"
      className={cn(
        "overflow-hidden rounded-lg border border-border bg-card text-card-foreground",
        className,
      )}
      {...props}
    />
  )
}

type PanelHeaderProps = {
  title: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
  className?: string
}

export function PanelHeader({ title, description, action, className }: PanelHeaderProps) {
  return (
    <div className={cn("flex items-start justify-between gap-3 px-5 pt-5 pb-2", className)}>
      <div className="min-w-0">
        <h2 className="text-base font-semibold leading-tight">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  )
}

/** Rows with hairlines inset from the card edge. */
export function PanelList({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("mx-5 divide-y divide-border", className)} {...props} />
}

export function PanelBody({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("px-5 pb-5", className)} {...props} />
}

export function PanelFooterLink({
  href,
  children,
  className,
}: {
  href: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <Link
      href={href}
      className={cn(
        "block border-t border-border py-3.5 text-center text-sm font-semibold transition-colors hover:bg-muted/50",
        className,
      )}
    >
      {children}
    </Link>
  )
}

export function PanelEmpty({ children }: { children: React.ReactNode }) {
  return <p className="px-5 pt-2 pb-6 text-sm text-muted-foreground">{children}</p>
}
