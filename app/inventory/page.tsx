"use client"

import * as React from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Search01Icon, ArrowUp01Icon, Delete01Icon, Edit01Icon,
} from "@hugeicons/core-free-icons"
import { toast } from "sonner"
import { STORE_CATEGORIES } from "@/lib/treemap"
import {
  loadPersistedGiftCards,
  upsertPersistedGiftCard,
  type PersistedGiftCard,
} from "@/lib/inventory-persistence"
import { GiftCardDialog } from "@/components/gift-card-dialog"
import rawData from "./data.json"

// ── Types ─────────────────────────────────────────────────────────────────────

type GiftCard = {
  id: number
  store: string
  last4: string
  initialBalance: number
  remainingBalance: number
  status: string
  addedDate: string
  addedBy: string
  notes?: string
}

type Transaction = {
  id: number
  cardId: number
  date: string
  type: "spend" | "donation"
  amount: number
  volunteer: string
  recipient: string | null
  notes: string
}

type DataStore = { cards: GiftCard[]; transactions: Transaction[] }

// ── Constants ─────────────────────────────────────────────────────────────────

const VOLUNTEERS = ["Sarah Johnson", "Mike Davis", "Lisa Chen", "James Lee", "Amy Brown"]
const CATEGORIES = ["All", "Grocery", "Fast Food", "Clothing", "Other"]

function categoryForStore(store: string) {
  return STORE_CATEGORIES[store] ?? "Other"
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function InventoryPage() {
  const [data, setData] = React.useState<DataStore>(rawData as DataStore)
  const [filterStore, setFilterStore] = React.useState("All")
  const [filterCategory, setFilterCategory] = React.useState("All")
  const [searchQuery, setSearchQuery] = React.useState("")
  const [selectedId, setSelectedId] = React.useState<number | null>(null)
  const [selectedRows, setSelectedRows] = React.useState<number[]>([])

  // Add gift card form
  const [newStore, setNewStore] = React.useState("")
  const [newLast4, setNewLast4] = React.useState("")
  const [newInitialAmount, setNewInitialAmount] = React.useState("")
  const [newNotes, setNewNotes] = React.useState("")
  const [addErr, setAddErr] = React.useState("")
  const [addSuccess, setAddSuccess] = React.useState("")

  // Edit form
  const [showEditSheet, setShowEditSheet] = React.useState(false)
  const [editCardId, setEditCardId] = React.useState<number | null>(null)
  const [editStore, setEditStore] = React.useState("")
  const [editInitialBalance, setEditInitialBalance] = React.useState("")
  const [editRemainingBalance, setEditRemainingBalance] = React.useState("")

  const uniqueStores = React.useMemo(() =>
    [...new Set(data.cards.map(c => c.store))].sort(), [data.cards])

  const storeOptions = React.useMemo(() =>
    [...new Set([...Object.keys(STORE_CATEGORIES), ...uniqueStores])].sort(), [uniqueStores])

  const filteredCards = React.useMemo(() =>
    data.cards.filter(c => {
      if (filterStore !== "All" && c.store !== filterStore) return false
      if (filterCategory !== "All" && categoryForStore(c.store) !== filterCategory) return false
      if (searchQuery) {
        const query = searchQuery.toLowerCase().trim()
        const numericQuery = searchQuery.replace(/\D/g, "")
        const byStore = c.store.toLowerCase().includes(query)
        const byDigits = numericQuery.length > 0 && c.last4.includes(numericQuery)
        if (!byStore && !byDigits) return false
      }
      return true
    }), [data.cards, filterStore, filterCategory, searchQuery])

  const selectedCard = data.cards.find(c => c.id === selectedId) ?? null

  const cardTxns = React.useMemo(() => {
    if (!selectedId) return []
    return data.transactions
      .filter(t => t.cardId === selectedId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [selectedId, data.transactions])

  const statsCards = selectedRows.length > 0 ? data.cards.filter(c => selectedRows.includes(c.id)) : data.cards

  const totalCards = statsCards.length
  const activeCards = statsCards.filter(c => c.status === "Active").length
  const totalRemaining = statsCards.reduce((s, c) => s + c.remainingBalance, 0)
  const totalInitial = statsCards.reduce((s, c) => s + c.initialBalance, 0)

  React.useEffect(() => {
    const persisted = loadPersistedGiftCards() as GiftCard[]
    if (persisted.length === 0) return

    setData(prev => {
      const prevKeys = new Set(prev.cards.map(c => `${c.store.toLowerCase()}::${c.last4}`))
      const uniquePersisted = persisted.filter(c => !prevKeys.has(`${c.store.toLowerCase()}::${c.last4}`))
      if (uniquePersisted.length === 0) return prev
      return { ...prev, cards: [...uniquePersisted, ...prev.cards] }
    })
  }, [])

  function handleAddGiftCard() {
    setAddErr("")
    setAddSuccess("")

    const store = newStore.trim()
    const last4 = newLast4.replace(/\D/g, "")
    const initialAmount = Number(Number(newInitialAmount).toFixed(2))

    if (!store) { setAddErr("Please select a store."); return }
    if (last4.length !== 4) { setAddErr("Last 4 digits must be exactly 4 numbers."); return }
    if (!newInitialAmount || isNaN(initialAmount) || initialAmount <= 0) {
      setAddErr("Please enter a valid initial amount."); return
    }

    const duplicate = data.cards.some(c => c.store === store && c.last4 === last4)
    if (duplicate) {
      setAddErr("A card for this store with the same last 4 digits already exists.")
      return
    }

    const nextId = Math.max(0, ...data.cards.map(c => c.id)) + 1
    const createdCard: GiftCard = {
      id: nextId,
      store,
      last4,
      initialBalance: initialAmount,
      remainingBalance: initialAmount,
      status: "Active",
      addedDate: new Date().toISOString(),
      addedBy: "Admin",
      notes: newNotes.trim() || undefined,
    }

    upsertPersistedGiftCard(createdCard as PersistedGiftCard)
    setData(d => ({ ...d, cards: [createdCard, ...d.cards] }))
    setNewStore("")
    setNewLast4("")
    setNewInitialAmount("")
    setNewNotes("")
    setAddSuccess("Gift card added successfully.")
  }

  // Record a spend on the currently-open card. Validation happens in the dialog.
  function recordSpend(amount: number, volunteer: string, notes: string) {
    if (selectedId == null) return
    setData(d => {
      const card = d.cards.find(c => c.id === selectedId)
      if (!card) return d
      const newBal = card.remainingBalance - amount
      return {
        cards: d.cards.map(c => c.id === selectedId
          ? { ...c, remainingBalance: newBal, status: newBal === 0 ? "Used" : c.status }
          : c),
        transactions: [...d.transactions, {
          id: d.transactions.length + 1, cardId: selectedId, date: new Date().toISOString(),
          type: "spend", amount, volunteer, recipient: null, notes,
        }],
      }
    })
    toast.success(`Recorded a $${amount.toFixed(2)} spend.`)
  }

  // Record a donation-out on the currently-open card.
  function recordDonation(amount: number, volunteer: string, recipient: string, notes: string) {
    if (selectedId == null) return
    setData(d => {
      const card = d.cards.find(c => c.id === selectedId)
      if (!card) return d
      const newBal = card.remainingBalance - amount
      return {
        cards: d.cards.map(c => c.id === selectedId
          ? { ...c, remainingBalance: newBal, status: newBal === 0 ? "Donated" : c.status }
          : c),
        transactions: [...d.transactions, {
          id: d.transactions.length + 1, cardId: selectedId, date: new Date().toISOString(),
          type: "donation", amount, volunteer, recipient, notes,
        }],
      }
    })
    toast.success(`Recorded a $${amount.toFixed(2)} donation to ${recipient}.`)
  }

  function deleteCard(id: number) {
    if (confirm("Are you sure you want to delete this gift card?")) {
      setData(d => ({
        cards: d.cards.filter(c => c.id !== id),
        transactions: d.transactions.filter(t => t.cardId !== id)
      }))
      if (selectedId === id) setSelectedId(null)
    }
  }

  function openEditCard(id: number) {
    const card = data.cards.find(c => c.id === id)
    if (card) {
      setEditCardId(id)
      setEditStore(card.store)
      setEditInitialBalance(card.initialBalance.toString())
      setEditRemainingBalance(card.remainingBalance.toString())
      setShowEditSheet(true)
    }
  }

  function saveEditCard() {
    if (!editCardId) return
    const initial = parseFloat(editInitialBalance)
    const remaining = parseFloat(editRemainingBalance)
    if (isNaN(initial) || isNaN(remaining) || initial < 0 || remaining < 0 || remaining > initial) {
      alert("Invalid balances")
      return
    }
    if (confirm("Are you sure you want to save these changes?")) {
      setData(d => ({
        ...d,
        cards: d.cards.map(c => c.id === editCardId ? {
          ...c,
          store: editStore,
          initialBalance: initial,
          remainingBalance: remaining,
          status: remaining === 0 ? "Used" : c.status
        } : c)
      }))
      setShowEditSheet(false)
    }
  }

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>

        {/* ── Header ── */}
        <div className="border-b h-12 flex items-center shrink-0">
          <div className="flex items-center gap-4 pl-5">
            <SidebarTrigger className="bg-white rounded-[6px] p-2 size-8 flex items-center justify-center" />
            <Separator orientation="vertical" className="h-4 bg-[#e5e5e5]" />
            <span className="font-medium text-[16px] text-[#0a0a0a]">Card Inventory</span>
          </div>
        </div>

        <div className="flex flex-1 flex-col overflow-auto">
          <div className="flex flex-col gap-6 p-4 sm:p-6">

            {/* ── Stats ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Total Cards", value: totalCards, sub: selectedRows.length > 0 ? "Selected gift cards" : "All gift cards in system" },
                { label: "Active Cards", value: activeCards, sub: selectedRows.length > 0 ? "Selected cards with balance" : "Cards with remaining balance" },
                { label: "Total Remaining", value: `$${totalRemaining.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, sub: selectedRows.length > 0 ? "Available in selected cards" : "Available across all cards" },
                { label: "Total Initial", value: `$${totalInitial.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, sub: selectedRows.length > 0 ? "Value of selected cards" : "Value of all cards received" },
              ].map(s => (
                <div key={s.label} className="border border-[#e2e8f0] rounded-[12px] p-5">
                  <p className="text-xs font-medium text-[#737373]">{s.label}</p>
                  <p className="text-[30px] font-semibold text-[#0a0a0a] mt-1 leading-none">{s.value}</p>
                  <p className="text-xs text-[#737373] mt-2">{s.sub}</p>
                </div>
              ))}
            </div>

            {/* ── Add Gift Card ── */}
            <div className="bg-white border border-[#e2e8f0] rounded-[12px] p-5">
              <div className="mb-4">
                <p className="text-sm font-semibold text-[#0a0a0a]">Add Gift Card</p>
                <p className="text-xs text-[#737373] mt-0.5">Create a new card entry for inventory tracking.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-[#737373]">Store</Label>
                  <Input
                    list="store-options"
                    placeholder="Search store"
                    value={newStore}
                    onChange={e => setNewStore(e.target.value)}
                    className="h-8 text-sm rounded-[6px]"
                  />
                  <datalist id="store-options">
                    {storeOptions.map(store => <option key={store} value={store} />)}
                  </datalist>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-[#737373]">Last 4 digits</Label>
                  <Input
                    inputMode="numeric"
                    placeholder="0000"
                    value={newLast4}
                    onChange={e => setNewLast4(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    className="h-8 text-sm rounded-[6px]"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-[#737373]">Initial amount ($)</Label>
                  <Input
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="0.00"
                    value={newInitialAmount}
                    onChange={e => setNewInitialAmount(e.target.value)}
                    className="h-8 text-sm rounded-[6px]"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-[#737373]">Optional notes</Label>
                  <Textarea
                    placeholder="Any context for this card"
                    value={newNotes}
                    onChange={e => setNewNotes(e.target.value)}
                    className="min-h-8 h-8 text-sm rounded-[6px] py-1.5"
                  />
                </div>
              </div>
              {addErr && <p className="text-xs text-red-500 mt-3">{addErr}</p>}
              {addSuccess && <p className="text-xs text-[#166534] mt-3">{addSuccess}</p>}
              <div className="flex items-center gap-2 mt-4">
                <button
                  onClick={handleAddGiftCard}
                  className="text-sm font-medium bg-[#0a0a0a] text-white px-3.5 py-1.5 rounded-[6px] hover:bg-[#262626] transition-colors"
                >
                  Add Gift Card
                </button>
              </div>
            </div>

            {/* ── Inventory card ── */}
            <div className="bg-white border border-[#e2e8f0] rounded-[12px] overflow-hidden">

              {/* Card header + search filters */}
              <div className="px-6 py-4 border-b border-[#e2e8f0]">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-semibold text-[#0a0a0a]">Gift Cards Inventory</p>
                    <p className="text-xs text-[#737373] mt-0.5">Click a row to record a spend, donation, or view history</p>
                  </div>
                  <p className="text-xs text-[#737373]">{filteredCards.length} of {data.cards.length} cards</p>
                </div>
                <div className="flex gap-3 flex-wrap">
                  <Select value={filterStore} onValueChange={(value) => setFilterStore(value ?? "All")}>
                    <SelectTrigger size="sm" className="w-44 rounded-[6px]">
                      <SelectValue placeholder="Filter by store" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All Stores</SelectItem>
                      {uniqueStores.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>

                  <Select value={filterCategory} onValueChange={(value) => setFilterCategory(value ?? "All")}>
                    <SelectTrigger size="sm" className="w-44 rounded-[6px]">
                      <SelectValue placeholder="Filter by category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(category => <SelectItem key={category} value={category}>{category}</SelectItem>)}
                    </SelectContent>
                  </Select>

                  <div className="relative">
                    <HugeiconsIcon icon={Search01Icon} strokeWidth={1.5} className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-[#a3a3a3] pointer-events-none" />
                    <Input
                      placeholder="Last 4 digits..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="h-8 pl-8 text-sm rounded-[6px] w-52"
                    />
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-[#fafafa] hover:bg-[#fafafa]">
                      <TableHead className="text-xs font-medium text-[#737373] py-3 pl-6">
                        <Checkbox
                          checked={selectedRows.length === filteredCards.length && filteredCards.length > 0}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedRows(filteredCards.map(c => c.id))
                            } else {
                              setSelectedRows([])
                            }
                          }}
                        />
                      </TableHead>
                      <TableHead className="text-xs font-medium text-[#737373] py-3">Store</TableHead>
                      <TableHead className="text-xs font-medium text-[#737373] py-3">Card Number</TableHead>
                      <TableHead className="text-xs font-medium text-[#737373] py-3">Initial Balance</TableHead>
                      <TableHead className="text-xs font-medium text-[#737373] py-3">Remaining Balance</TableHead>
                      <TableHead className="text-xs font-medium text-[#737373] py-3">Added By</TableHead>
                      <TableHead className="text-xs font-medium text-[#737373] py-3 pr-6" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCards.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center text-[#737373] text-sm">
                          No cards match your search.
                        </TableCell>
                      </TableRow>
                    ) : filteredCards.map(card => {
                      const pct = card.initialBalance > 0
                        ? (card.remainingBalance / card.initialBalance) * 100
                        : 0

                      return (
                        <TableRow
                          key={card.id}
                          className="border-[#e2e8f0] cursor-pointer transition-colors hover:bg-[#fafafa]"
                          onClick={() => setSelectedId(card.id)}
                        >
                          <TableCell className="py-3 pl-6 align-middle" onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={selectedRows.includes(card.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedRows(prev => [...prev, card.id])
                                } else {
                                  setSelectedRows(prev => prev.filter(id => id !== card.id))
                                }
                              }}
                            />
                          </TableCell>
                          <TableCell className="text-sm font-medium text-[#0a0a0a] py-3">{card.store}</TableCell>
                          <TableCell className="text-sm text-[#525252] py-3 font-mono tracking-wide align-middle">•••• {card.last4}</TableCell>
                          <TableCell className="text-sm text-[#525252] py-3 align-middle">${card.initialBalance.toFixed(2)}</TableCell>
                          <TableCell className="py-3 align-middle">
                            <div className="flex flex-col gap-1">
                              <span className={`text-sm font-medium ${card.remainingBalance === 0 ? "text-[#a3a3a3]" : "text-[#166534]"}`}>
                                ${card.remainingBalance.toFixed(2)}
                              </span>
                              <div className="w-20 h-1 bg-[#e2e8f0] rounded-full overflow-hidden">
                                <div className="h-full bg-[#22c55e] rounded-full" style={{ width: `${pct}%` }} />
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-[#525252] py-3 align-middle">{card.addedBy}</TableCell>
                          <TableCell className="py-3 pr-6 align-middle text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-2">
                              <HugeiconsIcon
                                icon={Edit01Icon}
                                strokeWidth={2}
                                className="size-4 text-[#a3a3a3] hover:text-blue-500 cursor-pointer"
                                onClick={() => openEditCard(card.id)}
                              />
                              <HugeiconsIcon
                                icon={Delete01Icon}
                                strokeWidth={2}
                                className="size-4 text-[#a3a3a3] hover:text-red-500 cursor-pointer"
                                onClick={() => deleteCard(card.id)}
                              />
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>{/* end overflow-x-auto */}

              {/* Footer */}
              <div className="px-6 py-3 border-t border-[#e2e8f0]">
                <p className="text-xs text-[#737373]">
                  Showing {filteredCards.length} of {data.cards.length} cards
                </p>
              </div>

            </div>
          </div>
        </div>
      </SidebarInset>

      {/* ── Gift Card Dialog (spend / donation / history) ── */}
      <GiftCardDialog
        card={selectedCard}
        transactions={cardTxns}
        volunteers={VOLUNTEERS}
        open={selectedId !== null}
        onClose={() => setSelectedId(null)}
        onSpend={recordSpend}
        onDonate={recordDonation}
      />

      {/* Edit Modal */}
      {showEditSheet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-[12px] shadow-lg max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-[#0a0a0a]">Edit Gift Card</h2>
                <button
                  onClick={() => setShowEditSheet(false)}
                  className="text-[#a3a3a3] hover:text-[#737373] transition-colors"
                >
                  <HugeiconsIcon icon={ArrowUp01Icon} strokeWidth={2} className="size-5 rotate-45" />
                </button>
              </div>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-[#737373]">Store</Label>
                  <Select value={editStore} onValueChange={(val) => setEditStore(val ?? "")}>
                    <SelectTrigger className="rounded-[26px] bg-[rgba(229,229,229,0.3)] border-[#e5e5e5] h-9 text-sm text-[#737373]">
                      <SelectValue placeholder="Select store" />
                    </SelectTrigger>
                    <SelectContent>
                      {uniqueStores.map(store => (
                        <SelectItem key={store} value={store}>{store}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-[#737373]">Initial Balance</Label>
                    <div className="relative">
                      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-[#737373] text-sm">$</span>
                      <Input
                        value={editInitialBalance}
                        onChange={(e) => setEditInitialBalance(e.target.value.replace(/[^0-9.]/g, ""))}
                        placeholder="0.00"
                        inputMode="decimal"
                        className="rounded-[26px] bg-[rgba(229,229,229,0.3)] border-[#e5e5e5] h-9 text-sm text-[#737373] placeholder:text-[#737373] pl-7"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-[#737373]">Remaining Balance</Label>
                    <div className="relative">
                      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-[#737373] text-sm">$</span>
                      <Input
                        value={editRemainingBalance}
                        onChange={(e) => setEditRemainingBalance(e.target.value.replace(/[^0-9.]/g, ""))}
                        placeholder="0.00"
                        inputMode="decimal"
                        className="rounded-[26px] bg-[rgba(229,229,229,0.3)] border-[#e5e5e5] h-9 text-sm text-[#737373] placeholder:text-[#737373] pl-7"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <Button variant="outline" onClick={() => setShowEditSheet(false)} className="rounded-[6px]">Cancel</Button>
                <Button onClick={saveEditCard} className="bg-[#0f172a] text-white text-sm font-medium px-4 py-2 rounded-[6px] hover:bg-[#1e293b] transition-colors">Save Changes</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </SidebarProvider>
  )
}
