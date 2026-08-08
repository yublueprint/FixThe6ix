"use client"

import * as React from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
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
  Search01Icon, ArrowDown01Icon, ArrowUp01Icon,
ShoppingBasket01Icon, GiveBloodIcon, Delete01Icon, Edit01Icon, TradeUpIcon, TradeDownIcon,
CheckmarkCircle01Icon, PlayCircleIcon, CircleIcon
} from "@hugeicons/core-free-icons"
import { Card, CardAction, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Combobox, ComboboxInput, ComboboxContent, ComboboxList, ComboboxItem, ComboboxEmpty } from "@/components/ui/combobox"
import { cn } from "@/lib/utils"
import { CATEGORY_RAW, categoryLabel } from "@/lib/treemap"
import useSWR from "swr"
import { fetcher } from "@/lib/fetcher"

// ── Types ─────────────────────────────────────────────────────────────────────

type Store = {
  id: string
  name: string
  category: string
}

type Transaction = {
  id: string
  giftCardId: string
  createdAt: string
  type: "SPEND" | "DONATION_OUT"
  amount: number
  volunteerName: string | null
  recipientName: string | null
  notes: string | null
}

type GiftCard = {
  id: string
  store: Store
  lastFourDigits: string
  initialAmount: number
  remainingAmount: number
  status: string
  createdAt: string
  notes?: string
  transactions: Transaction[]
}

type Volunteer = {
  id: string
  name: string
}

// ── Constants ─────────────────────────────────────────────────────────────────

const CATEGORIES = ["All", "Grocery", "Fast Food", "Clothing", "Other"]

function statusStyle(status: string) {
  const normalized = status.toLowerCase()
  if (normalized === "active") return "bg-[#bbf7d0] text-[#166534]"
  if (normalized === "used" || normalized === "fully_redeemed") return "bg-[#f5f5f5] text-[#525252]"
  if (normalized === "donated") return "bg-[#bfdbfe] text-[#1e40af]"
  return "bg-[#fef9c3] text-[#854d0e]"
}

function fmt(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit", hour12: true,
  })
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function InventoryPage() {
  const { data: cardsData, error: cardsError, mutate: mutateCards } = useSWR<GiftCard[]>("/api/gift-cards", fetcher)
  const cards = Array.isArray(cardsData) ? cardsData : []

  const { data: volunteersData, error: volsError } = useSWR<Volunteer[]>("/api/volunteers", fetcher)
  const volunteers = Array.isArray(volunteersData) ? volunteersData : []

  const loading = (!cardsData && !cardsError) || (!volunteersData && !volsError)
  const [filterStore, setFilterStore] = React.useState("All")
  const [filterCategory, setFilterCategory] = React.useState("All")
  const [searchQuery, setSearchQuery] = React.useState("")
  const [selectedId, setSelectedId] = React.useState<string | null>(null)
  const [selectedRows, setSelectedRows] = React.useState<string[]>([])

  // Add gift card form
  const [newStore, setNewStore] = React.useState("")
  const [newLast4, setNewLast4] = React.useState("")
  const [newInitialAmount, setNewInitialAmount] = React.useState("")
  const [newNotes, setNewNotes] = React.useState("")
  const [addErr, setAddErr] = React.useState("")
  const [addSuccess, setAddSuccess] = React.useState("")

  // Spend form
  const [showSpend, setShowSpend] = React.useState(false)
  const [spendAmt, setSpendAmt] = React.useState("")
  const [spendVol, setSpendVol] = React.useState("")
  const [spendNotes, setSpendNotes] = React.useState("")
  const [spendErr, setSpendErr] = React.useState("")

  // Donation form
  const [showDonate, setShowDonate] = React.useState(false)
  const [donateFull, setDonateFull] = React.useState(true)
  const [donateAmt, setDonateAmt] = React.useState("")
  const [donateRecip, setDonateRecip] = React.useState("")
  const [donateVol, setDonateVol] = React.useState("")
  const [donateNotes, setDonateNotes] = React.useState("")
  const [donateErr, setDonateErr] = React.useState("")

  // Edit form
  const [showEditSheet, setShowEditSheet] = React.useState(false)
  const [editCardId, setEditCardId] = React.useState<string | null>(null)
  const [editStore, setEditStore] = React.useState("")
  const [editInitialBalance, setEditInitialBalance] = React.useState("")
  const [editRemainingBalance, setEditRemainingBalance] = React.useState("")

  // Delete Alert State
  const [deleteId, setDeleteId] = React.useState<string | null>(null)

  const uniqueStores = React.useMemo(() =>
    [...new Set(cards.map(c => c.store.name))].sort(), [cards])

  const storeOptions = React.useMemo(() => uniqueStores, [uniqueStores])

  const filteredCards = React.useMemo(() =>
    cards.filter(c => {
      if (filterStore !== "All" && c.store.name !== filterStore) return false
      if (filterCategory !== "All" && categoryLabel(c.store.category) !== filterCategory) return false
      if (searchQuery) {
        const query = searchQuery.toLowerCase().trim()
        const numericQuery = searchQuery.replace(/\D/g, "")
        const byStore = c.store.name.toLowerCase().includes(query)
        const byDigits = numericQuery.length > 0 && c.lastFourDigits.includes(numericQuery)
        if (!byStore && !byDigits) return false
      }
      return true
    }), [cards, filterStore, filterCategory, searchQuery])

  const selectedCard = cards.find(c => c.id === selectedId) ?? null

  const cardTxns = React.useMemo(() => {
    if (!selectedId || !selectedCard) return []
    return selectedCard.transactions
  }, [selectedId, selectedCard])

  const statsCards = selectedRows.length > 0 ? cards.filter(c => selectedRows.includes(c.id)) : cards

  const totalCards = statsCards.length
  const activeCards = statsCards.filter(c => c.status === "ACTIVE").length
  const totalRemaining = statsCards.reduce((s, c) => s + Number(c.remainingAmount), 0)
  const totalInitial = statsCards.reduce((s, c) => s + Number(c.initialAmount), 0)

  async function handleAddGiftCard() {
    setAddErr("")
    setAddSuccess("")

    const storeName = newStore.trim()
    const lastFourDigits = newLast4.replace(/\D/g, "")
    const initialAmount = Number(Number(newInitialAmount).toFixed(2))

    if (!storeName) { setAddErr("Please select a store."); return }
    if (lastFourDigits.length !== 4) { setAddErr("Last 4 digits must be exactly 4 numbers."); return }
    if (!newInitialAmount || isNaN(initialAmount) || initialAmount <= 0) {
      setAddErr("Please enter a valid initial amount."); return
    }

    try {
      const res = await fetch("/api/gift-cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeName, lastFourDigits, initialAmount, notes: newNotes.trim() }),
      })
      if (!res.ok) {
        const d = await res.json()
        setAddErr(d.error || "Failed to add gift card")
        return
      }
      setAddSuccess("Gift card added successfully.")
      setNewStore("")
      setNewLast4("")
      setNewInitialAmount("")
      setNewNotes("")
      mutateCards()
    } catch (e) {
      setAddErr("An error occurred")
    }
  }

  function selectCard(id: string) {
    if (selectedId === id) {
      setSelectedId(null)
    } else {
      setSelectedId(id)
      setShowSpend(false); setShowDonate(false)
      setSpendAmt(""); setSpendVol(""); setSpendNotes(""); setSpendErr("")
      setDonateAmt("");      setDonateRecip("")
      setDonateVol("")
      setDonateNotes("")
      setDonateErr(""); setDonateFull(true)
    }
  }

  async function handleSpend() {
    setSpendErr("")
    const amount = Number(Number(spendAmt).toFixed(2))
    if (!spendAmt || isNaN(amount) || amount <= 0) { setSpendErr("Enter a valid amount."); return }
    if (!spendVol) { setSpendErr("Please select a volunteer."); return }
    if (amount > selectedCard!.remainingAmount) {
      setSpendErr(`Exceeds remaining balance of $${Number(selectedCard!.remainingAmount).toFixed(2)}.`); return
    }
    
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          giftCardId: selectedId,
          amount,
          type: "SPEND",
          volunteerName: spendVol,
          notes: spendNotes.trim(),
        }),
      })
      if (!res.ok) {
        const d = await res.json()
        setSpendErr(d.error || "Failed to record spend")
        return
      }
      setShowSpend(false);      setSpendAmt("")
      setSpendVol("")
      setSpendNotes("")
      mutateCards()
    } catch (e) {
      setSpendErr("An error occurred")
    }
  }

  async function handleDonate() {
    setDonateErr("")
    if (!donateVol) { setDonateErr("Please select a volunteer."); return }
    if (!donateRecip.trim()) { setDonateErr("Please enter a recipient name."); return }
    let amount: number
    if (donateFull) {
      amount = selectedCard!.remainingAmount
    } else {
      amount = Number(Number(donateAmt).toFixed(2))
      if (!donateAmt || isNaN(amount) || amount <= 0) { setDonateErr("Enter a valid amount."); return }
      if (amount > selectedCard!.remainingAmount) {
        setDonateErr(`Exceeds remaining balance of $${Number(selectedCard!.remainingAmount).toFixed(2)}.`); return
      }
    }
    
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          giftCardId: selectedId,
          amount,
          type: "DONATION_OUT",
          volunteerName: donateVol,
          recipientName: donateRecip.trim(),
          notes: donateNotes.trim(),
        }),
      })
      if (!res.ok) {
        const d = await res.json()
        setDonateErr(d.error || "Failed to record donation")
        return
      }
      setShowDonate(false)
      setDonateAmt(""); setDonateRecip(""); setDonateVol(""); setDonateNotes(""); setDonateFull(true)
      mutateCards()
    } catch (e) {
      setDonateErr("An error occurred")
    }
  }

  async function deleteCard() {
    if (!deleteId) return;
    try {
      await fetch(`/api/gift-cards/${deleteId}`, { method: "DELETE" })
      if (selectedId === deleteId) setSelectedId(null)
      setDeleteId(null)
      mutateCards()
    } catch (e) {
      console.error(e)
    }
  }

  function openEditCard(id: string) {
    const card = cards.find(c => c.id === id);
    if (card) {
      setEditCardId(id);
      setEditStore(card.store.name);
      setEditInitialBalance(card.initialAmount.toString());
      setEditRemainingBalance(card.remainingAmount.toString());
      setShowEditSheet(true);
    }
  }

  async function saveEditCard() {
    if (!editCardId) return;
    const initial = parseFloat(editInitialBalance);
    const remaining = parseFloat(editRemainingBalance);
    if (isNaN(initial) || isNaN(remaining) || initial < 0 || remaining < 0 || remaining > initial) {
      alert("Invalid balances");
      return;
    }
    if (confirm("Are you sure you want to save these changes?")) {
      try {
        await fetch(`/api/gift-cards/${editCardId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            storeName: editStore,
            initialAmount: initial,
            remainingAmount: remaining,
          }),
        })
        setShowEditSheet(false)
      mutateCards()
      } catch (e) {
        console.error(e)
      }
    }
  }

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>

        {/* ── Header ── */}
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4 bg-background">
          <SidebarTrigger className="-ml-1" />
          <div className="w-full flex justify-between items-center">
            <h1 className="text-lg font-semibold">Card Inventory</h1>
          </div>
        </header>

        <div className="flex flex-1 flex-col overflow-auto">
          <div className="flex flex-col gap-6 p-4 sm:p-6">

            {/* ── Stats ── */}
            <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[
                {
                  label: "Total Cards",
                  value: totalCards,
                  badge: "+8.5%",
                  isUp: true,
                  heading: "Inventory expanded this period",
                  sub: "Based on donation log intake"
                },
                {
                  label: "Active Cards",
                  value: activeCards,
                  badge: "+12.0%",
                  isUp: true,
                  heading: "High availability rate",
                  sub: "Ready for recipient allocation"
                },
                {
                  label: "Total Remaining",
                  value: `$${totalRemaining.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                  badge: "-3.2%",
                  isUp: false,
                  heading: "Active redemption in progress",
                  sub: "Redemptions logged according to schedule"
                },
                {
                  label: "Total Initial",
                  value: `$${totalInitial.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                  badge: "+14.5%",
                  isUp: true,
                  heading: "Steady intake increase",
                  sub: "Meets monthly collection targets"
                },
              ].map(s => (
                <Card key={s.label} className="@container/card">
                  <CardHeader>
                    <CardDescription>{s.label}</CardDescription>
                    <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                      {loading ? <Skeleton className="h-8 w-24" /> : s.value}
                    </CardTitle>
                    <CardAction>
                      <Badge variant="outline">
                        <HugeiconsIcon icon={s.isUp ? TradeUpIcon : TradeDownIcon} strokeWidth={2} className="mr-1 size-3" />
                        {s.badge}
                      </Badge>
                    </CardAction>
                  </CardHeader>
                  <CardFooter className="flex-col items-start gap-1.5 text-sm">
                    <div className="line-clamp-1 flex gap-2 font-medium">
                      {s.heading} <HugeiconsIcon icon={s.isUp ? TradeUpIcon : TradeDownIcon} strokeWidth={2} className={`size-4 ${s.isUp ? 'text-green-600' : 'text-orange-500'}`} />
                    </div>
                    <div className="text-muted-foreground">
                      {s.sub}
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>

            {/* ── Add Gift Card ── */}
            <div className="bg-card border border-border rounded-[12px] p-5">
              <div className="mb-4">
                <p className="text-sm font-semibold text-foreground">Add Gift Card</p>
                <p className="text-xs text-muted-foreground mt-0.5">Create a new card entry for inventory tracking.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">Store</Label>
                  <Combobox
                    value={newStore}
                    onValueChange={(val) => val && setNewStore(val as string)}
                    onInputValueChange={(val) => setNewStore(val)}
                  >
                    <ComboboxInput placeholder="Search or add store..." />
                    <ComboboxContent>
                      <ComboboxList>
                        {storeOptions.length > 0 ? (
                          storeOptions.map(store => (
                            <ComboboxItem key={store} value={store}>
                              {store}
                            </ComboboxItem>
                          ))
                        ) : (
                          <ComboboxEmpty>No results found</ComboboxEmpty>
                        )}
                      </ComboboxList>
                    </ComboboxContent>
                  </Combobox>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">Last 4 digits</Label>
                  <Input
                    inputMode="numeric"
                    placeholder="0000"
                    value={newLast4}
                    onChange={e => setNewLast4(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    className="h-8 text-sm rounded-[6px]"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">Initial amount ($)</Label>
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
                  <Label className="text-xs font-medium text-muted-foreground">Optional notes</Label>
                  <Textarea
                    placeholder="Any context for this card"
                    value={newNotes}
                    onChange={e => setNewNotes(e.target.value)}
                    className="min-h-8 h-8 text-sm rounded-[6px] py-1.5"
                  />
                </div>
              </div>
              {addErr && <p className="text-xs text-destructive mt-3">{addErr}</p>}
              {addSuccess && <p className="text-xs text-green-600 dark:text-green-400 mt-3">{addSuccess}</p>}
              <div className="flex items-center gap-2 mt-4">
                <button
                  onClick={handleAddGiftCard}
                  className="text-sm font-medium bg-primary text-primary-foreground px-3.5 py-1.5 rounded-[6px] hover:bg-primary-hover transition-colors"
                >
                  Add Gift Card
                </button>
              </div>
            </div>

            {/* ── Inventory card ── */}
            <div className="bg-card border border-border rounded-[12px] overflow-hidden">

              {/* Card header + search filters */}
              <div className="px-6 py-4 border-b border-border">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Gift Card Inventory</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Click a row to record a spend, donation, or view history</p>
                  </div>
                  <p className="text-xs text-muted-foreground">{filteredCards.length} of {cards.length} cards</p>
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
                    <HugeiconsIcon icon={Search01Icon} strokeWidth={1.5} className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
                    <Input
                      placeholder="Search store or last 4"
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
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableHead className="text-xs font-medium text-muted-foreground py-3 pl-6">
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
                      <TableHead className="text-xs font-medium text-muted-foreground py-3">Store</TableHead>
                      <TableHead className="text-xs font-medium text-muted-foreground py-3">Card Number</TableHead>
                      <TableHead className="text-xs font-medium text-muted-foreground py-3">Initial Balance</TableHead>
                      <TableHead className="text-xs font-medium text-muted-foreground py-3">Remaining Balance</TableHead>
                      <TableHead className="text-xs font-medium text-muted-foreground py-3">Amount Spent</TableHead>
                      <TableHead className="text-xs font-medium text-muted-foreground py-3">Status</TableHead>
                      <TableHead className="text-xs font-medium text-muted-foreground py-3">Added By</TableHead>
                      <TableHead className="text-xs font-medium text-muted-foreground py-3 pr-6" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      Array.from({ length: 5 }).map((_, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="py-3 pl-6"><Skeleton className="h-4 w-4 rounded-sm" /></TableCell>
                          <TableCell className="py-3"><Skeleton className="h-4 w-24" /></TableCell>
                          <TableCell className="py-3"><Skeleton className="h-4 w-16" /></TableCell>
                          <TableCell className="py-3"><Skeleton className="h-4 w-16" /></TableCell>
                          <TableCell className="py-3"><Skeleton className="h-4 w-20" /></TableCell>
                          <TableCell className="py-3"><Skeleton className="h-4 w-16" /></TableCell>
                          <TableCell className="py-3"><Skeleton className="h-4 w-16 rounded-full" /></TableCell>
                          <TableCell className="py-3"><Skeleton className="h-4 w-12" /></TableCell>
                          <TableCell className="py-3 pr-6"><Skeleton className="h-4 w-8 float-right" /></TableCell>
                        </TableRow>
                      ))
                    ) : filteredCards.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="h-24 text-center text-muted-foreground text-sm">
                          No cards match your search.
                        </TableCell>
                      </TableRow>
                    ) : filteredCards.map(card => {
                      const isOpen = selectedId === card.id
                      const pct = card.initialAmount > 0
                        ? (card.remainingAmount / card.initialAmount) * 100
                        : 0

                      return (
                        <React.Fragment key={card.id}>

                          {/* Card row */}
                          <TableRow
                            className={`border-border cursor-pointer transition-colors ${isOpen ? "bg-accent/50" : "hover:bg-muted/50"}`}
                            onClick={() => selectCard(card.id)}
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
                            <TableCell className="text-sm font-medium text-foreground py-3">{card.store.name}</TableCell>
                            <TableCell className="text-sm text-muted-foreground py-3 font-mono tracking-wide align-middle">•••• {card.lastFourDigits}</TableCell>
                            <TableCell className="text-sm text-muted-foreground py-3 align-middle">${Number(card.initialAmount).toFixed(2)}</TableCell>
                            <TableCell className="py-3 align-middle">
                              <div className="flex flex-col gap-1">
                                <span className={`text-sm font-medium tabular-nums ${card.remainingAmount === 0 ? "text-muted-foreground" : "text-foreground"}`}>
                                  ${Number(card.remainingAmount).toFixed(2)}
                                </span>
                                <div className="w-20 h-1 bg-secondary rounded-full overflow-hidden">
                                  <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm text-foreground font-medium tabular-nums py-3 align-middle">${(Number(card.initialAmount) - Number(card.remainingAmount)).toFixed(2)}</TableCell>
                            <TableCell className="py-3 align-middle">
                              <div className="flex w-[130px] items-center">
                                {card.status === "ACTIVE" ? (
                                  <HugeiconsIcon icon={PlayCircleIcon} strokeWidth={2} className="mr-2 size-4 text-blue-500" />
                                ) : card.status === "DONATED" ? (
                                  <HugeiconsIcon icon={CheckmarkCircle01Icon} strokeWidth={2} className="mr-2 size-4 text-green-500" />
                                ) : (
                                  <HugeiconsIcon icon={CheckmarkCircle01Icon} strokeWidth={2} className="mr-2 size-4 text-muted-foreground" />
                                )}
                                <span className="text-sm font-medium text-foreground">
                                  {card.status === "ACTIVE" ? "Active" : card.status === "DONATED" ? "Donated" : "Used"}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground py-3 align-middle">Admin</TableCell>
                            <TableCell className="py-3 pr-6 align-middle text-right">
                              <div className="flex items-center justify-end gap-2">
                                <HugeiconsIcon
                                  icon={Edit01Icon}
                                  strokeWidth={2}
                                  className="size-4 text-muted-foreground hover:text-blue-500 cursor-pointer"
                                  onClick={(e) => { e.stopPropagation(); openEditCard(card.id); }}
                                />
                                <HugeiconsIcon
                                  icon={Delete01Icon}
                                  strokeWidth={2}
                                  className="size-4 text-muted-foreground hover:text-destructive cursor-pointer"
                                  onClick={(e) => { e.stopPropagation(); setDeleteId(card.id); }}
                                />
                                <HugeiconsIcon
                                  icon={isOpen ? ArrowUp01Icon : ArrowDown01Icon}
                                  strokeWidth={2}
                                  className="size-4 text-muted-foreground inline-block"
                                />
                              </div>
                            </TableCell>
                          </TableRow>

                          {/* Expanded detail panel */}
                          {isOpen && selectedCard && (
                            <TableRow className="bg-accent/30 hover:bg-accent/30 border-border">
                              <TableCell colSpan={9} className="p-0">
                                <div className="px-6 py-5 border-t border-border">

                                  {/* Action buttons — only if balance remains */}
                                  {selectedCard.remainingAmount > 0 && (
                                    <div className="flex gap-2 mb-4">
                                      <button
                                        onClick={() => { setShowSpend(v => !v); setShowDonate(false) }}
                                        className={`flex items-center gap-1.5 text-sm font-medium px-3.5 py-2 rounded-[6px] border transition-colors ${showSpend ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border hover:bg-muted"}`}
                                      >
                                        <HugeiconsIcon icon={ShoppingBasket01Icon} strokeWidth={2} className="size-4" />
                                        Record Spend
                                      </button>
                                      <button
                                        onClick={() => { setShowDonate(v => !v); setShowSpend(false) }}
                                        className={`flex items-center gap-1.5 text-sm font-medium px-3.5 py-2 rounded-[6px] border transition-colors ${showDonate ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border hover:bg-muted"}`}
                                      >
                                        <HugeiconsIcon icon={GiveBloodIcon} strokeWidth={2} className="size-4" />
                                        Record Donation
                                      </button>
                                    </div>
                                  )}

                                  {/* Spend form */}
                                  {showSpend && (
                                    <div className="mb-5 bg-card border border-border rounded-[8px] p-4 space-y-3">
                                      <p className="text-sm font-semibold text-foreground">Record a Spend</p>
                                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        <div className="space-y-1.5">
                                          <Label className="text-xs font-medium text-muted-foreground">Amount ($)</Label>
                                          <Input
                                            type="number" min="0.01" step="0.01" placeholder="0.00"
                                            value={spendAmt} onChange={e => setSpendAmt(e.target.value)}
                                            className="h-8 text-sm rounded-[6px]"
                                          />
                                        </div>
                                        <div className="space-y-1.5">
                                          <Label className="text-xs font-medium text-muted-foreground">Volunteer</Label>
                                          <Select value={spendVol} onValueChange={(value) => setSpendVol(value ?? "")}>
                                            <SelectTrigger size="sm" className="rounded-[6px]">
                                              <SelectValue placeholder="Select volunteer" />
                                            </SelectTrigger>
                                            <SelectContent>
                                              {volunteers.map(v => <SelectItem key={v.id} value={v.name}>{v.name}</SelectItem>)}
                                            </SelectContent>
                                          </Select>
                                        </div>
                                        <div className="space-y-1.5">
                                          <Label className="text-xs font-medium text-muted-foreground">Notes (optional)</Label>
                                          <Input
                                            placeholder="e.g. Groceries for Family A"
                                            value={spendNotes} onChange={e => setSpendNotes(e.target.value)}
                                            className="h-8 text-sm rounded-[6px]"
                                          />
                                        </div>
                                      </div>
                                      {spendErr && <p className="text-xs text-destructive">{spendErr}</p>}
                                      <div className="flex gap-2">
                                        <button
                                          onClick={handleSpend}
                                          className="text-sm font-medium bg-primary text-primary-foreground px-3.5 py-1.5 rounded-[6px] hover:bg-primary-hover transition-colors"
                                        >
                                          Confirm Spend
                                        </button>
                                        <button
                                          onClick={() => { setShowSpend(false); setSpendErr("") }}
                                          className="text-sm font-medium text-muted-foreground px-3.5 py-1.5 rounded-[6px] hover:bg-muted transition-colors"
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                    </div>
                                  )}

                                  {/* Donation form */}
                                  {showDonate && (
                                    <div className="mb-5 bg-card border border-border rounded-[8px] p-4 space-y-3">
                                      <p className="text-sm font-semibold text-foreground">Record a Donation Out</p>
                                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        <div className="space-y-1.5">
                                          <Label className="text-xs font-medium text-muted-foreground">Recipient</Label>
                                          <Input
                                            placeholder="e.g. Family A"
                                            value={donateRecip} onChange={e => setDonateRecip(e.target.value)}
                                            className="h-8 text-sm rounded-[6px]"
                                          />
                                        </div>
                                        <div className="space-y-1.5">
                                          <Label className="text-xs font-medium text-muted-foreground">Volunteer</Label>
                                          <Select value={donateVol} onValueChange={(value) => setDonateVol(value ?? "")}>
                                            <SelectTrigger size="sm" className="rounded-[6px]">
                                              <SelectValue placeholder="Select volunteer" />
                                            </SelectTrigger>
                                            <SelectContent>
                                              {volunteers.map(v => <SelectItem key={v.id} value={v.name}>{v.name}</SelectItem>)}
                                            </SelectContent>
                                          </Select>
                                        </div>
                                        <div className="space-y-1.5">
                                          <Label className="text-xs font-medium text-muted-foreground">Amount</Label>
                                          <div className="flex gap-3 items-center pt-0.5">
                                            <label className="flex items-center gap-1.5 text-xs text-foreground cursor-pointer">
                                              <input
                                                type="radio" checked={donateFull}
                                                onChange={() => { setDonateFull(true); setDonateAmt("") }}
                                                className="accent-primary"
                                              />
                                              Full (${Number(selectedCard.remainingAmount).toFixed(2)})
                                            </label>
                                            <label className="flex items-center gap-1.5 text-xs text-foreground cursor-pointer">
                                              <input
                                                type="radio" checked={!donateFull}
                                                onChange={() => setDonateFull(false)}
                                                className="accent-primary"
                                              />
                                              Partial
                                            </label>
                                          </div>
                                          {!donateFull && (
                                            <Input
                                              type="number" min="0.01" step="0.01" placeholder="0.00"
                                              value={donateAmt} onChange={e => setDonateAmt(e.target.value)}
                                              className="h-8 text-sm rounded-[6px] mt-1.5"
                                            />
                                          )}
                                        </div>
                                      </div>
                                      <div className="space-y-1.5">
                                        <Label className="text-xs font-medium text-muted-foreground">Notes (optional)</Label>
                                        <Input
                                          placeholder="e.g. Weekly groceries for the family"
                                          value={donateNotes} onChange={e => setDonateNotes(e.target.value)}
                                          className="h-8 text-sm rounded-[6px]"
                                        />
                                      </div>
                                      {donateErr && <p className="text-xs text-destructive">{donateErr}</p>}
                                      <div className="flex gap-2">
                                        <button
                                          onClick={handleDonate}
                                          className="text-sm font-medium bg-primary text-primary-foreground px-3.5 py-1.5 rounded-[6px] hover:bg-primary-hover transition-colors"
                                        >
                                          Confirm Donation
                                        </button>
                                        <button
                                          onClick={() => { setShowDonate(false); setDonateErr("") }}
                                          className="text-sm font-medium text-muted-foreground px-3.5 py-1.5 rounded-[6px] hover:bg-muted transition-colors"
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                    </div>
                                  )}

                                  {/* Transaction history */}
                                  <div>
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                                      Transaction History
                                    </p>
                                    {cardTxns.length === 0 ? (
                                      <p className="text-sm text-muted-foreground text-center py-4">
                                        No transactions recorded for this card.
                                      </p>
                                    ) : (
                                      <div className="bg-card border border-border rounded-[8px] overflow-hidden">
                                        <table className="w-full text-sm">
                                          <thead>
                                            <tr className="bg-muted/50 border-b border-border">
                                              <th className="text-xs font-medium text-muted-foreground text-left py-2.5 pl-4 pr-3">Date & Time</th>
                                              <th className="text-xs font-medium text-muted-foreground text-left py-2.5 pr-3">Type</th>
                                              <th className="text-xs font-medium text-muted-foreground text-left py-2.5 pr-3">Amount</th>
                                              <th className="text-xs font-medium text-muted-foreground text-left py-2.5 pr-3">Volunteer</th>
                                              <th className="text-xs font-medium text-muted-foreground text-left py-2.5 pr-3">Recipient</th>
                                              <th className="text-xs font-medium text-muted-foreground text-left py-2.5 pr-4">Notes</th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {cardTxns.map((t, i) => (
                                              <tr key={t.id} className={i < cardTxns.length - 1 ? "border-b border-border" : ""}>
                                                <td className="py-2.5 pl-4 pr-3 text-muted-foreground whitespace-nowrap">{fmt(t.createdAt)}</td>
                                                <td className="py-2.5 pr-3">
                                                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${t.type === "SPEND" ? "bg-orange-100 text-orange-800" : "bg-green-100 text-green-800"}`}>
                                                    {t.type === "SPEND" ? "Spend" : "Donation"}
                                                  </span>
                                                </td>
                                                <td className="py-2.5 pr-3 font-medium text-foreground">-${Number(t.amount).toFixed(2)}</td>
                                                <td className="py-2.5 pr-3 text-muted-foreground">{t.volunteerName}</td>
                                                <td className="py-2.5 pr-3 text-muted-foreground">{t.recipientName ?? "—"}</td>
                                                <td className="py-2.5 pr-4 text-muted-foreground">{t.notes || "—"}</td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    )}
                                  </div>

                                </div>
                              </TableCell>
                            </TableRow>
                          )}

                        </React.Fragment>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>{/* end overflow-x-auto */}

              {/* Footer */}
              <div className="px-6 py-3 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  Showing {filteredCards.length} of {cards.length} cards
                </p>
              </div>

            </div>
          </div>
        </div>
      </SidebarInset>

      {/* Edit Dialog */}
      <Dialog open={showEditSheet} onOpenChange={setShowEditSheet}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Gift Card</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Store</Label>
              <Select value={editStore} onValueChange={(val) => setEditStore(val ?? "")}>
                <SelectTrigger className="rounded-[6px] bg-background border-border h-9 text-sm text-foreground">
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
                <Label className="text-xs font-medium text-muted-foreground">Initial Balance</Label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground text-sm">$</span>
                  <Input
                    value={editInitialBalance}
                    onChange={(e) => setEditInitialBalance(e.target.value.replace(/[^0-9.]/g, ""))}
                    placeholder="0.00"
                    inputMode="decimal"
                    className="rounded-[6px] bg-background border-border h-9 text-sm text-foreground placeholder:text-muted-foreground pl-7"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Remaining Balance</Label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground text-sm">$</span>
                  <Input
                    value={editRemainingBalance}
                    onChange={(e) => setEditRemainingBalance(e.target.value.replace(/[^0-9.]/g, ""))}
                    placeholder="0.00"
                    inputMode="decimal"
                    className="rounded-[6px] bg-background border-border h-9 text-sm text-foreground placeholder:text-muted-foreground pl-7"
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" className="rounded-[6px]" />}>
              Cancel
            </DialogClose>
            <Button onClick={saveEditCard} className="bg-primary text-primary-foreground text-sm font-medium rounded-[6px] hover:bg-primary-hover transition-colors">Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Alert Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the gift card
              and all of its associated transactions from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-[6px]">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteCard} className="rounded-[6px] bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </SidebarProvider>
  )
}