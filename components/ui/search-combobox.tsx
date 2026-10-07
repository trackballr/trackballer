"use client"

import { Combobox } from "@base-ui/react/combobox"
import { Check, ChevronsUpDown, X } from "lucide-react"

import { TeamFlag } from "@/components/team-flag"
import type { TeamOption } from "@/lib/onboarding/types"
import { cn } from "@/lib/utils"

function teamFromOption(option: TeamOption) {
  return {
    name: option.label,
    logo_url: option.logo_url,
    code: option.code,
  }
}

type SearchComboboxProps = {
  options: TeamOption[]
  valueId: string | null
  onValueIdChange: (valueId: string | null) => void
  label: string
  placeholder?: string
  emptyMessage?: string
  disabled?: boolean
  /** Keep the label for screen readers only (when a layout labels the row). */
  hideLabel?: boolean
  className?: string
}

export function SearchCombobox({
  options,
  valueId,
  onValueIdChange,
  label,
  placeholder = "Search...",
  emptyMessage = "No matches found.",
  disabled = false,
  hideLabel = false,
  className,
}: SearchComboboxProps) {
  const inputId = label.replace(/\s+/g, "-").toLowerCase()
  const selected =
    valueId != null ? (options.find((o) => o.id === valueId) ?? null) : null

  return (
    <Combobox.Root
      items={options}
      value={selected}
      onValueChange={(item) => onValueIdChange(item?.id ?? null)}
      itemToStringLabel={(item: TeamOption) => item.label}
      isItemEqualToValue={(a, b) => a.id === b.id}
      disabled={disabled}
      modal={false}
    >
      <div className={cn("flex flex-col gap-1.5", className)}>
        <label
          htmlFor={inputId}
          className={cn("text-sm font-medium text-foreground", hideLabel && "sr-only")}
        >
          {label}
        </label>
        <Combobox.InputGroup
          className={cn(
            "relative flex h-10 w-full cursor-pointer items-center gap-2 rounded-lg border border-border bg-background",
            "focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50",
            disabled && "pointer-events-none opacity-50",
          )}
        >
          {selected && (
            <TeamFlag
              team={teamFromOption(selected)}
              size="sm"
              className="ml-2 shrink-0"
            />
          )}
          <Combobox.Input
            id={inputId}
            placeholder={placeholder}
            suppressHydrationWarning
            className={cn(
              "h-full min-w-0 flex-1 border-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground",
              selected ? "pl-0 pr-3" : "px-3",
            )}
          />
          <div className="flex shrink-0 items-center pr-1 text-muted-foreground">
            <Combobox.Clear
              className="flex size-8 items-center justify-center rounded-md hover:bg-muted hover:text-foreground"
              aria-label="Clear selection"
            >
              <X className="size-4" />
            </Combobox.Clear>
            <Combobox.Trigger
              className="flex size-8 items-center justify-center rounded-md hover:bg-muted hover:text-foreground"
              aria-label="Open list"
            >
              <ChevronsUpDown className="size-4 opacity-50" />
            </Combobox.Trigger>
          </div>
        </Combobox.InputGroup>
      </div>

      <Combobox.Portal>
        <Combobox.Positioner sideOffset={4} className="z-50 outline-none">
          <Combobox.Popup
            className={cn(
              "w-[var(--anchor-width)] max-h-[min(18rem,var(--available-height))] overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-md",
              "origin-[var(--transform-origin)]",
            )}
          >
            <Combobox.Empty className="hidden px-3 py-4 text-sm text-muted-foreground in-data-empty:block">
              {emptyMessage}
            </Combobox.Empty>
            <Combobox.List className="max-h-72 overflow-y-auto overscroll-contain p-1 outline-none">
              {(item: TeamOption) => (
                <Combobox.Item
                  key={item.id}
                  value={item}
                  className={cn(
                    "relative grid cursor-default grid-cols-[auto_1fr_auto] items-center gap-2.5 rounded-md px-2 py-2 text-sm outline-none select-none",
                    "data-highlighted:bg-muted data-highlighted:text-foreground",
                  )}
                >
                  <TeamFlag team={teamFromOption(item)} size="sm" />
                  <span className="min-w-0 truncate">{item.label}</span>
                  <Combobox.ItemIndicator className="flex size-4 items-center justify-center">
                    <Check className="size-4 opacity-0 [[data-selected]_&]:opacity-100" />
                  </Combobox.ItemIndicator>
                </Combobox.Item>
              )}
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  )
}
