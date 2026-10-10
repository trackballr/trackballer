import { Button } from "@/components/ui/button"
import { Panel } from "@/components/ui/panel"
import { cn } from "@/lib/utils"

type AdminSaveBarProps = {
  /** Shown on the left: what state the page is in, or the last result. */
  status: string
  error?: boolean
  canSave: boolean
  pending: boolean
  saveLabel: string
  onSave: () => void
}

/** Save strip that stays at the bottom of the screen, as on profile settings. */
export function AdminSaveBar({
  status,
  error = false,
  canSave,
  pending,
  saveLabel,
  onSave,
}: AdminSaveBarProps) {
  return (
    <div className="sticky bottom-4 z-10">
      <Panel className="flex items-center justify-between gap-3 px-5 py-3 shadow-sm">
        <p
          role="status"
          className={cn(
            "min-w-0 truncate text-sm",
            error ? "text-destructive" : "text-muted-foreground",
          )}
        >
          {status}
        </p>
        <Button
          type="button"
          disabled={pending || !canSave}
          onClick={onSave}
          className="h-10 shrink-0 px-5"
        >
          {pending ? "Saving…" : saveLabel}
        </Button>
      </Panel>
    </div>
  )
}
