import { CatalogImage } from "@/components/catalog-image"

import { formatLeagueRoundLabel } from "@/lib/league/round-label"

type LeaguePageHeaderProps = {
  name: string
  country: string | null
  logoUrl: string | null
  activeRound: string
}

export function LeaguePageHeader({
  name,
  country,
  logoUrl,
  activeRound,
}: LeaguePageHeaderProps) {
  const roundLabel = formatLeagueRoundLabel(activeRound) ?? activeRound

  return (
    <>
      <div className="mb-2 flex items-center gap-3">
        <span className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-primary bg-primary/10 text-sm font-bold text-primary">
          {logoUrl ? (
            <CatalogImage
              src={logoUrl}
              alt=""
              width={40}
              height={40}
              className="size-10 object-contain"
            />
          ) : (
            name.slice(0, 2).toUpperCase()
          )}
        </span>
        <div>
          <h1 className="h-display">{name}</h1>
          {country ? (
            <p className="body-sm text-muted-foreground">{country}</p>
          ) : null}
        </div>
      </div>
      <p className="body-sm mb-6 text-muted-foreground">
        <span className="font-semibold text-foreground">Current round:</span> {roundLabel}
      </p>
    </>
  )
}
