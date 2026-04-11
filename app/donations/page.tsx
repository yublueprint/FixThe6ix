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
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft01Icon, ArrowLeftDoubleIcon, ArrowRight01Icon, ArrowRightDoubleIcon, ArrowDown01Icon, Search01Icon, TradeUpIcon } from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"
import donationsData from "./data.json"
import DonationsTable from "@/components/donations-table"

function formatFilterDate(iso: string) {
  if (!iso) return ""
  return new Date(`${iso}T12:00:00`).toLocaleDateString()
}

/**
 * Compact date filter styled like the donation log chips (border, slate fill, chevron).
 * Uses a visually hidden native `<input type="date">` for the real value and calendar UI;
 * the outer div is the click/keyboard target so we can show locale-formatted text in the shell.
 * The input stays offscreen (`sr-only`) with `aria-hidden` to avoid duplicate announcements—
 * screen readers use the wrapper’s `aria-label` instead.
 *
 * @param value - ISO date string `yyyy-mm-dd`, or empty when unset
 * @param onChange - Called with the next ISO date string when the user picks a date
 * @param placeholder - Visible label when empty (e.g. From / To)
 * @param ariaLabel - Short name for assistive tech, combined with the value or placeholder
 */
function FilterDateField({
  value,
  onChange,
  placeholder,
  ariaLabel,
}: {
  value: string
  onChange: (next: string) => void
  placeholder: string
  ariaLabel: string
}) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const hasValue = Boolean(value)

  /** Opens the browser date picker where supported; otherwise focuses the input so the user can pick. */
  function openPicker() {
    const el = inputRef.current
    if (!el) return
    try {
      el.showPicker()
    } catch {
      el.focus()
    }
  }

  const a11yLabel = hasValue
    ? `${ariaLabel}, ${formatFilterDate(value)}`
    : `${ariaLabel}, ${placeholder}`

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={a11yLabel}
      onClick={openPicker}
      onKeyDown={e => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          openPicker()
        }
      }}
      className={cn(
        "relative flex h-8 w-full cursor-pointer items-center gap-2 rounded-[6px] border border-[#E2E8F0] bg-[#F1F5F9] px-3 text-sm outline-none",
        "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
      )}
    >
      <input
        ref={inputRef}
        type="date"
        value={value}
        tabIndex={-1}
        aria-hidden
        onChange={e => onChange(e.target.value)}
        className="sr-only"
      />
      <span
        className={cn(
          "pointer-events-none min-w-0 flex-1 whitespace-nowrap tabular-nums truncate",
          hasValue ? "text-[#0a0a0a]" : "text-[#737373]",
        )}
        aria-hidden
      >
        {hasValue ? formatFilterDate(value) : placeholder}
      </span>
      <HugeiconsIcon
        icon={ArrowDown01Icon}
        strokeWidth={2}
        className="pointer-events-none relative z-0 size-4 shrink-0 text-[#737373]"
        aria-hidden
      />
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function DonationsPage() {
  const [filters, setFilters] = React.useState({
    startDate: "", endDate: "", store: "", recipient: "",
  })

  const uniqueStores = Array.from(new Set(donationsData.map(d => d.store))).sort()

  const filteredData = React.useMemo(() => {
    let data = [...donationsData]
    if (filters.startDate) data = data.filter(d => new Date(d.date) >= new Date(filters.startDate))
    if (filters.endDate)   data = data.filter(d => new Date(d.date) <= new Date(filters.endDate))
    if (filters.store)     data = data.filter(d => d.store === filters.store)
    if (filters.recipient) data = data.filter(d => d.recipient.toLowerCase().includes(filters.recipient.toLowerCase()))
    return data
  }, [filters])

  const totalCount = filteredData.length
  const totalValue = filteredData.reduce((sum, d) => sum + d.amount, 0)

  function exportToCSV() {
    const headers = ["Date", "Store", "Amount", "Volunteer", "Recipient", "Notes"]
    const rows = filteredData.map(d => [d.date, d.store, `$${d.amount}`, d.volunteer, d.recipient, d.notes || ""])
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(",")).join("\n")
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }))
    const a = Object.assign(document.createElement("a"), {
      href: url, download: `donations-${new Date().toISOString().split("T")[0]}.csv`,
    })
    a.click(); URL.revokeObjectURL(url)
  }

  const [currentPage, setCurrentPage] = React.useState(1);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);

  const paginatedData = filteredData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>

        {/* ── Header ── */}
        <div className="border-b h-12 flex items-center shrink-0">
          <div className="flex items-center gap-4 pl-5">
            <SidebarTrigger className="bg-white rounded-[6px] p-2 size-8 flex items-center justify-center" />
            <Separator orientation="vertical" className="h-4 bg-[#e5e5e5]" />
            <span className="font-medium text-[16px] text-[#0a0a0a]">Donations Given</span>
          </div>
        </div>

        <div className="flex flex-1 flex-col overflow-auto">
          <div className="flex flex-col gap-6 p-4 sm:p-6">

            {/* ── Stats row ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-[#F1F5F9] border border-[#E2E8F0] rounded-[16px] p-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-normal text-[#737373]">Total Cards Donated</p>
                  <span className="text-xs bg-[#bbf7d0] text-[#166534] px-2 py-0.5 rounded-full font-medium inline-flex items-center gap-1">
                    <HugeiconsIcon icon={TradeUpIcon} strokeWidth={2} className="size-3" />
                    +12
                  </span>
                </div>
                <p className="text-[30px] font-semibold text-[#404040] mt-1 leading-none">{totalCount}</p>
                <p className="text-sm text-[#737373] mt-2">Gift cards given to recipients</p>
              </div>
              <div className="bg-[#F1F5F9] border border-[#E2E8F0] rounded-[16px] p-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-normal text-[#737373]">Total Dollar Value</p>
                  <span className="text-xs bg-[#bbf7d0] text-[#166534] px-2 py-0.5 rounded-full font-medium inline-flex items-center gap-1">
                    <HugeiconsIcon icon={TradeUpIcon} strokeWidth={2} className="size-3" />
                    +12
                  </span>
                </div>
                <p className="text-[30px] font-semibold text-[#404040] mt-1 leading-none">
                  ${totalValue.toLocaleString()}
                </p>
                <p className="text-sm text-[#737373] mt-2">Total value distributed to community</p>
              </div>
            </div>

            {/* ── Donation Log card ── */}
            <div className="bg-white border border-[#e2e8f0] rounded-[12px] overflow-hidden">

              {/* Card header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#e2e8f0]">
                <div>
                  <p className="text-[16px] font-medium text-[#404040]">Donation Log</p>
                  <p className="text-[14px] text-[#737373] mt-0.5">Filter and export donation records</p>
                </div>
                <button
                  onClick={exportToCSV}
                  className="bg-[#0a0a0a] text-white text-sm font-medium px-4 py-2 rounded-[6px] flex items-center gap-2 hover:bg-[#262626] transition-colors"
                >
                  
                  Export CSV
                </button>
              </div>

              {/* Filters row — dates share row width (max 264) so narrow viewports don’t overflow; store min 134px, grows to max 240px */}
              <div className="px-4 sm:px-6 py-4 flex flex-wrap items-center gap-3 border-b border-[#e2e8f0]">
                <div className="flex min-w-0 w-full max-w-[264px] gap-2">
                  <div className="min-w-0 flex-1">
                    <FilterDateField
                      value={filters.startDate}
                      onChange={next => setFilters({ ...filters, startDate: next })}
                      placeholder="From"
                      ariaLabel="From date"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <FilterDateField
                      value={filters.endDate}
                      onChange={next => setFilters({ ...filters, endDate: next })}
                      placeholder="To"
                      ariaLabel="To date"
                    />
                  </div>
                </div>
                <div className="min-w-0 max-w-full shrink-0">
                  <Select value={filters.store} onValueChange={v => setFilters({ ...filters, store: v ?? "" })}>
                    <SelectTrigger
                      size="sm"
                      triggerIcon={ArrowDown01Icon}
                      title={filters.store || undefined}
                      className="min-w-[134px] w-max max-w-[240px] rounded-[6px] bg-[#F1F5F9] border border-[#E2E8F0]"
                    >
                      <SelectValue placeholder="All Stores" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Stores</SelectItem>
                      {uniqueStores.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="relative min-w-0 w-full max-w-[400px] basis-full sm:basis-auto sm:ml-auto sm:w-[400px] sm:shrink-0">
                  <HugeiconsIcon
                    icon={Search01Icon}
                    strokeWidth={2}
                    className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-[#737373]"
                    aria-hidden
                  />
                  <Input
                    placeholder="Search recipient..."
                    value={filters.recipient}
                    onChange={e => setFilters({ ...filters, recipient: e.target.value })}
                    className="h-8 w-full pl-8 text-sm rounded-[6px] border border-[#E2E8F0]"
                  />
                </div>
              </div>

              <DonationsTable filteredData={paginatedData}/>

              {/* Footer count */}
              <div className="px-6 py-3 border-t border-[#e2e8f0] flex items-center justify-between">
                <p className="text-xs text-[#737373]">
                  Showing {paginatedData.length} of {filteredData.length} donations
                </p>
                <div className="text-xs flex items-center">
                  Rows per page
                  <div className="w-[10px]"/>
                  <input
                    type="number"
                    value={rowsPerPage}
                    onChange={(e) => {
                      const value = Number(e.target.value) || 1;
                      setRowsPerPage(value);
                      setCurrentPage(1); // reset page
                    }}
                    className="border border-[#f0f0f0] rounded-[7px] w-[70px] p-2"
                  />                  
                  <div className="w-[10px]"/>
                  Page {currentPage} of {totalPages}
                  <div className="w-[10px]"/>
                 <HugeiconsIcon
                  onClick={() => setCurrentPage(1)}
                  icon={ArrowLeftDoubleIcon}
                  strokeWidth={2}
                  className="size-7 text-[#a3a3a3] cursor-pointer border border-[#f0f0f0] rounded-[5px] p-2 m-[1px]"
                />

                <HugeiconsIcon
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  icon={ArrowLeft01Icon}
                  strokeWidth={2}
                  className="size-7 text-[#a3a3a3] cursor-pointer border border-[#f0f0f0] rounded-[5px] p-2 m-[1px]"
                />

                <HugeiconsIcon
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  icon={ArrowRight01Icon}
                  strokeWidth={2}
                  className="size-7 text-[#a3a3a3] cursor-pointer border border-[#f0f0f0] rounded-[5px] p-2 m-[1px]"
                />

                <HugeiconsIcon
                  onClick={() => setCurrentPage(totalPages)}
                  icon={ArrowRightDoubleIcon}
                  strokeWidth={2}
                  className="size-7 text-[#a3a3a3] cursor-pointer border border-[#f0f0f0] rounded-[5px] p-2 m-[1px]"
                />
                </div>
              </div>

            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
