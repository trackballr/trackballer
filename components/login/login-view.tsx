import Image from "next/image"
import Link from "next/link"

import { SocialAuthButtons } from "@/components/login/social-auth-buttons"

type LoginViewProps = {
  authError?: string
}

export function LoginView({ authError }: LoginViewProps) {
  return (
    <div className="mx-auto flex min-h-svh max-w-sm flex-col justify-center px-6 py-12">
      <div className="mb-8 text-center">
        <Link
          href="/"
          className="mx-auto mb-4 flex size-12 items-center justify-center"
          aria-label="Trackballr home"
        >
          <Image
            src="/logo.png"
            alt="Trackballr"
            width={48}
            height={48}
            className="size-12 object-contain"
            priority
          />
        </Link>
        <h1 className="font-display text-[26px] font-bold tracking-tight">Trackballr</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your hub to track your favorite players and teams
        </p>
      </div>

      {authError && (
        <p className="mb-4 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-center text-sm text-destructive">
          Sign-in did not complete. Please try again.
        </p>
      )}

      <SocialAuthButtons />

      <p className="mt-6 text-center">
        <Link
          href="/"
          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          Browse as guest
        </Link>
      </p>

      <p className="caption mt-10 text-center text-muted-foreground">
        <Link href="/terms" className="underline-offset-4 hover:underline">
          Terms
        </Link>
        <span className="mx-2">·</span>
        <Link href="/privacy" className="underline-offset-4 hover:underline">
          Privacy
        </Link>
      </p>
    </div>
  )
}
