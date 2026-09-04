import { CatalogImage } from "@/components/catalog-image"
import { getLeagueHubHeaderStyle } from "@/lib/league/hub-theme"

type LeaguePageHeaderProps = {
  slug: string
  name: string
  country: string | null
  logoUrl: string | null
}

export function LeaguePageHeader({
  slug,
  name,
  country,
  logoUrl,
}: LeaguePageHeaderProps) {
  const style = getLeagueHubHeaderStyle(slug)

  return (
    <header
      className="relative h-36 overflow-hidden md:h-40"
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
            <span className="text-2xl font-bold" style={{ color: style.color }}>
              {name.slice(0, 2).toUpperCase()}
            </span>
          )}
        </span>
        <div className="min-w-0">
          <h1 className="h-display text-inherit drop-shadow-sm">{name}</h1>
          {country ? (
            <p className="body-sm mt-1 opacity-80">{country}</p>
          ) : null}
        </div>
      </div>
    </header>
  )
}
