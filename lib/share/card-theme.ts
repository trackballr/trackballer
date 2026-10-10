import { careerRingTier, type CareerTierSlug } from "@/lib/rating/career-tier"

/**
 * Site colours as hex for the share card picture — the picture renderer does
 * not read CSS variables or oklch. Keep in step with app/globals.css.
 */
export const CARD_COLORS = {
  /** --primary */
  navy: "#121f4f",
  white: "#ffffff",
  /** White text at reduced strength on navy. */
  whiteSoft: "rgba(255, 255, 255, 0.72)",
  whiteFaint: "rgba(255, 255, 255, 0.5)",
  hairline: "rgba(255, 255, 255, 0.16)",
  hotBg: "rgba(249, 115, 22, 0.2)",
  hotText: "#fdba74",
} as const

/** --rating-* ring colours. */
const TIER_RING: Record<CareerTierSlug, string> = {
  elite: "#e0af3b",
  world_class: "#0278e7",
  great: "#00713e",
  good: "#67bb6b",
  average: "#ef852e",
  below_average: "#d73337",
  bad: "#892122",
  unwatchable: "#6d2731",
  provisional: "#b8b8b1",
}

/** Same hues, lifted where the ring colour is too dark to read as text on navy. */
const TIER_TEXT_ON_NAVY: Record<CareerTierSlug, string> = {
  ...TIER_RING,
  world_class: "#5fa7ff",
  great: "#4bc680",
  below_average: "#fd736d",
  bad: "#ef6661",
  unwatchable: "#dc747e",
}

export function cardRingColor(tier: string | null, score: number): string {
  return TIER_RING[careerRingTier(tier, score)]
}

export function cardTierTextColor(tier: string | null, score: number): string {
  return TIER_TEXT_ON_NAVY[careerRingTier(tier, score)]
}
