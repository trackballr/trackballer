"use client"

import { useEffect, useRef } from "react"

/**
 * Publishes the sticky site header's height as --site-header-h on <html> so
 * page-level sticky bars can sit right under it (mobile adds a second nav row).
 */
export function HeaderHeightSync() {
  const markerRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const header = markerRef.current?.closest("header")
    if (!header) return

    const root = document.documentElement
    const update = () =>
      root.style.setProperty("--site-header-h", `${header.getBoundingClientRect().height}px`)

    update()
    const observer = new ResizeObserver(update)
    observer.observe(header)
    return () => observer.disconnect()
  }, [])

  return <span ref={markerRef} hidden />
}
