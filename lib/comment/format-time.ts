/** Stable date label for SSR — fixed locale/timezone so server and browser match. */
export function formatCommentDate(dateString: string): string {
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return "-"

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date)
}

/** Relative label for recent comments; falls back to formatCommentDate after 7 days. */
export function getCommentTimeSince(dateString: string, nowMs = Date.now()): string {
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return "-"

  const seconds = Math.floor((nowMs - date.getTime()) / 1000)

  if (seconds < 60) return "now"
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`

  return formatCommentDate(dateString)
}
