"use client"

import * as React from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import useSWR from "swr"
import { fetcher } from "@/lib/fetcher"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Search01Icon,
  ArrowDown01Icon,
  ArrowUp01Icon,
  Sorting01Icon,
  ArrowLeft01Icon,
  ArrowLeftDoubleIcon,
  ArrowRight01Icon,
  ArrowRightDoubleIcon,
  ViewIcon,
  Edit01Icon,
  Delete01Icon,
  UndoIcon,
  MoreVerticalIcon,
} from "@hugeicons/core-free-icons"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter,
} from "@/components/ui/table"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuCheckboxItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogMedia } from "@/components/ui/alert-dialog"
import { toast } from "sonner"

// ── Helpers ──────────────────────────────────────────────────────────

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

function formatDate(iso: string) {
  return formatShortDateTime(iso)
}

function formatDateTime(iso: string) {
  return formatShortDateTime(iso)
}

function getActionBadge(action: string) {
  switch (action) {
    case "CREATE":
      return <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 font-medium text-xs">Created</Badge>
    case "UPDATE":
      return <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 font-medium text-xs">Updated</Badge>
    case "DELETE":
      return <Badge variant="secondary" className="bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/10 font-medium text-xs">Deleted</Badge>
    default:
      return <Badge variant="secondary" className="bg-muted text-muted-foreground font-medium text-xs">{action}</Badge>
  }
}

function formatDetails(details: any): string {
  if (!details) return "—"
  if (details.description) return details.description
  const parts: string[] = []
  if (details.storeName) parts.push(details.storeName)
  if (details.lastFourDigits) parts.push("****" + details.lastFourDigits)
  if (details.type === "SPEND") parts.push("Spend")
  if (details.type === "DONATION_OUT") parts.push("Donation")
  if (details.amount) parts.push("$" + Number(details.amount).toFixed(2))
  if (details.initialAmount && !details.amount) parts.push("$" + Number(details.initialAmount).toFixed(2))
  if (details.invitedEmail) parts.push("Invited: " + details.invitedEmail)
  if (details.assignedRole) parts.push("Role: " + details.assignedRole)
  if (details.deletedUserName) parts.push("Removed: " + details.deletedUserName)
  if (details.deletedUserRole) parts.push("(" + details.deletedUserRole + ")")
  if (details.recipientName) parts.push("To: " + details.recipientName)
  if (details.volunteerName) parts.push("By: " + details.volunteerName)
  if (details.name) parts.push(details.name)
  if (details.category) parts.push(details.category)
  if (details.after?.role && details.before?.role && details.after.role !== details.before.role) {
    parts.push(details.before.role + " → " + details.after.role)
  }
  if (details.targetUserName && !details.deletedUserName && !details.invitedEmail) {
    parts.push(details.targetUserName)
  }
  return parts.length > 0 ? parts.join(" · ") : "—"
}

// ── Sort Icon ──────────────────────────────────────────────────────

function SortIcon({ field, sortField, sortDirection }: {
  field: string; sortField: string | null; sortDirection: "asc" | "desc"
}) {
  if (sortField !== field) return <HugeiconsIcon icon={Sorting01Icon} strokeWidth={2} className="ml-1 size-3.5 text-muted-foreground/50" />
  if (sortDirection === "asc") return <HugeiconsIcon icon={ArrowUp01Icon} strokeWidth={2} className="ml-1 size-3.5 text-foreground" />
  return <HugeiconsIcon icon={ArrowDown01Icon} strokeWidth={2} className="ml-1 size-3.5 text-foreground" />
}

// ── Generic Table Component ─────────────────────────────────────────

interface Column {
  key: string
  label: string
  sortable?: boolean
  render?: (row: any) => React.ReactNode
}

interface LogTableProps {
  onDeleteSelected?: (selectedIds: string[], selectedItems: any[]) => Promise<void> | void
  actionType?: "delete" | "restore"
  data: any[]
  loading: boolean
  columns: Column[]
  emptyMessage: string
  searchPlaceholder?: string
  title?: string
  subtitle?: string
  showTotals?: boolean
}

function LogTable({ data, loading, columns, emptyMessage, searchPlaceholder, title, subtitle, onDeleteSelected, actionType = "delete", showTotals = false }: LogTableProps) {
  const [selectedRows, setSelectedRows] = React.useState<string[]>([])
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = React.useState(false)
  const [bulkDeleting, setBulkDeleting] = React.useState(false)
  const [selectedStores, setSelectedStores] = React.useState<string[]>([])
  const [selectedCategories, setSelectedCategories] = React.useState<string[]>([])
  const [storeSearch, setStoreSearch] = React.useState("")
  const [categorySearch, setCategorySearch] = React.useState("")
  const [searchQuery, setSearchQuery] = React.useState("")
  const [sortField, setSortField] = React.useState<string | null>(null)
  const [sortDirection, setSortDirection] = React.useState<"asc" | "desc">("asc")
  const [pageSize, setPageSize] = React.useState(10)
  const [pageIndex, setPageIndex] = React.useState(0)
  const [visibleColumns, setVisibleColumns] = React.useState<Record<string, boolean>>(
    Object.fromEntries(columns.map(c => [c.key, true]))
  )

  const uniqueStores = React.useMemo(() => {
    const set = new Set<string>()
    for (const r of data) {
      const s = r.giftCard?.store?.name || r.store?.name || (typeof r.store === "string" ? r.store : null) || r.details?.storeName || r.storeName
      if (s && typeof s === "string") set.add(s)
    }
    return Array.from(set).sort()
  }, [data])

  const filteredStoreFilterOptions = React.useMemo(() => {
    const q = storeSearch.trim().toLowerCase()
    if (!q) return uniqueStores
    return uniqueStores.filter(s => s.toLowerCase().includes(q))
  }, [uniqueStores, storeSearch])

  const uniqueCategories = React.useMemo(() => {
    const set = new Set<string>()
    for (const r of data) {
      const c = r.giftCard?.store?.category || r.store?.category || r.category
      if (c && typeof c === "string") set.add(c)
    }
    return Array.from(set).sort()
  }, [data])

  const filteredCategoryFilterOptions = React.useMemo(() => {
    const q = categorySearch.trim().toLowerCase()
    if (!q) return uniqueCategories
    return uniqueCategories.filter(c => c.toLowerCase().includes(q))
  }, [uniqueCategories, categorySearch])

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

  const filteredData = React.useMemo(() => {
    let fd = [...data]
    if (selectedStores.length > 0) {
      fd = fd.filter(r => {
        const s = r.giftCard?.store?.name || r.store?.name || (typeof r.store === "string" ? r.store : null) || r.details?.storeName || r.storeName
        return s && selectedStores.includes(s)
      })
    }
    if (selectedCategories.length > 0) {
      fd = fd.filter(r => {
        const c = r.giftCard?.store?.category || r.store?.category || r.category
        return c && selectedCategories.includes(c)
      })
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase().trim()
      fd = fd.filter(row => {
        const storeName = row.giftCard?.store?.name || row.store?.name || (typeof row.store === "string" ? row.store : "") || row.details?.storeName || row.storeName || ""
        const category = row.giftCard?.store?.category || row.store?.category || row.category || row.details?.category || ""
        const lastFour = row.giftCard?.lastFourDigits || row.lastFourDigits || row.details?.lastFourDigits || ""
        const volunteer = row.volunteerName || row.details?.volunteerName || ""
        const recipient = row.recipientName || row.details?.recipientName || ""
        const notes = row.notes || row.details?.notes || row.details?.description || ""
        const amount = String(row.amount ?? row.initialAmount ?? row.details?.amount ?? "")
        const action = row.action || ""
        const entityType = row.entityType || ""
        const entityId = row.entityId || ""
        const performedBy = row.performedByName || row.details?.performedByName || ""
        const role = row.assignedRole || row.deletedUserRole || row.role || ""
        const email = row.invitedEmail || row.email || ""
        const targetUser = row.targetUserName || row.deletedUserName || row.name || ""
        const date = row.createdAt ? formatDate(row.createdAt) + " " + formatDateTime(row.createdAt) : ""
        const formattedDet = formatDetails(row.details)

        const strPool = [
          storeName, category, lastFour, volunteer, recipient, notes, amount,
          action, entityType, entityId, performedBy, role, email, targetUser, date, formattedDet,
          row.type === "SPEND" ? "spend" : "",
          row.type === "DONATION_OUT" ? "donation" : "",
        ].join(" ").toLowerCase()

        if (strPool.includes(q)) return true

        return columns.some(col => {
          const val = row[col.key]
          if (typeof val === "string") return val.toLowerCase().includes(q)
          if (typeof val === "number") return String(val).includes(q)
          if (typeof val === "object" && val) return JSON.stringify(val).toLowerCase().includes(q)
          return false
        })
      })
    }
    if (sortField) {
      fd.sort((a, b) => {
        let va: any = a[sortField]
        let vb: any = b[sortField]

        if (sortField === "store") {
          va = a.giftCard?.store?.name || a.store?.name || a.storeName || ""
          vb = b.giftCard?.store?.name || b.store?.name || b.storeName || ""
        } else if (sortField === "lastFour") {
          va = a.giftCard?.lastFourDigits || a.lastFourDigits || ""
          vb = b.giftCard?.lastFourDigits || b.lastFourDigits || ""
        } else if (sortField === "amount") {
          va = Number(a.amount || 0)
          vb = Number(b.amount || 0)
          return sortDirection === "asc" ? va - vb : vb - va
        } else if (sortField === "createdAt") {
          va = new Date(a.createdAt || 0).getTime()
          vb = new Date(b.createdAt || 0).getTime()
          return sortDirection === "asc" ? va - vb : vb - va
        } else if (sortField === "volunteerName" || sortField === "recipientName" || sortField === "action" || sortField === "performedByName") {
          va = String(a[sortField] || "")
          vb = String(b[sortField] || "")
        }

        const cmp = String(va ?? "").localeCompare(String(vb ?? ""))
        return sortDirection === "asc" ? cmp : -cmp
      })
    }
    return fd
  }, [data, selectedStores, selectedCategories, searchQuery, sortField, sortDirection, columns])

  React.useEffect(() => { setPageIndex(0); setSelectedRows([]) }, [searchQuery, selectedStores, selectedCategories, pageSize, data])

  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize))
  const paginatedData = filteredData.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize)

  const selectedItems = React.useMemo(() => {
    return data.filter((r, i) => selectedRows.includes(r.id || `row-${i}`))
  }, [data, selectedRows])

  function getItemLabel(item: any) {
    if (item.type === "DONATION_OUT" || item.type === "SPEND") {
      const typeStr = item.type === "DONATION_OUT" ? "Donation" : "Spend"
      const store = item.giftCard?.store?.name || item.storeName || "Card"
      const last4 = item.giftCard?.lastFourDigits ? `(•••• ${item.giftCard.lastFourDigits})` : ""
      const amt = `${Number(item.amount || 0).toFixed(2)}`
      return `${typeStr}: ${store} ${last4} — ${amt}`
    }
    if (item.action && item.entityType) {
      return `${item.action} on ${item.entityType} by ${item.performedByName || 'System'}`
    }
    if (item.store?.name && item.lastFourDigits) {
      return `${item.store.name} (•••• ${item.lastFourDigits}) — Balance: ${Number(item.remainingAmount || 0).toFixed(2)}`
    }
    return item.name || item.title || item.id || "Record"
  }

  async function handleBulkDelete() {
    if (selectedRows.length === 0) return
    setBulkDeleting(true)
    try {
      if (onDeleteSelected) {
        await onDeleteSelected(selectedRows, selectedItems)
      } else {
        await Promise.all(
          selectedRows.map(id => fetch(`/api/transactions/${id}`, { method: "DELETE" }))
        )
        toast.success(`Deleted ${selectedRows.length} record${selectedRows.length > 1 ? "s" : ""}`)
      }
      setSelectedRows([])
      setShowBulkDeleteDialog(false)
    } catch (e) {
      toast.error("Failed to delete selected records")
    } finally {
      setBulkDeleting(false)
    }
  }

  const activeColumns = columns.filter(c => visibleColumns[c.key])

  return (
    <div className="bg-card border border-border rounded-[12px] overflow-hidden">
      {/* Toolbar & Header */}
      <div className="px-6 py-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-semibold text-foreground">{title}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="rounded-full text-xs font-medium text-muted-foreground px-2.5 py-0.5 border-border bg-muted/40">{filteredData.length} of {data.length} records</Badge>
          </div>
        </div>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          {/* Left: Store & Category Filters */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Multi-select Store Filter (if available) */}
            {uniqueStores.length > 0 && (
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
            )}

            {/* Multi-select Category Filter (if available) */}
            {uniqueCategories.length > 0 && (
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

          {/* Middle: Search Input */}
          <div className="relative">
            <HugeiconsIcon
              icon={Search01Icon}
              strokeWidth={1.5}
              className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              placeholder="Search table"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-8 h-8 text-sm rounded-[6px] w-80 sm:w-96 md:w-[420px]"
            />
          </div>

          {/* Right: Actions (Bulk Action Button + Columns) */}
          <div className="flex items-center gap-3 flex-wrap justify-end">
            <Button
              variant={actionType === "restore" ? "outline" : "destructive"}
              size="sm"
              disabled={selectedRows.length === 0}
              onClick={() => setShowBulkDeleteDialog(true)}
              className={
                actionType === "restore"
                  ? "h-8 min-w-[136px] rounded-[6px] text-xs font-medium gap-1.5 border-border bg-card hover:bg-muted text-foreground disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer justify-center shadow-xs"
                  : "h-8 min-w-[136px] rounded-[6px] text-xs font-medium gap-1.5 bg-red-600 text-white hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer justify-center"
              }
            >
              <HugeiconsIcon icon={actionType === "restore" ? UndoIcon : Delete01Icon} strokeWidth={2} className="size-3.5" />
              {actionType === "restore" ? "Restore Selected" : "Delete Selected"}
            </Button>

            {/* Columns Visibility */}
            <DropdownMenu>
              <DropdownMenuTrigger render={
                <Button variant="outline" size="sm" className="h-8 text-xs gap-1 cursor-pointer border-border bg-card hover:bg-muted">
                  <HugeiconsIcon icon={ViewIcon} strokeWidth={2} className="size-3.5" />
                  Columns
                </Button>
              } />
              <DropdownMenuContent align="end">
                {columns.map(col => (
                  <DropdownMenuCheckboxItem
                    key={col.key}
                    checked={visibleColumns[col.key]}
                    onCheckedChange={checked => setVisibleColumns(prev => ({ ...prev, [col.key]: !!checked }))}
                  >
                    {col.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-background">
        <Table className="bg-background">
          <TableHeader className="bg-muted/50 dark:bg-sidebar">
            <TableRow className="bg-muted/50 dark:bg-sidebar hover:bg-muted/50 dark:hover:bg-sidebar border-border">
              <TableHead className="w-12 pl-6 py-3">
                <Checkbox
                  checked={selectedRows.length === paginatedData.length && paginatedData.length > 0}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedRows(paginatedData.map((r, i) => r.id || `row-${i}`))
                    } else {
                      setSelectedRows([])
                    }
                  }}
                />
              </TableHead>
              {activeColumns.map(col => (
                <TableHead
                  key={col.key}
                  className={`text-xs font-medium text-muted-foreground py-3 ${col.sortable ? "cursor-pointer select-none" : ""} ${col.key === "actions" ? "text-right pr-6" : ""}`}
                  onClick={col.sortable ? () => handleSort(col.key) : undefined}
                >
                  <div className={`flex items-center ${col.key === "actions" ? "justify-end" : ""}`}>
                    {col.label}
                    {col.sortable && <SortIcon field={col.key} sortField={sortField} sortDirection={sortDirection} />}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <TableRow key={idx} className="border-border">
                  <TableCell className="py-3 pl-6 w-12">
                    <Skeleton className="h-4 w-4 rounded-sm" />
                  </TableCell>
                  {activeColumns.map(col => (
                    <TableCell key={col.key} className="py-3">
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : paginatedData.length > 0 ? (
              paginatedData.map((row, i) => {
                const rowKey = row.id || `row-${i}`
                return (
                  <TableRow key={rowKey} className="border-border hover:bg-muted/50">
                    <TableCell className="py-3 pl-6 align-middle w-12" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedRows.includes(rowKey)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedRows(prev => [...prev, rowKey])
                          } else {
                            setSelectedRows(prev => prev.filter(id => id !== rowKey))
                          }
                        }}
                      />
                    </TableCell>
                    {activeColumns.map(col => (
                      <TableCell key={col.key} className={`text-sm py-3 ${col.key === "actions" ? "text-right pr-6" : ""}`}>
                        {col.render ? col.render(row) : (row[col.key] ?? "—")}
                      </TableCell>
                    ))}
                  </TableRow>
                )
              })
            ) : (
              <TableRow>
                <TableCell colSpan={activeColumns.length + 1} className="h-24 text-center text-muted-foreground text-sm">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          {showTotals && !loading && filteredData.length > 0 && (
            <TableFooter className="bg-muted/50 dark:bg-sidebar">
              <TableRow className="bg-muted/50 dark:bg-sidebar hover:bg-muted/50 dark:hover:bg-sidebar border-border">
                <TableCell className="w-12 pl-6 py-3"></TableCell>
                {activeColumns.map(col => {
                  if (col.key === "lastFour") {
                    return <TableCell key={col.key} className="py-3 font-semibold text-foreground">Total</TableCell>
                  }
                  if (col.key === "amount") {
                    const totalAmt = selectedRows.length > 0 
                      ? filteredData.filter((r, i) => selectedRows.includes(r.id || `row-${i}`)).reduce((s, r) => s + Number(r.amount || 0), 0)
                      : filteredData.reduce((s, r) => s + Number(r.amount || 0), 0);
                    return <TableCell key={col.key} className="py-3 font-semibold text-foreground tabular-nums">${totalAmt.toFixed(2)}</TableCell>
                  }
                  return <TableCell key={col.key} className="py-3"></TableCell>
                })}
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </div>

      {/* Destructive Bulk Delete Alert Dialog */}
      <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogMedia className={actionType === "restore" ? "bg-muted text-foreground" : "bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive"}>
              <HugeiconsIcon icon={actionType === "restore" ? UndoIcon : Delete01Icon} strokeWidth={2} className="size-6" />
            </AlertDialogMedia>
            <AlertDialogTitle>
              {actionType === "restore"
                ? `Restore ${selectedRows.length} selected record${selectedRows.length > 1 ? "s" : ""} & balance${selectedRows.length > 1 ? "s" : "" }?`
                : `Delete ${selectedRows.length} selected record${selectedRows.length > 1 ? "s" : ""}?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === "restore"
                ? `This will delete the following selected record${selectedRows.length > 1 ? "s" : ""} and restore the balance back to the respective gift card${selectedRows.length > 1 ? "s" : ""}. This action cannot be undone:`
                : `This will permanently delete the following selected record${selectedRows.length > 1 ? "s" : ""}. This action cannot be undone:`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <ul className="my-2 max-h-48 overflow-y-auto space-y-1.5 text-xs text-foreground/90 list-disc list-inside p-2.5 rounded-lg bg-muted/40 border border-border">
            {selectedItems.map((item, idx) => (
              <li key={item.id || idx} className="truncate">
                {getItemLabel(item)}
              </li>
            ))}
          </ul>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-[6px]" disabled={bulkDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant={actionType === "restore" ? "default" : "destructive"}
              onClick={handleBulkDelete}
              disabled={bulkDeleting}
              className={actionType === "restore" ? "rounded-[6px]" : "rounded-[6px] bg-destructive text-destructive-foreground hover:bg-destructive/90"}
            >
              {bulkDeleting
                ? (actionType === "restore" ? "Restoring…" : "Deleting…")
                : (actionType === "restore" ? "Restore Selected" : "Delete Selected")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Footer / Pagination */}
      <div className="px-6 py-3 border-t border-border flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Showing {paginatedData.length} of {filteredData.length} entries
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
  )
}

// ── Main Page ─────────────────────────────────────────────────────

export default function SystemLogsPage() {
  const [activeTab, setActiveTab] = React.useState("donations")

  // View Details Modal State
  const [viewingTx, setViewingTx] = React.useState<any | null>(null)
  const [showViewTxDialog, setShowViewTxDialog] = React.useState(false)

  // Delete Alert Modal State
  const [txToDelete, setTxToDelete] = React.useState<any | null>(null)
  const [showDeleteTxDialog, setShowDeleteTxDialog] = React.useState(false)
  const [deletingTx, setDeletingTx] = React.useState(false)

  // Fetch user role
  const { data: userData } = useSWR<any>("/api/admin/users", fetcher, {
    onError: () => {}, // Silently fail for non-admins
  })
  const currentUserRole = userData?.currentUserRole || ""
  const isSuperOrYU = currentUserRole === "SUPER_ADMIN" || currentUserRole === "YUBLUEPRINT"

  // Fetch transaction data
  const { data: donationData, error: donErr, mutate: mutateDonations } = useSWR<any[]>("/api/transactions?type=DONATION_OUT", fetcher)
  const donationLoading = !donationData && !donErr
  const donations = Array.isArray(donationData) ? donationData : []

  const { data: spendData, error: spendErr, mutate: mutateSpends } = useSWR<any[]>("/api/transactions?type=SPEND", fetcher)
  const spendLoading = !spendData && !spendErr
  const spends = Array.isArray(spendData) ? spendData : []

  // Fetch audit logs
  const { data: giftCardLogs, error: gcErr, mutate: mutateGiftCardLogs } = useSWR<any[]>("/api/audit-logs?entityType=GIFT_CARD", fetcher)
  const gcLoading = !giftCardLogs && !gcErr
  const giftCardAudit = Array.isArray(giftCardLogs) ? giftCardLogs : []

  const { data: userLogs, error: userErr, mutate: mutateUserLogs } = useSWR<any[]>(
    isSuperOrYU ? "/api/audit-logs?entityType=USER" : null, fetcher
  )
  const userLoading = !userLogs && !userErr && isSuperOrYU
  const userAudit = Array.isArray(userLogs) ? userLogs : []

  const { data: storeLogs, error: storeErr, mutate: mutateStoreLogs } = useSWR<any[]>("/api/audit-logs?entityType=STORE", fetcher)
  const storeLoading = !storeLogs && !storeErr
  const storeAudit = Array.isArray(storeLogs) ? storeLogs : []

  // Tab counts
  const donationCount = donations.length
  const spendCount = spends.length
  const gcCount = giftCardAudit.length
  const userCount = userAudit.length
  const storeCount = storeAudit.length

  // Delete transaction handler
  async function handleDeleteTransaction() {
    if (!txToDelete) return
    setDeletingTx(true)
    try {
      const res = await fetch(`/api/transactions/${txToDelete.id}`, {
        method: "DELETE",
      })
      if (res.ok) {
        toast.success("Transaction restored and card balance updated")
        setShowDeleteTxDialog(false)
        setTxToDelete(null)
        mutateDonations()
        mutateSpends()
      } else {
        toast.error("Failed to delete transaction")
      }
    } catch (e) {
      toast.error("An error occurred while deleting")
    } finally {
      setDeletingTx(false)
    }
  }

  // Column definitions with Action column for Donations and Spends
  const donationColumns: Column[] = [
    { key: "createdAt", label: "Date/Time", sortable: true, render: (r) => <span className="text-muted-foreground whitespace-nowrap">{formatShortDateTime(r.createdAt)}</span> },
    { key: "store", label: "Store", sortable: true, render: (r) => <span className="font-medium">{r.giftCard?.store?.name ?? "Unknown"}</span> },
    { key: "lastFour", label: "Card", render: (r) => <span className="text-muted-foreground font-mono">****{r.giftCard?.lastFourDigits ?? "—"}</span> },
    { key: "amount", label: "Amount", sortable: true, render: (r) => <span className="tabular-nums font-medium">${Number(r.amount).toFixed(2)}</span> },
    { key: "volunteerName", label: "Volunteer", sortable: true, render: (r) => <span className="text-muted-foreground">{r.volunteerName ?? "—"}</span> },
    { key: "recipientName", label: "Recipient", sortable: true, render: (r) => <span className="text-muted-foreground">{r.recipientName ?? "—"}</span> },
    {
      key: "actions",
      label: "Action",
      render: (r) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer"
            onClick={() => {
              setViewingTx(r)
              setShowViewTxDialog(true)
            }}
            title="View Details"
          >
            <HugeiconsIcon icon={ViewIcon} strokeWidth={2} className="size-4" />
            <span className="sr-only">View details</span>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer"
            onClick={() => {
              setTxToDelete(r)
              setShowDeleteTxDialog(true)
            }}
            title="Restore Record"
          >
            <HugeiconsIcon icon={UndoIcon} strokeWidth={2} className="size-4" />
            <span className="sr-only">Restore record</span>
          </Button>
        </div>
      ),
    },
  ]

  const spendColumns: Column[] = [
    { key: "createdAt", label: "Date/Time", sortable: true, render: (r) => <span className="text-muted-foreground whitespace-nowrap">{formatShortDateTime(r.createdAt)}</span> },
    { key: "store", label: "Store", sortable: true, render: (r) => <span className="font-medium">{r.giftCard?.store?.name ?? "Unknown"}</span> },
    { key: "lastFour", label: "Card", render: (r) => <span className="text-muted-foreground font-mono">****{r.giftCard?.lastFourDigits ?? "—"}</span> },
    { key: "amount", label: "Amount", sortable: true, render: (r) => <span className="tabular-nums font-medium">${Number(r.amount).toFixed(2)}</span> },
    { key: "volunteerName", label: "Volunteer", sortable: true, render: (r) => <span className="text-muted-foreground">{r.volunteerName ?? "—"}</span> },
    { key: "recipientName", label: "Recipient", sortable: true, render: (r) => <span className="text-muted-foreground">{r.recipientName ?? "—"}</span> },
    {
      key: "actions",
      label: "Action",
      render: (r) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer"
            onClick={() => {
              setViewingTx(r)
              setShowViewTxDialog(true)
            }}
            title="View Details"
          >
            <HugeiconsIcon icon={ViewIcon} strokeWidth={2} className="size-4" />
            <span className="sr-only">View details</span>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer"
            onClick={() => {
              setTxToDelete(r)
              setShowDeleteTxDialog(true)
            }}
            title="Restore Record"
          >
            <HugeiconsIcon icon={UndoIcon} strokeWidth={2} className="size-4" />
            <span className="sr-only">Restore record</span>
          </Button>
        </div>
      ),
    },
  ]

  const giftCardAuditColumns: Column[] = [
    { key: "createdAt", label: "Date/Time", sortable: true, render: (r) => <span className="text-muted-foreground whitespace-nowrap">{formatShortDateTime(r.createdAt)}</span> },
    { key: "action", label: "Action", sortable: true, render: (r) => getActionBadge(r.action) },
    { key: "entityId", label: "Card ID", render: (r) => <span className="text-muted-foreground font-mono text-xs truncate max-w-[100px] inline-block">{r.entityId?.slice(0, 8) ?? "—"}</span> },
    { key: "performedByName", label: "Performed By", sortable: true, render: (r) => <span className="text-muted-foreground">{r.performedByName ?? "System"}</span> },
    { key: "details", label: "Details", render: (r) => <span className="text-muted-foreground text-xs">{formatDetails(r.details)}</span> },
  ]

  const userAuditColumns: Column[] = [
    { key: "createdAt", label: "Date/Time", sortable: true, render: (r) => <span className="text-muted-foreground whitespace-nowrap">{formatShortDateTime(r.createdAt)}</span> },
    { key: "action", label: "Action", sortable: true, render: (r) => getActionBadge(r.action) },
    { key: "performedByName", label: "Performed By", sortable: true, render: (r) => <span className="text-muted-foreground">{r.performedByName ?? "System"}</span> },
    { key: "details", label: "Details", render: (r) => <span className="text-muted-foreground text-xs">{formatDetails(r.details)}</span> },
  ]

  const storeAuditColumns: Column[] = [
    { key: "createdAt", label: "Date/Time", sortable: true, render: (r) => <span className="text-muted-foreground whitespace-nowrap">{formatShortDateTime(r.createdAt)}</span> },
    { key: "action", label: "Action", sortable: true, render: (r) => getActionBadge(r.action) },
    { key: "performedByName", label: "Performed By", sortable: true, render: (r) => <span className="text-muted-foreground">{r.performedByName ?? "System"}</span> },
    { key: "details", label: "Details", render: (r) => <span className="text-muted-foreground text-xs">{formatDetails(r.details)}</span> },
  ]

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader title="System Logs" />

        <div className="flex flex-1 flex-col overflow-auto">
          <div className="flex flex-col gap-6 p-4 sm:p-6">

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="bg-muted rounded-lg p-1 h-auto flex-wrap">
                <TabsTrigger value="donations" className="rounded-md text-xs px-3 py-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm cursor-pointer">
                  Donations
                  <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5 py-0 h-4 bg-muted-foreground/10">{donationCount}</Badge>
                </TabsTrigger>
                <TabsTrigger value="spends" className="rounded-md text-xs px-3 py-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm cursor-pointer">
                  Spends
                  <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5 py-0 h-4 bg-muted-foreground/10">{spendCount}</Badge>
                </TabsTrigger>
                <TabsTrigger value="giftcards" className="rounded-md text-xs px-3 py-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm cursor-pointer">
                  Gift Cards
                  <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5 py-0 h-4 bg-muted-foreground/10">{gcCount}</Badge>
                </TabsTrigger>
                <TabsTrigger value="stores" className="rounded-md text-xs px-3 py-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm cursor-pointer">
                  Stores
                  <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5 py-0 h-4 bg-muted-foreground/10">{storeCount}</Badge>
                </TabsTrigger>
                {isSuperOrYU && (
                  <TabsTrigger value="users" className="rounded-md text-xs px-3 py-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm cursor-pointer">
                    User Activity
                    <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5 py-0 h-4 bg-muted-foreground/10">{userCount}</Badge>
                  </TabsTrigger>
                )}
              </TabsList>
            </Tabs>

            {/* Tab Content */}
            {activeTab === "donations" && (
              <LogTable
                data={donations}
                loading={donationLoading}
                columns={donationColumns}
                emptyMessage="No donation records found."
                searchPlaceholder="Search by store, volunteer, recipient..."
                title="Donation Log"
                subtitle="History of all gift cards given out"
                actionType="restore"
                showTotals={true}
                onDeleteSelected={async (ids) => {
                  const res = await Promise.all(ids.map(id => fetch(`/api/transactions/${id}`, { method: "DELETE" })));
                  if (res.every(r => r.ok)) {
                    toast.success(`Restored ${ids.length} donation record${ids.length > 1 ? "s" : ""} and updated card balance(s)`);
                  } else {
                    toast.error("Some donation records could not be restored");
                  }
                  mutateDonations();
                  mutateSpends();
                }}
              />
            )}

            {activeTab === "spends" && (
              <LogTable
                data={spends}
                loading={spendLoading}
                columns={spendColumns}
                emptyMessage="No spend records found."
                searchPlaceholder="Search by store, volunteer..."
                title="Spend Log"
                subtitle="History of all purchases made on gift cards"
                actionType="restore"
                showTotals={true}
                onDeleteSelected={async (ids) => {
                  const res = await Promise.all(ids.map(id => fetch(`/api/transactions/${id}`, { method: "DELETE" })));
                  if (res.every(r => r.ok)) {
                    toast.success(`Restored ${ids.length} spend record${ids.length > 1 ? "s" : ""} and updated card balance(s)`);
                  } else {
                    toast.error("Some spend records could not be restored");
                  }
                  mutateDonations();
                  mutateSpends();
                }}
              />
            )}

            {activeTab === "giftcards" && (
              <LogTable
                data={giftCardAudit}
                loading={gcLoading}
                columns={giftCardAuditColumns}
                emptyMessage="No gift card activity logged yet."
                searchPlaceholder="Search by name or card ID..."
                title="Gift Card Activity"
                subtitle="Audit log of additions, edits, and deletions"
                onDeleteSelected={async (ids) => {
                  const res = await fetch("/api/audit-logs", {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ ids }),
                  });
                  if (res.ok) {
                    toast.success(`Deleted ${ids.length} audit record${ids.length > 1 ? "s" : ""}`);
                    mutateGiftCardLogs();
                  } else {
                    toast.error("Failed to delete audit records");
                  }
                }}
              />
            )}

            {activeTab === "stores" && (
              <LogTable
                data={storeAudit}
                loading={storeLoading}
                columns={storeAuditColumns}
                emptyMessage="No store activity logged yet."
                searchPlaceholder="Search by name..."
                title="Store Activity"
                subtitle="Audit log of new stores added"
                onDeleteSelected={async (ids) => {
                  const res = await fetch("/api/audit-logs", {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ ids }),
                  });
                  if (res.ok) {
                    toast.success(`Deleted ${ids.length} store audit record${ids.length > 1 ? "s" : ""}`);
                    mutateStoreLogs();
                  } else {
                    toast.error("Failed to delete store audit records");
                  }
                }}
              />
            )}

            {activeTab === "users" && isSuperOrYU && (
              <LogTable
                data={userAudit}
                loading={userLoading}
                columns={userAuditColumns}
                emptyMessage="No user activity logged yet."
                searchPlaceholder="Search by name or email..."
                title="User Activity"
                subtitle="Audit log of user invites and edits"
                onDeleteSelected={async (ids) => {
                  const res = await fetch("/api/audit-logs", {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ ids }),
                  });
                  if (res.ok) {
                    toast.success(`Deleted ${ids.length} user audit record${ids.length > 1 ? "s" : ""}`);
                    mutateUserLogs();
                  } else {
                    toast.error("Failed to delete user audit records");
                  }
                }}
              />
            )}
          </div>
        </div>
      </SidebarInset>

      {/* View Transaction Details Dialog */}
      <Dialog open={showViewTxDialog} onOpenChange={setShowViewTxDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Transaction Details</DialogTitle>
            <DialogDescription>
              Complete record metadata and donation/spend details.
            </DialogDescription>
          </DialogHeader>
          {viewingTx && (
            <div className="py-2 space-y-4">
              <div className="flex items-center gap-3.5 p-3 rounded-lg border border-border bg-muted/40">
                <div className="flex size-12 items-center justify-center rounded-lg border border-border bg-background text-base font-semibold text-foreground">
                  {viewingTx.giftCard?.store?.name ? viewingTx.giftCard.store.name.slice(0, 2).toUpperCase() : "GC"}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-foreground truncate">{viewingTx.giftCard?.store?.name || "Unknown Store"}</h3>
                  <p className="text-xs text-muted-foreground font-mono">•••• {viewingTx.giftCard?.lastFourDigits || "—"}</p>
                </div>
                <Badge
                  variant="secondary"
                  className={`font-medium text-xs ${
                    viewingTx.type === "DONATION_OUT"
                      ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                      : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  }`}
                >
                  {viewingTx.type === "DONATION_OUT" ? "Donation" : "Spend"}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 rounded-md border border-border bg-card">
                  <span className="text-muted-foreground block mb-1">Amount</span>
                  <span className="text-foreground font-semibold text-sm">${Number(viewingTx.amount).toFixed(2)}</span>
                </div>
                <div className="p-2.5 rounded-md border border-border bg-card">
                  <span className="text-muted-foreground block mb-1">Volunteer</span>
                  <span className="text-foreground font-medium">{viewingTx.volunteerName || "—"}</span>
                </div>
                {viewingTx.type === "DONATION_OUT" && (
                  <div className="p-2.5 rounded-md border border-border bg-card col-span-2">
                    <span className="text-muted-foreground block mb-1">Recipient</span>
                    <span className="text-foreground font-medium">{viewingTx.recipientName || "—"}</span>
                  </div>
                )}
                <div className="p-2.5 rounded-md border border-border bg-card col-span-2">
                  <span className="text-muted-foreground block mb-1">Date & Time</span>
                  <span className="text-foreground">{formatDateTime(viewingTx.createdAt)}</span>
                </div>
              </div>

              {/* Notes */}
              <div className="p-3 rounded-lg border border-border bg-card space-y-1">
                <span className="text-xs font-medium text-muted-foreground block">Notes</span>
                {viewingTx.notes ? (
                  <p className="text-xs text-foreground whitespace-pre-wrap leading-relaxed">
                    {viewingTx.notes}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground italic">No notes recorded for this transaction.</p>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setShowViewTxDialog(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Destructive Restore Transaction Alert Dialog */}
      <AlertDialog open={showDeleteTxDialog} onOpenChange={setShowDeleteTxDialog}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-muted text-foreground">
              <HugeiconsIcon icon={UndoIcon} strokeWidth={2} className="size-6" />
            </AlertDialogMedia>
            <AlertDialogTitle>Restore transaction record?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the {txToDelete?.type === "SPEND" ? "spend" : "donation"} record of{" "}
              <strong className="text-foreground">${Number(txToDelete?.amount || 0).toFixed(2)}</strong> for{" "}
              <strong className="text-foreground">{txToDelete?.giftCard?.store?.name || "this store"} (•••• {txToDelete?.giftCard?.lastFourDigits || ""})</strong> and restore the amount back to the card&apos;s remaining balance. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-[6px]">Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="default"
              onClick={handleDeleteTransaction}
              disabled={deletingTx}
              className="rounded-[6px]"
            >
              {deletingTx ? "Restoring…" : "Restore Record"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarProvider>
  )
}
