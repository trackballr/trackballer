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
