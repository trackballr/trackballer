import { describe, expect, it } from "vitest"

import {
  careerBlend,
  careerRingCssVar,
  careerRingTier,
  careerTierCssVar,
  careerTierLabel,
  formatCareerScore,
  normalizeCareerTierSlug,
  tierForScore,
} from "@/lib/rating/career-tier"

describe("normalizeCareerTierSlug", () => {
  it("maps known DB slugs", () => {
    expect(normalizeCareerTierSlug("world_class")).toBe("world_class")
    expect(normalizeCareerTierSlug("provisional")).toBe("provisional")
  })

  it("falls back to provisional for unknown", () => {
    expect(normalizeCareerTierSlug(null)).toBe("provisional")
    expect(normalizeCareerTierSlug("unknown")).toBe("provisional")
  })
})

describe("careerTierLabel", () => {
  it("returns human labels", () => {
    expect(careerTierLabel("world_class")).toBe("World Class")
    expect(careerTierLabel("provisional")).toBe("Provisional")
  })
})

describe("careerTierCssVar", () => {
  it("maps to design tokens", () => {
    expect(careerTierCssVar("world_class")).toBe("--rating-world-class")
    expect(careerTierCssVar("provisional")).toBe("--rating-provisional")
  })
})

describe("tierForScore", () => {
  it("uses locked boundaries on 1–100 scale", () => {
    expect(tierForScore(90)).toBe("elite")
    expect(tierForScore(89)).toBe("world_class")
    expect(tierForScore(90)).toBe("elite")
    expect(tierForScore(29)).toBe("unwatchable")
  })
})

describe("formatCareerScore", () => {
  it("formats as integer OVR", () => {
    expect(formatCareerScore(82)).toBe("82")
    expect(formatCareerScore(null)).toBe("-")
  })
})

describe("careerRingTier", () => {
  it("derives colour tier from score when provisional", () => {
    expect(careerRingTier("provisional", 82)).toBe("world_class")
    expect(careerRingCssVar("provisional", 82)).toBe("--rating-world-class")
  })

  it("keeps blended tier when not provisional", () => {
    expect(careerRingTier("elite", 92)).toBe("elite")
  })
})

describe("careerBlend", () => {
  it("keeps FM score before 10 votes", () => {
    expect(careerBlend(95, 81, 9)).toBe(81)
  })

  it("switches to blended score at exactly 10 votes", () => {
    expect(careerBlend(90, 80, 10)).toBe(82)
  })
})
