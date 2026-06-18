"use client"

import { OptionMenuSelect } from "@/components/ui/option-menu-select"
import {
  FORMATION_TEMPLATES,
  type FormationId,
} from "@/lib/admin/formation-slots"
import { FormationPitch } from "@/components/formation/formation-pitch"
import type { PlayerListItem } from "@/lib/search/types"

export type SlotAssignment = {
  playerId: number
  displayName: string
  catalogName: string
  photoUrl: string | null
}

type FormationPitchPickerProps = {
  formation: FormationId
  assignments: Record<string, SlotAssignment | undefined>
  activeSlot: string | null
  onSlotClick: (slotKey: string) => void
}

export function FormationPitchPicker({
  formation,
  assignments,
  activeSlot,
  onSlotClick,
}: FormationPitchPickerProps) {
  return (
    <FormationPitch
      formation={formation}
      assignments={assignments}
      mode="edit"
      activeSlot={activeSlot}
      onSlotClick={onSlotClick}
    />
  )
}

export function FormationSelect({
  value,
  onChange,
}: {
  value: FormationId
  onChange: (id: FormationId) => void
}) {
  return (
    <OptionMenuSelect
      value={value}
      onValueChange={(val) => onChange(val as FormationId)}
      groups={[
        {
          options: FORMATION_TEMPLATES.map((f) => ({
            value: f.id,
            label: f.label,
          })),
        },
      ]}
      ariaLabel="Select formation"
    />
  )
}

export function playerToSlotAssignment(player: PlayerListItem): SlotAssignment {
  return {
    playerId: player.id,
    displayName: player.displayName,
    catalogName: player.catalogName,
    photoUrl: player.photoUrl,
  }
}
