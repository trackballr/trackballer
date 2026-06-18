import type { FixtureRow } from "@/lib/catalog/types"

export type MatchScoreFixture = Pick<
  FixtureRow,
  | "status_short"
  | "kickoff_at"
  | "home_goals_ft"
  | "away_goals_ft"
  | "home_goals_et"
  | "away_goals_et"
  | "home_goals_pen"
  | "away_goals_pen"
>

export type MatchScoreDisplay = {
  /** Main score line, e.g. "2–1", "0–0", or "18:00" for upcoming */
  scoreline: string
  /** Badge under score: FT, AET, PEN (4-2), LIVE, NS, … */
  statusLabel: string
  isLive: boolean
}

const TERMINAL = new Set(["FT", "AET", "PEN"])
const UPCOMING = new Set(["NS", "TBD"])
const INTERRUPTED = new Set(["PST", "CANC", "SUSP", "ABD", "AWD", "WO"])

function isLiveStatus(status: string): boolean {
  return !TERMINAL.has(status) && !UPCOMING.has(status) && !INTERRUPTED.has(status)
}

function formatGoals(home: number, away: number): string {
  return `${home} - ${away}`
}

function afterExtraTimeGoals(fixture: MatchScoreFixture): [number | null, number | null] {
  if (fixture.home_goals_et != null && fixture.away_goals_et != null) {
    return [fixture.home_goals_et, fixture.away_goals_et]
  }
  return [fixture.home_goals_ft, fixture.away_goals_ft]
}

const KICKOFF_LOCALE = "en-GB"
/** Same zone on server and browser — avoids hydration mismatch from OS defaults. */
const KICKOFF_TIME_ZONE = "UTC"

const KICKOFF_DATETIME_OPTIONS: Intl.DateTimeFormatOptions = {
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
}

function formatKickoffTime(iso: string): string {
  return new Intl.DateTimeFormat(KICKOFF_LOCALE, {
    hour: "numeric",
    minute: "2-digit",
    hour12: false,
    timeZone: KICKOFF_TIME_ZONE,
  }).format(new Date(iso))
}

/** Viewer-local kickoff line — use in the browser (e.g. match hero). */
export function formatMatchKickoffLocal(iso: string): string {
  return new Intl.DateTimeFormat(KICKOFF_LOCALE, KICKOFF_DATETIME_OPTIONS).format(
    new Date(iso),
  )
}

/** Viewer-local 24h kickoff clock — e.g. "16:00" for the match hero. */
export function formatKickoffClockLocal(iso: string): string {
  return new Intl.DateTimeFormat(KICKOFF_LOCALE, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso))
}

/** Viewer-local kickoff time only — e.g. "12:30 am" for fixture list rows. */
export function formatKickoffTimeLocal(iso: string): string {
  return new Intl.DateTimeFormat(KICKOFF_LOCALE, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(iso))
}

/** Viewer-local kickoff day under the time — e.g. "Fri, 12 Jun". */
export function formatKickoffDateLocalShort(iso: string): string {
  return new Intl.DateTimeFormat(KICKOFF_LOCALE, {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date(iso))
}

/** Viewer-local date heading for fixture groups — e.g. "Friday, 12 June". */
export function formatMatchKickoffDateHeadingLocal(iso: string): string {
  return new Intl.DateTimeFormat(KICKOFF_LOCALE, {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(iso))
}

/** Stable local calendar key for grouping fixtures by the viewer's day. */
export function kickoffLocalDateKey(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso))
}

/** UTC date heading for fixture groups — e.g. "Friday, 12 June". */
export function formatMatchKickoffDateHeading(iso: string): string {
  return new Intl.DateTimeFormat(KICKOFF_LOCALE, {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: KICKOFF_TIME_ZONE,
  }).format(new Date(iso))
}

/** UTC kickoff day — e.g. "Thu 11 Jun". Stable for server-rendered list rows. */
export function formatMatchKickoffDate(iso: string): string {
  return new Intl.DateTimeFormat(KICKOFF_LOCALE, {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: KICKOFF_TIME_ZONE,
  }).format(new Date(iso))
}

/** UTC kickoff line — stable for server render and compact list rows. */
export function formatMatchKickoffDateTime(iso: string): string {
  return new Intl.DateTimeFormat(KICKOFF_LOCALE, {
    ...KICKOFF_DATETIME_OPTIONS,
    timeZone: KICKOFF_TIME_ZONE,
  }).format(new Date(iso))
}

export function formatMatchScore(fixture: MatchScoreFixture): MatchScoreDisplay {
  const { status_short: status } = fixture

  if (UPCOMING.has(status)) {
    return {
      scoreline: formatKickoffTime(fixture.kickoff_at),
      statusLabel: status === "NS" ? "Yet to start" : status,
      isLive: false,
    }
  }

  if (INTERRUPTED.has(status)) {
    return {
      scoreline: "–",
      statusLabel: status,
      isLive: false,
    }
  }

  if (status === "PEN") {
    const [home, away] = afterExtraTimeGoals(fixture)
    const homePen = fixture.home_goals_pen
    const awayPen = fixture.away_goals_pen

    if (home != null && away != null && homePen != null && awayPen != null) {
      return {
        scoreline: formatGoals(home, away),
        statusLabel: `PEN (${homePen}-${awayPen})`,
        isLive: false,
      }
    }
  }

  if (status === "AET") {
    const [home, away] = afterExtraTimeGoals(fixture)
    if (home != null && away != null) {
      return {
        scoreline: formatGoals(home, away),
        statusLabel: "AET",
        isLive: false,
      }
    }
  }

  if (status === "FT" || TERMINAL.has(status)) {
    const home = fixture.home_goals_ft
    const away = fixture.away_goals_ft
    if (home != null && away != null) {
      return {
        scoreline: formatGoals(home, away),
        statusLabel: status,
        isLive: false,
      }
    }
  }

  if (isLiveStatus(status)) {
    const home = fixture.home_goals_ft ?? 0
    const away = fixture.away_goals_ft ?? 0
    return {
      scoreline: formatGoals(home, away),
      statusLabel: status === "HT" ? "HT" : "LIVE",
      isLive: true,
    }
  }

  return {
    scoreline: "–",
    statusLabel: status,
    isLive: false,
  }
}
