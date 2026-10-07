"use client"

import { useCallback, useState, useTransition } from "react"

import { useInfiniteScroll } from "@/components/comment/use-infinite-scroll"
import { RatingHistoryRow, ratingKey } from "@/components/profile/recent-ratings-list"
import { Panel, PanelEmpty, PanelList } from "@/components/ui/panel"
import { fetchRatingHistoryPageAction } from "@/lib/profile/actions/fetch-history"
import type {
  RatingHistoryCursor,
  RatingHistoryPage,
  RatingKind,
  RecentRatingItem,
} from "@/lib/profile/types"

const monthFormat = new Intl.DateTimeFormat("en-GB", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
})

/** Month buckets in UTC so the server render and hydration agree. */
function groupByMonth(items: RecentRatingItem[]) {
  const groups: { label: string; items: RecentRatingItem[] }[] = []
  for (const item of items) {
    const label = monthFormat.format(new Date(item.ratedAt))
    const last = groups.at(-1)
    if (last?.label === label) last.items.push(item)
    else groups.push({ label, items: [item] })
  }
  return groups
}

type RatingHistoryListProps = {
  userId: string
  kind: RatingKind | null
  initialPage: RatingHistoryPage
}

export function RatingHistoryList({ userId, kind, initialPage }: RatingHistoryListProps) {
  const [items, setItems] = useState(initialPage.items)
  const [cursor, setCursor] = useState<RatingHistoryCursor | null>(initialPage.nextCursor)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  const loadMore = useCallback(() => {
    if (!cursor || isLoading) return
    setIsLoading(true)
    startTransition(async () => {
      const result = await fetchRatingHistoryPageAction({ userId, kind, cursor })
      setIsLoading(false)
      if (!result.ok) {
        setError(result.error)
        return
      }
      setItems((prev) => {
        const seen = new Set(prev.map(ratingKey))
        return [...prev, ...result.items.filter((item) => !seen.has(ratingKey(item)))]
      })
      setCursor(result.nextCursor)
    })
  }, [cursor, isLoading, userId, kind])

  const sentinelRef = useInfiniteScroll({
    hasMore: cursor != null && error == null,
    isLoading,
    onLoadMore: loadMore,
  })

  if (items.length === 0) {
    return (
      <Panel className="pt-4">
        <PanelEmpty>
          {kind === "career"
            ? "No career ratings yet."
            : kind === "match"
              ? "No match ratings yet."
              : "No ratings yet."}
        </PanelEmpty>
      </Panel>
    )
  }

  return (
    <Panel className="py-2">
      {groupByMonth(items).map((group) => (
        <section key={group.label}>
          <h2 className="mx-3 mt-2 rounded-md bg-muted px-3 py-2 text-sm font-semibold">
            {group.label}
          </h2>
          <PanelList>
            {group.items.map((rating) => (
              <RatingHistoryRow key={ratingKey(rating)} rating={rating} />
            ))}
          </PanelList>
        </section>
      ))}

      {error ? (
        <p className="px-5 py-4 text-center text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : cursor ? (
        <div ref={sentinelRef} className="py-4 text-center text-sm text-muted-foreground">
          {isLoading ? "Loading older ratings…" : null}
        </div>
      ) : null}
    </Panel>
  )
}
