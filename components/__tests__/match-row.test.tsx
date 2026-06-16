import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { MatchRow } from "@/components/match-row"
import { matchRowFixture } from "@/lib/match/__tests__/fixtures"

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    className,
  }: {
    children: React.ReactNode
    href: string
    className?: string
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}))

vi.mock("next/image", () => ({
  default: ({ alt }: { alt: string }) => <img alt={alt} />,
}))

describe("MatchRow", () => {
  afterEach(() => {
    cleanup()
  })

  it("renders teams, score, FT status, and match link", () => {
    render(<MatchRow fixture={matchRowFixture({ id: 855736 })} />)

    expect(screen.getByRole("link", { name: "Brazil" })).toHaveAttribute("href", "/country/1")
    expect(screen.getByRole("link", { name: "Serbia" })).toHaveAttribute("href", "/country/2")
    expect(screen.getByRole("link", { name: "2 - 1 FT" })).toHaveAttribute("href", "/match/855736")
    expect(screen.getByText("FT")).toBeInTheDocument()
  })

  it("shows round name when showContext is on", () => {
    render(
      <MatchRow
        fixture={matchRowFixture({ id: 1, round_name: "Round of 16" })}
        showContext
      />,
    )

    expect(screen.getByText("Round of 16")).toBeInTheDocument()
  })

  it("hides round name when showContext is off", () => {
    render(
      <MatchRow
        fixture={matchRowFixture({ id: 99, round_name: "Round of 16" })}
      />,
    )

    expect(screen.queryByText("Round of 16")).not.toBeInTheDocument()
  })

  it("does not uppercase PEN status text", () => {
    render(
      <MatchRow
        fixture={matchRowFixture({
          id: 2,
          status_short: "PEN",
          home_goals_ft: 1,
          away_goals_ft: 1,
          home_goals_et: 1,
          away_goals_et: 1,
          home_goals_pen: 4,
          away_goals_pen: 2,
        })}
      />,
    )

    const penStatus = screen.getByText("PEN (4-2)")
    expect(penStatus).not.toHaveClass("uppercase")
  })

  it("uppercases FT status text", () => {
    const { container } = render(<MatchRow fixture={matchRowFixture({ id: 3 })} />)

    const status = container.querySelector('[class*="row-start-2"]')
    expect(status).toHaveTextContent("FT")
    expect(status).toHaveClass("uppercase")
  })
})
