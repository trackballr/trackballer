import { AdminShell } from "@/components/admin/admin-shell"
import { TotwCompetitionGrid } from "@/components/admin/totw-competition-grid"
import { getTotwCompetitionCards } from "@/lib/admin/totw-competitions"

export default async function AdminTeamOfTheWeekPage() {
  const cards = await getTotwCompetitionCards()

  return (
    <AdminShell wide>
      <TotwCompetitionGrid cards={cards} />
    </AdminShell>
  )
}
