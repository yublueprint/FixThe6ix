"use client"

import * as React from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  CreditCardIcon, Add01Icon, InformationCircleIcon, File01Icon,
  Upload01Icon, Download01Icon, Delete01Icon
} from "@hugeicons/core-free-icons"
import useSWR from "swr"
import { fetcher } from "@/lib/fetcher"

type ExistingCard = {
  id: string
  store: { name: string }
  lastFourDigits: string
}

type QueueCard = {
  id: string
  store: string
  last4: string
  amount: number
  notes: string
  addedBy: string
  dateAdded: string
  source: "single" | "bulk"
}

type CsvMappedRow = {
  store: string
  last4: string
  amount: number
  notes: string
  addedBy: string
  dateAdded: string
}

function toKey(store: string, last4: string) {
  return `${store.trim().toLowerCase()}::${last4.trim()}`
}

function parseCsvLine(line: string) {
  const values: string[] = []
  let current = ""
  let insideQuotes = false

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i]
    if (ch === '"') {
      if (insideQuotes && line[i + 1] === '"') {
        current += '"'
        i += 1
      } else {
        insideQuotes = !insideQuotes
      }
      continue
    }

    if (ch === "," && !insideQuotes) {
      values.push(current.trim())
      current = ""
      continue
    }

    current += ch
  }

  values.push(current.trim())
  return values
}

export default function CardsPage() {
  const [tab, setTab] = React.useState("single")
  const [queue, setQueue] = React.useState<QueueCard[]>([])
  
  const { data: cardsData, mutate: mutateCards } = useSWR<any[]>("/api/gift-cards", fetcher)
  const existingCards = Array.isArray(cardsData) ? cardsData : []

  const { data: storesData } = useSWR<any[]>("/api/stores", fetcher)
  const dbStoreNames = Array.isArray(storesData) ? storesData.map((s: any) => s.name) : []

  // Single-card form state
  const [store, setStore] = React.useState("")
  const [last4, setLast4] = React.useState("")
  const [amount, setAmount] = React.useState("")
  const [dateAdded, setDateAdded] = React.useState(() => new Date().toISOString().slice(0, 10))
  const [addedBy, setAddedBy] = React.useState("")
  const [notes, setNotes] = React.useState("")
  const [singleError, setSingleError] = React.useState("")
  const [singleSuccess, setSingleSuccess] = React.useState("")

  // Bulk state
  const [bulkError, setBulkError] = React.useState("")
  const [bulkSuccess, setBulkSuccess] = React.useState("")
  const [isDragOver, setIsDragOver] = React.useState(false)

  const storeInputRef = React.useRef<HTMLInputElement>(null)
  const bulkFileInputRef = React.useRef<HTMLInputElement>(null)

  const storeOptions = React.useMemo(() => {
    const fromData = existingCards.map(card => card.store?.name).filter(Boolean)
    return [...new Set([...fromData, ...dbStoreNames])].sort()
  }, [existingCards, dbStoreNames])

  const existingKeys = React.useMemo(() => {
    const keys = new Set(existingCards.map(card => toKey(card.store?.name ?? "", card.lastFourDigits)))
    queue.forEach(card => keys.add(toKey(card.store, card.last4)))
    return keys
  }, [queue, existingCards])

  async function saveQueueToInventory() {
    let successCount = 0
    let errorCount = 0

    for (const card of queue) {
      try {
        const res = await fetch("/api/gift-cards", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            storeName: card.store,
            lastFourDigits: card.last4,
            initialAmount: card.amount,
            notes: card.notes,
          }),
        })
        if (res.ok) {
          successCount++
        } else {
          errorCount++
        }
      } catch (e) {
        errorCount++
      }
    }

    if (errorCount === 0) {
      setSingleSuccess(`Saved ${successCount} card${successCount === 1 ? "" : "s"} to inventory.`)
    } else {
      setSingleSuccess(`Saved ${successCount} card(s), but failed to save ${errorCount} card(s).`)
    }
    
    // Refresh the list
    mutateCards()

    setQueue([])
  }

  function resetSingleForm() {
    setStore("")
    setLast4("")
    setAmount("")
    setNotes("")
    setSingleError("")
    setSingleSuccess("")
    storeInputRef.current?.focus()
  }

  function pushToQueue(row: CsvMappedRow, source: "single" | "bulk") {
    const newCard: QueueCard = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      store: row.store,
      last4: row.last4,
      amount: row.amount,
      notes: row.notes,
      addedBy: row.addedBy,
      dateAdded: row.dateAdded,
      source,
    }
    setQueue(prev => [...prev, newCard])
  }

  function handleAddSingle() {
    setSingleError("")
    setSingleSuccess("")

    const normalizedStore = store.trim()
    const normalizedLast4 = last4.replace(/\D/g, "")
    const parsedAmount = Number(Number(amount).toFixed(2))

    if (!normalizedStore) {
      setSingleError("Store is required.")
      return
    }
    if (!/^\d{4}$/.test(normalizedLast4)) {
      setSingleError("Last 4 digits must be exactly 4 numbers.")
      return
    }
    if (!amount || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      setSingleError("Amount must be a valid value greater than 0.")
      return
    }

    const dupKey = toKey(normalizedStore, normalizedLast4)
    if (existingKeys.has(dupKey)) {
      setSingleError("Duplicate detected: this store + last 4 card already exists.")
      return
    }

    pushToQueue(
      {
        store: normalizedStore,
        last4: normalizedLast4,
        amount: parsedAmount,
        notes: notes.trim(),
        addedBy: addedBy.trim(),
        dateAdded,
      },
      "single"
    )

    // We don't save immediately to backend, we just push to queue so user can save later.
    // If we wanted to save immediately, we would call the API here.
    // Let's keep it as push to queue.

    setSingleSuccess("Card added to queue. Click 'Save to Inventory' to commit.")
  }

  async function handleCsvUpload(file: File) {
    setBulkError("")
    setBulkSuccess("")

    const content = await file.text()
    const lines = content
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(Boolean)

    if (lines.length === 0) {
      setBulkError("CSV is empty.")
      return
    }

    const header = parseCsvLine(lines[0]).map(col => col.toLowerCase())
    const hasHeader = header.includes("store") && (header.includes("last4") || header.includes("last 4"))
    const startIndex = hasHeader ? 1 : 0

    const localSeen = new Set<string>()
    const mappedRows: CsvMappedRow[] = []
    let duplicates = 0
    let invalid = 0

    for (let i = startIndex; i < lines.length; i += 1) {
      const cols = parseCsvLine(lines[i])

      let rowStore = ""
      let rowLast4 = ""
      let rowAmount = ""
      let rowNotes = ""
      let rowAddedBy = ""
      let rowDate = new Date().toISOString().slice(0, 10)

      if (hasHeader) {
        const byHeader = (name: string) => {
          const idx = header.findIndex(h => h === name)
          return idx >= 0 ? cols[idx] ?? "" : ""
        }

        rowStore = byHeader("store")
        rowLast4 = byHeader("last4") || byHeader("last 4") || byHeader("last_four_digits")
        rowAmount = byHeader("amount") || byHeader("initial amount")
        rowNotes = byHeader("notes")
        rowAddedBy = byHeader("added by") || byHeader("added_by")
        rowDate = byHeader("date added") || byHeader("date_added") || rowDate
      } else {
        rowStore = cols[0] ?? ""
        rowLast4 = cols[1] ?? ""
        rowAmount = cols[2] ?? ""
        rowNotes = cols[3] ?? ""
        rowAddedBy = cols[4] ?? ""
      }

      const normalizedStore = rowStore.trim()
      const normalizedLast4 = rowLast4.replace(/\D/g, "")
      const parsedAmount = Number(Number(rowAmount).toFixed(2))

      if (!normalizedStore || !/^\d{4}$/.test(normalizedLast4) || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
        invalid += 1
        continue
      }

      const key = toKey(normalizedStore, normalizedLast4)
      if (existingKeys.has(key) || localSeen.has(key)) {
        duplicates += 1
        continue
      }

      localSeen.add(key)
      mappedRows.push({
        store: normalizedStore,
        last4: normalizedLast4,
        amount: parsedAmount,
        notes: rowNotes.trim(),
        addedBy: rowAddedBy.trim(),
        dateAdded: rowDate,
      })
    }

    if (mappedRows.length === 0) {
      setBulkError("No valid rows to import from CSV.")
      return
    }

    setQueue(prev => [
      ...prev,
      ...mappedRows.map(row => ({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        store: row.store,
        last4: row.last4,
        amount: row.amount,
        notes: row.notes,
        addedBy: row.addedBy,
        dateAdded: row.dateAdded,
        source: "bulk" as const,
      })),
    ])

    setBulkSuccess(`Imported ${mappedRows.length} card(s). Skipped ${duplicates} duplicate(s) and ${invalid} invalid row(s).`)
  }

  function handleBulkFiles(fileList: FileList | null) {
    const file = fileList?.[0]
    if (!file) return
    void handleCsvUpload(file)
  }

  function downloadTemplate() {
    const sample = [
      "store,last4,amount,notes,added by,date added",
      "Best Buy,1234,12,Emergency supplies,Amy Brown,2026-04-11",
      "Walmart,9876,65,Groceries support,James Lee,2026-04-11",
    ].join("\n")

    const blob = new Blob([sample], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "gift-card-template.csv"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        {/* ── Header ── */}
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4 bg-background">
          <SidebarTrigger className="-ml-1" />
          <div className="w-full flex justify-between items-center">
            <h1 className="text-lg font-semibold">Add Gift Card</h1>
          </div>
        </header>

        <div className="flex flex-1 min-h-0 bg-background">
          <div className="flex-1 border-r border-border p-4 sm:p-6 overflow-auto">
            <Tabs value={tab} onValueChange={(value) => setTab(value ?? "single")}>
              <TabsList className="bg-muted rounded-full p-1 h-8">
                <TabsTrigger
                  value="single"
                  className="rounded-full text-xs px-3 py-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <HugeiconsIcon icon={CreditCardIcon} strokeWidth={1.8} className="size-3.5" />
                  Single Card
                </TabsTrigger>
                <TabsTrigger
                  value="bulk"
                  className="rounded-full text-xs px-3 py-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <HugeiconsIcon icon={File01Icon} strokeWidth={1.8} className="size-3.5" />
                  Bulk Import
                </TabsTrigger>
              </TabsList>

              <TabsContent value="single" className="mt-4 space-y-4 max-w-3xl">
                <p className="text-xs text-muted-foreground">Summary</p>

                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Store</Label>
                  <Input
                    ref={storeInputRef}
                    list="card-store-options"
                    placeholder="Store"
                    value={store}
                    onChange={(e) => setStore(e.target.value)}
                    className="h-9 rounded-[6px]"
                  />
                  <datalist id="card-store-options">
                    {storeOptions.map(option => <option key={option} value={option} />)}
                  </datalist>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Last 4 Digits</Label>
                    <Input
                      inputMode="numeric"
                      placeholder="1234"
                      value={last4}
                      onChange={(e) => setLast4(e.target.value.replace(/\D/g, "").slice(0, 4))}
                      className="h-9 rounded-[6px]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Amount</Label>
                    <Input
                      type="number"
                      min="0.01"
                      step="0.01"
                      placeholder="$65"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="h-9 rounded-[6px]"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Date Added</Label>
                  <Input
                    type="date"
                    value={dateAdded}
                    onChange={(e) => setDateAdded(e.target.value)}
                    className="h-9 rounded-[6px]"
                  />
                </div>

                <div className="pt-2">
                  <p className="text-xs font-medium text-foreground">Card Details</p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Added by</Label>
                  <Input
                    placeholder="Volunteer name"
                    value={addedBy}
                    onChange={(e) => setAddedBy(e.target.value)}
                    className="h-9 rounded-[6px]"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Notes (optional)</Label>
                  <Textarea
                    placeholder="Any additional info about this card..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="min-h-20 rounded-[6px]"
                  />
                </div>

                {singleError && <p className="text-xs text-destructive">{singleError}</p>}
                {singleSuccess && (
                  <div className="flex items-center gap-3">
                    <p className="text-xs text-green-600 dark:text-green-400">{singleSuccess}</p>
                    <button
                      type="button"
                      onClick={resetSingleForm}
                      className="text-xs text-primary hover:underline"
                    >
                      Add another card
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={handleAddSingle}
                    className="bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-medium px-3 py-2 rounded-[6px]"
                  >
                    Add to Queue
                  </button>
                  <button
                    type="button"
                    onClick={() => setQueue([])}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Clear Queue
                  </button>
                </div>
              </TabsContent>

              <TabsContent value="bulk" className="mt-4 space-y-4 max-w-3xl">
                <div className="space-y-3">
                  <input
                    ref={bulkFileInputRef}
                    type="file"
                    accept=".csv,text/csv"
                    className="hidden"
                    onChange={(e) => {
                      handleBulkFiles(e.target.files)
                      e.currentTarget.value = ""
                    }}
                  />

                  <button
                    type="button"
                    onClick={() => bulkFileInputRef.current?.click()}
                    onDragOver={(e) => {
                      e.preventDefault()
                      setIsDragOver(true)
                    }}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault()
                      setIsDragOver(false)
                      handleBulkFiles(e.dataTransfer.files)
                    }}
                    className={`w-full rounded-[8px] border border-dashed transition-colors min-h-[172px] flex flex-col items-center justify-center text-center ${
                      isDragOver
                        ? "border-primary bg-primary/10"
                        : "border-border bg-muted"
                    }`}
                  >
                    <HugeiconsIcon icon={Upload01Icon} strokeWidth={1.6} className="size-5 text-muted-foreground mb-2" />
                    <p className="text-xs text-foreground">Drop your CSV files here</p>
                    <p className="text-xs text-muted-foreground mt-1">or browse files</p>
                  </button>

                  <button
                    type="button"
                    onClick={downloadTemplate}
                    className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground"
                  >
                    <HugeiconsIcon icon={Download01Icon} strokeWidth={1.8} className="size-3.5" />
                    Download CSV template
                  </button>
                </div>

                {bulkError && <p className="text-xs text-destructive">{bulkError}</p>}
                {bulkSuccess && <p className="text-xs text-green-600 dark:text-green-400">{bulkSuccess}</p>}
              </TabsContent>
            </Tabs>
          </div>

          <div className="w-[300px] sm:w-[340px] bg-muted/50 flex flex-col min-h-0 border-l border-border">
            <div className="h-12 border-b border-border px-4 flex items-center bg-card">
              <p className="text-xs font-medium text-foreground">Queue</p>
            </div>

            <div className="flex-1 overflow-auto bg-background">
              {queue.length === 0 ? (
                <div className="h-full p-4 flex flex-col items-center justify-center text-center">
                  <HugeiconsIcon icon={InformationCircleIcon} strokeWidth={1.5} className="size-5 text-muted-foreground mb-2" />
                  <p className="text-xs text-foreground">No cards queued</p>
                  <p className="text-[11px] text-muted-foreground mt-1 max-w-[220px]">
                    Fill the form or upload a CSV, then add cards to the queue. They will save at once.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {queue.map(card => (
                    <div key={card.id} className="px-4 py-3 bg-card hover:bg-accent/50 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-[11px] font-medium text-foreground">{card.store}</p>
                          <p className="text-[11px] text-muted-foreground">•••• {card.last4}</p>
                          <p className="text-[11px] text-muted-foreground">{card.addedBy || "Volunteer"}</p>
                        </div>
                        <p className="text-[11px] font-medium text-foreground">${card.amount.toFixed(0)}</p>
                      </div>
                      <div className="mt-1 flex items-center justify-between">
                        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{card.source}</span>
                        <button
                          type="button"
                          onClick={() => setQueue(prev => prev.filter(q => q.id !== card.id))}
                          className="text-[11px] text-muted-foreground hover:text-foreground"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-border p-3 bg-card">
              <button
                type="button"
                disabled={queue.length === 0}
                onClick={saveQueueToInventory}
                className="w-full bg-primary text-primary-foreground hover:bg-primary-hover text-xs font-medium px-3 py-2 rounded-[6px] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Save {queue.length} Card{queue.length === 1 ? "" : "s"} to Inventory
              </button>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
