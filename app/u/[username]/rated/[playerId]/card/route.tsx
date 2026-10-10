import { renderCareerCard } from "@/lib/share/career-card-image"
import { getCareerShare } from "@/lib/share/career-share"

type RouteContext = {
  params: Promise<{ username: string; playerId: string }>
}

/** Share card picture (PNG) for one user's career rating of one player. */
export async function GET(request: Request, { params }: RouteContext) {
  const { username, playerId: rawPlayerId } = await params
  const playerId = Number(rawPlayerId)
  if (!Number.isInteger(playerId) || playerId <= 0) {
    return new Response("Not found", { status: 404 })
  }

  const lookup = await getCareerShare(username, playerId)
  if (lookup.status !== "ok") {
    return new Response("Not found", { status: 404 })
  }

  const image = await renderCareerCard(lookup.share)
  const url = new URL(request.url)

  // A versioned address (?v=) never changes, so it can be kept for a long time;
  // the bare address must follow rating edits.
  image.headers.set(
    "Cache-Control",
    url.searchParams.has("v")
      ? "public, max-age=86400, s-maxage=604800"
      : "public, max-age=60, s-maxage=60",
  )
  if (url.searchParams.has("download")) {
    // "Krejčí" → "krejci": drop accents before making the file name.
    const slug = lookup.share.player.name
      .normalize("NFD")
      .replace(/\p{M}/gu, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
    image.headers.set(
      "Content-Disposition",
      `attachment; filename="trackballr-${slug}-${Math.round(lookup.share.rating)}.png"`,
    )
  }

  return image
}
