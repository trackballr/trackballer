"use client"

import { LogOut } from "lucide-react"
import { useRouter } from "nextjs-toploader/app"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"

export function ProfileSignOutButton() {
  const router = useRouter()
  const [pending, setPending] = useState(false)

  async function handleSignOut() {
    setPending(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signOut()
      if (error) {
        setPending(false)
        return
      }
      router.push("/login")
      router.refresh()
    } catch {
      setPending(false)
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleSignOut}
      disabled={pending}
      className="h-10 shrink-0 gap-2 bg-card px-4 text-destructive hover:bg-destructive/5 hover:text-destructive"
    >
      <LogOut aria-hidden />
      {pending ? "Signing out…" : "Sign out"}
    </Button>
  )
}
