import { describe, expect, it } from "vitest"

import {
  carryAssignmentsToFormation,
  countFilledSlots,
  FORMATION_TEMPLATES,
  formationSlotKeys,
  getFormationTemplate,
  getSlotPosition,
  swapSlotAssignments,
} from "../formation-slots"

describe("formation-slots", () => {
  it("each template has eleven unique slots", () => {
    for (const template of FORMATION_TEMPLATES) {
      expect(template.slots).toHaveLength(11)
      const keys = template.slots.map((s) => s.key)
      expect(new Set(keys).size).toBe(11)
    }
  })

  it("formationSlotKeys matches template", () => {
    expect(formationSlotKeys("4-4-2")).toEqual(
      getFormationTemplate("4-4-2").slots.map((s) => s.key),
    )
  })

  it("getSlotPosition maps horizontal coords from vertical", () => {
    const gk = getFormationTemplate("4-3-3").slots.find((s) => s.key === "gk")!
    expect(getSlotPosition(gk, "vertical")).toEqual({ top: 88, left: 50 })
    expect(getSlotPosition(gk, "horizontal")).toEqual({ top: 50, left: 12 })
  })

  it("countFilledSlots counts assigned keys only", () => {
    const keys = formationSlotKeys("4-3-3")
    expect(countFilledSlots(keys, { gk: {}, st: {} })).toBe(2)
  })

  it("swapSlotAssignments trades two filled slots", () => {
    const next = swapSlotAssignments({ lm: "Modric", rm: "Rabiot", cm: "Tonali" }, "lm", "rm")
    expect(next).toEqual({ lm: "Rabiot", rm: "Modric", cm: "Tonali" })
  })

  it("swapSlotAssignments moves a player into an empty slot", () => {
    const next = swapSlotAssignments<string>({ lm: "Modric" }, "lm", "rm")
    expect(next.rm).toBe("Modric")
    expect(next.lm).toBeUndefined()
  })

  it("swapSlotAssignments ignores an empty source or the same slot", () => {
    const start = { lm: "Modric" }
    expect(swapSlotAssignments(start, "rm", "lm")).toBe(start)
    expect(swapSlotAssignments(start, "lm", "lm")).toBe(start)
  })

  it("carryAssignmentsToFormation keeps every player, slot for slot", () => {
    const from = formationSlotKeys("4-3-3")
    const filled = Object.fromEntries(from.map((key, index) => [key, `P${index}`]))
    const next = carryAssignmentsToFormation(filled, "4-3-3", "3-5-2")

    const to = formationSlotKeys("3-5-2")
    expect(countFilledSlots(to, next)).toBe(11)
    expect(next[to[0]!]).toBe("P0")
    expect(next.gk).toBe("P0")
  })
})
