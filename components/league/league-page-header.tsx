import { CatalogImage } from "@/components/catalog-image"
import { getLeagueHubHeaderStyle, hasLeagueHubWhiteFade } from "@/lib/league/hub-theme"
import { cn } from "@/lib/utils"

type LeaguePageHeaderProps = {
  slug: string
  name: string
  country: string | null
  logoUrl: string | null
  /** Starting year of the season, e.g. 2026 renders "2026/27 Season". */
  seasonYear?: number
}

/** The white patch is a fixed colour, so text on it does not follow theme tokens. */
const ON_WHITE_TITLE = "oklch(0.145 0 0)"
const ON_WHITE_META = "oklch(0.5 0 0)"

function formatSeasonLabel(seasonYear: number): string {
  const next = String((seasonYear + 1) % 100).padStart(2, "0")
  return `${seasonYear}/${next} Season`
}

export function LeaguePageHeader({
  slug,
  name,
  country,
  logoUrl,
  seasonYear,
}: LeaguePageHeaderProps) {
  const style = getLeagueHubHeaderStyle(slug)
  /** The crest and title sit on the fixed white patch, so they need fixed dark text. */
  const onWhite = hasLeagueHubWhiteFade(slug)
  const titleColor = onWhite ? ON_WHITE_TITLE : style.color
  const metaColor = onWhite ? ON_WHITE_META : style.color
  const seasonLabel = seasonYear ? formatSeasonLabel(seasonYear) : null

  return (
    <header
      className={cn(
        "relative h-36 overflow-hidden md:h-40",
        onWhite && "league-banner-fade",
      )}
      style={style}
    >
      <div className="flex h-full items-center gap-4 px-4 lg:ml-[5%] lg:px-0 lg:pr-[5%]">
        <span className="flex size-20 shrink-0 items-center justify-center md:size-24">
          {logoUrl ? (
            <CatalogImage
              src={logoUrl}
              alt=""
              width={96}
              height={96}
              className="size-20 object-contain drop-shadow-sm md:size-24"
            />
          ) : (
            <span className="text-2xl font-bold" style={{ color: titleColor }}>
              {name.slice(0, 2).toUpperCase()}
            </span>
          )}
        </span>

        <div className="min-w-0">
          <h1
            className="font-display text-2xl leading-tight font-bold tracking-tight md:text-3xl"
            style={{ color: titleColor }}
          >
            {name}
          </h1>

          {country || seasonLabel ? (
            <p
              className="body-sm mt-1 flex flex-wrap items-center gap-x-2 gap-y-1"
              style={{ color: metaColor, opacity: onWhite ? 1 : 0.85 }}
            >
              {country ? <span className="font-medium">{country}</span> : null}
              {country && seasonLabel ? <span aria-hidden>•</span> : null}
              {seasonLabel ? <span>{seasonLabel}</span> : null}
            </p>
          ) : null}
        </div>
      </div>
    </header>
  )
}
