import { Share2 } from "lucide-react"
import type { ReactNode } from "react"
import Link from "next/link"

import { CareerRing } from "@/components/player/career-ring"
import { PlayerCareerRatingCta } from "@/components/player/player-career-rating-cta"
import { TeamFlag } from "@/components/team-flag"
import { Panel } from "@/components/ui/panel"
import { positionDisplayLabel } from "@/lib/match/position-label"
import { computeAgeFromBirthDate } from "@/lib/player/age"
import type { PlayerProfile } from "@/lib/player/types"
import {
  PROVISIONAL_CAREER_COPY,
  careerRingCssVar,
  careerRingTier,
  careerTierLabel,
  formatCareerScore,
} from "@/lib/rating/career-tier"
import { careerSharePath } from "@/lib/share/share-links"
import { cn } from "@/lib/utils"

type PlayerProfileHeroProps = {
  profile: PlayerProfile
  canRateCareer: boolean
  /** Signed-in viewer's username — lets them share their own rating of this player. */
  viewerUsername?: string | null
}

function formatOneDecimal(value: number | null): string {
  if (value == null || Number.isNaN(value)) return "—"
  return value.toFixed(1)
}

function formatBirthDateLabel(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(iso))
}

/** One cell of the facts strip: value on top, label under it, centred. */
function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0 px-2 py-3.5 text-center">
      <div className="flex items-center justify-center gap-1.5 truncate text-sm font-semibold sm:text-base">
        {children}
      </div>
      <p className="mt-0.5 truncate text-xs text-muted-foreground">{label}</p>
    </div>
  )
}

/** One rating tile: small label, big number, optional suffix and note. */
function RatingTile({
  label,
  value,
  suffix,
  note,
  accent,
}: {
  label: string
  value: string
  suffix?: string
  note?: ReactNode
  accent?: string
}) {
  return (
    <div className="min-w-0 rounded-lg bg-muted/60 px-3 py-3 sm:px-4 sm:py-3.5">
      <p className="truncate text-[11px] font-medium text-muted-foreground sm:text-xs">{label}</p>
      <p className="mt-1 flex items-baseline gap-1">
        <span
          className="font-display text-2xl leading-none font-bold tabular-nums sm:text-3xl"
          style={accent ? { color: accent } : undefined}
        >
          {value}
        </span>
        {suffix ? (
          <span className="text-[11px] text-muted-foreground sm:text-xs">{suffix}</span>
        ) : null}
      </p>
      {note ? <p className="mt-1.5 truncate text-xs font-semibold">{note}</p> : null}
    </div>
  )
}

export function PlayerProfileHero({
  profile,
  canRateCareer,
  viewerUsername = null,
}: PlayerProfileHeroProps) {
  const positionLabel = positionDisplayLabel(profile.primaryPosition)
  const displayAge =
    (profile.birthDate ? computeAgeFromBirthDate(profile.birthDate) : null) ??
    profile.age
  const ringTier = careerRingTier(profile.career.tier, profile.career.displayScore)
  const tierColor = `var(${careerRingCssVar(profile.career.tier, profile.career.displayScore)})`

  const facts: { label: string; value: ReactNode }[] = []
  if (displayAge != null) {
    facts.push({
      label: profile.birthDate ? formatBirthDateLabel(profile.birthDate) : "Age",
      value: `${displayAge} years`,
    })
  } else if (profile.birthDate) {
    facts.push({ label: "Date of birth", value: formatBirthDateLabel(profile.birthDate) })
  }
  if (positionLabel) facts.push({ label: "Position", value: positionLabel })
  if (profile.nationalTeam || profile.nationality) {
    facts.push({
      label: "Country",
      value: profile.nationalTeam ? (
        <>
          <TeamFlag team={profile.nationalTeam} size="sm" />
          <Link href={`/country/${profile.nationalTeam.id}`} className="truncate hover:underline">
            {profile.nationalTeam.name}
          </Link>
        </>
      ) : (
        <span className="truncate">{profile.nationality}</span>
      ),
    })
  }

  return (
    <Panel>
      <div className="relative flex items-center gap-4 overflow-hidden bg-primary px-5 py-5 text-primary-foreground sm:gap-5 sm:px-6">
        {/* Soft light from the top-left, as on the competition tiles. */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(90%_120%_at_0%_0%,rgb(255_255_255/0.14),transparent_60%)]"
        />
        <CareerRing
          name={profile.displayName}
          photoUrl={profile.photoUrl}
          tier={profile.career.tier}
          displayScore={profile.career.displayScore}
          compact
          className="relative shrink-0"
          ringClassName="sm:size-20"
        />
        <div className="relative min-w-0 flex-1">
          <h1 className="line-clamp-2 font-display text-lg leading-tight font-bold sm:text-2xl">
            {profile.displayName}
          </h1>
          {profile.clubTeam ? (
            <p className="mt-1.5 flex min-w-0 items-center gap-1.5 text-sm text-primary-foreground/85">
              <TeamFlag team={profile.clubTeam} size="sm" variant="crest" />
              <span className="truncate">{profile.clubTeam.name}</span>
            </p>
          ) : null}
          {canRateCareer && profile.userCareerRating != null ? (
            <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-primary-foreground/70">
              <span>You rated their career {formatCareerScore(profile.userCareerRating)}</span>
              {viewerUsername ? (
                <Link
                  href={careerSharePath(viewerUsername, profile.id)}
                  className="inline-flex items-center gap-1 rounded-full bg-primary-foreground/15 px-2.5 py-1 font-semibold text-primary-foreground transition-colors hover:bg-primary-foreground/25"
                >
                  <Share2 className="size-3" aria-hidden />
                  Share
                </Link>
              ) : null}
            </p>
          ) : null}
        </div>
        <PlayerCareerRatingCta
          playerId={profile.id}
          playerName={profile.displayName}
          canRate={canRateCareer}
          initialValue={profile.userCareerRating}
          layout="header"
          className="relative"
          share={
            viewerUsername
              ? {
                  username: viewerUsername,
                  publicScore: profile.career.displayScore,
                  isProvisional: profile.career.isProvisional,
                }
              : null
          }
        />
      </div>

      {facts.length > 0 ? (
        <div
          className={cn(
            "grid divide-x divide-border border-b border-border",
            facts.length === 3 ? "grid-cols-3" : facts.length === 2 ? "grid-cols-2" : "grid-cols-1",
          )}
        >
          {facts.map((fact) => (
            <Fact key={fact.label} label={fact.label}>
              {fact.value}
            </Fact>
          ))}
        </div>
      ) : null}

      <div className="p-5 sm:p-6">
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <RatingTile
            label="Career rating"
            value={formatCareerScore(profile.career.displayScore)}
            accent={tierColor}
            note={<span style={{ color: tierColor }}>{careerTierLabel(ringTier)}</span>}
          />
          <RatingTile
            label="Last 5 form"
            value={formatOneDecimal(profile.form.last5Avg)}
            suffix={profile.form.last5Avg != null ? "/ 10" : undefined}
          />
          <RatingTile
            label="WC form"
            value={formatOneDecimal(profile.tournament.avgRating)}
            suffix={profile.tournament.avgRating != null ? "/ 10" : undefined}
          />
        </div>
        {profile.career.isProvisional ? (
          <p className="mt-3 text-xs text-muted-foreground">
            {PROVISIONAL_CAREER_COPY}{" "}
            <Link href="/how-ratings-work" className="font-medium text-primary hover:underline">
              How ratings work
            </Link>
          </p>
        ) : null}
      </div>
    </Panel>
  )
}
