import { AdminHub } from "@/components/admin/admin-hub"
import { AdminShell } from "@/components/admin/admin-shell"

export default function AdminPage() {
  return (
    <AdminShell
      title="Admin"
      description="Editorial tools for the home page, Team of the Week and comments. Catalog sync runs separately through the sync routes."
    >
      <AdminHub />
    </AdminShell>
  )
}
