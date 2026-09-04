type RangeOptions = {
  /** Format in UTC — use for the first paint, before the local swap. */
  utc?: boolean
}

/** en-GB day order with en-US month names, so September reads "Sep", not "Sept". */
function dayMonth(date: Date, utc: boolean): string {
  const zone = utc ? { timeZone: "UTC" } : {}
  const day = new Intl.DateTimeFormat("en-GB", { day: "numeric", ...zone }).format(date)
  const month = new Intl.DateTimeFormat("en-US", { month: "short", ...zone }).format(date)
  return `${day} ${month}`
}

function year(date: Date, utc: boolean): string {
  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    ...(utc ? { timeZone: "UTC" } : {}),
  }).format(date)
}

/** Kickoff span of a round — e.g. "5 Sep – 6 Sep 2026", or "5 Sep 2026" for one day. */
export function formatRoundDateRange(
  kickoffs: string[],
  { utc = false }: RangeOptions = {},
): string | null {
  const times = kickoffs
    .map((iso) => new Date(iso).getTime())
    .filter((time) => Number.isFinite(time))

  if (times.length === 0) return null

  const first = new Date(Math.min(...times))
  const last = new Date(Math.max(...times))
  const firstLabel = dayMonth(first, utc)
  const lastLabel = dayMonth(last, utc)
  const lastYear = year(last, utc)

  if (firstLabel === lastLabel && year(first, utc) === lastYear) {
    return `${firstLabel} ${lastYear}`
  }

  return `${firstLabel} – ${lastLabel} ${lastYear}`
}
