"use client"

import type { AvatarSource } from "@/lib/profile/display-avatar"
import { cn } from "@/lib/utils"

type AvatarSourcePickerProps = {
  googleAvatarUrl: string
  xAvatarUrl: string
  value: AvatarSource
  onChange: (source: AvatarSource) => void
  disabled?: boolean
}

function AvatarOption({
  label,
  url,
  selected,
  disabled,
  onSelect,
}: {
  label: string
  url: string
  selected: boolean
  disabled?: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        "flex w-24 flex-col items-center gap-2 rounded-lg border p-3 transition-colors",
        selected
          ? "border-primary bg-primary/5"
          : "border-border hover:border-muted-foreground/40",
        disabled && "pointer-events-none opacity-50",
      )}
    >
      <div className="size-14 overflow-hidden rounded-full border border-border bg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element -- OAuth avatar hosts vary */}
        <img
          src={url}
          alt=""
          className="size-full object-cover"
          referrerPolicy="no-referrer"
        />
      </div>
      <span className="text-xs font-medium">{label}</span>
    </button>
  )
}

export function AvatarSourcePicker({
  googleAvatarUrl,
  xAvatarUrl,
  value,
  onChange,
  disabled,
}: AvatarSourcePickerProps) {
  return (
    <fieldset>
      <legend className="sr-only">Profile photo</legend>
      <div className="flex flex-wrap gap-3">
        <AvatarOption
          label="Google"
          url={googleAvatarUrl}
          selected={value === "google"}
          disabled={disabled}
          onSelect={() => onChange("google")}
        />
        <AvatarOption
          label="X"
          url={xAvatarUrl}
          selected={value === "x"}
          disabled={disabled}
          onSelect={() => onChange("x")}
        />
      </div>
    </fieldset>
  )
}
