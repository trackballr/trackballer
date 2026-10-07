import { notFound } from "next/navigation"

import { getServerAuth } from "@/lib/auth/server-session"
import { getProfileByUsername, getProfileStats } from "@/lib/profile/queries"
import { createClient } from "@/lib/supabase/server"

/** Profile, counts and viewer for the /u/[username] history pages. */
export async function loadProfileHistoryContext(username: string) {
  const profile = await getProfileByUsername(username)
  if (!profile?.username) notFound()

  const supabase = await createClient()
  const [auth, stats] = await Promise.all([
    getServerAuth(supabase),
    getProfileStats(profile.id),
  ])

  return {
    supabase,
    profile,
    stats,
    viewerUserId: auth?.userId ?? null,
    isOwner: auth?.userId === profile.id,
  }
}
