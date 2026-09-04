export type StandingsTeamRow = {
  rank: number
  teamId: number
  teamName: string
  logoUrl: string | null
  played: number
  win: number
  draw: number
  lose: number
  goalsFor: number
  goalsAgainst: number
  goalsDiff: number
  points: number
  form: string | null
  /** API note for the row, e.g. "Promotion - Champions League (Group Stage)". */
  description: string | null
}

export type StandingsGroup = {
  name: string
  teams: StandingsTeamRow[]
}

export type StandingsPayload = {
  leagueName: string
  season: number
  groups: StandingsGroup[]
}
