import { CARD_COLORS } from "@/lib/share/card-theme"
import { shareCardName, type MatchShare, type MatchSharePlayer } from "@/lib/share/match-share-model"
import { ShareFace, ShareScoreChip } from "@/lib/share/match-card-parts"

type Photos = Map<number, string | null>

function RankRow({
  player,
  rank,
  photo,
  featured,
}: {
  player: MatchSharePlayer
  rank: number
  photo: string | null
  featured: boolean
}) {
  const face = featured ? 76 : 52
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        width: "100%",
        marginBottom: featured ? 14 : 8,
      }}
    >
      <div
        style={{
          display: "flex",
          width: featured ? 72 : 44,
          fontFamily: "Outfit",
          fontWeight: 800,
          fontSize: featured ? 56 : 32,
          lineHeight: 0.9,
          color: "rgba(255,255,255,0.28)",
        }}
      >
        {rank}
      </div>
      <ShareFace name={player.name} photo={photo} size={face} />
      <div style={{ display: "flex", flexDirection: "column", flex: 1, marginLeft: 16 }}>
        <div
          style={{
            display: "flex",
            fontFamily: "Outfit",
            fontWeight: 700,
            fontSize: featured ? 28 : 20,
            lineHeight: 1.1,
          }}
        >
          {shareCardName(player.name)}
        </div>
        {player.position ? (
          <div
            style={{
              display: "flex",
              marginTop: 4,
              fontSize: featured ? 16 : 14,
              color: CARD_COLORS.whiteFaint,
            }}
          >
            {player.position}
          </div>
        ) : null}
      </div>
      {player.rating != null ? <ShareScoreChip rating={player.rating} size={featured ? "md" : "sm"} /> : null}
    </div>
  )
}

function Column({
  players,
  startRank,
  photos,
}: {
  players: MatchSharePlayer[]
  startRank: number
  photos: Photos
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
      {players.map((player, index) => (
        <RankRow
          key={player.id}
          player={player}
          rank={startRank + index}
          photo={photos.get(player.id) ?? null}
          featured={false}
        />
      ))}
    </div>
  )
}

/** Highest score at the top. Top three stay full width; a long tail splits in two. */
export function MatchCardList({ share, photos }: { share: MatchShare; photos: Photos }) {
  const featured = share.ranked.slice(0, 3)
  const rest = share.ranked.slice(3)
  const split = rest.length > 5
  const mid = Math.ceil(rest.length / 2)

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
      <div
        style={{
          display: "flex",
          marginBottom: 18,
          fontSize: 18,
          fontWeight: 600,
          color: CARD_COLORS.whiteFaint,
        }}
      >
        {share.ratedCount} rated
      </div>
      {featured.map((player, index) => (
        <RankRow
          key={player.id}
          player={player}
          rank={index + 1}
          photo={photos.get(player.id) ?? null}
          featured
        />
      ))}
      {split ? (
        <div style={{ display: "flex", marginTop: 8 }}>
          <Column players={rest.slice(0, mid)} startRank={4} photos={photos} />
          <div style={{ display: "flex", width: 28 }} />
          <Column players={rest.slice(mid)} startRank={4 + mid} photos={photos} />
        </div>
      ) : (
        rest.map((player, index) => (
          <RankRow
            key={player.id}
            player={player}
            rank={index + 4}
            photo={photos.get(player.id) ?? null}
            featured={false}
          />
        ))
      )}
    </div>
  )
}
