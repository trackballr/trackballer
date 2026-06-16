export type CountryCoach = {
  name: string
  photoUrl: string | null
}

export type NationalTeamProfile = {
  id: number
  name: string
  code: string | null
  logoUrl: string | null
  country: string | null
  coach: CountryCoach | null
  homeVenue: string | null
  competitionLabel: string
}

export type CountryPageParams = {
  view: "upcoming" | "finished"
  page: number
  sort: "rating-desc" | "rating-asc"
}
