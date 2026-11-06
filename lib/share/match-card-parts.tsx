import { matchRatingTierHex } from "@/lib/rating/match-rating-tier"
import { CARD_COLORS } from "@/lib/share/card-theme"
import {
  formatShareMatchScore,
  shareCardName,
  type MatchSharePlayer,
} from "@/lib/share/match-share-model"

export function shareInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return `${parts[0]![0] ?? ""}${parts.at(-1)![0] ?? ""}`.toUpperCase()
}

export function ShareFace({
  name,
  photo,
  size,
}: {
  name: string
  photo: string | null
  size: number
}) {
  return (
    <div
      style={{
        display: "flex",
        width: size,
        height: size,
        borderRadius: size / 2,
        overflow: "hidden",
        backgroundColor: "rgba(255,255,255,0.14)",
        alignItems: "center",
        justifyContent: "center",
        color: CARD_COLORS.white,
        fontFamily: "Outfit",
        fontWeight: 700,
        fontSize: Math.round(size * 0.32),
      }}
    >
      {photo ? (
        // eslint-disable-next-line @next/next/no-img-element -- picture renderer, not a page
        <img src={photo} alt="" width={size} height={size} style={{ objectFit: "cover" }} />
      ) : (
        shareInitials(name)
      )}
    </div>
  )
}

export function ShareScoreChip({
  rating,
  size = "md",
}: {
  rating: number
  size?: "md" | "sm"
}) {
  const colors = matchRatingTierHex(rating)
  const compact = size === "sm"
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.bg,
        color: colors.fg,
        fontFamily: "Outfit",
        fontWeight: 700,
        fontSize: compact ? 18 : 28,
        lineHeight: 1,
        borderRadius: compact ? 8 : 12,
        padding: compact ? "5px 8px" : "8px 14px",
        minWidth: compact ? 40 : 64,
      }}
    >
      {formatShareMatchScore(rating)}
    </div>
  )
}

export function MatchCardHeader({
  crest,
  teamName,
  opponentName,
  roundLabel,
}: {
  crest: string | null
  teamName: string
  opponentName: string
  roundLabel: string | null
}) {
  const vs = roundLabel ? `vs ${opponentName} · ${roundLabel}` : `vs ${opponentName}`
  return (
    <div style={{ display: "flex", alignItems: "center", marginBottom: 28 }}>
      {crest ? (
        // eslint-disable-next-line @next/next/no-img-element -- picture renderer, not a page
        <img src={crest} alt="" width={84} height={84} style={{ objectFit: "contain" }} />
      ) : (
        <div style={{ display: "flex", width: 84, height: 84 }} />
      )}
      <div style={{ display: "flex", flexDirection: "column", flex: 1, marginLeft: 20 }}>
        <div
          style={{
            display: "flex",
            fontFamily: "Figtree",
            fontWeight: 600,
            fontSize: 18,
            letterSpacing: 3,
            color: CARD_COLORS.whiteFaint,
          }}
        >
          MY RATINGS
        </div>
        <div
          style={{
            display: "flex",
            fontFamily: "Outfit",
            fontWeight: 800,
            fontSize: teamName.length > 18 ? 40 : 48,
            lineHeight: 1.05,
            marginTop: 4,
          }}
        >
          {shareCardName(teamName)}
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 6,
            fontFamily: "Figtree",
            fontWeight: 500,
            fontSize: 22,
            color: CARD_COLORS.whiteSoft,
          }}
        >
          {vs}
        </div>
      </div>
    </div>
  )
}

/** Black mark sits on a white chip so it reads on the navy card, next to the name. */
export function MatchCardBrand({ logo }: { logo: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        marginTop: 20,
        paddingTop: 18,
        borderTop: `1px solid ${CARD_COLORS.hairline}`,
      }}
    >
      <div
        style={{
          display: "flex",
          width: 56,
          height: 56,
          borderRadius: 12,
          backgroundColor: CARD_COLORS.white,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- picture renderer, not a page */}
        <img src={logo} alt="" width={44} height={44} style={{ objectFit: "contain" }} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", marginLeft: 14 }}>
        <div
          style={{
            display: "flex",
            fontFamily: "Outfit",
            fontWeight: 800,
            fontSize: 28,
            lineHeight: 1,
          }}
        >
          Trackballr
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 4,
            fontSize: 16,
            color: CARD_COLORS.whiteSoft,
          }}
        >
          Rate every player. Every match.
        </div>
      </div>
    </div>
  )
}
