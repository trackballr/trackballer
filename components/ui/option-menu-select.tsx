"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

export type OptionMenuGroup = {
  label?: string
  options: { value: string; label: string }[]
}

type OptionMenuSelectProps = {
  value: string
  onValueChange: (value: string) => void
  groups: OptionMenuGroup[]
  ariaLabel: string
  triggerClassName?: string
  disabled?: boolean
  placeholder?: string
}

function findLabel(groups: OptionMenuGroup[], value: string): string | undefined {
  for (const group of groups) {
    const match = group.options.find((option) => option.value === value)
    if (match) return match.label
  }
  return undefined
}

export function OptionMenuSelect({
  value,
  onValueChange,
  groups,
  ariaLabel,
  triggerClassName,
  disabled = false,
  placeholder = "Select…",
}: OptionMenuSelectProps) {
  const [open, setOpen] = useState(false)
  const displayLabel = findLabel(groups, value) ?? placeholder

  function handleValueChange(nextValue: string) {
    onValueChange(nextValue)
    setOpen(false)
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        disabled={disabled}
        render={
          <Button
            type="button"
            variant="outline"
            className={cn(
              "h-9 w-full min-w-0 justify-between gap-2 px-3 font-medium",
              triggerClassName,
            )}
            aria-label={ariaLabel}
          />
        }
      >
        <span className="min-w-0 truncate text-left">{displayLabel}</span>
        <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="max-h-72 min-w-[var(--anchor-width)]">
        <DropdownMenuRadioGroup value={value} onValueChange={handleValueChange}>
          {groups.map((group, index) => (
            <DropdownMenuGroup key={group.label ?? `group-${index}`}>
              {group.label ? (
                <DropdownMenuLabel>{group.label}</DropdownMenuLabel>
              ) : null}
              {group.options.map((option) => (
                <DropdownMenuRadioItem key={option.value} value={option.value}>
                  {option.label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuGroup>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
