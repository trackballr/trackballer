"use client"

import { Popover as PopoverPrimitive } from "@base-ui/react/popover"
import { useRouter } from "nextjs-toploader/app"
import { useEffect, useRef, useState } from "react"
import { Loader2, Search } from "lucide-react"

import { PlayerResultRow } from "@/components/search/player-result-row"
import { HydrationGate } from "@/components/hydration-gate"
import { Input } from "@/components/ui/input"
import { useDebounce } from "@/hooks/use-debounce"
import type { PlayerListItem } from "@/lib/search/types"
import { cn } from "@/lib/utils"

type NavSearchVariant = "header" | "menu"

type NavSearchProps = {
  variant?: NavSearchVariant
  onResultSelect?: () => void
}

function NavSearchFallback({ variant }: { variant: NavSearchVariant }) {
  if (variant === "menu") {
    return (
      <div className="h-9 w-full rounded-lg border border-border bg-muted/30" aria-hidden />
    )
  }

  return (
    <div
      className="h-8 w-full max-w-[280px] rounded-lg border border-border bg-muted/30"
      aria-hidden
    />
  )
}

export function NavSearch({ variant = "header", onResultSelect }: NavSearchProps) {
  const router = useRouter()
  const anchorRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const popupRef = useRef<HTMLDivElement>(null)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<PlayerListItem[]>([])
  const [isSearching, setIsSearching] = useState(false)

  const debouncedQuery = useDebounce(query, 300)
  const dropdownOpen = query.trim().length >= 1
  const isMenu = variant === "menu"

  useEffect(() => {
    if (!dropdownOpen) return

    const frame = requestAnimationFrame(() => {
      const input = inputRef.current
      if (!input) return

      const active = document.activeElement
      const focusStolen =
        active !== input && !popupRef.current?.contains(active)

      if (focusStolen) {
        input.focus({ preventScroll: true })
      }
    })

    return () => cancelAnimationFrame(frame)
  }, [dropdownOpen, query.length, isSearching, results.length])

  useEffect(() => {
    if (debouncedQuery.trim().length < 1) {
      setResults([])
      setIsSearching(false)
      return
    }

    let cancelled = false
    setIsSearching(true)

    fetch(`/api/search/players?q=${encodeURIComponent(debouncedQuery.trim())}`)
      .then((res) => res.json())
      .then((data: PlayerListItem[]) => {
        if (!cancelled) setResults(Array.isArray(data) ? data : [])
      })
      .catch(() => {
        if (!cancelled) setResults([])
      })
      .finally(() => {
        if (!cancelled) setIsSearching(false)
      })

    return () => {
      cancelled = true
    }
  }, [debouncedQuery])

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      if (query.trim().length >= 1 && inputRef.current === document.activeElement) {
        return
      }
      setQuery("")
      setResults([])
      setIsSearching(false)
    }
  }

  function handleResultClick(playerId: number) {
    setQuery("")
    setResults([])
    onResultSelect?.()
    router.push(`/player/${playerId}`)
  }

  const showSpinner = isSearching && results.length === 0
  const showEmpty =
    !isSearching && debouncedQuery.trim().length >= 1 && results.length === 0
  const showResults = results.length > 0

  return (
    <HydrationGate fallback={<NavSearchFallback variant={variant} />}>
      <PopoverPrimitive.Root
        open={dropdownOpen}
        onOpenChange={handleOpenChange}
        modal={false}
      >
        <div
          ref={anchorRef}
          className={cn(
            "relative min-w-0",
            isMenu ? "w-full" : "w-full max-w-[280px]",
          )}
        >
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 z-10 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search players…"
            className={cn("w-full pl-8", isMenu ? "h-9" : "h-8")}
            aria-label="Search players"
            aria-expanded={dropdownOpen}
            aria-autocomplete="list"
          />
        </div>

        <PopoverPrimitive.Portal>
          <PopoverPrimitive.Positioner
            anchor={anchorRef}
            side="bottom"
            align="start"
            sideOffset={4}
            className="isolate z-60"
          >
            <PopoverPrimitive.Popup
              ref={popupRef}
              initialFocus={false}
              finalFocus={inputRef}
              className={cn(
                "z-60 w-(--anchor-width) rounded-lg bg-popover p-0 text-popover-foreground shadow-md ring-1 ring-foreground/10 outline-hidden",
                !isMenu && "max-w-[280px]",
              )}
            >
              {showSpinner ? (
                <div className="flex items-center gap-2 px-3 py-4 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Searching…
                </div>
              ) : showEmpty ? (
                <p className="px-3 py-4 text-sm text-muted-foreground">No players found</p>
              ) : showResults ? (
                <div className="max-h-64 overflow-y-auto">
                  {isSearching ? (
                    <div className="flex items-center gap-2 border-b border-border px-3 py-2 text-xs text-muted-foreground">
                      <Loader2 className="size-3.5 animate-spin" aria-hidden />
                      Updating…
                    </div>
                  ) : null}
                  {results.map((player) => (
                    <button
                      key={player.id}
                      type="button"
                      className="w-full text-left"
                      onMouseDown={(event) => {
                        event.preventDefault()
                        handleResultClick(player.id)
                      }}
                    >
                      <PlayerResultRow player={player} dense />
                    </button>
                  ))}
                </div>
              ) : (
                <p className="px-3 py-4 text-sm text-muted-foreground">Type to search players</p>
              )}
            </PopoverPrimitive.Popup>
          </PopoverPrimitive.Positioner>
        </PopoverPrimitive.Portal>
      </PopoverPrimitive.Root>
    </HydrationGate>
  )
}
