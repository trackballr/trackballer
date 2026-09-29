import { countries } from "country-data-list"

/** API-Football nationality strings that do not match country-data-list names. */
const NATIONALITY_ALIASES: Record<string, string> = {
  england: "gb-eng",
  scotland: "gb-sct",
  wales: "gb-wls",
  "northern ireland": "gb-nir",
  usa: "us",
  "united states": "us",
  "korea republic": "kr",
  "south korea": "kr",
  "côte d'ivoire": "ci",
  "cote d'ivoire": "ci",
}

const byName = new Map<string, string>()
for (const country of countries.all) {
  const name = country.name?.trim().toLowerCase()
  const alpha2 = country.alpha2?.trim().toLowerCase()
  if (name && alpha2) {
    byName.set(name, alpha2)
  }
}

/** Lowercase alpha-2 (or gb-eng style) for react-circle-flags, or null if unknown. */
export function nationalityToAlpha2(nationality: string | null | undefined): string | null {
  if (!nationality?.trim()) return null

  const key = nationality.trim().toLowerCase()
  const alias = NATIONALITY_ALIASES[key]
  if (alias) return alias

  return byName.get(key) ?? null
}
