import { TeamFlag } from "@/components/team-flag"

type PlayerClubCrestBadgeProps = {
  team: {
    name: string
    logo_url: string | null
    code: string | null
  }
}

export function PlayerClubCrestBadge({ team }: PlayerClubCrestBadgeProps) {
  return (
    <span className="absolute -bottom-0.5 -right-0.5 rounded-sm border border-background bg-background p-0.5">
      <TeamFlag team={team} size="sm" variant="crest" />
    </span>
  )
}
