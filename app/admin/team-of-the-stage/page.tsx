import { AdminShell } from "@/components/admin/admin-shell"
import { TotwCompetitionGrid } from "@/components/admin/totw-competition-grid"
import { getTotwCompetitionCards } from "@/lib/admin/totw-competitions"

export default async function AdminTeamOfTheWeekPage() {
  const cards = await getTotwCompetitionCards()

  return (
    <AdminShell
      wide
      title="Team of the Week"
      description="Pick a competition, then choose a matchday XI to publish."
    >
      <TotwCompetitionGrid cards={cards} />
    </AdminShell>
  )
}
