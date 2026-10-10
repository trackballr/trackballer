import { AdminShell } from "@/components/admin/admin-shell"
import { CatalogFixForm } from "@/components/admin/catalog-fix-form"
import { browsePositions, getBrowseFilterOptions } from "@/lib/search/filter-options"

export default async function AdminDataPage() {
  const { clubs } = await getBrowseFilterOptions()

  return (
    <AdminShell
      title="Fix data"
      description="Correct a player's name, club, position, overall rating or photo when the sync got it wrong."
    >
      <CatalogFixForm clubOptions={clubs} positions={[...browsePositions]} />
    </AdminShell>
  )
}
