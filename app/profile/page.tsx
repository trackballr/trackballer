import { redirect } from "next/navigation"

import { ProfilePage } from "@/components/profile/profile-page"
import {
  getProfileById,
  getProfilePageData,
} from "@/lib/profile/queries"
import { getServerAuth } from "@/lib/auth/server-session"
import { createClient } from "@/lib/supabase/server"

export const metadata = {
  title: "Your profile | Trackballr",
}

export default async function OwnProfilePage() {
  const supabase = await createClient()
  const auth = await getServerAuth(supabase)

  if (!auth) {
    redirect("/login")
  }

  const profile = await getProfileById(auth.userId)
  if (!profile) {
    redirect("/login")
  }

  const data = await getProfilePageData(profile, auth.userId, { isOwner: true })

  return <ProfilePage data={data} />
}
