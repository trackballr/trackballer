import { readFile } from "node:fs/promises"
import { join } from "node:path"

import { ImageResponse } from "next/og"

import type { MatchShare } from "@/lib/share/match-share-model"
import { MatchCardList } from "@/lib/share/match-card-list"
import { MatchCardPitch } from "@/lib/share/match-card-pitch"
import { MatchCardBrand, MatchCardHeader } from "@/lib/share/match-card-parts"
import { CARD_COLORS } from "@/lib/share/card-theme"

export const MATCH_CARD_SIZE = { width: 1080, height: 1350 } as const

async function loadFont(file: string): Promise<Buffer> {
  return readFile(join(process.cwd(), "assets/fonts", file))
}

async function loadLogo(): Promise<string> {
  const png = await readFile(join(process.cwd(), "public/logo.png"))
  return `data:image/png;base64,${png.toString("base64")}`
}

function sniffImageType(bytes: Buffer): string | null {
  if (bytes.length < 12) return null
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return "image/png"
  }
  if (bytes[0] === 0xff && bytes[1] === 0xd8) return "image/jpeg"
  if (bytes.subarray(0, 3).toString("latin1") === "GIF") return "image/gif"
  if (
    bytes.subarray(0, 4).toString("latin1") === "RIFF" &&
    bytes.subarray(8, 12).toString("latin1") === "WEBP"
  ) {
    return "image/webp"
  }
  return null
}

/** One slow or missing photo falls back to initials instead of failing the card. */
async function fetchAsDataUrl(url: string | null): Promise<string | null> {
  if (!url) return null
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(4000) })
    if (!response.ok) return null
    const bytes = Buffer.from(await response.arrayBuffer())
    const type = sniffImageType(bytes)
    if (!type) return null
    return `data:${type};base64,${bytes.toString("base64")}`
  } catch {
    return null
  }
}

function playersOnCard(share: MatchShare) {
  if (share.complete) return [...share.pitchRows.flat(), ...share.subs]
  return share.ranked
}

/** Portrait share picture: a ranking list, or a half pitch once the team is complete. */
export async function renderMatchCard(share: MatchShare): Promise<ImageResponse> {
  const people = playersOnCard(share)
  const [outfitBold, outfitExtraBold, figtreeMedium, figtreeSemiBold, logo, crest, ...photos] =
    await Promise.all([
      loadFont("Outfit-Bold.ttf"),
      loadFont("Outfit-ExtraBold.ttf"),
      loadFont("Figtree-Medium.ttf"),
      loadFont("Figtree-SemiBold.ttf"),
      loadLogo(),
      fetchAsDataUrl(share.team.logoUrl),
      ...people.map((player) => fetchAsDataUrl(player.photoUrl)),
    ])

  const photoById = new Map<number, string | null>()
  people.forEach((player, index) => {
    photoById.set(player.id, photos[index] ?? null)
  })

  const body = share.complete ? (
    <MatchCardPitch share={share} photos={photoById} />
  ) : (
    <MatchCardList share={share} photos={photoById} />
  )

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        padding: "48px 56px 40px",
        backgroundColor: CARD_COLORS.navy,
        backgroundImage:
          "radial-gradient(circle at 0% 0%, rgba(255,255,255,0.16), rgba(255,255,255,0) 52%)",
        color: CARD_COLORS.white,
        fontFamily: "Figtree",
      }}
    >
      <MatchCardHeader
        crest={crest}
        teamName={share.team.name}
        opponentName={share.opponentName}
        roundLabel={share.roundLabel}
      />
      {body}
      <MatchCardBrand logo={logo} />
    </div>,
    {
      ...MATCH_CARD_SIZE,
      fonts: [
        { name: "Outfit", data: outfitBold, weight: 700, style: "normal" },
        { name: "Outfit", data: outfitExtraBold, weight: 800, style: "normal" },
        { name: "Figtree", data: figtreeMedium, weight: 500, style: "normal" },
        { name: "Figtree", data: figtreeSemiBold, weight: 600, style: "normal" },
      ],
    },
  )
}
