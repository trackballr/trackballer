import { GoogleAnalytics } from "@next/third-parties/google"
import { Figtree, Geist_Mono, Outfit } from "next/font/google"
import NextTopLoader from "nextjs-toploader"

import "./globals.css"
import { AppShell } from "@/components/app-shell"
import { cn } from "@/lib/utils"

const figtree = Figtree({
  subsets: ["latin"],
  variable: "--font-sans",
})

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-display",
})

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata = {
  title: "Trackballer",
  description: "Your hub to track your favorite players and teams",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={cn(
        "antialiased",
        figtree.variable,
        outfit.variable,
        geistMono.variable,
      )}
    >
      <body className="min-h-svh bg-background font-sans text-foreground">
        <NextTopLoader
          color="var(--primary)"
          height={3}
          showSpinner={false}
          shadow={false}
        />
        <AppShell>{children}</AppShell>
      </body>
      {process.env.NEXT_PUBLIC_GA_ID ? (
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
      ) : null}
    </html>
  )
}
