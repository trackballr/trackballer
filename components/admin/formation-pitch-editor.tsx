"use client"

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core"
import { useId, useState } from "react"

import {
  FormationPitchFrame,
  FormationPuck,
  FormationPuckName,
  formationSlotClass,
  slotPositionStyle,
  type FormationSlotView,
} from "@/components/formation/formation-pitch"
import {
  getFormationTemplate,
  type FormationId,
  type PitchSlot,
} from "@/lib/admin/formation-slots"
import { cn } from "@/lib/utils"

type FormationPitchEditorProps = {
  formation: FormationId
  assignments: Record<string, FormationSlotView | undefined>
  /** Slot waiting for a player from search. */
  activeSlot: string | null
  onSlotClick: (slotKey: string) => void
  /** A player was dragged from one slot onto another — swap (or move if empty). */
  onMove: (fromKey: string, toKey: string) => void
  disabled?: boolean
}

function EditorSlot({
  slot,
  assigned,
  active,
  dragging,
  disabled,
  onSlotClick,
}: {
  slot: PitchSlot
  assigned: FormationSlotView | undefined
  active: boolean
  /** True while any puck is being dragged. */
  dragging: boolean
  disabled: boolean
  onSlotClick: (slotKey: string) => void
}) {
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: slot.key })
  const {
    setNodeRef: setDragRef,
    attributes,
    listeners,
    isDragging,
  } = useDraggable({ id: slot.key, disabled: disabled || !assigned })

  return (
    <div ref={setDropRef} className={formationSlotClass} style={slotPositionStyle(slot)}>
      <button
        ref={setDragRef}
        type="button"
        disabled={disabled}
        onClick={() => onSlotClick(slot.key)}
        aria-label={
          assigned
            ? `${slot.label}: ${assigned.displayName}. Drag onto another position to swap.`
            : `${slot.label}, empty`
        }
        className={cn(
          // touch-manipulation: a press-and-hold starts a drag instead of scrolling the page.
          "touch-manipulation rounded-full outline-none focus-visible:ring-2 focus-visible:ring-white",
          assigned && !disabled ? "cursor-grab active:cursor-grabbing" : "cursor-pointer",
          isDragging && "opacity-35",
        )}
        {...attributes}
        {...listeners}
      >
        <FormationPuck
          slotLabel={slot.label}
          assigned={assigned}
          active={active && !dragging}
          dropTarget={isOver && !isDragging}
        />
      </button>
      {assigned ? (
        <FormationPuckName name={assigned.catalogName} />
      ) : (
        // Keeps empty and filled slots the same height so pucks do not shift on drop.
        <span className="mt-1 h-3" aria-hidden />
      )}
    </div>
  )
}

/**
 * Team of the Week pitch: tap a slot to fill it from search, or drag a player
 * onto another position to swap them (mouse, touch press-and-hold, or keyboard).
 */
export function FormationPitchEditor({
  formation,
  assignments,
  activeSlot,
  onSlotClick,
  onMove,
  disabled = false,
}: FormationPitchEditorProps) {
  const template = getFormationTemplate(formation)
  const [draggingKey, setDraggingKey] = useState<string | null>(null)
  // Stable id so the library's screen-reader helpers match between server and browser.
  const dndId = useId()

  const sensors = useSensors(
    // A small move starts the drag, so a plain click still selects the slot.
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 160, tolerance: 8 } }),
    useSensor(KeyboardSensor),
  )

  function handleDragStart(event: DragStartEvent) {
    setDraggingKey(String(event.active.id))
  }

  function handleDragEnd(event: DragEndEvent) {
    setDraggingKey(null)
    const from = String(event.active.id)
    const to = event.over ? String(event.over.id) : null
    if (to && to !== from) onMove(from, to)
  }

  const draggingSlot = draggingKey
    ? template.slots.find((slot) => slot.key === draggingKey)
    : undefined

  /** "LM, L. Modrić" — how a slot is read out while dragging. */
  function describe(key: string | number | undefined): string {
    const slot = template.slots.find((item) => item.key === String(key))
    if (!slot) return "the pitch"
    const name = assignments[slot.key]?.catalogName
    return name ? `${slot.label}, ${name}` : `${slot.label}, empty`
  }

  const announcements: Announcements = {
    onDragStart: ({ active }) => `Picked up ${describe(active.id)}.`,
    onDragOver: ({ over }) => (over ? `Over ${describe(over.id)}.` : undefined),
    onDragEnd: ({ active, over }) =>
      over && over.id !== active.id
        ? `Dropped on ${describe(over.id)}. They swap places.`
        : `${describe(active.id)} stays where it was.`,
    onDragCancel: ({ active }) => `Cancelled. ${describe(active.id)} stays where it was.`,
  }

  return (
    <DndContext
      id={dndId}
      sensors={sensors}
      accessibility={{ announcements }}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setDraggingKey(null)}
    >
      <FormationPitchFrame>
        {template.slots.map((slot) => (
          <EditorSlot
            key={slot.key}
            slot={slot}
            assigned={assignments[slot.key]}
            active={activeSlot === slot.key}
            dragging={draggingKey != null}
            disabled={disabled}
            onSlotClick={onSlotClick}
          />
        ))}
      </FormationPitchFrame>

      <DragOverlay dropAnimation={null}>
        {draggingSlot ? (
          <span className="flex cursor-grabbing flex-col items-center">
            <FormationPuck
              slotLabel={draggingSlot.label}
              assigned={assignments[draggingSlot.key]}
              className="scale-110 shadow-lg"
            />
          </span>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
