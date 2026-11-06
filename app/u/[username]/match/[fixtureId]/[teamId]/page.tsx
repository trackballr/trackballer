import type { Metadata } from "next"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"

import { ShareRatingActions } from "@/components/share/share-rating-actions"
import { Panel } from "@/components/ui/panel"
import { getServerAuth } from "@/lib/auth/server-session"
import { MATCH_CARD_SIZE } from "@/lib/share/match-card-image"
import { getMatchShare, matchShareVersion } from "@/lib/share/match-share"
import {
  matchShareCardPath,
  matchSharePath,
  matchShareText,
} from "@/lib/share/share-links"
import { createClient } from "@/lib/supabase/server"

type PageProps = {
  params: Promise<{ username: string; fixtureId: string; teamId: string }>
}

function parseId(raw: string): number | null {
  const id = Number(raw)
  return Number.isInteger(id) && id > 0 ? id : null
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username, fixtureId: rawFixtureId, teamId: rawTeamId } = await params
  const fixtureId = parseId(rawFixtureId)
  const teamId = parseId(rawTeamId)
  const lookup =
    fixtureId && teamId ? await getMatchShare(username, fixtureId, teamId) : null
  if (!lookup || lookup.status !== "ok") return { title: "Match ratings | Trackballr" }

  const { share } = lookup
  const leader = share.ranked[0]
  const title = `@${share.username}'s ${share.team.name} ratings | Trackballr`
  const description = matchShareText({
    teamName: share.team.name,
    opponentName: share.opponentName,
    topName: leader?.name ?? share.team.name,
    topRating: leader?.rating ?? 0,
    complete: share.complete,
    byUsername: share.username,
  })
  const image = {
    url: matchShareCardPath(share.username, share.fixtureId, share.team.id, matchShareVersion(share)),
    ...MATCH_CARD_SIZE,
    alt: `${share.team.name} ratings by @${share.username}`,
  }

  return {
    title,
    description,
    alternates: {
      canonical: matchSharePath(share.username, share.fixtureId, share.team.id),
    },
    openGraph: { title, description, type: "article", images: [image] },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  }
}

/** Public page for one user's ratings of one team in a match. */
export default async function MatchRatingSharePage({ params }: PageProps) {
  const { username, fixtureId: rawFixtureId, teamId: rawTeamId } = await params
  const fixtureId = parseId(rawFixtureId)
  const teamId = parseId(rawTeamId)
  if (!fixtureId || !teamId) notFound()

  const lookup = await getMatchShare(username, fixtureId, teamId)
  if (lookup.status === "not-found") notFound()
  if (lookup.status === "locked") redirect(`/match/${lookup.fixtureId}`)

  const { share } = lookup
  const supabase = await createClient()
  const auth = await getServerAuth(supabase)
  const profile = auth
    ? await supabase.from("profiles").select("username").eq("id", auth.userId).maybeSingle()
    : null
  const isOwner = profile?.data?.username?.toLowerCase() === share.username.toLowerCase()

  const sharePath = matchSharePath(share.username, share.fixtureId, share.team.id)
  const cardPath = matchShareCardPath(
    share.username,
    share.fixtureId,
    share.team.id,
    matchShareVersion(share),
  )
  const leader = share.ranked[0]
  const heading = share.complete
    ? `${share.team.name} vs ${share.opponentName}`
    : `${share.ratedCount} ${share.team.name} ratings vs ${share.opponentName}`

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 lg:py-8">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-start lg:gap-6">
        <Panel>
          {/* eslint-disable-next-line @next/next/no-img-element -- our own generated card */}
          <img
            src={cardPath}
            alt={`@${share.username}'s ${share.team.name} ratings vs ${share.opponentName}`}
            width={MATCH_CARD_SIZE.width}
            height={MATCH_CARD_SIZE.height}
            className="block aspect-[1080/1350] w-full bg-primary"
          />
        </Panel>

        <Panel>
          <div className="p-5">
            <h1 className="font-display text-xl leading-tight font-bold">
              {isOwner ? "Your" : `@${share.username}'s`} {heading}
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {share.complete
                ? "Every player who played, on the half pitch."
                : `${leader?.name ?? "The leader"} is out in front. Rate the rest to fill the pitch.`}
            </p>

            <div className="mt-5 border-t border-border pt-4">
              <h2 className="text-sm font-semibold">
                {isOwner ? "Share your ratings" : "Share this card"}
              </h2>
              <p className="mt-0.5 mb-3 text-xs text-muted-foreground">
                Post the link and the card shows as its preview, or take the picture itself.
              </p>
              <ShareRatingActions
                sharePath={sharePath}
                cardPath={cardPath}
                text={matchShareText({
                  teamName: share.team.name,
                  opponentName: share.opponentName,
                  topName: leader?.name ?? share.team.name,
                  topRating: leader?.rating ?? 0,
                  complete: share.complete,
                  byUsername: isOwner ? null : share.username,
                })}
              />
            </div>

            <div className="mt-4 border-t border-border pt-4">
              <Link
                href={`/match/${share.fixtureId}`}
                className="text-sm font-semibold underline underline-offset-4"
              >
                Open the match
              </Link>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  )
}
