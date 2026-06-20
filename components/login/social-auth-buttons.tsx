"use client"

import { useState } from "react"

import { oauthProviderIcons } from "@/components/login/oauth-provider-icons"
import {
  getOAuthRedirectUrl,
  oauthProviders,
  type OAuthProviderId,
} from "@/lib/auth/oauth-providers"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

type SocialAuthButtonsProps = {
  className?: string
}

export function SocialAuthButtons({ className }: SocialAuthButtonsProps) {
  const [pendingProvider, setPendingProvider] = useState<OAuthProviderId | null>(
    null,
  )
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  async function signInWith(providerId: OAuthProviderId) {
    const provider = oauthProviders.find((p) => p.id === providerId)
    if (!provider?.enabled) {
      setErrorMessage("This sign-in option is not available yet.")
      return
    }

    setErrorMessage(null)
    setPendingProvider(providerId)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: provider.supabaseProvider,
      options: {
        redirectTo: getOAuthRedirectUrl(window.location.origin),
      },
    })

    if (error) {
      setPendingProvider(null)
      setErrorMessage(error.message)
    }
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {errorMessage && (
        <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-center text-sm text-destructive">
          {errorMessage}
        </p>
      )}

      {oauthProviders
        .filter((provider) => provider.enabled)
        .map((provider) => {
        const Icon = oauthProviderIcons[provider.id]
        const isPending = pendingProvider === provider.id
        const disabled = !provider.enabled || pendingProvider !== null

        return (
          <button
            key={provider.id}
            type="button"
            disabled={disabled}
            onClick={() => signInWith(provider.id)}
            className={cn(
              "flex h-11 w-full items-center justify-center gap-2.5 rounded-lg border border-border bg-card px-4 text-sm font-semibold text-foreground transition-colors",
              provider.enabled &&
                "hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              !provider.enabled && "cursor-not-allowed opacity-50",
              isPending && "opacity-70",
            )}
          >
            <Icon className="size-5 shrink-0" aria-hidden />
            <span>{isPending ? "Redirecting…" : provider.label}</span>
          </button>
        )
      })}
    </div>
  )
}
