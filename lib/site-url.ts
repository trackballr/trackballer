/**
 * Public address of this deployment, for links that must be absolute (link
 * previews, share links). Preview deployments use their own Vercel address.
 */
export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (explicit) return explicit.replace(/\/+$/, "")

  if (process.env.VERCEL_ENV === "preview" && process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }

  return "https://www.trackballr.com"
}
