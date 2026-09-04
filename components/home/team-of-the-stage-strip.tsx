import Link from "next/link"

import { FormationPitch } from "@/components/formation/formation-pitch"
import type { TeamOfTheStageView } from "@/lib/home/team-of-the-stage"

type TeamOfTheStageStripProps = {
  team: TeamOfTheStageView | null
  showWorldCupLink?: boolean
  competitionHref?: string | null
  sectionId?: string
}

export function TeamOfTheStageStrip({
  team,
  showWorldCupLink = true,
  competitionHref = null,
  sectionId,
}: TeamOfTheStageStripProps) {
  if (!team) return null

  const displayAssignments = Object.fromEntries(
    Object.entries(team.assignments).map(([slot, player]) => [
      slot,
      {
        playerId: player.playerId,
        displayName: player.displayName,
        catalogName: player.catalogName,
        photoUrl: player.photoUrl,
      },
    ]),
  )

  const hubLink = competitionHref ?? (showWorldCupLink ? "/world-cup#totw" : null)
  const hubLabel = competitionHref ? "League hub" : "World Cup hub"

  return (
    <section id={sectionId} className="scroll-mt-8 pt-6 sm:pt-8">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <div>
          <h2 className="h3">The Star Performers</h2>
          <p className="text-xs text-muted-foreground">{team.title}</p>
        </div>
        {hubLink ? (
          <Link
            href={hubLink}
            className="text-xs font-medium text-primary hover:underline"
          >
            {hubLabel}
          </Link>
        ) : null}
      </div>

      <FormationPitch formation={team.formation} assignments={displayAssignments} mode="display" />
    </section>
  )
}
