import { renderMatchCard } from "@/lib/share/match-card-image"
import { getMatchShare } from "@/lib/share/match-share"

type RouteContext = {
  params: Promise<{ username: string; fixtureId: string; teamId: string }>
}

function parseId(raw: string): number | null {
  const id = Number(raw)
  return Number.isInteger(id) && id > 0 ? id : null
}

/** Share card picture (PNG) for one user's ratings of one team in a match. */
export async function GET(request: Request, { params }: RouteContext) {
  const { username, fixtureId: rawFixtureId, teamId: rawTeamId } = await params
  const fixtureId = parseId(rawFixtureId)
  const teamId = parseId(rawTeamId)
  if (!fixtureId || !teamId) return new Response("Not found", { status: 404 })

  const lookup = await getMatchShare(username, fixtureId, teamId)
  if (lookup.status !== "ok") return new Response("Not found", { status: 404 })

  const image = await renderMatchCard(lookup.share)
  const url = new URL(request.url)

  image.headers.set(
    "Cache-Control",
    url.searchParams.has("v")
      ? "public, max-age=86400, s-maxage=604800"
      : "public, max-age=60, s-maxage=60",
  )
  if (url.searchParams.has("download")) {
    const slug = `${lookup.share.team.name}-vs-${lookup.share.opponentName}`
      .normalize("NFD")
      .replace(/\p{M}/gu, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
    image.headers.set(
      "Content-Disposition",
      `attachment; filename="trackballr-${slug}.png"`,
    )
  }

  return image
}
