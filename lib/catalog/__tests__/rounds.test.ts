import { describe, expect, it } from "vitest"

import {
  leagueRoundSortKey,
  mergeCatalogRounds,
  sortRoundNames,
} from "@/lib/catalog/rounds"

describe("sortRoundNames", () => {
  it("orders regular season matchweeks numerically", () => {
    expect(
      sortRoundNames([
        "Regular Season - 10",
        "Regular Season - 2",
        "Regular Season - 38",
      ]),
    ).toEqual(["Regular Season - 2", "Regular Season - 10", "Regular Season - 38"])
  })

  it("puts unknown round labels after numbered matchweeks", () => {
    expect(leagueRoundSortKey("Playoffs")).toBeGreaterThan(
      leagueRoundSortKey("Regular Season - 38"),
    )
  })
})

describe("mergeCatalogRounds", () => {
  it("keeps later matchweeks when the rounds table only has a preponed week", () => {
    const merged = mergeCatalogRounds(
      8,
      [
        {
          id: 99,
          season_id: 8,
          name: "Regular Season - 6",
          sort_order: 5,
        },
      ],
      ["Regular Season - 4", "Regular Season - 5", "Regular Season - 6"],
    )

    expect(merged.map((round) => round.name)).toEqual([
      "Regular Season - 4",
      "Regular Season - 5",
      "Regular Season - 6",
    ])
    expect(merged[2]?.id).toBe(99)
  })
})
