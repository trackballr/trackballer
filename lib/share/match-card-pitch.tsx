import { CARD_COLORS } from "@/lib/share/card-theme"
import { sharePitchName, type MatchShare, type MatchSharePlayer } from "@/lib/share/match-share-model"
import { ShareFace, ShareScoreChip } from "@/lib/share/match-card-parts"

type Photos = Map<number, string | null>

const PITCH = "#2f8f4e"
const LINE = "rgba(255,255,255,0.5)"

function PitchPlayer({
  player,
  photo,
  face,
}: {
  player: MatchSharePlayer
  photo: string | null
  face: number
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        width: face + 36,
      }}
    >
      <div style={{ display: "flex", position: "relative" }}>
        <div
          style={{
            display: "flex",
            borderRadius: face / 2,
            border: "3px solid #ffffff",
          }}
        >
          <ShareFace name={player.name} photo={photo} size={face} />
        </div>
        {player.rating != null ? (
          <div
            style={{
              display: "flex",
              position: "absolute",
              bottom: -10,
              left: 0,
              right: 0,
              justifyContent: "center",
            }}
          >
            <ShareScoreChip rating={player.rating} size="sm" />
          </div>
        ) : null}
      </div>
      <div
        style={{
          display: "flex",
          marginTop: player.rating != null ? 16 : 6,
          fontFamily: "Outfit",
          fontWeight: 700,
          fontSize: face > 60 ? 16 : 14,
          lineHeight: 1.1,
          textAlign: "center",
        }}
      >
        {sharePitchName(player.name)}
      </div>
    </div>
  )
}

function PitchMarkings() {
  return (
    <div
      style={{
        display: "flex",
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      }}
    >
      <div
        style={{
          display: "flex",
          position: "absolute",
          top: "50%",
          left: 0,
          width: "100%",
          height: 3,
          backgroundColor: LINE,
        }}
      />
      <div
        style={{
          display: "flex",
          position: "absolute",
          top: "50%",
          left: "50%",
          width: 120,
          height: 120,
          marginTop: -60,
          marginLeft: -60,
          borderRadius: 60,
          border: `3px solid ${LINE}`,
        }}
      />
      <div
        style={{
          display: "flex",
          position: "absolute",
          bottom: 0,
          left: "50%",
          width: 360,
          height: 56,
          marginLeft: -180,
          border: `3px solid ${LINE}`,
          borderBottom: "none",
        }}
      />
    </div>
  )
}

/**
 * Half pitch, attack at the top. Played subs sit in a row underneath.
 * The unused bench is not on the card.
 */
export function MatchCardPitch({ share, photos }: { share: MatchShare; photos: Photos }) {
  const compact =
    share.pitchRows.length >= 5 || share.pitchRows.some((line) => line.length >= 5)
  const face = compact ? 56 : 68

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
      <div
        style={{
          display: "flex",
          flex: 1,
          position: "relative",
          backgroundColor: PITCH,
          borderRadius: 28,
          overflow: "hidden",
        }}
      >
        <PitchMarkings />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "100%",
            height: "100%",
            padding: "22px 8px 28px",
          }}
        >
          {share.pitchRows.map((line, index) => (
            <div
              key={index}
              style={{
                display: "flex",
                justifyContent: "space-around",
                alignItems: "flex-start",
                width: "100%",
              }}
            >
              {line.map((player) => (
                <PitchPlayer
                  key={player.id}
                  player={player}
                  photo={photos.get(player.id) ?? null}
                  face={face}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      {share.subs.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", marginTop: 18 }}>
          <div
            style={{
              display: "flex",
              fontSize: 16,
              fontWeight: 600,
              letterSpacing: 2,
              color: CARD_COLORS.whiteFaint,
              marginBottom: 10,
            }}
          >
            SUBS
          </div>
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            {share.subs.map((player) => (
              <div key={player.id} style={{ display: "flex", marginRight: 12 }}>
                <PitchPlayer
                  player={player}
                  photo={photos.get(player.id) ?? null}
                  face={52}
                />
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}
