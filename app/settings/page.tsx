import Link from "next/link"
import { redirect } from "next/navigation"

import { SettingsForm } from "@/components/settings/settings-form"
import { getProfileById, getProfileTeamOptions } from "@/lib/profile/queries"
import { getServerAuth } from "@/lib/auth/server-session"
import { createClient } from "@/lib/supabase/server"

export const metadata = {
  title: "Settings | Trackballr",
}

export default async function SettingsPage() {
  const supabase = await createClient()
  const auth = await getServerAuth(supabase)

  if (!auth) {
    redirect("/login")
  }

  const [profile, teamOptions] = await Promise.all([
    getProfileById(auth.userId),
    getProfileTeamOptions(),
  ])
  if (!profile) {
    redirect("/login")
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link
        href="/profile"
        className="text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        ← Back to profile
      </Link>
      <h1 className="h-display mt-3 mb-6">Settings</h1>
      <SettingsForm profile={profile} teamOptions={teamOptions} />
    </div>
  )
}
