"use client"

import { useState, useEffect, useMemo, type ReactNode } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import useSWR from "swr"
import { fetcher } from "@/lib/fetcher"
import Link from "next/link"
import { Treemap, ResponsiveContainer, Tooltip } from "recharts"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu"
import { HugeiconsIcon } from "@hugeicons/react"
import { Search01Icon, TradeUpIcon, TradeDownIcon, ArrowDown01Icon, ArrowUp01Icon, Sorting01Icon } from "@hugeicons/core-free-icons"
import { Card, CardAction, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { categoryLabel, CATEGORY_RAW, TreemapCell } from "@/lib/treemap"

// ── Types ─────────────────────────────────────────────────────────────────────

type Store = {
  id: string
  name: string
  category: string
}

type GiftCard = {
  id: string
  store: Store
  initialAmount: number
  remainingAmount: number
  status: string
}

// ── Constants ─────────────────────────────────────────────────────────────────

const CATEGORIES = ["Grocery", "Fast Food", "Clothing", "Other"]
const ROWS_PER_PAGE_OPTIONS = [10, 20, 50]

// ── Pagination button ──────────────────────────────────────────────────────────

function PagBtn({ onClick, disabled, children }: { onClick: () => void; disabled: boolean; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-8 h-8 flex items-center justify-center rounded border border-border text-sm text-muted-foreground disabled:opacity-40 disabled:cursor-not-allowed hover:bg-accent transition-colors"
    >
      {children}
    </button>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

function SortIcon({ field, sortField, sortDirection }: {
  field: string; sortField: string | null; sortDirection: "asc" | "desc"
}) {
  if (sortField !== field) return <HugeiconsIcon icon={Sorting01Icon} strokeWidth={2} className="ml-1 size-3.5 text-muted-foreground/50" />
  if (sortDirection === "asc") return <HugeiconsIcon icon={ArrowUp01Icon} strokeWidth={2} className="ml-1 size-3.5 text-foreground" />
  return <HugeiconsIcon icon={ArrowDown01Icon} strokeWidth={2} className="ml-1 size-3.5 text-foreground" />
}

export default function HomePage() {
  const [selectedStores, setSelectedStores] = useState<string[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [storeSearch, setStoreSearch] = useState("")
  const [categorySearch, setCategorySearch] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [page, setPage] = useState(1)
  const [sortField, setSortField] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

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
  const [rowsPerPage, setRowsPerPage] = useState(10)

  const { data, error } = useSWR<any[]>("/api/gift-cards", fetcher)
  const isLoading = !data && !error
  const cards = Array.isArray(data) ? data : []

  // Summary stats with real dynamic date & period analysis
  const totalCards = cards.length
  const totalRemaining = cards.reduce((s, c) => s + Number(c.remainingAmount), 0)
  const totalRedeemed = cards.reduce((s, c) => s + (Number(c.initialAmount) - Number(c.remainingAmount)), 0)
  const totalInitial = cards.reduce((s, c) => s + Number(c.initialAmount), 0)
  const activeCount = cards.filter(c => c.status === "ACTIVE" || Number(c.remainingAmount) > 0).length

  const statsAnalysis = useMemo(() => {
    const now = Date.now()
    const periodMs = 30 * 24 * 60 * 60 * 1000
    const currentPeriodStart = now - periodMs
    const previousPeriodStart = now - (2 * periodMs)

    const hasCardData = totalCards > 0
    const hasRemData = totalCards > 0 && totalInitial > 0
    const allTxns = cards.flatMap(c => c.transactions || [])
    const hasSpentData = totalRedeemed > 0 || allTxns.length > 0

    // 1. Card intake trends
    const cardsCurrent = cards.filter(c => new Date(c.createdAt).getTime() >= currentPeriodStart).length
    const cardsPrevious = cards.filter(c => {
      const t = new Date(c.createdAt).getTime()
      return t >= previousPeriodStart && t < currentPeriodStart
    }).length

    let cardBadge: string | null = null
    let cardIsUp = true
    let cardHeading = "No card records"
    let cardSub = "No cards added to database yet"

    if (hasCardData) {
      if (cardsPrevious > 0) {
        const pct = ((cardsCurrent - cardsPrevious) / cardsPrevious) * 100
        cardIsUp = pct >= 0
        cardBadge = `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`
        cardHeading = `${pct >= 0 ? "Trending up" : "Down"} this month`
        cardSub = `${cardsCurrent} card${cardsCurrent !== 1 ? "s" : ""} added in last 30 days`
      } else if (cardsCurrent > 0) {
        cardIsUp = true
        cardBadge = `+${cardsCurrent} new`
        cardHeading = `+${cardsCurrent} cards added this period`
        cardSub = "Added in the last 30 days"
      } else {
        cardIsUp = true
        cardBadge = "0%"
        cardHeading = "No new cards this period"
        cardSub = "No additions in the last 30 days"
      }
    }

    // 2. Remaining balance trends
    let remBadge: string | null = null
    let remIsUp = true
    let remHeading = "No balance data"
    let remSub = "No active card balance available"

    if (hasRemData) {
      const availablePct = (totalRemaining / totalInitial) * 100
      remIsUp = availablePct > 30
      remBadge = `${availablePct.toFixed(1)}% available`
      remHeading = `${activeCount} of ${totalCards} cards active`
      remSub = `$${totalRemaining.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} available across stores`
    }

    // 3. Transactions / Redeemed trends
    const txnsCurrent = allTxns.filter(t => new Date(t.createdAt).getTime() >= currentPeriodStart)
    const txnsPrevious = allTxns.filter(t => {
      const time = new Date(t.createdAt).getTime()
      return time >= previousPeriodStart && time < currentPeriodStart
    })

    const spentCurrent = txnsCurrent.reduce((s, t) => s + Number(t.amount || 0), 0)
    const spentPrevious = txnsPrevious.reduce((s, t) => s + Number(t.amount || 0), 0)

    let spentBadge: string | null = null
    let spentIsUp = true
    let spentHeading = "No redemptions logged"
    let spentSub = "No spending activity recorded"

    if (hasSpentData) {
      if (spentPrevious > 0) {
        const spentPct = ((spentCurrent - spentPrevious) / spentPrevious) * 100
        spentIsUp = spentPct >= 0
        spentBadge = `${spentPct >= 0 ? "+" : ""}${spentPct.toFixed(1)}%`
        spentHeading = `${spentPct >= 0 ? "Increased" : "Decreased"} distribution`
        spentSub = `$${spentCurrent.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} spent across ${txnsCurrent.length} txn${txnsCurrent.length !== 1 ? "s" : ""} (last 30d)`
      } else if (spentCurrent > 0) {
        spentIsUp = true
        spentBadge = `+$${Math.round(spentCurrent)}`
        spentHeading = `$${spentCurrent.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} spent recently`
        spentSub = `${txnsCurrent.length} transaction${txnsCurrent.length !== 1 ? "s" : ""} in the last 30 days`
      } else {
        spentIsUp = true
        spentBadge = "0 txns"
        spentHeading = "Steady distribution"
        spentSub = "No transactions in the last 30 days"
      }
    }

    return {
      hasCardData, cardBadge, cardIsUp, cardHeading, cardSub,
      hasRemData, remBadge, remIsUp, remHeading, remSub,
      hasSpentData, spentBadge, spentIsUp, spentHeading, spentSub
    }
  }, [cards, totalCards, totalRemaining, totalRedeemed, totalInitial, activeCount])

  // Per-store breakdown
  const storeBreakdown = useMemo(() => {
    const map = new Map<string, {
      store: string; category: string; count: number; remaining: number; redeemed: number
    }>()
    for (const c of cards) {
      const storeName = c.store.name
      const cat = categoryLabel(c.store.category)
      if (!map.has(storeName)) {
        map.set(storeName, { store: storeName, category: cat, count: 0, remaining: 0, redeemed: 0 })
      }
      const e = map.get(storeName)!
      e.count += 1
      e.remaining += Number(c.remainingAmount)
      e.redeemed += Number(c.initialAmount) - Number(c.remainingAmount)
    }
    return Array.from(map.values()).sort((a, b) => b.remaining - a.remaining)
  }, [cards])

  const uniqueStores = useMemo(() => {
    return Array.from(new Set(storeBreakdown.map(s => s.store))).sort()
  }, [storeBreakdown])

  const filteredStoreFilterOptions = useMemo(() => {
    const q = storeSearch.trim().toLowerCase()
    if (!q) return uniqueStores
    return uniqueStores.filter(s => s.toLowerCase().includes(q))
  }, [uniqueStores, storeSearch])

  const filteredCategoryFilterOptions = useMemo(() => {
    const q = categorySearch.trim().toLowerCase()
    if (!q) return CATEGORIES
    return CATEGORIES.filter(c => c.toLowerCase().includes(q))
  }, [categorySearch])

  // Category filter for treemap and table
  const filteredStores = useMemo(() => {
    let list = [...storeBreakdown]
    if (selectedCategories.length > 0) {
      list = list.filter(s => selectedCategories.includes(s.category))
    }
    if (selectedStores.length > 0) {
      list = list.filter(s => selectedStores.includes(s.store))
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      list = list.filter(s =>
        s.store.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        String(s.count).includes(q) ||
        s.remaining.toFixed(2).includes(q) ||
        s.redeemed.toFixed(2).includes(q)
      )
    }
    if (sortField) {
      list.sort((a, b) => {
        if (sortField === "store") {
          const va = (a.store || "").toLowerCase()
          const vb = (b.store || "").toLowerCase()
          const cmp = va.localeCompare(vb)
          return sortDirection === "asc" ? cmp : -cmp
        }
        if (sortField === "cards") {
          const va = Number(a.count || 0)
          const vb = Number(b.count || 0)
          return sortDirection === "asc" ? va - vb : vb - va
        }
        if (sortField === "remainingBalance") {
          const va = Number(a.remaining || 0)
          const vb = Number(b.remaining || 0)
          return sortDirection === "asc" ? va - vb : vb - va
        }
        if (sortField === "amountSpent") {
          const va = Number(a.redeemed || 0)
          const vb = Number(b.redeemed || 0)
          return sortDirection === "asc" ? va - vb : vb - va
        }
        return 0
      })
    }
    return list
  }, [storeBreakdown, selectedCategories, selectedStores, searchQuery, sortField, sortDirection])

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredStores.length / rowsPerPage))
  const safePage = Math.min(page, totalPages)
  const paginatedStores = useMemo(() => {
    const start = (safePage - 1) * rowsPerPage
    return filteredStores.slice(start, start + rowsPerPage)
  }, [filteredStores, safePage, rowsPerPage])

  // Treemap data
  const treemapData = useMemo(() => {
    return (selectedCategories.length > 0 ? storeBreakdown.filter(s => selectedCategories.includes(s.category)) : storeBreakdown)
      .filter(s => s.remaining > 0)
      .map(s => ({
        name: s.store,
        size: parseFloat(s.remaining.toFixed(2)),
        remaining: parseFloat(s.remaining.toFixed(2)),
        redeemed: parseFloat(s.redeemed.toFixed(2)),
        category: s.category,
      }))
  }, [storeBreakdown, selectedCategories])

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset className="min-w-0 overflow-x-hidden">

        {/* ── Header ── */}
        <SiteHeader title="Dashboard" />

        <div className="flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
          <div className="flex flex-col gap-6 p-4 sm:p-6">
            
            <div className="flex flex-col gap-2">
              <p className="text-muted-foreground">Welcome to your admin dashboard</p>
            </div>


            {/* ── Summary ── */}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {/* Total Cards */}
              <Card className="@container/card border border-zinc-700 bg-[#111111] text-white shadow-sm">
                <CardHeader>
                  <CardDescription className="text-zinc-300">Total Cards</CardDescription>
                  <CardTitle className="text-2xl font-semibold tabular-nums text-white @[250px]/card:text-3xl">
                    {isLoading ? <Skeleton className="h-8 w-16 bg-zinc-700" /> : totalCards}
                  </CardTitle>
                  {statsAnalysis.cardBadge && (
                    <CardAction>
                      <Badge variant="outline" className="border-zinc-600 bg-zinc-800 text-zinc-100">
                        <HugeiconsIcon icon={statsAnalysis.cardIsUp ? TradeUpIcon : TradeDownIcon} className="mr-1 size-3" />
                        {statsAnalysis.cardBadge}
                      </Badge>
                    </CardAction>
                  )}
                </CardHeader>
                <CardFooter className="flex-col items-start gap-1.5 text-sm text-zinc-200">
                  <div className="line-clamp-1 flex items-center gap-2 font-medium text-white">
                    {statsAnalysis.cardHeading}
                    {statsAnalysis.hasCardData && (
                      <HugeiconsIcon icon={statsAnalysis.cardIsUp ? TradeUpIcon : TradeDownIcon} className="size-4 text-zinc-300" />
                    )}
                  </div>
                  <div className="text-zinc-300">
                    {statsAnalysis.cardSub}
                  </div>
                </CardFooter>
              </Card>

              {/* Remaining Value */}
              <Card className="@container/card border border-zinc-700 bg-[#111111] text-white shadow-sm">
                <CardHeader>
                  <CardDescription className="text-zinc-300">Remaining Value</CardDescription>
                  <CardTitle className="text-2xl font-semibold tabular-nums text-white @[250px]/card:text-3xl">
                    {isLoading ? <Skeleton className="h-8 w-24 bg-zinc-700" /> : `$${totalRemaining.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  </CardTitle>
                  {statsAnalysis.remBadge && (
                    <CardAction>
                      <Badge variant="outline" className="border-zinc-600 bg-zinc-800 text-zinc-100">
                        <HugeiconsIcon icon={statsAnalysis.remIsUp ? TradeUpIcon : TradeDownIcon} className="mr-1 size-3" />
                        {statsAnalysis.remBadge}
                      </Badge>
                    </CardAction>
                  )}
                </CardHeader>
                <CardFooter className="flex-col items-start gap-1.5 text-sm text-zinc-200">
                  <div className="line-clamp-1 flex items-center gap-2 font-medium text-white">
                    {statsAnalysis.remHeading}
                    {statsAnalysis.hasRemData && (
                      <HugeiconsIcon icon={statsAnalysis.remIsUp ? TradeUpIcon : TradeDownIcon} className="size-4 text-zinc-300" />
                    )}
                  </div>
                  <div className="text-zinc-300">
                    {statsAnalysis.remSub}
                  </div>
                </CardFooter>
              </Card>

              {/* Total Redeemed */}
              <Card className="@container/card border border-zinc-700 bg-[#111111] text-white shadow-sm">
                <CardHeader>
                  <CardDescription className="text-zinc-300">Total Redeemed</CardDescription>
                  <CardTitle className="text-2xl font-semibold tabular-nums text-white @[250px]/card:text-3xl">
                    {isLoading ? <Skeleton className="h-8 w-24 bg-zinc-700" /> : `$${totalRedeemed.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  </CardTitle>
                  {statsAnalysis.spentBadge && (
                    <CardAction>
                      <Badge variant="outline" className="border-zinc-600 bg-zinc-800 text-zinc-100">
                        <HugeiconsIcon icon={statsAnalysis.spentIsUp ? TradeUpIcon : TradeDownIcon} className="mr-1 size-3" />
                        {statsAnalysis.spentBadge}
                      </Badge>
                    </CardAction>
                  )}
                </CardHeader>
                <CardFooter className="flex-col items-start gap-1.5 text-sm text-zinc-200">
                  <div className="line-clamp-1 flex items-center gap-2 font-medium text-white">
                    {statsAnalysis.spentHeading}
                    {statsAnalysis.hasSpentData && (
                      <HugeiconsIcon icon={statsAnalysis.spentIsUp ? TradeUpIcon : TradeDownIcon} className="size-4 text-zinc-300" />
                    )}
                  </div>
                  <div className="text-zinc-300">
                    {statsAnalysis.spentSub}
                  </div>
                </CardFooter>
              </Card>
            </div>

            {/* ── Visual Inventory (Treemap) ── */}
            <div className="border border-border rounded-[12px] bg-card p-4 sm:p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <h3 className="text-base font-semibold text-foreground">Visual Inventory</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Store size proportional to remaining dollar balance
                  </p>
                </div>
              </div>

              <div className="h-[280px] w-full min-h-[280px]">
                {isLoading ? (
                  <Skeleton className="h-full w-full rounded-lg" />
                ) : treemapData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-muted-foreground text-sm border border-dashed border-border rounded-lg">
                    No active cards with remaining balance in this category
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <Treemap
                      data={treemapData}
                      dataKey="size"
                      aspectRatio={4 / 3}
                      stroke="none"
                      content={<TreemapCell />}
                      isAnimationActive={false}
                    >
                      <Tooltip
                        content={({ payload }) => {
                          if (!payload || !payload.length) return null
                          const data = payload[0].payload
                          return (
                            <div className="bg-popover border border-border text-popover-foreground text-xs p-2.5 rounded-md shadow-md">
                              <p className="font-semibold">{data.name}</p>
                              <p className="text-muted-foreground">{data.category}</p>
                              <div className="mt-1 pt-1 border-t border-border space-y-0.5">
                                <p className="text-emerald-500 font-medium">Remaining: ${data.remaining?.toFixed(2)}</p>
                                <p className="text-muted-foreground">Redeemed: ${data.redeemed?.toFixed(2)}</p>
                              </div>
                            </div>
                          )
                        }}
                      />
                    </Treemap>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* ── Store Inventory Summary Table Card ── */}
            <div className="bg-card border border-border rounded-[12px] overflow-hidden">

              {/* Card header + multi-select filters */}
              <div className="px-6 py-4 border-b border-border">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Store Inventory Summary</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Overview of card balances and redemptions by store</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="rounded-full text-xs font-medium text-muted-foreground px-2.5 py-0.5 border-border bg-muted/40">{filteredStores.length} of {storeBreakdown.length} stores</Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  {/* Left: Store & Category Filters */}
                  <div className="flex items-center gap-3 flex-wrap">
                    {/* Multi-select Store Filter */}
                    <DropdownMenu>
                      <DropdownMenuTrigger render={
                        <Button variant="outline" size="sm" className="h-8 rounded-[6px] text-xs font-medium gap-1.5 min-w-44 justify-between border-border bg-card hover:bg-muted">
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

                    {/* Multi-select Category Filter */}
                    <DropdownMenu>
                      <DropdownMenuTrigger render={
                        <Button variant="outline" size="sm" className="h-8 rounded-[6px] text-xs font-medium gap-1.5 min-w-44 justify-between border-border bg-card hover:bg-muted">
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
                              setSelectedCategories(CATEGORIES)
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
                  </div>

                  {/* Middle: Search Input */}
                  <div className="relative">
                    <HugeiconsIcon icon={Search01Icon} strokeWidth={1.5} className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
                    <Input
                      placeholder="Search table"
                      value={searchQuery}
                      onChange={e => { setSearchQuery(e.target.value); setPage(1) }}
                      className="h-8 pl-8 text-sm rounded-[6px] w-80 sm:w-96 md:w-[420px]"
                    />
                  </div>

                  {/* Right: Spacer to maintain balance */}
                  <div className="hidden sm:block min-w-0" />
                </div>
              </div>

              <div className="overflow-x-auto bg-background">
                <Table className="bg-background">
                  <TableHeader className="bg-muted/50 dark:bg-sidebar">
                    <TableRow className="bg-muted/50 dark:bg-sidebar hover:bg-muted/50 dark:hover:bg-sidebar border-border">
                      <TableHead className="text-xs font-medium text-muted-foreground py-3 pl-6 cursor-pointer select-none hover:text-foreground" onClick={() => handleSort("store")}>
                        <div className="flex items-center">
                          Store
                          <SortIcon field="store" sortField={sortField} sortDirection={sortDirection} />
                        </div>
                      </TableHead>
                      <TableHead className="text-xs font-medium text-muted-foreground py-3 text-right cursor-pointer select-none hover:text-foreground" onClick={() => handleSort("cards")}>
                        <div className="flex items-center justify-end">
                          Cards
                          <SortIcon field="cards" sortField={sortField} sortDirection={sortDirection} />
                        </div>
                      </TableHead>
                      <TableHead className="text-xs font-medium text-muted-foreground py-3 text-right cursor-pointer select-none hover:text-foreground" onClick={() => handleSort("remainingBalance")}>
                        <div className="flex items-center justify-end">
                          Remaining Balance
                          <SortIcon field="remainingBalance" sortField={sortField} sortDirection={sortDirection} />
                        </div>
                      </TableHead>
                      <TableHead className="text-xs font-medium text-muted-foreground py-3 text-right pr-6 cursor-pointer select-none hover:text-foreground" onClick={() => handleSort("amountSpent")}>
                        <div className="flex items-center justify-end">
                          Amount Spent
                          <SortIcon field="amountSpent" sortField={sortField} sortDirection={sortDirection} />
                        </div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      Array.from({ length: 5 }).map((_, idx) => (
                        <TableRow key={idx} className="border-border">
                          <TableCell className="py-3 pl-6">
                            <Skeleton className="h-4 w-24 mb-1" />
                            <Skeleton className="h-3 w-16" />
                          </TableCell>
                          <TableCell className="py-3"><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                          <TableCell className="py-3"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                          <TableCell className="py-3 pr-6"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                        </TableRow>
                      ))
                    ) : paginatedStores.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-sm text-muted-foreground py-10">
                          No stores match your search or filters.
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedStores.map(row => (
                        <TableRow key={row.store} className="hover:bg-muted/50 border-border">
                          <TableCell className="py-3 pl-6">
                            <p className="text-sm font-medium text-foreground">{row.store}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{row.category}</p>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground py-3 text-right align-middle">{row.count}</TableCell>
                          <TableCell className="text-sm font-medium text-foreground py-3 tabular-nums text-right align-middle">
                            ${row.remaining.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-sm text-foreground py-3 tabular-nums font-medium text-right align-middle pr-6">
                            ${row.redeemed.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                  <TableFooter className="bg-muted/50 dark:bg-sidebar">
                    <TableRow className="bg-muted/50 dark:bg-sidebar hover:bg-muted/50 dark:hover:bg-sidebar border-border">
                      <TableCell className="py-3 pl-6 font-semibold">Total</TableCell>
                      <TableCell className="py-3 text-right tabular-nums font-semibold">
                        {filteredStores.reduce((acc, row) => acc + row.count, 0)}
                      </TableCell>
                      <TableCell className="py-3 text-right tabular-nums font-semibold">
                        ${filteredStores.reduce((acc, row) => acc + row.remaining, 0).toFixed(2)}
                      </TableCell>
                      <TableCell className="py-3 text-right tabular-nums pr-6 font-semibold">
                        ${filteredStores.reduce((acc, row) => acc + row.redeemed, 0).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </div>

              {/* Pagination footer */}
              <div className="flex flex-wrap items-center justify-between gap-2 px-6 py-3 border-t border-border bg-card">
                <p className="text-xs text-muted-foreground">
                  {filteredStores.length} result{filteredStores.length !== 1 ? "s" : ""}
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Rows per page</span>
                    <select
                      value={rowsPerPage}
                      onChange={e => { setRowsPerPage(Number(e.target.value)); setPage(1) }}
                      className="border border-border rounded-[4px] px-1.5 py-0.5 text-xs text-foreground bg-background"
                    >
                      {ROWS_PER_PAGE_OPTIONS.map(n => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  </div>
                  <p className="text-xs text-muted-foreground">Page {safePage} of {totalPages}</p>
                  <div className="flex items-center gap-1">
                    <PagBtn onClick={() => setPage(1)} disabled={safePage === 1}>«</PagBtn>
                    <PagBtn onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage === 1}>‹</PagBtn>
                    <PagBtn onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}>›</PagBtn>
                    <PagBtn onClick={() => setPage(totalPages)} disabled={safePage === totalPages}>»</PagBtn>
                  </div>
                </div>
              </div>

            </div>{/* end table section */}

          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}