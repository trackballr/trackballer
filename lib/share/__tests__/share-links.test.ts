import { describe, expect, it } from "vitest"

import {
  careerGapLabel,
  careerShareCardPath,
  careerSharePath,
  careerShareText,
  isCareerHotTake,
  xShareUrl,
} from "@/lib/share/share-links"

describe("career share links", () => {
  it("builds the public page and card paths", () => {
    expect(careerSharePath("chai_7", 874)).toBe("/u/chai_7/rated/874")
    expect(careerShareCardPath("chai_7", 874)).toBe("/u/chai_7/rated/874/card")
    expect(careerShareCardPath("chai_7", 874, 1760000000)).toBe(
      "/u/chai_7/rated/874/card?v=1760000000",
    )
  })

  it("flags a hot take at 15 or more away from the public score", () => {
    expect(isCareerHotTake(97, 82)).toBe(true)
    expect(isCareerHotTake(70, 85)).toBe(true)
    expect(isCareerHotTake(90, 80)).toBe(false)
  })

  it("describes the gap against fans or the base rating", () => {
    expect(careerGapLabel(97, 94, false)).toBe("3 above the fans")
    expect(careerGapLabel(80, 94, false)).toBe("14 below the fans")
    expect(careerGapLabel(94, 94, false)).toBe("Same as the fans")
    expect(careerGapLabel(97, 94, true)).toBe("3 above the base rating")
  })

  it("writes the post text and X link", () => {
    const text = careerShareText({
      playerName: "Cristiano Ronaldo",
      rating: 97,
      publicScore: 94,
      isProvisional: false,
    })
    expect(text).toBe("I rated Cristiano Ronaldo 97 on Trackballr. Fans say 94. What's yours?")

    expect(
      careerShareText({
        playerName: "Cristiano Ronaldo",
        rating: 97,
        publicScore: 94,
        isProvisional: true,
        byUsername: "chai_7",
      }),
    ).toBe("@chai_7 rated Cristiano Ronaldo 97 on Trackballr. Base rating is 94. What's yours?")

    const url = xShareUrl(text, "https://www.trackballr.com/u/chai_7/rated/874")
    expect(url.startsWith("https://x.com/intent/post?")).toBe(true)
    expect(new URL(url).searchParams.get("url")).toBe(
      "https://www.trackballr.com/u/chai_7/rated/874",
    )
  })
})
