import { describe, expect, it } from "vitest"

import { mapPlayerBrowseRow } from "@/lib/search/player-map"

describe("mapPlayerBrowseRow", () => {
  it("prefers first and last name for display", () => {
    const item = mapPlayerBrowseRow({
      id: 1,
      name: "Player 1",
      firstname: "Harry",
      lastname: "Kane",
      photo_url: null,
      nationality: "England",
      primary_position: "FWD",
      age: 31,
      club_team: { name: "Bayern Munich" },
      career: {
        display_score: 87,
        tier: "world_class",
        is_provisional: false,
      },
    })

    expect(item.displayName).toBe("Harry Kane")
    expect(item.displayScore).toBe(87)
    expect(item.clubName).toBe("Bayern Munich")
  })

  it("handles career aggregate returned as array", () => {
    const item = mapPlayerBrowseRow({
      id: 2,
      name: "Player 2",
      firstname: null,
      lastname: null,
      photo_url: null,
      nationality: null,
      primary_position: null,
      age: null,
      club_team: null,
      career: [
        {
          display_score: 6,
          tier: "good",
          is_provisional: true,
        },
      ],
    })

    expect(item.displayName).toBe("Player 2")
    expect(item.isProvisional).toBe(true)
    expect(item.tier).toBe("good")
  })

  it("works age out from the date of birth over the stored age", () => {
    const item = mapPlayerBrowseRow({
      id: 2,
      name: "Player 2",
      firstname: null,
      lastname: null,
      photo_url: null,
      nationality: null,
      primary_position: null,
      age: 1,
      birth_date: "2000-01-01",
      club_team: null,
      career: null,
    })

    expect(item.age).toBeGreaterThan(20)
  })

  it("falls back to the stored age without a date of birth", () => {
    const item = mapPlayerBrowseRow({
      id: 3,
      name: "Player 3",
      firstname: null,
      lastname: null,
      photo_url: null,
      nationality: null,
      primary_position: null,
      age: 27,
      birth_date: null,
      club_team: null,
      career: null,
    })

    expect(item.age).toBe(27)
  })
})
