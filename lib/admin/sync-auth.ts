import { timingSafeEqual } from "node:crypto"
import { NextRequest } from "next/server"

function safeEqual(a: string | null, b: string): boolean {
  if (!a) return false
  const ab = Buffer.from(a)
  const bb = Buffer.from(b)
  return ab.length === bb.length && timingSafeEqual(ab, bb)
}

export function assertSyncAuthorized(request: NextRequest): Response | null {
  const secret = process.env.SYNC_ADMIN_SECRET
  if (!secret) {
    return Response.json(
      { error: "SYNC_ADMIN_SECRET is not configured on the server" },
      { status: 500 },
    )
  }

  const authHeader = request.headers.get("authorization")
  const bearer =
    authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null
  const headerSecret = request.headers.get("x-sync-secret")

  if (!safeEqual(bearer, secret) && !safeEqual(headerSecret, secret)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  return null
}
