import Link from "next/link"

import { AppShellClient } from "@/components/app-shell-client"
import { TopNav } from "@/components/top-nav"

type AppShellProps = {
  children: React.ReactNode
}

function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-background py-8">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-4 sm:flex-row">
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} Trackballr. All rights reserved.
        </p>
        <nav className="flex gap-6 text-sm text-muted-foreground">
          <Link
            href="/guidelines"
            className="transition-colors hover:text-foreground"
          >
            Guidelines
          </Link>
          <Link href="/privacy" className="transition-colors hover:text-foreground">
            Privacy
          </Link>
          <Link href="/terms" className="transition-colors hover:text-foreground">
            Terms
          </Link>
        </nav>
      </div>
    </footer>
  )
}

export function AppShell({ children }: AppShellProps) {
  return (
    <AppShellClient nav={<TopNav />} footer={<Footer />}>
      {children}
    </AppShellClient>
  )
}
