import { CARD_COLORS } from "@/lib/share/card-theme"
import { shareCardName, type MatchShare, type MatchSharePlayer } from "@/lib/share/match-share-model"
import { ShareFace, ShareScoreChip } from "@/lib/share/match-card-parts"

type Photos = Map<number, string | null>
type ChipSize = "md" | "sm"

type RowScale = {
  face: number
  name: number
  rank: number
  rankWidth: number
  chip: ChipSize
}

/** Shorter lists use bigger rows. The rows then share the leftover height. */
function rowScale(count: number): RowScale {
  if (count <= 5) return { face: 88, name: 32, rank: 64, rankWidth: 84, chip: "md" }
  if (count <= 7) return { face: 72, name: 28, rank: 52, rankWidth: 72, chip: "md" }
  return { face: 60, name: 24, rank: 44, rankWidth: 60, chip: "sm" }
}

function RankRow({
  player,
  rank,
  photo,
  scale,
  fill,
}: {
  player: MatchSharePlayer
  rank: number
  photo: string | null
  scale: RowScale
  fill: boolean
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        width: "100%",
        flex: fill ? 1 : undefined,
      }}
    >
      <div
        style={{
          display: "flex",
          width: scale.rankWidth,
          fontFamily: "Outfit",
          fontWeight: 800,
          fontSize: scale.rank,
          lineHeight: 0.9,
          color: "rgba(255,255,255,0.28)",
        }}
      >
        {rank}
      </div>
      <ShareFace name={player.name} photo={photo} size={scale.face} />
      <div style={{ display: "flex", flexDirection: "column", flex: 1, marginLeft: 16 }}>
        <div
          style={{
            display: "flex",
            fontFamily: "Outfit",
            fontWeight: 700,
            fontSize: scale.name,
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
              fontSize: Math.max(14, scale.name - 12),
              color: CARD_COLORS.whiteFaint,
            }}
          >
            {player.position}
          </div>
        ) : null}
      </div>
      {player.rating != null ? <ShareScoreChip rating={player.rating} size={scale.chip} /> : null}
    </div>
  )
}

/** Highest score at the top. Five to nine names fill the card; a longer list splits. */
export function MatchCardList({ share, photos }: { share: MatchShare; photos: Photos }) {
  const count = share.ranked.length
  const scale = rowScale(count)
  const split = count > 9
  const featured = split ? share.ranked.slice(0, 3) : share.ranked
  const rest = split ? share.ranked.slice(3) : []
  const mid = Math.ceil(rest.length / 2)
  const tailScale = rowScale(12)

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
      <div
        style={{
          display: "flex",
          marginBottom: 8,
          fontSize: 18,
          fontWeight: 600,
          color: CARD_COLORS.whiteFaint,
        }}
      >
        {share.ratedCount} rated
      </div>
      <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
        {featured.map((player, index) => (
          <RankRow
            key={player.id}
            player={player}
            rank={index + 1}
            photo={photos.get(player.id) ?? null}
            scale={split ? rowScale(6) : scale}
            fill={!split}
          />
        ))}
      </div>
      {split ? (
        <div style={{ display: "flex", marginTop: 8 }}>
          {[rest.slice(0, mid), rest.slice(mid)].map((column, columnIndex) => (
            <div
              key={columnIndex}
              style={{
                display: "flex",
                flexDirection: "column",
                flex: 1,
                marginLeft: columnIndex === 1 ? 28 : 0,
              }}
            >
              {column.map((player, index) => (
                <RankRow
                  key={player.id}
                  player={player}
                  rank={4 + columnIndex * mid + index}
                  photo={photos.get(player.id) ?? null}
                  scale={tailScale}
                  fill={false}
                />
              ))}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}
