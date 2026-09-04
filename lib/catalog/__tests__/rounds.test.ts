import { describe, expect, it } from "vitest"

import { leagueRoundSortKey, sortRoundNames } from "@/lib/catalog/rounds"

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
