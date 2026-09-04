import type { ReactNode } from "react"

type CompetitionHubShellProps = {
  eyebrow: string
  children: ReactNode
  footer?: ReactNode
}

/** Shared full-width shell for World Cup and domestic league hub pages. */
export function CompetitionHubShell({
  eyebrow,
  children,
  footer,
}: CompetitionHubShellProps) {
  return (
    <div className="w-full py-8">
      <p className="eyebrow mb-3 px-4 lg:ml-[5%] lg:px-0">{eyebrow}</p>
      <div className="px-4 lg:ml-[5%] lg:px-0 lg:pr-[5%]">
        {children}
        {footer}
      </div>
    </div>
  )
}
