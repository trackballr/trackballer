import type { SupabaseClient } from "@supabase/supabase-js"

/** Read admin flag via SECURITY DEFINER RPC (no is_admin column grant needed). */
export async function readIsAdmin(supabase: SupabaseClient): Promise<boolean> {
  const { data, error } = await supabase.rpc("is_admin")
  if (error) return false
  return data === true
}

/** Read ban flag via SECURITY DEFINER RPC (no is_banned column grant needed). */
export async function readIsBanned(supabase: SupabaseClient): Promise<boolean> {
  const { data, error } = await supabase.rpc("is_banned")
  if (error) return false
  return data === true
}
