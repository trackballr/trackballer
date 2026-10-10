import { AdminShell } from "@/components/admin/admin-shell"
import { TrendingPinEditor } from "@/components/admin/trending-pin-editor"
import { listTrendingPins } from "@/lib/admin/trending-pins"

export default async function AdminTrendingPage() {
  const pins = await listTrendingPins()

  return (
    <AdminShell
      title="Trending players"
      description="These players show on the home page in this order, with their rank number."
    >
      <TrendingPinEditor initialPins={pins} />
    </AdminShell>
  )
}
