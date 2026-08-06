"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"

interface ExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ExportDialog({ open, onOpenChange }: ExportDialogProps) {
  const [selected, setSelected] = React.useState({
    gift_cards: true,
    transactions: true,
    stores: true,
    users: true,
  })

  const handleExport = () => {
    const tables = Object.entries(selected)
      .filter(([_, isSelected]) => isSelected)
      .map(([table]) => table)
      .join(",")

    if (!tables) return

    // Navigate programmatically using window.location to trigger download
    window.location.href = `/api/export?tables=${tables}`
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export Data</DialogTitle>
          <DialogDescription>
            Select the tables you want to export. If you select one, it will download as a CSV. If multiple, they will be bundled in a ZIP file.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col gap-4 py-4">
          <label className="flex items-start gap-3 space-y-0 cursor-pointer">
            <Checkbox 
              checked={selected.gift_cards}
              onCheckedChange={(c) => setSelected(s => ({ ...s, gift_cards: !!c }))}
            />
            <div className="grid gap-1.5 leading-none">
              <span className="text-sm font-medium leading-none">Gift Cards</span>
              <span className="text-sm text-muted-foreground">Includes their remaining amounts, status, and IDs.</span>
            </div>
          </label>
          <label className="flex items-start gap-3 space-y-0 cursor-pointer">
            <Checkbox 
              checked={selected.transactions}
              onCheckedChange={(c) => setSelected(s => ({ ...s, transactions: !!c }))}
            />
            <div className="grid gap-1.5 leading-none">
              <span className="text-sm font-medium leading-none">Transactions</span>
              <span className="text-sm text-muted-foreground">Includes volunteer logs, spend vs. donated.</span>
            </div>
          </label>
          <label className="flex items-start gap-3 space-y-0 cursor-pointer">
            <Checkbox 
              checked={selected.stores}
              onCheckedChange={(c) => setSelected(s => ({ ...s, stores: !!c }))}
            />
            <div className="grid gap-1.5 leading-none">
              <span className="text-sm font-medium leading-none">Stores</span>
              <span className="text-sm text-muted-foreground">Your list of vendors.</span>
            </div>
          </label>
          <label className="flex items-start gap-3 space-y-0 cursor-pointer">
            <Checkbox 
              checked={selected.users}
              onCheckedChange={(c) => setSelected(s => ({ ...s, users: !!c }))}
            />
            <div className="grid gap-1.5 leading-none">
              <span className="text-sm font-medium leading-none">Volunteers</span>
              <span className="text-sm text-muted-foreground">The volunteers stored in the system.</span>
            </div>
          </label>
        </div>

        <DialogFooter className="sm:justify-end">
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            type="button" 
            onClick={handleExport}
            disabled={!Object.values(selected).some(Boolean)}
          >
            Download Export
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
