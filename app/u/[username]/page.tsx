import { notFound, redirect } from "next/navigation"

import { ProfilePage } from "@/components/profile/profile-page"
import {
  getProfileByUsername,
  getProfilePageData,
} from "@/lib/profile/queries"
import { getServerAuth } from "@/lib/auth/server-session"
import { createClient } from "@/lib/supabase/server"

type PageProps = {
  params: Promise<{ username: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { username } = await params
  const profile = await getProfileByUsername(username)
  return {
    title: profile
      ? `${profile.displayName} (@${profile.username}) | Trackballr`
      : "Profile | Trackballr",
  }
}

export default async function UserProfileByUsernamePage({ params }: PageProps) {
  const { username } = await params
  const profile = await getProfileByUsername(username)

  if (!profile?.username) {
    notFound()
  }

  const supabase = await createClient()
  const auth = await getServerAuth(supabase)

  if (auth?.userId === profile.id) {
    redirect("/profile")
  }

  const data = await getProfilePageData(profile, auth?.userId)

  return <ProfilePage data={data} />
}
