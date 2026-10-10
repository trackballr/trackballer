"use client"

import {
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useId, useState, useTransition } from "react"

import { AdminSaveBar } from "@/components/admin/admin-save-bar"
import { PlayerSearchPicker } from "@/components/admin/player-search-picker"
import { PlayerAvatar } from "@/components/player-avatar"
import { Button } from "@/components/ui/button"
import { Panel, PanelBody, PanelEmpty, PanelHeader } from "@/components/ui/panel"
import { saveTrendingPins } from "@/lib/admin/actions/trending-pins"
import type { TrendingPinRow } from "@/lib/admin/trending-pins"
import type { PlayerListItem } from "@/lib/search/types"
import { cn } from "@/lib/utils"

/** Server limit in saveTrendingPins. */
const MAX_PINS = 20

type TrendingPinEditorProps = {
  initialPins: TrendingPinRow[]
}

function PinRow({
  pin,
  rank,
  disabled,
  onRemove,
}: {
  pin: TrendingPinRow
  rank: number
  disabled: boolean
  onRemove: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: pin.playerId,
    disabled,
  })

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(
        "flex items-center gap-3 border-b border-border bg-card py-2.5 last:border-b-0",
        isDragging && "relative z-10 rounded-lg border-b-0 shadow-md ring-1 ring-border",
      )}
    >
      <button
        type="button"
        aria-label={`Reorder ${pin.displayName}`}
        disabled={disabled}
        // touch-none: a drag on the handle moves the row instead of scrolling the page.
        className="flex size-8 shrink-0 cursor-grab touch-none items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:cursor-grabbing disabled:cursor-default"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" aria-hidden />
      </button>
      <span className="w-6 shrink-0 text-center font-display text-lg leading-none font-bold tabular-nums text-muted-foreground">
        {rank}
      </span>
      <PlayerAvatar
        name={pin.displayName}
        photoUrl={pin.photoUrl}
        size="md"
        className="shrink-0 rounded-full"
      />
      <span className="min-w-0 flex-1 truncate text-sm font-semibold">{pin.displayName}</span>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        disabled={disabled}
        onClick={onRemove}
        aria-label={`Remove ${pin.displayName}`}
        className="shrink-0 text-muted-foreground hover:text-destructive"
      >
        <Trash2 aria-hidden />
      </Button>
    </li>
  )
}

function sameOrder(a: TrendingPinRow[], b: TrendingPinRow[]): boolean {
  return a.length === b.length && a.every((pin, index) => pin.playerId === b[index]!.playerId)
}

/** Pins shown on the home page, in order. Drag rows to reorder; Save applies everything. */
export function TrendingPinEditor({ initialPins }: TrendingPinEditorProps) {
  const router = useRouter()
  const [pins, setPins] = useState(initialPins)
  const [savedPins, setSavedPins] = useState(initialPins)
  const [notice, setNotice] = useState<{ text: string; error: boolean } | null>(null)
  const [pending, startTransition] = useTransition()
  const dndId = useId()

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const dirty = !sameOrder(pins, savedPins)

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    setPins((list) => {
      const from = list.findIndex((pin) => pin.playerId === active.id)
      const to = list.findIndex((pin) => pin.playerId === over.id)
      return from < 0 || to < 0 ? list : arrayMove(list, from, to)
    })
    setNotice(null)
  }

  function addPlayer(player: PlayerListItem) {
    if (pins.some((pin) => pin.playerId === player.id)) {
      setNotice({ text: `${player.displayName} is already pinned.`, error: true })
      return
    }
    if (pins.length >= MAX_PINS) {
      setNotice({ text: `You can pin up to ${MAX_PINS} players.`, error: true })
      return
    }
    setPins([
      ...pins,
      {
        id: -player.id,
        playerId: player.id,
        sortOrder: pins.length,
        displayName: player.displayName,
        photoUrl: player.photoUrl,
      },
    ])
    setNotice(null)
  }

  function removePin(playerId: number) {
    setPins((list) => list.filter((pin) => pin.playerId !== playerId))
    setNotice(null)
  }

  function save() {
    startTransition(async () => {
      const result = await saveTrendingPins({ playerIds: pins.map((pin) => pin.playerId) })
      if (!result.ok) {
        setNotice({ text: result.error, error: true })
        return
      }
      setSavedPins(pins)
      setNotice({ text: "Saved. The home page shows this order.", error: false })
      router.refresh()
    })
  }

  return (
    <div className="space-y-6">
      <Panel>
        <PanelHeader title="Add a player" description="Search, then pick a player to pin." />
        <PanelBody className="pt-2">
          <PlayerSearchPicker label="Player search" onSelect={addPlayer} disabled={pending} />
        </PanelBody>
      </Panel>

      <Panel>
        <PanelHeader
          title="Pinned order"
          description="Drag a row by its handle to reorder. Number 1 shows first on the home page."
          action={
            <span className="text-sm font-semibold tabular-nums">
              {pins.length}
              <span className="text-muted-foreground"> / {MAX_PINS}</span>
            </span>
          }
        />
        {pins.length === 0 ? (
          <PanelEmpty>No pins yet. Add players above.</PanelEmpty>
        ) : (
          <DndContext
            id={dndId}
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={pins.map((pin) => pin.playerId)}
              strategy={verticalListSortingStrategy}
            >
              <ul className="mx-5 mb-3">
                {pins.map((pin, index) => (
                  <PinRow
                    key={pin.playerId}
                    pin={pin}
                    rank={index + 1}
                    disabled={pending}
                    onRemove={() => removePin(pin.playerId)}
                  />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        )}
      </Panel>

      <AdminSaveBar
        status={
          notice?.error
            ? notice.text
            : dirty
              ? "You have unsaved changes."
              : (notice?.text ?? "All changes saved.")
        }
        error={notice?.error}
        canSave={dirty}
        pending={pending}
        saveLabel="Save order"
        onSave={save}
      />
    </div>
  )
}
