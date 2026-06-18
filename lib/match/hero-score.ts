import type { MatchScoreFixture } from "@/lib/match/score"

export type MatchHeroScore = {
  mainScore: string
  penLine: string | null
  statusText: string
  isLive: boolean
  /** True when the match hasn't kicked off — mainScore is the kickoff time. */
  isUpcoming: boolean
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

const TERMINAL = new Set(["FT", "AET", "PEN"])
const UPCOMING = new Set(["NS", "TBD"])
const INTERRUPTED = new Set(["PST", "CANC", "SUSP", "ABD", "AWD", "WO"])

function isLiveStatus(status: string): boolean {
  return !TERMINAL.has(status) && !UPCOMING.has(status) && !INTERRUPTED.has(status)
}

/** Large scoreboard line for match hero; separate pen subline when decided on pens. */
export function formatMatchHeroScore(fixture: MatchScoreFixture): MatchHeroScore {
  const status = fixture.status_short

  if (UPCOMING.has(status)) {
    return {
      mainScore: new Intl.DateTimeFormat("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "UTC",
      }).format(new Date(fixture.kickoff_at)),
      penLine: null,
      statusText: status,
      isLive: false,
      isUpcoming: true,
    }
  }

  if (isLiveStatus(status)) {
    const home = fixture.home_goals_ft ?? 0
    const away = fixture.away_goals_ft ?? 0
    return {
      mainScore: formatGoals(home, away),
      penLine: null,
      statusText: status === "HT" ? "HT" : "LIVE",
      isLive: true,
      isUpcoming: false,
    }
  }

  if (status === "PEN") {
    const [home, away] = afterExtraTimeGoals(fixture)
    const homePen = fixture.home_goals_pen
    const awayPen = fixture.away_goals_pen

    if (home != null && away != null) {
      return {
        mainScore: formatGoals(home, away),
        penLine:
          homePen != null && awayPen != null
            ? `Pen: ${homePen} - ${awayPen}`
            : null,
        statusText: "PEN",
        isLive: false,
        isUpcoming: false,
      }
    }
  }

  if (status === "AET") {
    const [home, away] = afterExtraTimeGoals(fixture)
    if (home != null && away != null) {
      return {
        mainScore: formatGoals(home, away),
        penLine: null,
        statusText: "AET",
        isLive: false,
        isUpcoming: false,
      }
    }
  }

  const home = fixture.home_goals_ft
  const away = fixture.away_goals_ft
  if (home != null && away != null) {
    return {
      mainScore: formatGoals(home, away),
      penLine: null,
      statusText: status,
      isLive: false,
      isUpcoming: false,
    }
  }

  return {
    mainScore: "–",
    penLine: null,
    statusText: status,
    isLive: false,
    isUpcoming: false,
  }
}
