const EXACT_ALLOWLIST = new Set([
  "/login",
  "/onboarding",
  "/terms",
  "/privacy",
  "/guidelines",
])

const PREFIX_ALLOWLIST = [
  "/api/",
  "/auth/",
  "/_next/",
  "/player/",
  "/country/",
  "/match/",
  "/league/",
  "/world-cup",
  "/search",
  "/players",
]

/** Guests browse freely; incomplete logged-in users may only hit allowlisted routes. */
export function isOnboardingBypassPath(pathname: string): boolean {
  if (EXACT_ALLOWLIST.has(pathname)) return true
  if (pathname === "/") return true

  return PREFIX_ALLOWLIST.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix),
  )
}
