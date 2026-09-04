import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

type CompetitionHubShellProps = {
  banner?: ReactNode
  children: ReactNode
  footer?: ReactNode
}

/** Full-width shell for domestic league hub pages. */
export function CompetitionHubShell({
  banner,
  children,
  footer,
}: CompetitionHubShellProps) {
  return (
    <div className="w-full">
      {banner}
      <div className={cn("px-4 lg:ml-[5%] lg:px-0 lg:pr-[5%]", banner ? "py-6" : "py-8")}>
        {children}
        {footer}
      </div>
    </div>
  )
}
