import { redirect } from "next/navigation"

import { readIsAdmin } from "@/lib/auth/rpc-gates"
import { getServerAuth } from "@/lib/auth/server-session"
import { createClient } from "@/lib/supabase/server"

export type AdminSession = {
  userId: string
}

/** Returns admin session or null (no redirect). */
export async function getAdminSession(): Promise<AdminSession | null> {
  const supabase = await createClient()
  const auth = await getServerAuth(supabase)

  if (!auth) return null

  const isAdmin = await readIsAdmin(supabase)
  if (!isAdmin) return null

  return { userId: auth.userId }
}

/** Gate for server pages: guests to login, non-admins to home. */
export async function requireAdmin(): Promise<AdminSession> {
  const supabase = await createClient()
  const auth = await getServerAuth(supabase)

  if (!auth) {
    redirect("/login")
  }

  const isAdmin = await readIsAdmin(supabase)
  if (!isAdmin) {
    redirect("/")
  }

  return { userId: auth.userId }
}
