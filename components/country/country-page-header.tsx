import { CatalogImage } from "@/components/catalog-image"

type CountryPageHeaderProps = {
  name: string
  logoUrl: string | null
  code: string | null
}

export function CountryPageHeader({ name, logoUrl, code }: CountryPageHeaderProps) {
  const fallback = code?.slice(0, 3).toUpperCase() ?? name.slice(0, 2).toUpperCase()

  return (
    <header className="mb-6 flex min-w-0 items-center gap-3 sm:gap-4">
      {logoUrl ? (
        <CatalogImage
          src={logoUrl}
          alt=""
          width={56}
          height={56}
          className="h-10 w-auto max-w-14 shrink-0 object-contain sm:h-12 sm:max-w-16 md:h-14 md:max-w-[4.5rem]"
        />
      ) : (
        <span
          aria-hidden
          className="shrink-0 font-mono text-sm font-bold uppercase text-muted-foreground sm:text-base"
        >
          {fallback}
        </span>
      )}
      <h1 className="h-display min-w-0 truncate leading-tight">{name}</h1>
    </header>
  )
}
