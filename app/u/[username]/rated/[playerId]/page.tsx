import type { Metadata } from "next"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"

import { ShareRatingActions } from "@/components/share/share-rating-actions"
import { buttonVariants } from "@/components/ui/button"
import { Panel } from "@/components/ui/panel"
import { getServerAuth } from "@/lib/auth/server-session"
import { formatCareerScore } from "@/lib/rating/career-tier"
import { CAREER_CARD_SIZE } from "@/lib/share/career-card-image"
import { careerShareVersion, getCareerShare } from "@/lib/share/career-share"
import {
  careerGapLabel,
  careerShareCardPath,
  careerSharePath,
  careerShareText,
} from "@/lib/share/share-links"
import { createClient } from "@/lib/supabase/server"

type PageProps = {
  params: Promise<{ username: string; playerId: string }>
}

function parsePlayerId(raw: string): number | null {
  const id = Number(raw)
  return Number.isInteger(id) && id > 0 ? id : null
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username, playerId: rawPlayerId } = await params
  const playerId = parsePlayerId(rawPlayerId)
  const lookup = playerId ? await getCareerShare(username, playerId) : null
  if (!lookup || lookup.status !== "ok") return { title: "Rating | Trackballr" }

  const { share } = lookup
  const title = `@${share.user.username} rated ${share.player.name} ${formatCareerScore(share.rating)} | Trackballr`
  const description = `${careerGapLabel(share.rating, share.publicScore, share.isProvisional)}. What's your rating?`
  const image = {
    url: careerShareCardPath(share.user.username, share.player.id, careerShareVersion(share)),
    ...CAREER_CARD_SIZE,
    alt: `${share.player.name} career rating by @${share.user.username}`,
  }

  return {
    title,
    description,
    alternates: { canonical: careerSharePath(share.user.username, share.player.id) },
    openGraph: { title, description, type: "article", images: [image] },
    // Large picture preview on X.
    twitter: { card: "summary_large_image", title, description, images: [image] },
  }
}

/** Public page for one career rating: the card, then a way to add your own. */
export default async function CareerRatingSharePage({ params }: PageProps) {
  const { username, playerId: rawPlayerId } = await params
  const playerId = parsePlayerId(rawPlayerId)
  if (!playerId) notFound()

  const lookup = await getCareerShare(username, playerId)
  if (lookup.status === "not-found") notFound()
  // Rating or account gone: the player page is still the useful place to land.
  if (lookup.status === "no-rating") redirect(`/player/${lookup.playerId}`)

  const { share } = lookup
  const supabase = await createClient()
  const auth = await getServerAuth(supabase)
  const isOwner = auth?.userId === share.user.id

  const sharePath = careerSharePath(share.user.username, share.player.id)
  const cardPath = careerShareCardPath(
    share.user.username,
    share.player.id,
    careerShareVersion(share),
  )
  const rating = formatCareerScore(share.rating)
  const publicScore = formatCareerScore(share.publicScore)

  const shareActions = (
    <ShareRatingActions
      sharePath={sharePath}
      cardPath={cardPath}
      text={careerShareText({
        playerName: share.player.name,
        rating: share.rating,
        publicScore: share.publicScore,
        isProvisional: share.isProvisional,
        byUsername: isOwner ? null : share.user.username,
      })}
    />
  )

  const pageLinks = (
    <div className="flex flex-wrap gap-2">
      <Link
        href={`/player/${share.player.id}`}
        className={buttonVariants({
          // The owner came here to share, so sharing leads; visitors are asked to rate.
          variant: isOwner ? "outline" : "default",
          className: isOwner ? "h-10 bg-card px-4 text-sm" : "h-10 px-4 text-sm",
        })}
      >
        {isOwner ? "Change your rating" : "What's your rating?"}
      </Link>
      <Link
        href={isOwner ? "/profile" : `/u/${share.user.username}`}
        className={buttonVariants({ variant: "outline", className: "h-10 bg-card px-4 text-sm" })}
      >
        {isOwner ? "Your profile" : `@${share.user.username}'s profile`}
      </Link>
    </div>
  )

  return (
    // Laptops: card on the left, everything to do with it on the right, so the
    // share buttons are on screen without scrolling. Smaller screens stack, with
    // the actions straight under the card.
    <div className="mx-auto max-w-6xl px-4 py-6 lg:py-8">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-start lg:gap-6">
        <Panel>
          {/* eslint-disable-next-line @next/next/no-img-element -- our own generated card */}
          <img
            src={cardPath}
            alt={`${share.player.name}: rated ${rating} by @${share.user.username}; ${share.isProvisional ? "base rating" : "fans"} ${publicScore}.`}
            width={CAREER_CARD_SIZE.width}
            height={CAREER_CARD_SIZE.height}
            className="block aspect-[1200/630] w-full bg-primary"
          />
        </Panel>

        <Panel>
          <div className="p-5">
            <h1 className="font-display text-xl leading-tight font-bold">
              {isOwner ? "You" : `@${share.user.username}`} rated {share.player.name} {rating}
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {careerGapLabel(share.rating, share.publicScore, share.isProvisional)} (
              {publicScore}).{isOwner ? "" : " Where do you have them?"}
            </p>

            {isOwner ? null : <div className="mt-4">{pageLinks}</div>}

            <div className="mt-5 border-t border-border pt-4">
              <h2 className="text-sm font-semibold">
                {isOwner ? "Share your take" : "Share this card"}
              </h2>
              <p className="mt-0.5 mb-3 text-xs text-muted-foreground">
                Post the link and the card shows as its preview, or take the picture itself.
              </p>
              {shareActions}
            </div>

            {isOwner ? <div className="mt-2 border-t border-border pt-4">{pageLinks}</div> : null}
          </div>
        </Panel>
      </div>
    </div>
  )
}
