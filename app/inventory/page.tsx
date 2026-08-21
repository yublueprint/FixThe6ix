"use client"

import * as React from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Search01Icon, ArrowDown01Icon, ArrowUp01Icon, Sorting01Icon,
  ShoppingBasket01Icon, GiveBloodIcon, Delete01Icon, Edit01Icon, TradeUpIcon, TradeDownIcon,
  CheckmarkCircle01Icon, PlayCircleIcon, PlusSignIcon,
  ViewIcon, Copy01Icon, ArrowLeft01Icon, ArrowLeftDoubleIcon, ArrowRight01Icon, ArrowRightDoubleIcon
} from "@hugeicons/core-free-icons"
import { Card, CardAction, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogMedia } from "@/components/ui/alert-dialog"
import { Combobox, ComboboxInput, ComboboxContent, ComboboxList, ComboboxItem, ComboboxEmpty } from "@/components/ui/combobox"
import { 
  DropdownMenu, 
  DropdownMenuTrigger, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuCheckboxItem, 
} from "@/components/ui/dropdown-menu"
import { categoryLabel } from "@/lib/treemap"
import { toast } from "sonner"
import useSWR from "swr"
import { fetcher } from "@/lib/fetcher"

// ── Types ──

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
  addedBy?: string | null
  transactions: Transaction[]
}

type Volunteer = {
  id: string
  name: string
}

// ── Constants ─────────────────────────────────────────────────────────────────

function formatShortDateTime(iso: string) {
  if (!iso) return "—"
  const d = new Date(iso)
  if (isNaN(d.getTime())) return "—"
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  const time = d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
  return `${year}-${month}-${day}, ${time}`
}

function fmt(iso: string) {
  return formatShortDateTime(iso)
}

function SortIcon({ field, sortField, sortDirection }: {
  field: string; sortField: string | null; sortDirection: "asc" | "desc"
}) {
  if (sortField !== field) return <HugeiconsIcon icon={Sorting01Icon} strokeWidth={2} className="ml-1 size-3.5 text-muted-foreground/50" />
  if (sortDirection === "asc") return <HugeiconsIcon icon={ArrowUp01Icon} strokeWidth={2} className="ml-1 size-3.5 text-foreground" />
  return <HugeiconsIcon icon={ArrowDown01Icon} strokeWidth={2} className="ml-1 size-3.5 text-foreground" />
}

export default function InventoryPage() {
  const { data: cardsData, error: cardsError, mutate: mutateCards } = useSWR<GiftCard[]>("/api/gift-cards", fetcher)
  const { data: volunteersData, mutate: mutateVolunteers } = useSWR<Volunteer[]>("/api/volunteers", fetcher)
  const { data: storesData, mutate: mutateStores } = useSWR<Store[]>("/api/stores", fetcher)

  const cards: GiftCard[] = Array.isArray(cardsData) ? cardsData : []
  const volunteers: Volunteer[] = Array.isArray(volunteersData) ? volunteersData : []
  const stores: Store[] = Array.isArray(storesData) ? storesData : []
  const loading = !cardsData && !cardsError

  // Search and filter state
  const [selectedStores, setSelectedStores] = React.useState<string[]>([])
  const [selectedCategories, setSelectedCategories] = React.useState<string[]>([])
  const [storeSearch, setStoreSearch] = React.useState("")
  const [categorySearch, setCategorySearch] = React.useState("")
  const [searchQuery, setSearchQuery] = React.useState("")

  // Sort state
  const [sortField, setSortField] = React.useState<string | null>(null)
  const [sortDirection, setSortDirection] = React.useState<"asc" | "desc">("asc")

  // Selected row expansion & checkboxes
  const [selectedId, setSelectedId] = React.useState<string | null>(null)
  const [selectedRows, setSelectedRows] = React.useState<string[]>([])
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = React.useState(false)
  const [bulkDeleting, setBulkDeleting] = React.useState(false)

  // Pagination State
  const [pageSize, setPageSize] = React.useState(10)
  const [pageIndex, setPageIndex] = React.useState(0)

  // View Card Dialog State
  const [viewingCard, setViewingCard] = React.useState<GiftCard | null>(null)
  const [showViewCardDialog, setShowViewCardDialog] = React.useState(false)

  const handleViewCard = (card: GiftCard) => {
    setViewingCard(card)
    setShowViewCardDialog(true)
  }

  // Edit modal state
  const [editId, setEditId] = React.useState<string | null>(null)
  const [editStore, setEditStore] = React.useState("")
  const [editInitialBalance, setEditInitialBalance] = React.useState("")
  const [editRemainingBalance, setEditRemainingBalance] = React.useState("")
  const [showEditSheet, setShowEditSheet] = React.useState(false)

  // Add Store Dialog State
  const [showAddStoreDialog, setShowAddStoreDialog] = React.useState(false)
  const [newStoreName, setNewStoreName] = React.useState("")
  const [newStoreCategory, setNewStoreCategory] = React.useState("GROCERY")
  const [savingStore, setSavingStore] = React.useState(false)

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
        setEditStore(data.name)
        await mutateStores()
        setShowAddStoreDialog(false)
        setNewStoreName("")
        setNewStoreCategory("GROCERY")
      } else if (res.status === 409) {
        toast.info(`Store "${newStoreName.trim()}" already exists and has been selected`)
        setEditStore(newStoreName.trim())
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
  const [savingEdit, setSavingEdit] = React.useState(false)

  // Delete card dialog state
  const [deleteId, setDeleteId] = React.useState<string | null>(null)
  const [deleting, setDeleting] = React.useState(false)

  // Spend form state
  const [showSpend, setShowSpend] = React.useState(false)
  const [spendAmt, setSpendAmt] = React.useState("")
  const [spendVol, setSpendVol] = React.useState("")
  const [spendRecip, setSpendRecip] = React.useState("")
  const [spendNotes, setSpendNotes] = React.useState("")
  const [spendErr, setSpendErr] = React.useState("")
  const [spending, setSpending] = React.useState(false)

  // Donation form state
  const [showDonate, setShowDonate] = React.useState(false)
  const [donateRecip, setDonateRecip] = React.useState("")
  const [donateVol, setDonateVol] = React.useState("")
  const [donateFull, setDonateFull] = React.useState(true)
  const [donateAmt, setDonateAmt] = React.useState("")
  const [donateNotes, setDonateNotes] = React.useState("")
  const [donateErr, setDonateErr] = React.useState("")
  const [donating, setDonating] = React.useState(false)

  // Add Volunteer / Invite modal state (matching User Management)
  const [showAddVolunteerDialog, setShowAddVolunteerDialog] = React.useState(false)
  const [inviteDisplayName, setInviteDisplayName] = React.useState("")
  const [inviteEmail, setInviteEmail] = React.useState("")
  const [inviteCreateAccount, setInviteCreateAccount] = React.useState(false)
  const [invitingVolunteer, setInvitingVolunteer] = React.useState(false)
  const [addVolunteerTarget, setAddVolunteerTarget] = React.useState<"spend" | "donate" | null>(null)
  
  const [generatedLink, setGeneratedLink] = React.useState("")
  const [showGeneratedLinkDialog, setShowGeneratedLinkDialog] = React.useState(false)

  // Column visibility
  const [visibleColumns, setVisibleColumns] = React.useState<Record<string, boolean>>({
    store: true,
    lastFour: true,
    initialAmount: true,
    remainingAmount: true,
    spent: true,
    status: true,
    addedBy: true,
    createdAt: true,
  })

  // Store options
  const uniqueStores = React.useMemo(() => {
    const fromCards = cards.map(c => c.store.name)
    const fromStores = stores.map(s => s.name)
    return Array.from(new Set([...fromCards, ...fromStores])).sort()
  }, [cards, stores])

  const filteredStoreFilterOptions = React.useMemo(() => {
    const q = storeSearch.trim().toLowerCase()
    if (!q) return uniqueStores
    return uniqueStores.filter(s => s.toLowerCase().includes(q))
  }, [uniqueStores, storeSearch])

  const uniqueCategories = React.useMemo(() => {
    const fromCards = cards.map(c => categoryLabel(c.store.category))
    const fromStores = stores.map(s => categoryLabel(s.category))
    return Array.from(new Set([...fromCards, ...fromStores])).sort()
  }, [cards, stores])

  const filteredCategoryFilterOptions = React.useMemo(() => {
    const q = categorySearch.trim().toLowerCase()
    if (!q) return uniqueCategories
    return uniqueCategories.filter(c => c.toLowerCase().includes(q))
  }, [uniqueCategories, categorySearch])

  const filteredEditStoreOptions = React.useMemo(() => {
    if (!editStore.trim()) return uniqueStores
    return uniqueStores.filter(s => s.toLowerCase().includes(editStore.toLowerCase().trim()))
  }, [editStore, uniqueStores])

  // Sorting handler
  function handleSort(field: string) {
    if (sortField === field) {
      if (sortDirection === "asc") {
        setSortDirection("desc")
      } else {
        setSortField(null)
        setSortDirection("asc")
      }
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  // Filtered Cards
  const filteredCards = React.useMemo(() => {
    let list = cards.filter(c => {
      if (selectedStores.length > 0 && !selectedStores.includes(c.store.name)) return false
      if (selectedCategories.length > 0 && !selectedCategories.includes(categoryLabel(c.store.category))) return false
      if (searchQuery) {
        const query = searchQuery.toLowerCase().trim()
        const numericQuery = searchQuery.replace(/\D/g, "")
        const byStore = c.store.name.toLowerCase().includes(query)
        const byDigits = numericQuery.length > 0 && c.lastFourDigits.includes(numericQuery)
        const byAddedBy = (c.addedBy || "").toLowerCase().includes(query)
        if (!byStore && !byDigits && !byAddedBy) return false
      }
      return true
    })

    if (sortField) {
      list = [...list].sort((a, b) => {
        if (sortField === "store") {
          const va = (a.store?.name || "").toLowerCase()
          const vb = (b.store?.name || "").toLowerCase()
          const cmp = va.localeCompare(vb)
          return sortDirection === "asc" ? cmp : -cmp
        }
        if (sortField === "lastFour") {
          const va = a.lastFourDigits || ""
          const vb = b.lastFourDigits || ""
          const cmp = va.localeCompare(vb)
          return sortDirection === "asc" ? cmp : -cmp
        }
        if (sortField === "initialAmount") {
          const va = Number(a.initialAmount || 0)
          const vb = Number(b.initialAmount || 0)
          return sortDirection === "asc" ? va - vb : vb - va
        }
        if (sortField === "remainingAmount") {
          const va = Number(a.remainingAmount || 0)
          const vb = Number(b.remainingAmount || 0)
          return sortDirection === "asc" ? va - vb : vb - va
        }
        if (sortField === "spent") {
          const va = Number(a.initialAmount || 0) - Number(a.remainingAmount || 0)
          const vb = Number(b.initialAmount || 0) - Number(b.remainingAmount || 0)
          return sortDirection === "asc" ? va - vb : vb - va
        }
        if (sortField === "status") {
          const va = a.status || ""
          const vb = b.status || ""
          const cmp = va.localeCompare(vb)
          return sortDirection === "asc" ? cmp : -cmp
        }
        if (sortField === "addedBy") {
          const va = (a.addedBy || "").toLowerCase()
          const vb = (b.addedBy || "").toLowerCase()
          const cmp = va.localeCompare(vb)
          return sortDirection === "asc" ? cmp : -cmp
        }
        if (sortField === "createdAt") {
          const va = new Date(a.createdAt).getTime() || 0
          const vb = new Date(b.createdAt).getTime() || 0
          return sortDirection === "asc" ? va - vb : vb - va
        }
        return 0
      })
    }

    return list
  }, [cards, selectedStores, selectedCategories, searchQuery, sortField, sortDirection])

  // Reset pagination when filters change
  React.useEffect(() => {
    setPageIndex(0)
    setSelectedRows([])
  }, [selectedStores, selectedCategories, searchQuery, pageSize])

  const totalPages = Math.max(1, Math.ceil(filteredCards.length / pageSize))
  const paginatedCards = React.useMemo(() => {
    const start = pageIndex * pageSize
    return filteredCards.slice(start, start + pageSize)
  }, [filteredCards, pageIndex, pageSize])

  // Stats calculation
  const totalCards = cards.length
  const activeCards = cards.filter(c => c.status === "ACTIVE" || Number(c.remainingAmount) > 0).length
  const totalRemaining = cards.reduce((s, c) => s + Number(c.remainingAmount), 0)
  const totalInitial = cards.reduce((s, c) => s + Number(c.initialAmount), 0)

  // Selection
  const selectedCard = cards.find(c => c.id === selectedId) || null
  const cardTxns = selectedCard?.transactions || []

  function selectCard(id: string) {
    if (selectedId === id) {
      setSelectedId(null)
      setShowSpend(false)
      setShowDonate(false)
    } else {
      setSelectedId(id)
      setShowSpend(false)
      setShowDonate(false)
    }
  }

  // Bulk Delete
  async function handleBulkDelete() {
    if (selectedRows.length === 0) return
    setBulkDeleting(true)
    try {
      await Promise.all(selectedRows.map(id => fetch(`/api/gift-cards/${id}`, { method: "DELETE" })))
      toast.success(`Successfully deleted ${selectedRows.length} gift card${selectedRows.length > 1 ? "s" : ""}`)
      setSelectedRows([])
      setShowBulkDeleteDialog(false)
      await mutateCards()
    } catch (e) {
      toast.error("Failed to delete selected cards")
    } finally {
      setBulkDeleting(false)
    }
  }

  // Single Delete
  async function handleDeleteCard() {
    if (!deleteId) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/gift-cards/${deleteId}`, { method: "DELETE" })
      if (res.ok) {
        toast.success("Gift card deleted")
        setDeleteId(null)
        if (selectedId === deleteId) setSelectedId(null)
        await mutateCards()
      } else {
        toast.error("Failed to delete gift card")
      }
    } catch (e) {
      toast.error("Error deleting card")
    } finally {
      setDeleting(false)
    }
  }

  // Edit Card
  function openEditCard(id: string) {
    const c = cards.find(x => x.id === id)
    if (!c) return
    setEditId(id)
    setEditStore(c.store.name)
    setEditInitialBalance(Number(c.initialAmount).toFixed(2))
    setEditRemainingBalance(Number(c.remainingAmount).toFixed(2))
    setShowEditSheet(true)
  }

  async function saveEditCard() {
    if (!editId) return
    setSavingEdit(true)
    try {
      const res = await fetch(`/api/gift-cards/${editId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeName: editStore,
          initialAmount: parseFloat(editInitialBalance),
          remainingAmount: parseFloat(editRemainingBalance),
        }),
      })
      if (res.ok) {
        toast.success("Card updated")
        setShowEditSheet(false)
        await mutateCards()
      } else {
        toast.error("Failed to update card")
      }
    } catch (e) {
      toast.error("Error saving card")
    } finally {
      setSavingEdit(false)
    }
  }

  // Record Spend
  async function handleSpend() {
    if (!selectedId) return
    setSpendErr("")
    const amt = parseFloat(spendAmt)
    if (isNaN(amt) || amt <= 0) {
      setSpendErr("Please enter a valid amount")
      return
    }
    if (selectedCard && amt > selectedCard.remainingAmount) {
      setSpendErr(`Amount exceeds remaining balance ($${Number(selectedCard.remainingAmount).toFixed(2)})`)
      return
    }
    setSpending(true)
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          giftCardId: selectedId,
          type: "SPEND",
          amount: amt,
          volunteerName: spendVol || undefined,
          recipientName: spendRecip || undefined,
          notes: spendNotes || undefined,
        }),
      })
      if (res.ok) {
        toast.success("Spend recorded")
        setSpendAmt("")
        setSpendVol("")
        setSpendRecip("")
        setSpendNotes("")
        setShowSpend(false)
        await mutateCards()
      } else {
        const d = await res.json()
        setSpendErr(d.error || "Failed to record spend")
      }
    } catch (e) {
      setSpendErr("Network error")
    } finally {
      setSpending(false)
    }
  }

  // Record Donation
  async function handleDonate() {
    if (!selectedId) return
    setDonateErr("")
    const amt = donateFull ? (selectedCard?.remainingAmount ?? 0) : parseFloat(donateAmt)
    if (isNaN(amt) || amt <= 0) {
      setDonateErr("Please enter a valid amount")
      return
    }
    if (selectedCard && amt > selectedCard.remainingAmount) {
      setDonateErr(`Amount exceeds remaining balance ($${Number(selectedCard.remainingAmount).toFixed(2)})`)
      return
    }
    setDonating(true)
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          giftCardId: selectedId,
          type: "DONATION_OUT",
          amount: amt,
          recipientName: donateRecip || undefined,
          volunteerName: donateVol || undefined,
          notes: donateNotes || undefined,
        }),
      })
      if (res.ok) {
        toast.success("Donation recorded")
        setDonateRecip("")
        setDonateVol("")
        setDonateAmt("")
        setDonateNotes("")
        setShowDonate(false)
        await mutateCards()
      } else {
        const d = await res.json()
        setDonateErr(d.error || "Failed to record donation")
      }
    } catch (e) {
      setDonateErr("Network error")
    } finally {
      setDonating(false)
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      toast.success("Copied invitation link to clipboard")
    })
  }

  function handleOpenVolunteerDialog(open: boolean) {
    setShowAddVolunteerDialog(open)
    if (!open) {
      setInviteDisplayName("")
      setInviteEmail("")
      setInviteCreateAccount(false)
    }
  }

  // Add Volunteer / Invite Submit
  async function handleVolunteerSubmit(e: React.FormEvent) {
    e.preventDefault()
    setInvitingVolunteer(true)

    // Option 1: Name-only volunteer (no login account)
    if (!inviteCreateAccount) {
      if (!inviteDisplayName.trim()) {
        toast.error("Please enter a name for the volunteer.")
        setInvitingVolunteer(false)
        return
      }
      try {
        const res = await fetch("/api/volunteers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: inviteDisplayName.trim() }),
        })
        const data = await res.json()
        if (res.ok) {
          toast.success(`Volunteer "${data.name}" added successfully.`)
          if (addVolunteerTarget === "spend") setSpendVol(data.name)
          if (addVolunteerTarget === "donate") setDonateVol(data.name)
          handleOpenVolunteerDialog(false)
          await mutateVolunteers()
        } else {
          toast.error(data.error || "Failed to add volunteer")
        }
      } catch (error) {
        toast.error("An error occurred while adding the volunteer.")
      } finally {
        setInvitingVolunteer(false)
      }
      return
    }

    // Option 2: Full login account invite (Supabase auth)
    if (!inviteEmail.trim()) {
      toast.error("Please enter an email address for the volunteer account.")
      setInvitingVolunteer(false)
      return
    }

    try {
      const res = await fetch("/api/admin/users/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: inviteEmail.trim(),
          role: "VOLUNTEER",
          name: inviteDisplayName.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(`Invitation generated for ${inviteEmail.trim()}`)
        const assignedName = inviteDisplayName.trim() || inviteEmail.trim()
        if (addVolunteerTarget === "spend") setSpendVol(assignedName)
        if (addVolunteerTarget === "donate") setDonateVol(assignedName)
        handleOpenVolunteerDialog(false)
        await mutateVolunteers()

        if (data.action_link) {
          setGeneratedLink(data.action_link)
          setShowGeneratedLinkDialog(true)
        }
      } else {
        toast.error(data.error || "Failed to send invite")
      }
    } catch (error) {
      toast.error("An error occurred while inviting the volunteer.")
    } finally {
      setInvitingVolunteer(false)
    }
  }

  const tableStatsCards = selectedRows.length > 0
    ? cards.filter(c => selectedRows.includes(c.id))
    : filteredCards

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>

        {/* ── Header ── */}
        <SiteHeader title="Card Inventory" />

        <div className="flex flex-1 flex-col overflow-auto">
          <div className="flex flex-col gap-6 p-4 sm:p-6">

            {/* ── Stats with Real Database Analysis ── */}
            <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {(() => {
                const now = Date.now()
                const periodMs = 30 * 24 * 60 * 60 * 1000
                const currentPeriodStart = now - periodMs
                const previousPeriodStart = now - (2 * periodMs)

                const hasCardData = totalCards > 0

                // 1. Total Cards
                const cardsCurrent = cards.filter(c => new Date(c.createdAt).getTime() >= currentPeriodStart).length
                const cardsPrevious = cards.filter(c => {
                  const t = new Date(c.createdAt).getTime()
                  return t >= previousPeriodStart && t < currentPeriodStart
                }).length

                let cardBadge: string | null = null
                let cardIsUp = true
                let cardHeading = "No cards in inventory"
                let cardSub = "Add cards to start tracking inventory"

                if (hasCardData) {
                  if (cardsPrevious > 0) {
                    const pct = ((cardsCurrent - cardsPrevious) / cardsPrevious) * 100
                    cardIsUp = pct >= 0
                    cardBadge = `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`
                    cardHeading = `${pct >= 0 ? "Inventory expanded" : "Intake reduced"} this month`
                    cardSub = `${cardsCurrent} card${cardsCurrent !== 1 ? "s" : ""} added in the last 30 days`
                  } else if (cardsCurrent > 0) {
                    cardIsUp = true
                    cardBadge = `+${cardsCurrent} new`
                    cardHeading = `+${cardsCurrent} cards added recently`
                    cardSub = "Added in the last 30 days"
                  } else {
                    cardIsUp = true
                    cardBadge = "0%"
                    cardHeading = "No new cards this period"
                    cardSub = "No additions in the last 30 days"
                  }
                }

                // 2. Active Cards
                const activePct = totalCards > 0 ? (activeCards / totalCards) * 100 : 0
                const activeBadge: string | null = activeCards > 0 ? `${activePct.toFixed(0)}% active` : null
                const activeHeading = activeCards > 0 ? `${activeCards} card${activeCards !== 1 ? "s" : ""} ready to allocate` : "No active cards available"
                const activeSub = activeCards > 0 ? "Available for recipient distribution" : (hasCardData ? "All cards have been fully redeemed" : "No cards in database")

                // 3. Total Remaining
                const remPct = totalInitial > 0 ? (totalRemaining / totalInitial) * 100 : 0
                const remBadge: string | null = totalRemaining > 0 && totalInitial > 0 ? `${remPct.toFixed(1)}% remaining` : null
                const remIsUp = remPct > 30
                const remHeading = totalRemaining > 0 ? `$${totalRemaining.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} available` : "Zero balance remaining"
                const remSub = totalRemaining > 0 ? "Active funds remaining in inventory" : (hasCardData ? "All funds have been redeemed" : "No funds currently tracked")

                // 4. Total Initial
                const allTxns = cards.flatMap(c => c.transactions || [])
                const totalSpent = cards.reduce((s, c) => s + (Number(c.initialAmount) - Number(c.remainingAmount)), 0)
                const initBadge: string | null = totalInitial > 0 ? `$${totalInitial.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : null
                const initHeading = totalInitial > 0 ? `$${totalSpent.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} distributed to date` : "No initial intake recorded"
                const initSub = allTxns.length > 0 ? `Across ${allTxns.length} total transaction${allTxns.length !== 1 ? "s" : ""}` : "No transaction logs yet"

                const stats = [
                  {
                    label: "Total Cards",
                    value: totalCards,
                    badge: cardBadge,
                    hasData: hasCardData,
                    isUp: cardIsUp,
                    heading: cardHeading,
                    sub: cardSub
                  },
                  {
                    label: "Active Cards",
                    value: activeCards,
                    badge: activeBadge,
                    hasData: activeCards > 0,
                    isUp: activeCards > 0,
                    heading: activeHeading,
                    sub: activeSub
                  },
                  {
                    label: "Total Remaining",
                    value: `$${totalRemaining.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                    badge: remBadge,
                    hasData: totalRemaining > 0,
                    isUp: remIsUp,
                    heading: remHeading,
                    sub: remSub
                  },
                  {
                    label: "Total Initial",
                    value: `$${totalInitial.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                    badge: initBadge,
                    hasData: totalInitial > 0,
                    isUp: true,
                    heading: initHeading,
                    sub: initSub
                  },
                ]

                return stats.map(s => (
                  <Card key={s.label} className="@container/card">
                    <CardHeader>
                      <CardDescription>{s.label}</CardDescription>
                      <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                        {loading ? <Skeleton className="h-8 w-24" /> : s.value}
                      </CardTitle>
                      {s.badge && (
                        <CardAction>
                          <Badge variant="outline">
                            <HugeiconsIcon icon={s.isUp ? TradeUpIcon : TradeDownIcon} strokeWidth={2} className="mr-1 size-3" />
                            {s.badge}
                          </Badge>
                        </CardAction>
                      )}
                    </CardHeader>
                    <CardFooter className="flex-col items-start gap-1.5 text-sm">
                      <div className="line-clamp-1 flex items-center gap-2 font-medium">
                        {s.heading}
                        {s.hasData && (
                          <HugeiconsIcon icon={s.isUp ? TradeUpIcon : TradeDownIcon} strokeWidth={2} className="size-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="text-muted-foreground">
                        {s.sub}
                      </div>
                    </CardFooter>
                  </Card>
                ))
              })()}
            </div>

            {/* ── Inventory Table Card Matching Other Pages ── */}
            <div className="bg-card border border-border rounded-[12px] overflow-hidden shadow-sm">

              {/* Toolbar & Header */}
              <div className="px-6 py-4 border-b border-border">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Gift Card Inventory</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Click any card row to expand details, record spends, or record donations</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="rounded-full text-xs font-medium text-muted-foreground px-2.5 py-0.5 border-border bg-muted/40">
                      {filteredCards.length} of {cards.length} cards
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 flex-wrap">
                  {/* Left: Store & Category Filters */}
                  <div className="flex items-center gap-3 flex-wrap">
                    {/* Multi-select Store Filter */}
                    {uniqueStores.length > 0 && (
                      <DropdownMenu>
                        <DropdownMenuTrigger render={
                          <Button variant="outline" size="sm" className="h-8 rounded-[6px] text-xs font-medium gap-1.5 min-w-44 justify-between border-border bg-card hover:bg-muted cursor-pointer">
                            <span className="truncate">
                              {selectedStores.length === 0
                                ? "All Stores"
                                : selectedStores.length === 1
                                ? selectedStores[0]
                                : `${selectedStores.length} Stores Selected`}
                            </span>
                            <HugeiconsIcon icon={ArrowDown01Icon} strokeWidth={2} className="size-3.5 text-muted-foreground shrink-0 ml-1" />
                          </Button>
                        } />
                        <DropdownMenuContent align="start" className="w-56 p-2 space-y-1">
                          <div className="relative mb-1">
                            <HugeiconsIcon icon={Search01Icon} strokeWidth={1.5} className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-muted-foreground pointer-events-none" />
                            <Input
                              placeholder="Search stores..."
                              value={storeSearch}
                              onChange={e => setStoreSearch(e.target.value)}
                              className="h-7 pl-7 pr-2 text-xs rounded-[5px]"
                              onClick={e => e.stopPropagation()}
                              onKeyDown={e => e.stopPropagation()}
                            />
                          </div>
                          <div className="flex items-center justify-between px-1 py-1 text-[11px] text-muted-foreground border-b border-border mb-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault()
                                setSelectedStores(uniqueStores)
                              }}
                              className="text-primary hover:underline cursor-pointer"
                            >
                              Select All
                            </button>
                            {selectedStores.length > 0 && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault()
                                  setSelectedStores([])
                                }}
                                className="hover:underline cursor-pointer"
                              >
                                Clear All
                              </button>
                            )}
                          </div>
                          <div className="max-h-48 overflow-y-auto space-y-0.5 pr-1 [scrollbar-width:thin] [scrollbar-color:var(--border)_transparent]">
                            {filteredStoreFilterOptions.length > 0 ? (
                              filteredStoreFilterOptions.map(store => {
                                const isChecked = selectedStores.includes(store)
                                return (
                                  <DropdownMenuCheckboxItem
                                    key={store}
                                    checked={isChecked}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        setSelectedStores(prev => [...prev, store])
                                      } else {
                                        setSelectedStores(prev => prev.filter(s => s !== store))
                                      }
                                    }}
                                    onSelect={(e) => e.preventDefault()}
                                    className="text-xs cursor-pointer py-1.5"
                                  >
                                    {store}
                                  </DropdownMenuCheckboxItem>
                                )
                              })
                            ) : (
                              <p className="text-xs text-muted-foreground text-center py-2">No stores found</p>
                            )}
                          </div>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}

                    {/* Multi-select Category Filter */}
                    {uniqueCategories.length > 0 && (
                      <DropdownMenu>
                        <DropdownMenuTrigger render={
                          <Button variant="outline" size="sm" className="h-8 rounded-[6px] text-xs font-medium gap-1.5 min-w-44 justify-between border-border bg-card hover:bg-muted cursor-pointer">
                            <span className="truncate">
                              {selectedCategories.length === 0
                                ? "All Categories"
                                : selectedCategories.length === 1
                                ? selectedCategories[0]
                                : `${selectedCategories.length} Categories Selected`}
                            </span>
                            <HugeiconsIcon icon={ArrowDown01Icon} strokeWidth={2} className="size-3.5 text-muted-foreground shrink-0 ml-1" />
                          </Button>
                        } />
                        <DropdownMenuContent align="start" className="w-56 p-2 space-y-1">
                          <div className="relative mb-1">
                            <HugeiconsIcon icon={Search01Icon} strokeWidth={1.5} className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-muted-foreground pointer-events-none" />
                            <Input
                              placeholder="Search categories..."
                              value={categorySearch}
                              onChange={e => setCategorySearch(e.target.value)}
                              className="h-7 pl-7 pr-2 text-xs rounded-[5px]"
                              onClick={e => e.stopPropagation()}
                              onKeyDown={e => e.stopPropagation()}
                            />
                          </div>
                          <div className="flex items-center justify-between px-1 py-1 text-[11px] text-muted-foreground border-b border-border mb-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault()
                                setSelectedCategories(uniqueCategories)
                              }}
                              className="text-primary hover:underline cursor-pointer"
                            >
                              Select All
                            </button>
                            {selectedCategories.length > 0 && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault()
                                  setSelectedCategories([])
                                }}
                                className="hover:underline cursor-pointer"
                              >
                                Clear All
                              </button>
                            )}
                          </div>
                          <div className="max-h-48 overflow-y-auto space-y-0.5 pr-1 [scrollbar-width:thin] [scrollbar-color:var(--border)_transparent]">
                            {filteredCategoryFilterOptions.length > 0 ? (
                              filteredCategoryFilterOptions.map(cat => {
                                const isChecked = selectedCategories.includes(cat)
                                return (
                                  <DropdownMenuCheckboxItem
                                    key={cat}
                                    checked={isChecked}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        setSelectedCategories(prev => [...prev, cat])
                                      } else {
                                        setSelectedCategories(prev => prev.filter(c => c !== cat))
                                      }
                                    }}
                                    onSelect={(e) => e.preventDefault()}
                                    className="text-xs cursor-pointer py-1.5"
                                  >
                                    {cat}
                                  </DropdownMenuCheckboxItem>
                                )
                              })
                            ) : (
                              <p className="text-xs text-muted-foreground text-center py-2">No categories found</p>
                            )}
                          </div>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>

                  {/* Right Controls: Search + Columns + Delete Selected + Add Gift Card */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Search Input */}
                    <div className="relative">
                      <HugeiconsIcon
                        icon={Search01Icon}
                        strokeWidth={1.5}
                        className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
                      />
                      <Input
                        placeholder="Search store, last 4, added by..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="h-8 pl-8 text-xs rounded-[6px] w-56 bg-background"
                      />
                    </div>

                    {/* Column Visibility Dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger render={
                        <Button variant="outline" size="sm" className="h-8 rounded-[6px] text-xs font-normal border-border bg-card hover:bg-muted cursor-pointer">
                          Columns
                        </Button>
                      } />
                      <DropdownMenuContent align="end" className="w-44">
                        {Object.keys(visibleColumns).map(col => (
                          <DropdownMenuCheckboxItem
                            key={col}
                            checked={visibleColumns[col]}
                            onCheckedChange={(checked) => setVisibleColumns(prev => ({ ...prev, [col]: !!checked }))}
                            className="text-xs capitalize cursor-pointer"
                          >
                            {col === "lastFour" ? "Card Number" : col === "createdAt" ? "Date Added" : col.replace(/([A-Z])/g, " $1")}
                          </DropdownMenuCheckboxItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Bulk Delete Button */}
                    {selectedRows.length > 0 && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setShowBulkDeleteDialog(true)}
                        className="h-8 rounded-[6px] text-xs font-medium gap-1.5 cursor-pointer"
                      >
                        <HugeiconsIcon icon={Delete01Icon} strokeWidth={2} className="size-3.5" />
                        Delete ({selectedRows.length})
                      </Button>
                    )}

                    {/* Add Gift Card Button */}
                    <a href="/cards">
                      <Button
                        size="sm"
                        className="h-8 rounded-[6px] text-xs font-medium gap-1.5 cursor-pointer bg-primary text-primary-foreground hover:bg-primary-hover"
                      >
                        <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} className="size-3.5" />
                        Add Gift Card
                      </Button>
                    </a>
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50 border-border">
                      <TableHead className="w-10 py-3 pl-6">
                        <Checkbox
                          checked={paginatedCards.length > 0 && selectedRows.length === paginatedCards.length}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedRows(paginatedCards.map(c => c.id))
                            } else {
                              setSelectedRows([])
                            }
                          }}
                        />
                      </TableHead>
                      {visibleColumns.store && (
                        <TableHead className="text-xs font-medium text-muted-foreground py-3 cursor-pointer select-none hover:text-foreground" onClick={() => handleSort("store")}>
                          <div className="flex items-center">
                            Store
                            <SortIcon field="store" sortField={sortField} sortDirection={sortDirection} />
                          </div>
                        </TableHead>
                      )}
                      {visibleColumns.lastFour && (
                        <TableHead className="text-xs font-medium text-muted-foreground py-3 cursor-pointer select-none hover:text-foreground" onClick={() => handleSort("lastFour")}>
                          <div className="flex items-center">
                            Card Number
                            <SortIcon field="lastFour" sortField={sortField} sortDirection={sortDirection} />
                          </div>
                        </TableHead>
                      )}
                      {visibleColumns.initialAmount && (
                        <TableHead className="text-xs font-medium text-muted-foreground py-3 cursor-pointer select-none hover:text-foreground" onClick={() => handleSort("initialAmount")}>
                          <div className="flex items-center">
                            Initial Balance
                            <SortIcon field="initialAmount" sortField={sortField} sortDirection={sortDirection} />
                          </div>
                        </TableHead>
                      )}
                      {visibleColumns.remainingAmount && (
                        <TableHead className="text-xs font-medium text-muted-foreground py-3 cursor-pointer select-none hover:text-foreground" onClick={() => handleSort("remainingAmount")}>
                          <div className="flex items-center">
                            Remaining Balance
                            <SortIcon field="remainingAmount" sortField={sortField} sortDirection={sortDirection} />
                          </div>
                        </TableHead>
                      )}
                      {visibleColumns.spent && (
                        <TableHead className="text-xs font-medium text-muted-foreground py-3 cursor-pointer select-none hover:text-foreground" onClick={() => handleSort("spent")}>
                          <div className="flex items-center">
                            Amount Spent
                            <SortIcon field="spent" sortField={sortField} sortDirection={sortDirection} />
                          </div>
                        </TableHead>
                      )}
                      {visibleColumns.status && (
                        <TableHead className="text-xs font-medium text-muted-foreground py-3 cursor-pointer select-none hover:text-foreground" onClick={() => handleSort("status")}>
                          <div className="flex items-center">
                            Status
                            <SortIcon field="status" sortField={sortField} sortDirection={sortDirection} />
                          </div>
                        </TableHead>
                      )}
                      {visibleColumns.addedBy && (
                        <TableHead className="text-xs font-medium text-muted-foreground py-3 cursor-pointer select-none hover:text-foreground" onClick={() => handleSort("addedBy")}>
                          <div className="flex items-center">
                            Added By
                            <SortIcon field="addedBy" sortField={sortField} sortDirection={sortDirection} />
                          </div>
                        </TableHead>
                      )}
                      {visibleColumns.createdAt && (
                        <TableHead className="text-xs font-medium text-muted-foreground py-3 cursor-pointer select-none hover:text-foreground" onClick={() => handleSort("createdAt")}>
                          <div className="flex items-center">
                            Date/Time Added
                            <SortIcon field="createdAt" sortField={sortField} sortDirection={sortDirection} />
                          </div>
                        </TableHead>
                      )}
                      <TableHead className="text-xs font-medium text-muted-foreground py-3 pr-6 text-right">Actions</TableHead>
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
                          <TableCell className="py-3"><Skeleton className="h-4 w-20" /></TableCell>
                          <TableCell className="py-3 pr-6"><Skeleton className="h-4 w-8 float-right" /></TableCell>
                        </TableRow>
                      ))
                    ) : filteredCards.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} className="h-24 text-center text-muted-foreground text-sm">
                          No cards match your search or filter criteria.
                        </TableCell>
                      </TableRow>
                    ) : paginatedCards.map((card: GiftCard) => {
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

                            {visibleColumns.store && (
                              <TableCell className="text-sm font-medium text-foreground py-3">{card.store.name}</TableCell>
                            )}
                            {visibleColumns.lastFour && (
                              <TableCell className="text-sm text-muted-foreground py-3 font-mono tracking-wide align-middle">•••• {card.lastFourDigits}</TableCell>
                            )}
                            {visibleColumns.initialAmount && (
                              <TableCell className="text-sm text-muted-foreground py-3 align-middle">${Number(card.initialAmount).toFixed(2)}</TableCell>
                            )}
                            {visibleColumns.remainingAmount && (
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
                            )}
                            {visibleColumns.spent && (
                              <TableCell className="text-sm text-foreground font-medium tabular-nums py-3 align-middle">${(Number(card.initialAmount) - Number(card.remainingAmount)).toFixed(2)}</TableCell>
                            )}
                            {visibleColumns.status && (
                              <TableCell className="py-3 align-middle">
                                <div className="flex w-[130px] items-center">
                                  {Number(card.remainingAmount) > 0 || card.status === "ACTIVE" || card.status === "PARTIALLY_REDEEMED" ? (
                                    <HugeiconsIcon icon={PlayCircleIcon} strokeWidth={2} className="mr-2 size-4 text-blue-500" />
                                  ) : card.status === "DONATED" ? (
                                    <HugeiconsIcon icon={CheckmarkCircle01Icon} strokeWidth={2} className="mr-2 size-4 text-green-500" />
                                  ) : (
                                    <HugeiconsIcon icon={CheckmarkCircle01Icon} strokeWidth={2} className="mr-2 size-4 text-muted-foreground" />
                                  )}
                                  <span className="text-sm font-medium text-foreground">
                                    {Number(card.remainingAmount) > 0 || card.status === "ACTIVE" || card.status === "PARTIALLY_REDEEMED"
                                      ? "Active"
                                      : card.status === "DONATED"
                                      ? "Donated"
                                      : "Used"}
                                  </span>
                                </div>
                              </TableCell>
                            )}
                            {visibleColumns.addedBy && (
                              <TableCell className="text-sm text-muted-foreground py-3 align-middle">{card.addedBy || "—"}</TableCell>
                            )}
                            {visibleColumns.createdAt && (
                              <TableCell className="text-xs text-muted-foreground py-3 align-middle whitespace-nowrap">{formatShortDateTime(card.createdAt)}</TableCell>
                            )}

                            {/* Actions */}
                            <TableCell className="py-3 pr-6 align-middle text-right" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-end gap-1">
                                {/* View Card Details (Eye) */}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer"
                                  onClick={() => handleViewCard(card)}
                                >
                                  <HugeiconsIcon icon={ViewIcon} strokeWidth={2} className="size-4" />
                                  <span className="sr-only">View card</span>
                                </Button>

                                {/* Edit Card (Pencil) */}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer"
                                  onClick={() => openEditCard(card.id)}
                                >
                                  <HugeiconsIcon icon={Edit01Icon} strokeWidth={2} className="size-4" />
                                  <span className="sr-only">Edit card</span>
                                </Button>

                                {/* Delete Card */}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:text-red-600 hover:bg-red-500/10 cursor-pointer"
                                  onClick={() => setDeleteId(card.id)}
                                >
                                  <HugeiconsIcon icon={Delete01Icon} strokeWidth={2} className="size-4 text-red-500" />
                                  <span className="sr-only">Delete card</span>
                                </Button>

                                {/* Expand Chevron */}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    selectCard(card.id)
                                  }}
                                >
                                  <HugeiconsIcon
                                    icon={isOpen ? ArrowUp01Icon : ArrowDown01Icon}
                                    strokeWidth={2}
                                    className="size-4"
                                  />
                                  <span className="sr-only">Toggle details</span>
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>

                          {/* Expanded detail panel */}
                          {isOpen && selectedCard && (
                            <TableRow className="bg-accent/30 hover:bg-accent/30 border-border">
                              <TableCell colSpan={10} className="p-0">
                                <div className="px-6 py-5 border-t border-border space-y-4">

                                  {/* Action buttons — only if balance remains */}
                                  {selectedCard.remainingAmount > 0 && (
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => { setShowSpend(v => !v); setShowDonate(false) }}
                                        className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-[6px] border transition-colors cursor-pointer ${
                                          showSpend ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border hover:bg-muted"
                                        }`}
                                      >
                                        <HugeiconsIcon icon={ShoppingBasket01Icon} strokeWidth={2} className="size-3.5" />
                                        Record Spend
                                      </button>
                                      <button
                                        onClick={() => { setShowDonate(v => !v); setShowSpend(false) }}
                                        className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-[6px] border transition-colors cursor-pointer ${
                                          showDonate ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border hover:bg-muted"
                                        }`}
                                      >
                                        <HugeiconsIcon icon={GiveBloodIcon} strokeWidth={2} className="size-3.5" />
                                        Record Donation
                                      </button>
                                    </div>
                                  )}

                                  {/* Spend form */}
                                  {showSpend && (
                                    <div className="bg-card border border-border rounded-[8px] p-4 space-y-3">
                                      <p className="text-xs font-semibold text-foreground">Record a Spend</p>
                                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                        <div className="space-y-1.5">
                                          <Label className="text-xs font-medium text-muted-foreground">Amount ($)</Label>
                                          <Input
                                            type="number" min="0.01" step="0.01" placeholder="0.00"
                                            value={spendAmt} onChange={e => setSpendAmt(e.target.value)}
                                            className="h-8 text-xs rounded-[6px]"
                                          />
                                        </div>
                                        <div className="space-y-1.5">
                                          <Label className="text-xs font-medium text-muted-foreground">Volunteer</Label>
                                          <Select value={spendVol} onValueChange={(value) => {
                                            if (value === "__add_new_volunteer__") {
                                              setAddVolunteerTarget("spend")
                                              setShowAddVolunteerDialog(true)
                                              return
                                            }
                                            setSpendVol(value ?? "")
                                          }}>
                                            <SelectTrigger size="sm" className="rounded-[6px] text-xs h-8">
                                              <SelectValue placeholder="Select volunteer" />
                                            </SelectTrigger>
                                            <SelectContent className="w-auto min-w-[var(--anchor-width)] max-w-sm max-h-60 overflow-y-auto">
                                              {volunteers.map(v => <SelectItem key={v.id} value={v.name}>{v.name}</SelectItem>)}
                                              <div className="border-t border-border my-1" />
                                              <SelectItem value="__add_new_volunteer__" className="text-primary font-medium">
                                                <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} className="size-3.5 mr-1" />
                                                Add Volunteer
                                              </SelectItem>
                                            </SelectContent>
                                          </Select>
                                        </div>
                                        <div className="space-y-1.5">
                                          <Label className="text-xs font-medium text-muted-foreground">Recipient (optional)</Label>
                                          <Input
                                            placeholder="e.g. Family A"
                                            value={spendRecip} onChange={e => setSpendRecip(e.target.value)}
                                            className="h-8 text-xs rounded-[6px]"
                                          />
                                        </div>
                                        <div className="space-y-1.5">
                                          <Label className="text-xs font-medium text-muted-foreground">Notes (optional)</Label>
                                          <Input
                                            placeholder="e.g. Weekly groceries"
                                            value={spendNotes} onChange={e => setSpendNotes(e.target.value)}
                                            className="h-8 text-xs rounded-[6px]"
                                          />
                                        </div>
                                      </div>
                                      {spendErr && <p className="text-xs text-destructive">{spendErr}</p>}
                                      <div className="flex gap-2">
                                        <Button
                                          onClick={handleSpend}
                                          loading={spending}
                                          loadingText="Recording…"
                                          size="sm"
                                          className="rounded-[6px] text-xs"
                                        >
                                          Confirm Spend
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => { setShowSpend(false); setSpendErr(""); setSpendRecip("") }}
                                          className="rounded-[6px] text-xs"
                                        >
                                          Cancel
                                        </Button>
                                      </div>
                                    </div>
                                  )}

                                  {/* Donation form */}
                                  {showDonate && (
                                    <div className="bg-card border border-border rounded-[8px] p-4 space-y-3">
                                      <p className="text-xs font-semibold text-foreground">Record a Donation Out</p>
                                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        <div className="space-y-1.5">
                                          <Label className="text-xs font-medium text-muted-foreground">Recipient</Label>
                                          <Input
                                            placeholder="e.g. Family A"
                                            value={donateRecip} onChange={e => setDonateRecip(e.target.value)}
                                            className="h-8 text-xs rounded-[6px]"
                                          />
                                        </div>
                                        <div className="space-y-1.5">
                                          <Label className="text-xs font-medium text-muted-foreground">Volunteer</Label>
                                          <Select value={donateVol} onValueChange={(value) => {
                                            if (value === "__add_new_volunteer__") {
                                              setAddVolunteerTarget("donate")
                                              setShowAddVolunteerDialog(true)
                                              return
                                            }
                                            setDonateVol(value ?? "")
                                          }}>
                                            <SelectTrigger size="sm" className="rounded-[6px] text-xs h-8">
                                              <SelectValue placeholder="Select volunteer" />
                                            </SelectTrigger>
                                            <SelectContent className="w-auto min-w-[var(--anchor-width)] max-w-sm max-h-60 overflow-y-auto">
                                              {volunteers.map(v => <SelectItem key={v.id} value={v.name}>{v.name}</SelectItem>)}
                                              <div className="border-t border-border my-1" />
                                              <SelectItem value="__add_new_volunteer__" className="text-primary font-medium">
                                                <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} className="size-3.5 mr-1" />
                                                Add Volunteer
                                              </SelectItem>
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
                                            <div className="relative mt-1.5">
                                              <span className="pointer-events-none absolute inset-y-0 left-2.5 flex items-center text-xs font-medium text-muted-foreground">$</span>
                                              <Input
                                                type="text"
                                                inputMode="decimal"
                                                placeholder="0.00"
                                                value={donateAmt}
                                                onChange={e => {
                                                  const digits = e.target.value.replace(/\D/g, "")
                                                  if (!digits) { setDonateAmt(""); return }
                                                  const cents = parseInt(digits, 10)
                                                  setDonateAmt((cents / 100).toFixed(2))
                                                }}
                                                className="h-8 text-xs rounded-[6px] pl-6 pr-3 font-mono tabular-nums text-left"
                                              />
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                      <div className="space-y-1.5">
                                        <Label className="text-xs font-medium text-muted-foreground">Notes (optional)</Label>
                                        <textarea
                                          placeholder="e.g. Weekly groceries for the family"
                                          value={donateNotes}
                                          onChange={e => setDonateNotes(e.target.value)}
                                          className="flex min-h-[32px] h-[32px] w-full rounded-[6px] border border-input bg-input/30 px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 outline-none resize-y overflow-hidden leading-snug"
                                        />
                                      </div>
                                      {donateErr && <p className="text-xs text-destructive">{donateErr}</p>}
                                      <div className="flex gap-2">
                                        <Button
                                          onClick={handleDonate}
                                          loading={donating}
                                          loadingText="Confirming…"
                                          size="sm"
                                          className="rounded-[6px] text-xs"
                                        >
                                          Confirm Donation
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => { setShowDonate(false); setDonateErr("") }}
                                          className="rounded-[6px] text-xs"
                                        >
                                          Cancel
                                        </Button>
                                      </div>
                                    </div>
                                  )}

                                  {/* Transaction history */}
                                  <div>
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                                      Transaction History
                                    </p>
                                    {cardTxns.length === 0 ? (
                                      <p className="text-xs text-muted-foreground text-center py-4">
                                        No transactions recorded for this card.
                                      </p>
                                    ) : (
                                      <div className="bg-background border border-border rounded-[8px] overflow-hidden">
                                        <table className="w-full text-xs bg-background">
                                          <thead>
                                            <tr className="bg-muted/50 dark:bg-sidebar border-b border-border">
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
                                                  {t.type === "SPEND" ? (
                                                    <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 hover:bg-amber-500/10 font-medium text-[11px]">
                                                      Spend
                                                    </Badge>
                                                  ) : (
                                                    <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/10 font-medium text-[11px]">
                                                      Donation
                                                    </Badge>
                                                  )}
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

                  {/* Totals Table Footer */}
                  <TableFooter className="bg-muted/50 dark:bg-sidebar">
                    <TableRow className="bg-muted/50 dark:bg-sidebar hover:bg-muted/50 dark:hover:bg-sidebar border-border">
                      <TableCell colSpan={2}></TableCell>
                      <TableCell className="py-3 font-semibold text-foreground align-middle">Total</TableCell>
                      <TableCell className="py-3 font-semibold text-foreground align-middle">${tableStatsCards.reduce((s, c) => s + Number(c.initialAmount), 0).toFixed(2)}</TableCell>
                      <TableCell className="py-3 font-semibold text-foreground align-middle">
                        <span className={tableStatsCards.reduce((s, c) => s + Number(c.remainingAmount), 0) === 0 ? "text-muted-foreground" : "text-foreground"}>
                          ${tableStatsCards.reduce((s, c) => s + Number(c.remainingAmount), 0).toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell className="py-3 font-semibold text-foreground align-middle tabular-nums">${tableStatsCards.reduce((s, c) => s + (Number(c.initialAmount) - Number(c.remainingAmount)), 0).toFixed(2)}</TableCell>
                      <TableCell colSpan={4}></TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </div>

              {/* Pagination Footer */}
              <div className="px-6 py-3 border-t border-border flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Showing {paginatedCards.length} of {filteredCards.length} cards
                </p>
                <div className="text-xs flex items-center gap-1.5">
                  Rows per page
                  <input
                    type="number"
                    value={pageSize}
                    onChange={(e) => { setPageSize(Number(e.target.value) || 1); setPageIndex(0) }}
                    className="border border-border rounded-md w-[60px] p-1.5 bg-background text-foreground text-center"
                  />
                  <span className="mx-1">Page {pageIndex + 1} of {totalPages}</span>
                  <HugeiconsIcon onClick={() => setPageIndex(0)} icon={ArrowLeftDoubleIcon} strokeWidth={2}
                    className="size-7 text-muted-foreground cursor-pointer border border-border rounded-[5px] p-1.5 hover:bg-muted" />
                  <HugeiconsIcon onClick={() => setPageIndex(p => Math.max(0, p - 1))} icon={ArrowLeft01Icon} strokeWidth={2}
                    className="size-7 text-muted-foreground cursor-pointer border border-border rounded-[5px] p-1.5 hover:bg-muted" />
                  <HugeiconsIcon onClick={() => setPageIndex(p => Math.min(totalPages - 1, p + 1))} icon={ArrowRight01Icon} strokeWidth={2}
                    className="size-7 text-muted-foreground cursor-pointer border border-border rounded-[5px] p-1.5 hover:bg-muted" />
                  <HugeiconsIcon onClick={() => setPageIndex(totalPages - 1)} icon={ArrowRightDoubleIcon} strokeWidth={2}
                    className="size-7 text-muted-foreground cursor-pointer border border-border rounded-[5px] p-1.5 hover:bg-muted" />
                </div>
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
              <Combobox
                value={editStore}
                onValueChange={(val) => {
                  if (val === "__add_new_store__") {
                    setShowAddStoreDialog(true)
                    return
                  }
                  if (val) setEditStore(val as string)
                }}
                onInputValueChange={(val) => setEditStore(val)}
              >
                <ComboboxInput
                  placeholder="Search or add store..."
                  className="h-8 rounded-[6px]"
                />
                <ComboboxContent className="max-h-60 overflow-hidden">
                  <ComboboxList className="max-h-56 overflow-y-auto pr-1 [scrollbar-width:thin] [scrollbar-color:var(--border)_transparent]">
                    {filteredEditStoreOptions.length > 0 ? (
                      filteredEditStoreOptions.map(store => (
                        <ComboboxItem key={store} value={store}>
                          {store}
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
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Initial Balance</Label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-2.5 flex items-center text-xs font-medium text-muted-foreground">$</span>
                  <Input
                    type="text"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={editInitialBalance}
                    onChange={e => {
                      const digits = e.target.value.replace(/\D/g, "")
                      if (!digits) {
                        setEditInitialBalance("")
                        return
                      }
                      const cents = parseInt(digits, 10)
                      setEditInitialBalance((cents / 100).toFixed(2))
                    }}
                    className="h-8 text-sm rounded-[6px] pl-6 pr-3 font-mono tabular-nums text-left"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Remaining Balance</Label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-2.5 flex items-center text-xs font-medium text-muted-foreground">$</span>
                  <Input
                    type="text"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={editRemainingBalance}
                    onChange={e => {
                      const digits = e.target.value.replace(/\D/g, "")
                      if (!digits) {
                        setEditRemainingBalance("")
                        return
                      }
                      const cents = parseInt(digits, 10)
                      setEditRemainingBalance((cents / 100).toFixed(2))
                    }}
                    className="h-8 text-sm rounded-[6px] pl-6 pr-3 font-mono tabular-nums text-left"
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" className="rounded-[6px]" />}>
              Cancel
            </DialogClose>
            <Button
              onClick={saveEditCard}
              loading={savingEdit}
              loadingText="Saving…"
              className="bg-primary text-primary-foreground text-sm font-medium rounded-[6px] hover:bg-primary-hover transition-colors"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Card Details Dialog */}
      <Dialog open={showViewCardDialog} onOpenChange={setShowViewCardDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Gift Card Details</DialogTitle>
            <DialogDescription>
              Complete card information, balances, and notes.
            </DialogDescription>
          </DialogHeader>
          {viewingCard && (
            <div className="py-2 space-y-4">
              <div className="flex items-center gap-3.5 p-3 rounded-lg border border-border bg-muted/40">
                <div className="flex size-12 items-center justify-center rounded-lg border border-border bg-background text-base font-semibold text-foreground">
                  {viewingCard.store.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-foreground truncate">{viewingCard.store.name}</h3>
                  <p className="text-xs text-muted-foreground font-mono">•••• {viewingCard.lastFourDigits}</p>
                </div>
                <Badge variant="secondary" className="font-medium text-xs">
                  {viewingCard.store.category || "Other"}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 rounded-md border border-border bg-card">
                  <span className="text-muted-foreground block mb-1">Initial Balance</span>
                  <span className="text-foreground font-semibold text-sm">${Number(viewingCard.initialAmount).toFixed(2)}</span>
                </div>
                <div className="p-2.5 rounded-md border border-border bg-card">
                  <span className="text-muted-foreground block mb-1">Remaining Balance</span>
                  <span className="text-foreground font-semibold text-sm">${Number(viewingCard.remainingAmount).toFixed(2)}</span>
                </div>
                <div className="p-2.5 rounded-md border border-border bg-card">
                  <span className="text-muted-foreground block mb-1">Total Spent</span>
                  <span className="text-foreground font-medium">${(Number(viewingCard.initialAmount) - Number(viewingCard.remainingAmount)).toFixed(2)}</span>
                </div>
                <div className="p-2.5 rounded-md border border-border bg-card">
                  <span className="text-muted-foreground block mb-1">Status</span>
                  <Badge
                    variant="secondary"
                    className={`font-medium text-xs ${
                      Number(viewingCard.remainingAmount) > 0 || viewingCard.status === "ACTIVE" || viewingCard.status === "PARTIALLY_REDEEMED"
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : viewingCard.status === "DONATED"
                        ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {Number(viewingCard.remainingAmount) > 0 || viewingCard.status === "ACTIVE" || viewingCard.status === "PARTIALLY_REDEEMED"
                      ? "Active"
                      : viewingCard.status === "DONATED"
                      ? "Donated"
                      : "Used"}
                  </Badge>
                </div>
                <div className="p-2.5 rounded-md border border-border bg-card col-span-2">
                  <span className="text-muted-foreground block mb-1">Added By</span>
                  <span className="text-foreground">{viewingCard.addedBy || "Volunteer"}</span>
                </div>
                {viewingCard.createdAt && (
                  <div className="p-2.5 rounded-md border border-border bg-card col-span-2">
                    <span className="text-muted-foreground block mb-1">Date Added</span>
                    <span className="text-foreground">{fmt(viewingCard.createdAt)}</span>
                  </div>
                )}
              </div>

              {/* Notes section */}
              <div className="p-3 rounded-lg border border-border bg-card space-y-1">
                <span className="text-xs font-medium text-muted-foreground block">Notes</span>
                {viewingCard.notes ? (
                  <p className="text-xs text-foreground whitespace-pre-wrap leading-relaxed">
                    {viewingCard.notes}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground italic">No notes recorded for this card.</p>
                )}
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setShowViewCardDialog(false)
                if (viewingCard) openEditCard(viewingCard.id)
              }}
            >
              <HugeiconsIcon icon={Edit01Icon} strokeWidth={2} className="size-3.5 mr-1.5" />
              Edit Card
            </Button>
            <Button onClick={() => setShowViewCardDialog(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Alert Dialog */}
      <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive">
              <HugeiconsIcon icon={Delete01Icon} strokeWidth={2} className="size-6" />
            </AlertDialogMedia>
            <AlertDialogTitle>Delete {selectedRows.length} selected gift card{selectedRows.length > 1 ? "s" : ""}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the following {selectedRows.length} gift card{selectedRows.length > 1 ? "s" : ""} and all associated transaction records. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkDeleting} className="rounded-[6px]">Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleBulkDelete}
              disabled={bulkDeleting}
              className="rounded-[6px]"
            >
              {bulkDeleting ? "Deleting…" : `Delete ${selectedRows.length} Card${selectedRows.length > 1 ? "s" : ""}`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Single Delete Alert Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive">
              <HugeiconsIcon icon={Delete01Icon} strokeWidth={2} className="size-6" />
            </AlertDialogMedia>
            <AlertDialogTitle>Delete gift card?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this gift card and its complete transaction history. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting} className="rounded-[6px]">Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleDeleteCard}
              disabled={deleting}
              className="rounded-[6px]"
            >
              {deleting ? "Deleting…" : "Delete Card"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Volunteer Dialog Matching User Management */}
      <Dialog open={showAddVolunteerDialog} onOpenChange={handleOpenVolunteerDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Volunteer</DialogTitle>
            <DialogDescription>
              {!inviteCreateAccount
                ? "Add a volunteer by name. No login account will be created."
                : "Send an invitation. The volunteer will be able to set their password and sign in."
              }
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleVolunteerSubmit}>
            <div className="py-3 space-y-4">
              {/* Account toggle switch */}
              <div className="flex items-center justify-between rounded-lg border border-border bg-muted/50 p-3">
                <div className="space-y-0.5">
                  <Label className="text-xs font-medium text-foreground">Create login account</Label>
                  <p className="text-[11px] text-muted-foreground">Allow this volunteer to sign in to the platform</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={inviteCreateAccount}
                  onClick={() => setInviteCreateAccount(!inviteCreateAccount)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent shadow-xs transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 ${
                    inviteCreateAccount ? "bg-primary" : "bg-input"
                  }`}
                >
                  <span
                    className={`pointer-events-none block size-4 rounded-full bg-background shadow-lg ring-0 transition-transform ${
                      inviteCreateAccount ? "translate-x-4" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Display Name Field */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">
                  {inviteCreateAccount ? "Display Name (Optional)" : "Display Name"}
                </Label>
                <Input
                  value={inviteDisplayName}
                  onChange={e => setInviteDisplayName(e.target.value)}
                  placeholder="e.g. Alex Morgan"
                  required={!inviteCreateAccount}
                  className="h-8 text-sm rounded-[6px]"
                />
              </div>

              {/* Animated Email Field — only shown when creating an account */}
              <div
                className="overflow-hidden transition-all duration-300 ease-in-out"
                style={{
                  maxHeight: inviteCreateAccount ? "80px" : "0px",
                  opacity: inviteCreateAccount ? 1 : 0,
                }}
              >
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">Email Address</Label>
                  <Input
                    type="email"
                    required={inviteCreateAccount}
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                    placeholder="volunteer@example.com"
                    className="h-8 text-sm rounded-[6px]"
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button type="button" variant="outline" onClick={() => handleOpenVolunteerDialog(false)} className="rounded-[6px] text-xs">
                Cancel
              </Button>
              <Button type="submit" disabled={invitingVolunteer} className="rounded-[6px] text-xs font-medium">
                {invitingVolunteer
                  ? (!inviteCreateAccount ? "Adding…" : "Sending…")
                  : (!inviteCreateAccount ? "Add Volunteer" : "Send Invitation")
                }
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Generated Invite Link Dialog */}
      <Dialog open={showGeneratedLinkDialog} onOpenChange={setShowGeneratedLinkDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invitation Link Generated</DialogTitle>
            <DialogDescription>
              Share this link directly with the volunteer so they can set up their account and password.
            </DialogDescription>
          </DialogHeader>
          <div className="py-3 space-y-3">
            <div className="flex items-center gap-2">
              <Input
                readOnly
                value={generatedLink}
                className="h-8 text-xs font-mono select-all bg-muted/40"
              />
              <Button
                size="sm"
                variant="outline"
                className="h-8 shrink-0 gap-1.5 text-xs rounded-[6px] cursor-pointer"
                onClick={() => copyToClipboard(generatedLink)}
              >
                <HugeiconsIcon icon={Copy01Icon} strokeWidth={2} className="size-3.5" />
                Copy Link
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              This link is valid for single-use registration and expires in 24 hours.
            </p>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowGeneratedLinkDialog(false)} className="rounded-[6px] text-xs">
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
