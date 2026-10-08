import { TeamFlag } from "@/components/team-flag"
import { cn } from "@/lib/utils"

type PlayerClubCrestBadgeProps = {
  team: {
    name: string
    logo_url: string | null
    code: string | null
  }
  /** xs sits on the short browse and trending rows. */
  size?: "sm" | "xs"
  /** Top keeps the crest clear of a score badge under a small ring. */
  corner?: "bottom" | "top"
}

export function PlayerClubCrestBadge({
  team,
  size = "sm",
  corner = "bottom",
}: PlayerClubCrestBadgeProps) {
  const tiny = size === "xs"

  return (
    <span
      className={cn(
        "absolute rounded-sm border border-background bg-background",
        tiny ? "-right-1 p-px" : "-right-0.5 p-0.5",
        corner === "top" ? "-top-0.5" : "-bottom-0.5",
      )}
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
