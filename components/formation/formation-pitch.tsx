import Link from "next/link"
import type { CSSProperties, ReactNode } from "react"

import { CatalogImage } from "@/components/catalog-image"
import {
  getFormationTemplate,
  type FormationId,
  type PitchSlot,
} from "@/lib/admin/formation-slots"
import { cn } from "@/lib/utils"

export type FormationSlotView = {
  playerId?: number
  displayName: string
  catalogName: string
  photoUrl: string | null
}

const lineClass = "pointer-events-none absolute border-[var(--pitch-line)]"

/** Portrait pitch in the match-page green, with markings. Slots go in as children. */
export function FormationPitchFrame({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      role="group"
      aria-label="Formation pitch"
      className={cn(
        // isolate: pucks use z-index while dragging; keep that inside the pitch.
        "relative isolate mx-auto aspect-[3/4] w-full max-w-md overflow-hidden rounded-lg bg-[var(--pitch)]",
        className,
      )}
    >
      <div aria-hidden>
        {/* Outer boundary */}
        <div className={cn(lineClass, "inset-3 rounded-md border")} />
        {/* Halfway line, centre circle and spot */}
        <div className="pointer-events-none absolute inset-x-3 top-1/2 h-px -translate-y-1/2 bg-[var(--pitch-line)]" />
        <div
          className={cn(
            lineClass,
            "top-1/2 left-1/2 size-16 -translate-x-1/2 -translate-y-1/2 rounded-full border",
          )}
        />
        <div className="pointer-events-none absolute top-1/2 left-1/2 size-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--pitch-line)]" />
        {/* Top penalty box and goal area */}
        <div
          className={cn(
            lineClass,
            "top-3 left-1/2 h-[14%] w-2/5 -translate-x-1/2 rounded-b-sm border border-t-0",
          )}
        />
        <div
          className={cn(
            lineClass,
            "top-3 left-1/2 h-[6%] w-1/5 -translate-x-1/2 rounded-b-sm border border-t-0",
          )}
        />
        {/* Bottom penalty box and goal area */}
        <div
          className={cn(
            lineClass,
            "bottom-3 left-1/2 h-[14%] w-2/5 -translate-x-1/2 rounded-t-sm border border-b-0",
          )}
        />
        <div
          className={cn(
            lineClass,
            "bottom-3 left-1/2 h-[6%] w-1/5 -translate-x-1/2 rounded-t-sm border border-b-0",
          )}
        />
      </div>
      {children}
    </div>
  )
}

/** Where a slot sits on the portrait pitch. */
export function slotPositionStyle(slot: PitchSlot): CSSProperties {
  return { top: `${slot.top}%`, left: `${slot.left}%` }
}

export const formationSlotClass =
  "absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"

type FormationPuckProps = {
  slotLabel: string
  assigned: FormationSlotView | undefined
  /** Selected for filling from search (editor). */
  active?: boolean
  /** Another puck is being dragged over this one (editor). */
  dropTarget?: boolean
  className?: string
}

/** The round face (or empty position marker) on the pitch. */
export function FormationPuck({
  slotLabel,
  assigned,
  active = false,
  dropTarget = false,
  className,
}: FormationPuckProps) {
  return (
    <span
      className={cn(
        "relative flex size-11 shrink-0 items-center justify-center rounded-full text-[0.6rem] font-bold transition-[box-shadow,scale]",
        assigned
          ? "border-2 border-white bg-white shadow-[0_1px_3px_rgb(0_0_0/0.25)]"
          : "border-2 border-dashed border-white/60 bg-white/10 text-white",
        active && "ring-2 ring-white ring-offset-2 ring-offset-[var(--pitch)]",
        dropTarget && "scale-110 ring-4 ring-white/70",
        className,
      )}
    >
      {assigned?.photoUrl ? (
        <CatalogImage
          src={assigned.photoUrl}
          alt=""
          width={44}
          height={44}
          className="absolute inset-0 size-full rounded-full object-cover"
        />
      ) : assigned ? (
        <span className="text-foreground">{slotLabel}</span>
      ) : (
        <span>{slotLabel}</span>
      )}
    </span>
  )
}

/** Player name under a puck — white on the green, like match lineups. */
export function FormationPuckName({ name }: { name: string }) {
  return (
    <span className="mt-1 max-w-[4.75rem] truncate text-center text-[0.625rem] leading-tight font-semibold text-white [text-shadow:0_1px_2px_rgb(0_0_0/0.45)]">
      {name}
    </span>
  )
}

type FormationPitchProps = {
  formation: FormationId
  assignments: Record<string, FormationSlotView | undefined>
  className?: string
}

/** Read-only team on a pitch; faces link to player pages. */
export function FormationPitch({ formation, assignments, className }: FormationPitchProps) {
  const template = getFormationTemplate(formation)

  return (
    <div className={cn("w-full", className)}>
      <FormationPitchFrame>
        {template.slots.map((slot) => {
          const assigned = assignments[slot.key]
          const puck = <FormationPuck slotLabel={slot.label} assigned={assigned} />

          return (
            <div key={slot.key} className={formationSlotClass} style={slotPositionStyle(slot)}>
              {assigned?.playerId ? (
                <Link
                  href={`/player/${assigned.playerId}`}
                  aria-label={assigned.displayName}
                  className="rounded-full transition-transform hover:scale-105"
                >
                  {puck}
                </Link>
              ) : (
                puck
              )}
              {assigned?.catalogName ? <FormationPuckName name={assigned.catalogName} /> : null}
            </div>
          )
        })}
      </FormationPitchFrame>
    </div>
  )
}
