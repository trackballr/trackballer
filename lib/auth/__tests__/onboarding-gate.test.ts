import { describe, expect, it } from "vitest"

import { isOnboardingBypassPath } from "@/lib/auth/onboarding-gate"

describe("isOnboardingBypassPath", () => {
  it("allows guests to browse public routes", () => {
    expect(isOnboardingBypassPath("/")).toBe(true)
    expect(isOnboardingBypassPath("/match/123")).toBe(true)
    expect(isOnboardingBypassPath("/player/456")).toBe(true)
    expect(isOnboardingBypassPath("/country/26")).toBe(true)
  })

  it("allows onboarding and login for incomplete users", () => {
    expect(isOnboardingBypassPath("/onboarding")).toBe(true)
    expect(isOnboardingBypassPath("/login")).toBe(true)
    expect(isOnboardingBypassPath("/api/profile/username-available")).toBe(true)
  })

  it("blocks profile settings until onboarding completes", () => {
    expect(isOnboardingBypassPath("/profile")).toBe(false)
    expect(isOnboardingBypassPath("/u/chai")).toBe(false)
    expect(isOnboardingBypassPath("/settings")).toBe(false)
  })
})
