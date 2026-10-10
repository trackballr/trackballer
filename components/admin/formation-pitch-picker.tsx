"use client"

import { OptionMenuSelect } from "@/components/ui/option-menu-select"
import {
  FORMATION_TEMPLATES,
  type FormationId,
} from "@/lib/admin/formation-slots"
import type { PlayerListItem } from "@/lib/search/types"

export type SlotAssignment = {
  playerId: number
  displayName: string
  catalogName: string
  photoUrl: string | null
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
