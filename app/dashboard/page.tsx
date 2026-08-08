"use client"

import { useState, useEffect, useMemo, type ReactNode } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import useSWR from "swr"
import { fetcher } from "@/lib/fetcher"
import Link from "next/link"
import { Treemap, ResponsiveContainer, Tooltip } from "recharts"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { HugeiconsIcon } from "@hugeicons/react"
import { Edit01Icon, ShoppingBasket01Icon, GiveBloodIcon, Archive01Icon, Add01Icon, Search01Icon } from "@hugeicons/core-free-icons"
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

const CATEGORIES = ["All", "Grocery", "Fast Food", "Clothing", "Other"]
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

export default function HomePage() {
  const [activeCategory, setActiveCategory] = useState("All")
  const [searchQuery, setSearchQuery] = useState("")
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  const { data, isLoading } = useSWR<any[]>("/api/gift-cards", fetcher)
  const cards = Array.isArray(data) ? data : []

  // Summary stats
  const totalCards = cards.length
  const totalRemaining = cards.reduce((s, c) => s + Number(c.remainingAmount), 0)
  const totalRedeemed = cards.reduce((s, c) => s + (Number(c.initialAmount) - Number(c.remainingAmount)), 0)
  const activeCount = cards.filter(c => c.status === "ACTIVE").length

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

  // Category filter
  const filteredByCategory = activeCategory === "All"
    ? storeBreakdown
    : storeBreakdown.filter(s => s.category === activeCategory)

  // Search filter
  const filteredStores = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return filteredByCategory
    return filteredByCategory.filter(s => s.store.toLowerCase().includes(q))
  }, [filteredByCategory, searchQuery])

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredStores.length / rowsPerPage))
  const safePage = Math.min(page, totalPages)
  const paginatedStores = useMemo(() => {
    const start = (safePage - 1) * rowsPerPage
    return filteredStores.slice(start, start + rowsPerPage)
  }, [filteredStores, safePage, rowsPerPage])

  // Treemap data
  const treemapData = useMemo(() => {
    return filteredByCategory
      .filter(s => s.remaining > 0)
      .map(s => ({
        name: s.store,
        size: parseFloat(s.remaining.toFixed(2)),
        remaining: parseFloat(s.remaining.toFixed(2)),
        redeemed: parseFloat(s.redeemed.toFixed(2)),
        category: s.category,
      }))
  }, [filteredByCategory])

  function handleCategoryChange(cat: string | null) {
    if (!cat) return
    setActiveCategory(cat)
    setSearchQuery("")
    setPage(1)
  }

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset className="min-w-0 overflow-x-hidden">

        {/* ── Header ── */}
        <div className="border-b h-12 flex items-center shrink-0 px-0 bg-background">
          <div className="flex items-center gap-4 pl-5 w-full">
            <SidebarTrigger className="bg-card rounded-[6px] p-2 size-8 flex items-center justify-center border shadow-sm" />
            <Separator orientation="vertical" className="h-4" />
            <span className="font-medium text-base text-foreground">Home</span>
          </div>
        </div>

        <div className="flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
          <div className="flex flex-col gap-6 p-4 sm:p-6">

            {/* ── Quick Actions ── */}
            <div className="flex flex-col gap-3">
              <p className="text-base font-medium text-muted-foreground">Quick Actions</p>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {([
                  { href: "/cards",       icon: Add01Icon,           label: "Add Gift Cards",   desc: "Active cards" },
                  { href: "/inventory",   icon: ShoppingBasket01Icon, label: "Record Spend",     desc: "Log a purchase made with a gift card" },
                  { href: "/donations",   icon: GiveBloodIcon,        label: "Record Donation",  desc: "Give a card to a recipient in need" },
                  { href: "/inventory",   icon: Archive01Icon,        label: "View Inventory",   desc: "Browse all cards by store and category" },
                ] as const).map(({ href, icon, label, desc }) => (
                  <Link key={label} href={href} className="block h-full">
                    <div className="h-full bg-card rounded-[18px] shadow-sm border border-border pt-8 sm:pt-[58px] pb-6 px-6 flex flex-col gap-2 hover:bg-accent hover:border-primary/50 transition-colors cursor-pointer">
                      <div className="bg-transparent rounded-[10px] size-10 flex items-center shrink-0">
                        <HugeiconsIcon icon={icon} strokeWidth={2.5} className="size-6 text-primary" />
                      </div>
                      <div className="mt-2">
                        <p className="text-base font-medium text-foreground">{label}</p>
                        <p className="text-sm text-muted-foreground mt-0.5">{desc}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* ── Summary ── */}
            <div className="flex flex-col gap-3">
              <p className="text-base font-medium text-muted-foreground">Summary</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

                {/* Total Cards */}
                <div className="border border-border bg-card rounded-[12px] p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-muted-foreground">Total Cards</p>
                    <span className="bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400 text-xs font-medium px-2 py-0.5 rounded-full shrink-0">
                      +{isLoading ? <Skeleton className="h-3 w-4 inline-block" /> : activeCount}
                    </span>
                  </div>
                  {isLoading ? (
                    <Skeleton className="h-8 w-16 mt-1" />
                  ) : (
                    <h3 className="text-3xl font-semibold text-foreground mt-1 leading-none">{totalCards}</h3>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">Active cards</p>
                </div>

                {/* Remaining Value */}
                <div className="border border-border bg-card rounded-[12px] p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-muted-foreground">Remaining Value</p>
                    <span className="bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400 text-xs font-medium px-2 py-0.5 rounded-full shrink-0">
                      +{isLoading ? <Skeleton className="h-3 w-4 inline-block" /> : storeBreakdown.length}
                    </span>
                  </div>
                  {isLoading ? (
                    <Skeleton className="h-8 w-24 mt-1" />
                  ) : (
                    <h3 className="text-3xl font-semibold text-foreground mt-1 leading-none">
                      ${Math.round(totalRemaining).toLocaleString()}
                    </h3>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">Available across all cards</p>
                </div>

                {/* Total Redeemed */}
                <div className="border border-border bg-card rounded-[12px] p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-muted-foreground">Total Redeemed</p>
                    <span className="bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400 text-xs font-medium px-2 py-0.5 rounded-full shrink-0">
                      +{isLoading ? <Skeleton className="h-3 w-4 inline-block" /> : storeBreakdown.length}
                    </span>
                  </div>
                  {isLoading ? (
                    <Skeleton className="h-8 w-24 mt-1" />
                  ) : (
                    <h3 className="text-3xl font-semibold text-foreground mt-1 leading-none">
                      ${Math.round(totalRedeemed).toLocaleString()}
                    </h3>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">Total value spent or donated</p>
                </div>

              </div>
            </div>

            {/* ── Value Distribution ── */}
            <div id="inventory" className="border border-border bg-card rounded-[12px] overflow-hidden shadow-sm">

              {/* Card header */}
              <div className="px-5 pt-5 pb-4">
                <p className="text-sm font-semibold text-foreground">Gift Cards by Store</p>
                <p className="text-xs text-muted-foreground mt-0.5">Tile size = remaining balance · hover a tile for details</p>
              </div>

              {/* Treemap */}
              <div className="px-5 pb-4">
                {isLoading ? (
                  <Skeleton className="w-full h-[220px] rounded-md" />
                ) : treemapData.length === 0 ? (
                  <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
                    No remaining balance in this category.
                  </div>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={220}>
                      <Treemap
                        data={treemapData}
                        dataKey="size"
                        aspectRatio={16 / 9}
                        content={<TreemapCell />}
                      >
                        <Tooltip
                          content={({ active, payload }) => {
                            if (!active || !payload?.length) return null
                            const d = payload[0].payload
                            return (
                              <div className="bg-popover border border-border rounded-[8px] shadow-md px-3 py-2 text-sm min-w-[140px] text-popover-foreground">
                                <p className="font-semibold mb-1">{d.name}</p>
                                <div className="space-y-0.5 text-xs">
                                  <p className="text-green-600 dark:text-green-400">Remaining: <span className="font-medium">${d.remaining?.toFixed(2)}</span></p>
                                  <p className="text-orange-500 dark:text-orange-400">Redeemed: <span className="font-medium">${d.redeemed?.toFixed(2)}</span></p>
                                  <p className="text-muted-foreground mt-1">{d.category}</p>
                                </div>
                              </div>
                            )
                          }}
                        />
                      </Treemap>
                    </ResponsiveContainer>
                    <div className="flex flex-wrap gap-4 mt-3 justify-center">
                      {Object.entries(CATEGORY_RAW).map(([c, color]) => (
                        <div key={c} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                          {c}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Table section */}
              <div className="mx-4 mb-4 border border-border rounded-[8px] overflow-x-auto">

              {/* Toolbar */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card">
                <div className="relative flex-1 max-w-xs">
                  <HugeiconsIcon
                    icon={Search01Icon}
                    strokeWidth={1.5}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none"
                  />
                  <input
                    type="text"
                    placeholder="Search stores…"
                    value={searchQuery}
                    onChange={e => { setSearchQuery(e.target.value); setPage(1) }}
                    className="w-full pl-8 pr-3 py-1.5 bg-background border border-border rounded-[6px] text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <Select value={activeCategory} onValueChange={handleCategoryChange}>
                    <SelectTrigger size="sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-xs text-muted-foreground ml-auto">
                  {filteredStores.length} store{filteredStores.length !== 1 ? "s" : ""}
                </p>
              </div>

              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="text-xs font-medium text-muted-foreground py-3">Store</TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground py-3 text-right">Cards</TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground py-3 text-right">Remaining Balance</TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground py-3 text-right">Amount Spent</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedStores.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-sm text-muted-foreground py-10">
                        No stores match your search.
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedStores.map(row => (
                      <TableRow key={row.store} className="hover:bg-muted/50 border-border">
                        <TableCell className="py-3">
                          <p className="text-sm font-medium text-foreground">{row.store}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{row.category}</p>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground py-3 text-right align-middle">{row.count}</TableCell>
                        <TableCell className="text-sm font-medium text-green-600 py-3 text-right align-middle">
                          ${row.remaining.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-sm text-orange-500 py-3 text-right align-middle">
                          ${row.redeemed.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {/* Pagination footer */}
              <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-t border-border bg-card">
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
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}