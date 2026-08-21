"use client"

import * as React from "react"
import { useState, useMemo, useRef, useEffect } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Combobox, ComboboxInput, ComboboxContent, ComboboxList, ComboboxItem, ComboboxEmpty
} from "@/components/ui/combobox"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  CreditCardIcon, Upload01Icon, Download01Icon,
  InformationCircleIcon, Add01Icon, PlusSignIcon
} from "@hugeicons/core-free-icons"
import useSWR from "swr"
import { fetcher } from "@/lib/fetcher"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

const CSV_TEMPLATE = `vendor,last4,remaining,redeemed,delivered_to,delivery_date\nChapters-Indigo,4172,50.00,0.73,ParkRoad,2026-04-20\nTim Hortons,1088,25.00,,,2026-04-20\nMetro,5542,100.00,20.00,Community Pantry,2026-04-21`

type QueueCard = {
  id: string
  store: string
  last4: string
  amount: number
  remainingAmount?: number
  notes: string
  addedBy: string
  source: "single" | "csv"
  deliveryDate?: string
}

function splitCSV(line: string): string[] {
  const out: string[] = []
  let cur = ""
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    const next = line[i + 1]

    if (c === '"' && next === '"') {
      cur += '"'
      i++
    } else if (c === '"') {
      inQuotes = !inQuotes
    } else if (c === ',' && !inQuotes) {
      out.push(cur)
      cur = ""
    } else {
      cur += c
    }
  }

  out.push(cur)
  return out
}

function parseCSV(text: string) {
  const lines = text.trim().split(/\r?\n/)
  if (lines.length === 0) return []

  const headers = splitCSV(lines[0]).map(h => h.toLowerCase().trim().replace(/[^a-z0-9_]/g, ''))
  
  const findCol = (keys: string[]) => {
    for (const k of keys) {
      const idx = headers.findIndex(h => h.includes(k))
      if (idx !== -1) return idx
    }
    return -1
  }

  const col = {
    vendor: findCol(["vendor", "store", "retailer", "merchant"]),
    last4: findCol(["last4", "lastfour", "card", "digits", "number"]),
    remaining: findCol(["remaining", "balance", "amount", "current", "value"]),
    redeemed: findCol(["redeemed", "spent", "used"]),
    delivered_to: findCol(["delivered_to", "deliveredto", "recipient", "client"]),
    delivery_date: findCol(["delivery_date", "deliverydate", "date", "created"]),
  }

  const data = lines.slice(1)
  return data.filter(l => l.trim()).map((line, i) => {
    const parts = splitCSV(line).map(p => p.trim())

    const vendor = col.vendor !== -1 ? parts[col.vendor] || "" : (parts[0] || "")
    const last4 = col.last4 !== -1 ? parts[col.last4] || "" : (parts[1] || "")
    const remaining = col.remaining !== -1 ? parts[col.remaining] || "" : (parts[2] || "")
    const redeemed = col.redeemed !== -1 ? parts[col.redeemed] || "" : ""
    const delivered_to = col.delivered_to !== -1 ? parts[col.delivered_to] || "" : ""
    const delivery_date = col.delivery_date !== -1 ? parts[col.delivery_date] || "" : ""

    const errors: string[] = []
    if (!vendor) errors.push("Vendor/Store is missing")

    const last4Clean = last4.replace(/\D/g, "")
    if (last4Clean.length !== 4) errors.push("Last 4 digits must be exactly 4 digits")

    const remainingNum = parseFloat(remaining.replace(/[^0-9.-]+/g, ""))
    const redeemedNum = parseFloat(redeemed.replace(/[^0-9.-]+/g, ""))
    if (isNaN(remainingNum) && isNaN(redeemedNum)) {
      errors.push("At least one of remaining or redeemed must be a valid amount")
    }

    return {
      rowNum: i + 1,
      vendor,
      last4: last4Clean.length >= 4 ? last4Clean.slice(-4) : last4Clean,
      remaining,
      redeemed,
      delivered_to,
      delivery_date,
      status: errors.length ? "error" : "valid",
      errors,
    }
  })
}

export default function CardsPage() {
  const [queue, setQueue] = useState<QueueCard[]>([])
  const [savingQueue, setSavingQueue] = useState(false)

  const { data: cardsData, mutate: mutateCards } = useSWR<any[]>("/api/gift-cards", fetcher)
  const { data: storesData, mutate: mutateStores } = useSWR<any[]>("/api/stores", fetcher)
  const storeOptions = useMemo(() => Array.isArray(storesData) ? storesData.map((s: any) => s.name) : [], [storesData])

  // Single card form state
  const [store, setStore] = useState("")
  const [last4, setLast4] = useState("")
  const [amount, setAmount] = useState("")
  const [notes, setNotes] = useState("")
  const [currentUser, setCurrentUser] = useState("Volunteer")
  const [singleError, setSingleError] = useState("")

  const [isDragging, setIsDragging] = useState(false)
  
  // Add Store Dialog State
  const [showAddStoreDialog, setShowAddStoreDialog] = useState(false)
  const [newStoreName, setNewStoreName] = useState("")
  const [newStoreCategory, setNewStoreCategory] = useState("GROCERY")
  const [savingStore, setSavingStore] = useState(false)

  async function handleCreateStore(e: React.FormEvent) {
    e.preventDefault()
    if (!newStoreName.trim()) {
      toast.error("Please enter a store name")
      return
    }
    setSavingStore(true)
    try {
      const res = await fetch("/api/stores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newStoreName.trim(),
          category: newStoreCategory || "OTHER",
        }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(`Store "${data.name}" added successfully`)
        setStore(data.name)
        await mutateStores()
        setShowAddStoreDialog(false)
        setNewStoreName("")
        setNewStoreCategory("GROCERY")
      } else if (res.status === 409) {
        toast.info(`Store "${newStoreName.trim()}" already exists and has been selected`)
        setStore(newStoreName.trim())
        setShowAddStoreDialog(false)
        setNewStoreName("")
      } else {
        toast.error(data.error || "Failed to add store")
      }
    } catch (error) {
      toast.error("An error occurred while adding the store")
    } finally {
      setSavingStore(false)
    }
  }
  const bulkFileInputRef = useRef<HTMLInputElement>(null)

  const supabase = createClient()
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const name = data.user?.user_metadata?.full_name || data.user?.email || "Volunteer"
      setCurrentUser(name)
    })
  }, [])

  const filteredStoreOptions = useMemo(() => {
    if (!store.trim()) return storeOptions
    return storeOptions.filter(s => s.toLowerCase().includes(store.toLowerCase().trim()))
  }, [store, storeOptions])

  function handleAddToQueue(e: React.FormEvent) {
    e.preventDefault()
    setSingleError("")

    if (!store.trim()) {
      setSingleError("Please enter or select a store")
      return
    }
    if (!/^\d{4}$/.test(last4.trim())) {
      setSingleError("Last 4 digits must be exactly 4 digits")
      return
    }
    const numAmount = parseFloat(amount)
    if (isNaN(numAmount) || numAmount <= 0) {
      setSingleError("Please enter a valid dollar amount")
      return
    }

    const newCard: QueueCard = {
      id: `card-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      store: store.trim(),
      last4: last4.trim(),
      amount: numAmount,
      remainingAmount: numAmount,
      notes: notes.trim(),
      addedBy: currentUser,
      source: "single",
    }

    setQueue(prev => [newCard, ...prev])
    toast.success(`Added ${newCard.store} (•••• ${newCard.last4}) to queue`)

    // Reset fields for fast consecutive entries
    setLast4("")
    setAmount("")
    setNotes("")
  }

  function processFile(file: File) {
    if (!file.name.endsWith(".csv")) {
      toast.error("Please upload a valid .csv file")
      return
    }

    const reader = new FileReader()
    reader.onload = e => {
      const text = e.target?.result as string
      const rows = parseCSV(text)

      const validRows = rows.filter(r => r.status !== "error")
      const errorRows = rows.filter(r => r.status === "error")

      if (validRows.length > 0) {
        const newQueueCards: QueueCard[] = validRows.map((r, idx) => {
          const rem = parseFloat(r.remaining.replace(/[^0-9.-]+/g, "")) || 0
          const red = parseFloat(r.redeemed.replace(/[^0-9.-]+/g, "")) || 0
          const totalInit = rem + red > 0 ? rem + red : rem
          return {
            id: `csv-card-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 6)}`,
            store: r.vendor,
            last4: r.last4,
            amount: totalInit,
            remainingAmount: rem,
            notes: r.delivered_to ? `Delivered to: ${r.delivered_to}` : "",
            addedBy: currentUser,
            source: "csv",
            deliveryDate: r.delivery_date || undefined,
          }
        })

        setQueue(prev => [...newQueueCards, ...prev])
        toast.success(`Added ${validRows.length} card${validRows.length > 1 ? "s" : ""} from ${file.name} to the queue`)
      }

      if (errorRows.length > 0) {
        toast.warning(`Skipped ${errorRows.length} invalid row${errorRows.length > 1 ? "s" : ""} in ${file.name}`)
      }
    }
    reader.readAsText(file)
  }

  async function saveQueueToInventory() {
    if (queue.length === 0) return
    setSavingQueue(true)

    const singleCards = queue.filter(q => q.source === "single")
    const csvCards = queue.filter(q => q.source === "csv")

    let successCount = 0
    let errorCount = 0

    // Save single cards
    for (const card of singleCards) {
      try {
        const res = await fetch("/api/gift-cards", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            storeName: card.store,
            lastFourDigits: card.last4,
            initialAmount: card.amount,
            notes: card.notes || undefined,
            addedBy: card.addedBy || currentUser,
          }),
        })
        if (res.ok) successCount++
        else errorCount++
      } catch {
        errorCount++
      }
    }

    // Save CSV cards via bulk API
    if (csvCards.length > 0) {
      try {
        const res = await fetch("/api/import-cards", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: "bulk_queue_import.csv",
            rows: csvCards.map(c => ({
              vendor: c.store,
              last4: c.last4,
              remaining: c.remainingAmount != null ? c.remainingAmount : c.amount,
              redeemed: c.amount - (c.remainingAmount != null ? c.remainingAmount : c.amount),
              delivery_date: c.deliveryDate || null,
              status: "valid",
            })),
          }),
        })
        const data = await res.json()
        if (res.ok) {
          successCount += (data.inserted || 0) + (data.updated || 0)
        } else {
          errorCount += csvCards.length
        }
      } catch {
        errorCount += csvCards.length
      }
    }

    setSavingQueue(false)
    if (successCount > 0) {
      toast.success(`Successfully saved ${successCount} gift card${successCount > 1 ? "s" : ""} to inventory!`)
      setQueue([])
      mutateCards()
    }
    if (errorCount > 0) {
      toast.error(`${errorCount} card${errorCount > 1 ? "s" : ""} could not be saved.`)
    }
  }

  function downloadTemplate() {
    const blob = new Blob([CSV_TEMPLATE], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "gift_card_import_template.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset className="min-w-0 overflow-x-hidden">
        <SiteHeader title="Add Gift Cards" />

        {/* ── Outer Page Layout: Form & Dropzone on Left, Persistent Queue Sidebar on Right ── */}
        <div className="flex flex-1 flex-col lg:flex-row min-h-0 bg-background">
          
          {/* Left Content Area: Single Entry + OR Divider + Bulk Dropzone */}
          <div className="flex-1 p-4 sm:p-6 overflow-auto border-r border-border">
            <div className="max-w-3xl space-y-6">

              {/* 1. Single Card Details Card */}
              <div className="border border-border rounded-[12px] overflow-hidden bg-card shadow-sm">
                <div className="px-6 py-4 border-b border-border">
                  <p className="text-sm font-semibold text-foreground">Single Card Details</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Fill out card information and add to queue</p>
                </div>

                <form onSubmit={handleAddToQueue} className="p-6 space-y-4">
                  {/* Store Combobox */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">Store</Label>
                    <Combobox
                      value={store}
                      onValueChange={(val) => {
                        if (val === "__add_new_store__") {
                          setShowAddStoreDialog(true)
                          return
                        }
                        if (val) setStore(val as string)
                      }}
                      onInputValueChange={(val) => setStore(val)}
                    >
                      <ComboboxInput
                        placeholder="Search or add store..."
                        className="h-8 rounded-[6px]"
                      />
                      <ComboboxContent className="max-h-60 overflow-hidden">
                        <ComboboxList className="max-h-56 overflow-y-auto pr-1 [scrollbar-width:thin] [scrollbar-color:var(--border)_transparent]">
                          {filteredStoreOptions.length > 0 ? (
                            filteredStoreOptions.map(s => (
                              <ComboboxItem key={s} value={s}>
                                {s}
                              </ComboboxItem>
                            ))
                          ) : (
                            <ComboboxEmpty>No results found</ComboboxEmpty>
                          )}
                          <div className="border-t border-border my-1" />
                          <ComboboxItem value="__add_new_store__" className="text-primary font-medium cursor-pointer">
                            <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} className="size-3.5 mr-1" />
                            Add Store
                          </ComboboxItem>
                        </ComboboxList>
                      </ComboboxContent>
                    </Combobox>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Last 4 Digits */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-muted-foreground">Last 4 Digits</Label>
                      <Input
                        value={last4}
                        onChange={(e) => setLast4(e.target.value.replace(/\D/g, "").slice(0, 4))}
                        placeholder="e.g. 4821"
                        maxLength={4}
                        className="h-8 text-sm rounded-[6px] font-mono tracking-wide"
                      />
                    </div>

                    {/* Initial Balance */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-muted-foreground">Initial Balance</Label>
                      <div className="relative">
                        <span className="pointer-events-none absolute inset-y-0 left-2.5 flex items-center text-xs font-medium text-muted-foreground">$</span>
                        <Input
                          type="text"
                          inputMode="decimal"
                          placeholder="0.00"
                          value={amount}
                          onChange={e => {
                            const digits = e.target.value.replace(/\D/g, "")
                            if (!digits) {
                              setAmount("")
                              return
                            }
                            const cents = parseInt(digits, 10)
                            setAmount((cents / 100).toFixed(2))
                          }}
                          className="h-8 text-sm rounded-[6px] pl-6 pr-3 font-mono tabular-nums text-left"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">Notes (optional)</Label>
                    <textarea
                      placeholder="e.g. Weekly groceries for the family"
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      className="flex min-h-[64px] w-full rounded-[6px] border border-input bg-input/30 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 outline-none resize-y leading-snug"
                    />
                  </div>

                  {singleError && (
                    <p className="text-xs text-destructive">{singleError}</p>
                  )}

                  <div className="pt-2 flex items-center justify-between">
                    {queue.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setQueue([])}
                        className="text-xs text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                      >
                        Clear Queue ({queue.length})
                      </button>
                    )}
                    <div className="ml-auto flex items-center gap-2">
                      <Button type="submit" className="rounded-[6px] text-xs font-medium gap-1.5 cursor-pointer">
                        <HugeiconsIcon icon={Add01Icon} strokeWidth={2} className="size-3.5" />
                        Add to Queue
                      </Button>
                    </div>
                  </div>
                </form>
              </div>

              {/* 2. Dotted line with "OR" in the middle */}
              <div className="relative flex items-center justify-center my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-dashed border-border" />
                </div>
                <div className="relative px-3 bg-background text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  OR
                </div>
              </div>

              {/* 3. CSV Bulk Import Dropzone (Directly adds to Queue) */}
              <div className="border border-border rounded-[12px] overflow-hidden bg-card shadow-sm">
                <div className="px-6 py-4 border-b border-border flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Bulk CSV Import</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Drop a CSV file to add multiple cards straight to the queue</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={downloadTemplate} className="rounded-[6px] text-xs font-medium gap-1.5 cursor-pointer">
                    <HugeiconsIcon icon={Download01Icon} strokeWidth={2} className="size-3.5" />
                    Download CSV Template
                  </Button>
                </div>

                <div className="p-6">
                  <input
                    ref={bulkFileInputRef}
                    type="file"
                    accept=".csv,text/csv"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) processFile(e.target.files[0])
                      e.currentTarget.value = ""
                    }}
                  />

                  <div
                    onClick={() => bulkFileInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault()
                      setIsDragging(false)
                      if (e.dataTransfer.files?.[0]) processFile(e.dataTransfer.files[0])
                    }}
                    className={`w-full rounded-[10px] border-2 border-dashed p-8 transition-colors flex flex-col items-center justify-center text-center cursor-pointer ${
                      isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/50 bg-card"
                    }`}
                  >
                    <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-3">
                      <HugeiconsIcon icon={Upload01Icon} strokeWidth={2} className="size-5" />
                    </div>
                    <p className="text-xs font-semibold text-foreground">
                      Drop your CSV file here, or click to browse
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-1">Cards will automatically load into the queue on the right</p>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* ── Persistent Right-Hand Queue Sidebar ── */}
          <div className="w-full lg:w-[360px] bg-muted/30 flex flex-col min-h-0 shrink-0 border-t lg:border-t-0 lg:border-l border-border">
            <div className="h-14 border-b border-border px-5 flex items-center justify-between bg-card shrink-0">
              <div className="flex items-center gap-2">
                <p className="text-xs font-semibold text-foreground uppercase tracking-wide">Queue</p>
                {queue.length > 0 && (
                  <Badge variant="secondary" className="text-xs font-semibold px-2 py-0.5">{queue.length}</Badge>
                )}
              </div>
              {queue.length > 0 && (
                <button
                  type="button"
                  onClick={() => setQueue([])}
                  className="text-xs text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                >
                  Clear All
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-border bg-background max-h-[calc(100vh-220px)] lg:max-h-[calc(100vh-140px)]">
              {queue.length === 0 ? (
                <div className="p-8 flex flex-col items-center justify-center text-center h-full min-h-[260px]">
                  <HugeiconsIcon icon={InformationCircleIcon} strokeWidth={1.5} className="size-6 text-muted-foreground/60 mb-2" />
                  <p className="text-xs font-medium text-foreground">No cards queued</p>
                  <p className="text-[11px] text-muted-foreground mt-1 max-w-[220px]">
                    Fill the form or drop a CSV file. All cards appear here in the queue ready to save together.
                  </p>
                </div>
              ) : (
                queue.map((card) => (
                  <div key={card.id} className="p-3.5 hover:bg-muted/40 transition-colors flex items-start justify-between gap-3 bg-card">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-semibold text-foreground truncate">{card.store}</p>
                        <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5 uppercase font-medium text-muted-foreground">
                          {card.source}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground font-mono">•••• {card.last4}</p>
                      {card.notes && <p className="text-[11px] text-muted-foreground truncate italic">{card.notes}</p>}
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span className="text-xs font-bold text-foreground">${Number(card.amount).toFixed(2)}</span>
                      <button
                        type="button"
                        onClick={() => setQueue(prev => prev.filter(q => q.id !== card.id))}
                        className="text-[11px] text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t border-border bg-card shrink-0">
              <Button
                type="button"
                disabled={queue.length === 0 || savingQueue}
                onClick={saveQueueToInventory}
                className="w-full rounded-[6px] text-xs font-medium gap-2 cursor-pointer justify-center"
              >
                <HugeiconsIcon icon={CreditCardIcon} strokeWidth={2} className="size-3.5" />
                {savingQueue ? "Saving to Inventory..." : `Save ${queue.length} Card${queue.length === 1 ? "" : "s"} to Inventory`}
              </Button>
            </div>
          </div>

        </div>
      </SidebarInset>

      {/* Add Store Dialog Popup */}
      <Dialog open={showAddStoreDialog} onOpenChange={setShowAddStoreDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Store</DialogTitle>
            <DialogDescription>
              Enter the store name and category to add it to inventory options.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateStore}>
            <div className="py-3 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Store Name</Label>
                <Input
                  value={newStoreName}
                  onChange={e => setNewStoreName(e.target.value)}
                  placeholder="e.g. Costco, Metro, Target"
                  required
                  className="h-8 text-sm rounded-[6px]"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Category</Label>
                <Select value={newStoreCategory} onValueChange={(val) => setNewStoreCategory(val ?? "GROCERY")}>
                  <SelectTrigger className="h-8 text-xs rounded-[6px]">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GROCERY">Grocery</SelectItem>
                    <SelectItem value="FAST_FOOD">Fast Food</SelectItem>
                    <SelectItem value="CLOTHING">Clothing</SelectItem>
                    <SelectItem value="RESTAURANT">Restaurant</SelectItem>
                    <SelectItem value="PHARMACY">Pharmacy</SelectItem>
                    <SelectItem value="ELECTRONICS">Electronics</SelectItem>
                    <SelectItem value="HOME_GOODS">Home Goods</SelectItem>
                    <SelectItem value="ONLINE">Online</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowAddStoreDialog(false)} className="rounded-[6px] text-xs">
                Cancel
              </Button>
              <Button type="submit" disabled={savingStore || !newStoreName.trim()} className="rounded-[6px] text-xs font-medium">
                {savingStore ? "Adding…" : "Add Store"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </SidebarProvider>
  )
}
