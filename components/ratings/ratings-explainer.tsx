import Link from "next/link"

import { PROVISIONAL_CAREER_COPY } from "@/lib/rating/career-tier"

const CAREER_TIERS = [
  { range: "90–100", label: "Elite" },
  { range: "80–89", label: "World Class" },
  { range: "70–79", label: "Great" },
  { range: "60–69", label: "Good" },
  { range: "50–59", label: "Average" },
  { range: "40–49", label: "Below Average" },
  { range: "30–39", label: "Bad" },
  { range: "1–29", label: "Unwatchable" },
]

export function RatingsExplainer() {
  return (
    <div className="mx-auto max-w-2xl space-y-10 px-4 py-8">
      <header>
        <p className="eyebrow mb-2">Guide</p>
        <h1 className="h-display mb-3">How ratings work</h1>
        <p className="body-sm text-muted-foreground">
          Penaltyboxd has two ways to score players — a career rating (like FIFA overall)
          and a match rating (how they played in one game).
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="h3">Career rating (1–100)</h2>
        <p className="body-sm text-muted-foreground">
          Every player has an overall career score shown as a coloured ring on their
          profile. Higher is better — think FIFA-style OVR.
        </p>
        <ul className="body-sm list-disc space-y-2 pl-5 text-muted-foreground">
          <li>
            <strong className="text-foreground">Provisional score:</strong> until 10 fans
            rate a player&apos;s career, the score is a base rating from our catalog data.{" "}
            <span className="text-foreground">{PROVISIONAL_CAREER_COPY}</span>
          </li>
          <li>
            <strong className="text-foreground">Community blend:</strong> after 10 career
            votes, the public score becomes 20% fan average + 80% base rating.
          </li>
          <li>
            <strong className="text-foreground">Tier colours:</strong> the ring colour
            reflects the score band — from Elite down to Unwatchable.
          </li>
        </ul>
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-semibold">Score</th>
                <th className="px-3 py-2 font-semibold">Tier</th>
              </tr>
            </thead>
            <tbody>
              {CAREER_TIERS.map((tier) => (
                <tr key={tier.label} className="border-t border-border">
                  <td className="px-3 py-2 tabular-nums">{tier.range}</td>
                  <td className="px-3 py-2">{tier.label}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="h3">Match rating (1–10)</h2>
        <p className="body-sm text-muted-foreground">
          After a match finishes, signed-in fans can rate how each player performed in
          that game — half-step scores from 1 to 10. Ratings unlock once the match is
          complete and lineups are synced.
        </p>
        <p className="body-sm text-muted-foreground">
          Match scores use colour tiers similar to FotMob — poor, average, good, and
          standout performances are easy to spot at a glance.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="h3">What you can do</h2>
        <ol className="body-sm list-decimal space-y-2 pl-5 text-muted-foreground">
          <li>
            <strong className="text-foreground">Sign in</strong> with Google or X to
            vote.
          </li>
          <li>
            Open any <strong className="text-foreground">player profile</strong> and slide
            to rate their career.
          </li>
          <li>
            Use the <strong className="text-foreground">shuffle strip</strong> on the home
            page to discover players you have not scored yet.
          </li>
          <li>
            After a match ends, open the <strong className="text-foreground">match
            page</strong> and rate the players who played.
          </li>
        </ol>
      </section>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/players"
          className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Browse players
        </Link>
        <Link
          href="/"
          className="inline-flex h-9 items-center justify-center rounded-md border border-border bg-background px-4 text-sm font-medium hover:bg-muted"
        >
          Back to home
        </Link>
      </div>
    </div>
  )
}
