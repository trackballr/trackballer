"use client"

import { CatalogImage } from "@/components/catalog-image"
import Link from "next/link"

import {
  getFormationTemplate,
  getSlotPosition,
  type FormationId,
} from "@/lib/admin/formation-slots"
import { cn } from "@/lib/utils"

export type FormationSlotView = {
  playerId?: number
  displayName: string
  catalogName: string
  photoUrl: string | null
}

type FormationPitchProps = {
  formation: FormationId
  assignments: Record<string, FormationSlotView | undefined>
  /** Edit mode: tap slots. Display mode: link to player pages when playerId set. */
  mode?: "edit" | "display"
  activeSlot?: string | null
  onSlotClick?: (slotKey: string) => void
  className?: string
}

function PitchSurface({
  formation,
  assignments,
  mode,
  activeSlot,
  onSlotClick,
  orientation,
}: FormationPitchProps & { orientation: "vertical" | "horizontal" }) {
  const template = getFormationTemplate(formation)

  return (
    <>
      {orientation === "vertical" ? (
        <>
          {/* Outer boundary */}
          <div
            className="pointer-events-none absolute inset-3 rounded-lg border border-primary/30"
            aria-hidden
          />
          {/* Halfway line */}
          <div
            className="pointer-events-none absolute inset-x-3 top-1/2 h-px -translate-y-1/2 bg-primary/30"
            aria-hidden
          />
          {/* Centre circle + spot */}
          <div
            className="pointer-events-none absolute left-1/2 top-1/2 size-16 -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/30"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute left-1/2 top-1/2 size-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/40"
            aria-hidden
          />
          {/* Top penalty box + goal area */}
          <div
            className="pointer-events-none absolute left-1/2 top-3 h-[14%] w-2/5 -translate-x-1/2 rounded-b-md border border-t-0 border-primary/30"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute left-1/2 top-3 h-[6%] w-1/5 -translate-x-1/2 rounded-b-sm border border-t-0 border-primary/30"
            aria-hidden
          />
          {/* Bottom penalty box + goal area */}
          <div
            className="pointer-events-none absolute bottom-3 left-1/2 h-[14%] w-2/5 -translate-x-1/2 rounded-t-md border border-b-0 border-primary/30"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute bottom-3 left-1/2 h-[6%] w-1/5 -translate-x-1/2 rounded-t-sm border border-b-0 border-primary/30"
            aria-hidden
          />
        </>
      ) : (
        <>
          <div className="absolute inset-y-4 left-1/2 w-px bg-border/80" aria-hidden />
          <div
            className="absolute left-1/2 top-1/2 size-16 -translate-x-1/2 -translate-y-1/2 rounded-full border border-border/80"
            aria-hidden
          />
        </>
      )}

      {template.slots.map((slot) => {
        const assigned = assignments[slot.key]
        const isActive = activeSlot === slot.key
        const pos = getSlotPosition(slot, orientation)

        const puck = (
          <>
            {assigned?.photoUrl ? (
              <CatalogImage
                src={assigned.photoUrl}
                alt=""
                width={44}
                height={44}
                className="absolute inset-0 size-full rounded-full object-cover"
              />
            ) : (
              <span>{slot.label}</span>
            )}
          </>
        )

        const puckClass = cn(
          "relative flex size-11 shrink-0 items-center justify-center rounded-full border-2 bg-card text-[0.6rem] font-bold shadow-sm transition-colors",
          mode === "edit" && isActive
            ? "border-primary ring-2 ring-primary/30"
            : "border-border",
          assigned ? "text-foreground" : "text-muted-foreground",
          mode === "display" && assigned?.playerId && "hover:border-primary",
        )

        const label = assigned?.catalogName ? (
          <span className="mt-1 max-w-[4.5rem] truncate text-center text-[0.6rem] font-semibold leading-tight">
            {assigned.catalogName}
          </span>
        ) : null

        const positionStyle = { top: `${pos.top}%`, left: `${pos.left}%` }

        if (mode === "display" && assigned?.playerId) {
          return (
            <div
              key={`${orientation}-${slot.key}`}
              className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
              style={positionStyle}
            >
              <Link
                href={`/player/${assigned.playerId}`}
                className={puckClass}
                aria-label={assigned.displayName}
              >
                {puck}
              </Link>
              {label}
            </div>
          )
        }

        if (mode === "edit" && onSlotClick) {
          return (
            <div
              key={`${orientation}-${slot.key}`}
              className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
              style={positionStyle}
            >
              <button
                type="button"
                onClick={() => onSlotClick(slot.key)}
                className={puckClass}
                aria-label={`${slot.label}${assigned ? `: ${assigned.displayName}` : ", empty"}`}
              >
                {puck}
              </button>
              {label}
            </div>
          )
        }

        return (
          <div
            key={`${orientation}-${slot.key}`}
            className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
            style={positionStyle}
          >
            <div className={puckClass}>{puck}</div>
            {label}
          </div>
        )
      })}
    </>
  )
}

export function FormationPitch({
  formation,
  assignments,
  mode = "display",
  activeSlot = null,
  onSlotClick,
  className,
}: FormationPitchProps) {
  const pitchClass =
    "relative overflow-hidden rounded-lg border border-border bg-[linear-gradient(180deg,color-mix(in_oklch,var(--primary)_12%,transparent),color-mix(in_oklch,var(--muted)_40%,transparent))]"

  return (
    <div className={cn("w-full", className)}>
      {/* Vertical (portrait) pitch on every breakpoint */}
      <div
        className={cn(pitchClass, "mx-auto aspect-[3/4] w-full max-w-md")}
        role="group"
        aria-label="Formation pitch"
      >
        <PitchSurface
          formation={formation}
          assignments={assignments}
          mode={mode}
          activeSlot={activeSlot}
          onSlotClick={onSlotClick}
          orientation="vertical"
        />
      </div>
    </div>
  )
}
