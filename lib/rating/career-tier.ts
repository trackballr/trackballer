/** DB tier slugs from player_career_aggregates.tier */
export type CareerTierSlug =
  | "provisional"
  | "elite"
  | "world_class"
  | "great"
  | "good"
  | "average"
  | "below_average"
  | "bad"
  | "unwatchable"

const TIER_LABELS: Record<CareerTierSlug, string> = {
  provisional: "Provisional",
  elite: "Elite",
  world_class: "World Class",
  great: "Great",
  good: "Good",
  average: "Average",
  below_average: "Below Average",
  bad: "Bad",
  unwatchable: "Unwatchable",
}

/** CSS custom property names (--rating-elite, etc.) */
const TIER_CSS_VARS: Record<CareerTierSlug, string> = {
  provisional: "--rating-provisional",
  elite: "--rating-elite",
  world_class: "--rating-world-class",
  great: "--rating-great",
  good: "--rating-good",
  average: "--rating-average",
  below_average: "--rating-below-average",
  bad: "--rating-bad",
  unwatchable: "--rating-unwatchable",
}

export const CAREER_RATING_MIN = 1
export const CAREER_RATING_MAX = 100
export const CAREER_RATING_DEFAULT = 75

export function normalizeCareerTierSlug(tier: string | null | undefined): CareerTierSlug {
  const key = tier?.trim().toLowerCase()
  if (key && key in TIER_LABELS) return key as CareerTierSlug
  return "provisional"
}

export function careerTierLabel(tier: string | null | undefined): string {
  return TIER_LABELS[normalizeCareerTierSlug(tier)]
}

export function careerTierCssVar(tier: string | null | undefined): string {
  return TIER_CSS_VARS[normalizeCareerTierSlug(tier)]
}

/** Ring colour from public score — provisional DB tier stays grey unless we derive from score. */
export function careerRingTier(
  tier: string | null | undefined,
  displayScore: number | null | undefined,
): CareerTierSlug {
  const slug = normalizeCareerTierSlug(tier)
  if (slug !== "provisional") return slug
  if (displayScore == null || Number.isNaN(displayScore)) return "average"
  return tierForScore(displayScore)
}

export function careerRingCssVar(
  tier: string | null | undefined,
  displayScore: number | null | undefined,
): string {
  return TIER_CSS_VARS[careerRingTier(tier, displayScore)]
}

/** Locked thresholds on 1–100 scale — used when blending kicks in. */
export function tierForScore(score: number): CareerTierSlug {
  if (score >= 90) return "elite"
  if (score >= 80) return "world_class"
  if (score >= 70) return "great"
  if (score >= 60) return "good"
  if (score >= 50) return "average"
  if (score >= 40) return "below_average"
  if (score >= 30) return "bad"
  return "unwatchable"
}

/**
 * Public career score switches from FM-only to blended once votes reach 10.
 * Blend formula: 20% community mean + 80% FM base (all on 1–100 scale).
 */
export function careerBlend(
  meanUserRating: number | null | undefined,
  fmBase: number | null | undefined,
  voteCount: number,
): number {
  const fm = fmBase ?? 50
  if (voteCount < 10 || meanUserRating == null) return fm
  return Math.round(meanUserRating * 0.2 + fm * 0.8)
}

/** Integer OVR on the career ring card. */
export function formatCareerScore(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "-"
  return String(Math.round(value))
}

export const PROVISIONAL_CAREER_COPY =
  "Provisional · Base Rating until 10 community ratings"
