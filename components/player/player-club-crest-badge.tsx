import { TeamFlag } from "@/components/team-flag"

type PlayerClubCrestBadgeProps = {
  team: {
    name: string
    logo_url: string | null
    code: string | null
  }
  /** xs sits on the short browse and trending rows. */
  size?: "sm" | "xs"
}

export function PlayerClubCrestBadge({ team, size = "sm" }: PlayerClubCrestBadgeProps) {
  const tiny = size === "xs"

  return (
    <span
      className={
        tiny
          ? "absolute -right-1 -bottom-0.5 rounded-sm border border-background bg-background p-px"
          : "absolute -right-0.5 -bottom-0.5 rounded-sm border border-background bg-background p-0.5"
      }
    >
      <TeamFlag
        team={team}
        size="sm"
        variant="crest"
        className={tiny ? "size-2.5" : undefined}
      />
    </span>
  )
}
