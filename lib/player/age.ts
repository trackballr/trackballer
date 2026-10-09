/** Whole years since birth — same calendar-day rule as onboarding 18+ check. */
export function computeAgeFromBirthDate(
  dateOfBirth: string,
  asOf: Date = new Date(),
): number | null {
  const dob = new Date(`${dateOfBirth.slice(0, 10)}T00:00:00Z`)
  if (Number.isNaN(dob.getTime())) return null

  let age = asOf.getUTCFullYear() - dob.getUTCFullYear()
  const monthDiff = asOf.getUTCMonth() - dob.getUTCMonth()
  if (monthDiff < 0 || (monthDiff === 0 && asOf.getUTCDate() < dob.getUTCDate())) {
    age -= 1
  }
  return age >= 0 ? age : null
}

/**
 * Latest birth date (YYYY-MM-DD, UTC) for someone who is at least `years` old
 * on `asOf` — the cut-off for age filters. A 29 February birthday falls back to
 * the 28th in years without one, matching computeAgeFromBirthDate.
 */
export function latestBirthDateForAge(years: number, asOf: Date = new Date()): string {
  const year = asOf.getUTCFullYear() - years
  const month = asOf.getUTCMonth()
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
  const day = Math.min(asOf.getUTCDate(), daysInMonth)
  return new Date(Date.UTC(year, month, day)).toISOString().slice(0, 10)
}
