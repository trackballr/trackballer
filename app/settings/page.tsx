import { redirect } from "next/navigation"

/** Settings live on /profile beside your recent activity. */
export default function SettingsPage() {
  redirect("/profile")
}
