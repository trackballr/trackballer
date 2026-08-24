import { CatalogImage } from "@/components/catalog-image"
import Link from "next/link"

import type { CompetitionStrip } from "@/lib/home/types"

type CompetitionStripProps = {
  strip: CompetitionStrip
}

function StripItem({ item }: { item: CompetitionStrip["featured"] }) {
  return (
    <Link
      href={item.href}
      className="flex w-14 shrink-0 flex-col items-center gap-1.5 transition-opacity hover:opacity-80"
    >
      <span className="flex size-12 items-center justify-center overflow-hidden rounded-full border border-border bg-muted text-xs font-bold text-muted-foreground">
        {item.logoUrl ? (
          <CatalogImage
            src={item.logoUrl}
            alt=""
            width={32}
            height={32}
            className="size-8 object-contain"
          />
        ) : (
          item.shortLabel
        )}
      </span>
      <span className="max-w-14 truncate text-center text-[10px] font-medium text-muted-foreground">
        {item.shortLabel}
      </span>
    </Link>
  )
}

export function CompetitionStrip({ strip }: CompetitionStripProps) {
  const allItems = [strip.featured, ...strip.others]

  return (
    <section aria-label="Competitions">
      <h2 className="sr-only">Competitions</h2>
      <p className="eyebrow mb-3">Competitions</p>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {allItems.map((item) => (
          <StripItem key={item.id} item={item} />
        ))}
      </div>
    </section>
  )
}
