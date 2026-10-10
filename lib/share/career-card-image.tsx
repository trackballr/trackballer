import { readFile } from "node:fs/promises"
import { join } from "node:path"

import { ImageResponse } from "next/og"

import {
  careerRingTier,
  careerTierLabel,
  formatCareerScore,
  tierForScore,
} from "@/lib/rating/career-tier"
import type { CareerShare } from "@/lib/share/career-share"
import { CARD_COLORS, cardRingColor, cardTierTextColor } from "@/lib/share/card-theme"
import { careerGapLabel } from "@/lib/share/share-links"

export const CAREER_CARD_SIZE = { width: 1200, height: 630 } as const

/** Lucide "flame" outline, drawn inline because the renderer has no icon font. */
const FLAME_PATH =
  "M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"

async function loadFont(file: string): Promise<Buffer> {
  return readFile(join(process.cwd(), "assets/fonts", file))
}

async function loadLogo(): Promise<string> {
  const png = await readFile(join(process.cwd(), "public/logo.png"))
  return `data:image/png;base64,${png.toString("base64")}`
}

/**
 * Picture type from the file's first bytes. The image host labels some JPEG
 * player photos as PNG, and the renderer draws nothing if the label is wrong.
 */
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

/**
 * Fetch a remote picture up front so one slow, missing or unreadable photo
 * cannot fail the whole card — the caller falls back to initials.
 */
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

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return `${parts[0]![0] ?? ""}${parts.at(-1)![0] ?? ""}`.toUpperCase()
}

const eyebrow = {
  display: "flex",
  fontFamily: "Figtree",
  fontWeight: 600,
  letterSpacing: 3,
  color: CARD_COLORS.whiteFaint,
} as const

/** The 1200×630 share picture for one career rating, in the site's navy theme. */
export async function renderCareerCard(share: CareerShare): Promise<ImageResponse> {
  const [outfitBold, outfitExtraBold, figtreeMedium, figtreeSemiBold, logo, photo, crest, avatar] =
    await Promise.all([
      loadFont("Outfit-Bold.ttf"),
      loadFont("Outfit-ExtraBold.ttf"),
      loadFont("Figtree-Medium.ttf"),
      loadFont("Figtree-SemiBold.ttf"),
      loadLogo(),
      fetchAsDataUrl(share.player.photoUrl),
      fetchAsDataUrl(share.player.clubLogoUrl),
      fetchAsDataUrl(share.user.avatarUrl),
    ])

  const ringColor = cardRingColor(share.publicTier, share.publicScore)
  const ratingTier = tierForScore(share.rating)
  const ratingColor = cardTierTextColor(ratingTier, share.rating)
  const publicColor = cardTierTextColor(share.publicTier, share.publicScore)
  const publicTierLabel = careerTierLabel(careerRingTier(share.publicTier, share.publicScore))
  const nameSize = share.player.name.length > 22 ? 52 : 64
  const gapLabel = careerGapLabel(share.rating, share.publicScore, share.isProvisional)

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: "52px 64px",
          backgroundColor: CARD_COLORS.navy,
          // Soft light from the top-left, as on the player page band.
          backgroundImage:
            "radial-gradient(circle at 0% 0%, rgba(255,255,255,0.17), rgba(255,255,255,0) 58%)",
          color: CARD_COLORS.white,
          fontFamily: "Figtree",
        }}
      >
        {/* Top: what this is + brand */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ ...eyebrow, fontSize: 22 }}>CAREER RATING</div>
          <div style={{ display: "flex", alignItems: "center" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 46,
                height: 46,
                borderRadius: 23,
                backgroundColor: CARD_COLORS.white,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text -- picture renderer, not the page */}
              <img src={logo} width={36} height={36} />
            </div>
            <div
              style={{
                display: "flex",
                marginLeft: 12,
                fontFamily: "Outfit",
                fontWeight: 700,
                fontSize: 30,
                letterSpacing: -0.5,
              }}
            >
              Trackballr
            </div>
          </div>
        </div>

        {/* Middle: player ring + name + the two scores */}
        <div style={{ display: "flex", flex: 1, alignItems: "center" }}>
          <div style={{ display: "flex", position: "relative", width: 268, height: 268 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 268,
                height: 268,
                borderRadius: 134,
                border: `10px solid ${ringColor}`,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 232,
                  height: 232,
                  borderRadius: 116,
                  backgroundColor: CARD_COLORS.white,
                  color: CARD_COLORS.navy,
                  fontFamily: "Outfit",
                  fontWeight: 800,
                  fontSize: 84,
                }}
              >
                {photo ? (
                  // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text -- picture renderer
                  <img
                    src={photo}
                    width={232}
                    height={232}
                    // Rounding goes on the picture itself: the renderer does not clip
                    // a picture to its rounded parent.
                    style={{ objectFit: "cover", borderRadius: 116 }}
                  />
                ) : (
                  initials(share.player.name)
                )}
              </div>
            </div>
            {crest ? (
              <div
                style={{
                  display: "flex",
                  position: "absolute",
                  top: 4,
                  right: 4,
                  alignItems: "center",
                  justifyContent: "center",
                  width: 68,
                  height: 68,
                  borderRadius: 16,
                  backgroundColor: CARD_COLORS.white,
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text -- picture renderer */}
                <img src={crest} width={50} height={50} style={{ objectFit: "contain" }} />
              </div>
            ) : null}
          </div>

          <div style={{ display: "flex", flexDirection: "column", flex: 1, marginLeft: 56 }}>
            <div
              style={{
                display: "flex",
                fontFamily: "Outfit",
                fontWeight: 800,
                fontSize: nameSize,
                lineHeight: 1.05,
                letterSpacing: -1.5,
              }}
            >
              {share.player.name}
            </div>
            {share.player.clubName ? (
              <div
                style={{
                  display: "flex",
                  marginTop: 8,
                  fontWeight: 500,
                  fontSize: 28,
                  color: CARD_COLORS.whiteSoft,
                }}
              >
                {share.player.clubName}
              </div>
            ) : null}

            <div style={{ display: "flex", alignItems: "flex-end", marginTop: 30 }}>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ ...eyebrow, fontSize: 20 }}>MY RATING</div>
                <div style={{ display: "flex", alignItems: "baseline", marginTop: 2 }}>
                  <div
                    style={{
                      display: "flex",
                      fontFamily: "Outfit",
                      fontWeight: 800,
                      fontSize: 148,
                      lineHeight: 1,
                      letterSpacing: -4,
                      color: ratingColor,
                    }}
                  >
                    {formatCareerScore(share.rating)}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      marginLeft: 16,
                      fontFamily: "Outfit",
                      fontWeight: 700,
                      fontSize: 34,
                      color: ratingColor,
                    }}
                  >
                    {careerTierLabel(ratingTier)}
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  marginLeft: 44,
                  paddingLeft: 44,
                  paddingBottom: 14,
                  borderLeft: `2px solid ${CARD_COLORS.hairline}`,
                }}
              >
                <div style={{ ...eyebrow, fontSize: 20 }}>
                  {share.isProvisional ? "BASE RATING" : "FANS"}
                </div>
                <div style={{ display: "flex", alignItems: "baseline", marginTop: 4 }}>
                  <div
                    style={{
                      display: "flex",
                      fontFamily: "Outfit",
                      fontWeight: 800,
                      fontSize: 72,
                      lineHeight: 1,
                      letterSpacing: -2,
                    }}
                  >
                    {formatCareerScore(share.publicScore)}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      marginLeft: 12,
                      fontFamily: "Outfit",
                      fontWeight: 700,
                      fontSize: 24,
                      color: publicColor,
                    }}
                  >
                    {publicTierLabel}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom: who rated + how it compares + address */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: 24,
            borderTop: `2px solid ${CARD_COLORS.hairline}`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: "rgba(255,255,255,0.14)",
                fontWeight: 600,
                fontSize: 22,
              }}
            >
              {avatar ? (
                // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text -- picture renderer
                <img
                  src={avatar}
                  width={56}
                  height={56}
                  style={{ objectFit: "cover", borderRadius: 28 }}
                />
              ) : (
                initials(share.user.displayName)
              )}
            </div>
            <div style={{ display: "flex", marginLeft: 14, fontWeight: 600, fontSize: 28 }}>
              {`@${share.user.username}`}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginLeft: 22,
                padding: "8px 18px",
                borderRadius: 999,
                fontWeight: 600,
                fontSize: 22,
                backgroundColor: share.isHotTake ? CARD_COLORS.hotBg : "rgba(255,255,255,0.1)",
                color: share.isHotTake ? CARD_COLORS.hotText : CARD_COLORS.whiteSoft,
              }}
            >
              {share.isHotTake ? (
                <svg
                  width={22}
                  height={22}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={CARD_COLORS.hotText}
                  strokeWidth={2.2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ marginRight: 8 }}
                >
                  <path d={FLAME_PATH} />
                </svg>
              ) : null}
              {share.isHotTake ? `Hot take · ${gapLabel}` : gapLabel}
            </div>
          </div>
          <div
            style={{ display: "flex", fontWeight: 500, fontSize: 24, color: CARD_COLORS.whiteFaint }}
          >
            trackballr.com
          </div>
        </div>
      </div>
    ),
    {
      ...CAREER_CARD_SIZE,
      fonts: [
        { name: "Outfit", data: outfitBold, weight: 700, style: "normal" },
        { name: "Outfit", data: outfitExtraBold, weight: 800, style: "normal" },
        { name: "Figtree", data: figtreeMedium, weight: 500, style: "normal" },
        { name: "Figtree", data: figtreeSemiBold, weight: 600, style: "normal" },
      ],
    },
  )
}
