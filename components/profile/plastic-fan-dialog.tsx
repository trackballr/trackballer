"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type PlasticFanDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  onCancel: () => void
}

export function PlasticFanDialog({
  open,
  onOpenChange,
  onConfirm,
  onCancel,
}: PlasticFanDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Changing allegiance?</DialogTitle>
          <DialogDescription>
            Switching your favourite club is a bold move. No lockout - we just
            need you to own it before we update your profile.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={onCancel}>
            Keep previous club
          </Button>
          <Button type="button" onClick={onConfirm}>
            Yes, update my club
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
