import Link from "next/link"

import type { TeamSummary } from "@/lib/catalog/types"
import { cn } from "@/lib/utils"

type NationalTeamNameLinkProps = {
  team: Pick<TeamSummary, "id" | "name" | "is_national">
  className?: string
}

export function NationalTeamNameLink({ team, className }: NationalTeamNameLinkProps) {
  if (team.is_national) {
    return (
      <Link href={`/country/${team.id}`} className={cn("truncate hover:underline", className)}>
        {team.name}
      </Link>
    )
  }

  return <span className={cn("truncate", className)}>{team.name}</span>
}
