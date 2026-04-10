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
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft01Icon, ArrowLeftDoubleIcon, ArrowRight01Icon, ArrowRightDoubleIcon, DownloadIcon } from "@hugeicons/core-free-icons"
import donationsData from "./data.json"
import DonationsTable from "@/components/donations-table"

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
              <div className="border border-[#e2e8f0] rounded-[12px] p-5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-[#737373]">Total Donations Distributed</p>
                  <span className="text-xs bg-[#bbf7d0] text-[#166534] px-2 py-0.5 rounded-full font-medium">→ +12</span>
                </div>
                <p className="text-[30px] font-semibold text-[#0a0a0a] mt-1 leading-none">{totalCount}</p>
                <p className="text-xs text-[#737373] mt-2">Gift cards given to recipients</p>
              </div>
              <div className="border border-[#e2e8f0] rounded-[12px] p-5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-[#737373]">Total Dollar Value</p>
                  <span className="text-xs bg-[#bbf7d0] text-[#166534] px-2 py-0.5 rounded-full font-medium">→ +12</span>
                </div>
                <p className="text-[30px] font-semibold text-[#0a0a0a] mt-1 leading-none">
                  ${totalValue.toLocaleString()}
                </p>
                <p className="text-xs text-[#737373] mt-2">Total value distributed to community</p>
              </div>
            </div>

            {/* ── Donation Log card ── */}
            <div className="bg-white border border-[#e2e8f0] rounded-[12px] overflow-hidden">

              {/* Card header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#e2e8f0]">
                <div>
                  <p className="text-sm font-semibold text-[#0a0a0a]">Donation Log</p>
                  <p className="text-xs text-[#737373] mt-0.5">Filter and export donation records</p>
                </div>
                <button
                  onClick={exportToCSV}
                  className="bg-[#0a0a0a] text-white text-sm font-medium px-4 py-2 rounded-[6px] flex items-center gap-2 hover:bg-[#262626] transition-colors"
                >
                  <HugeiconsIcon icon={DownloadIcon} strokeWidth={2} className="size-4" />
                  Export CSV
                </button>
              </div>

              {/* Filters row */}
              <div className="px-4 sm:px-6 py-4 grid grid-cols-2 sm:grid-cols-4 gap-3 border-b border-[#e2e8f0]">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-[#737373]">Start Date</Label>
                  <Input
                    type="date"
                    value={filters.startDate}
                    onChange={e => setFilters({ ...filters, startDate: e.target.value })}
                    className="h-8 text-sm rounded-[6px]"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-[#737373]">End Date</Label>
                  <Input
                    type="date"
                    value={filters.endDate}
                    onChange={e => setFilters({ ...filters, endDate: e.target.value })}
                    className="h-8 text-sm rounded-[6px]"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-[#737373]">Store</Label>
                  <Select value={filters.store} onValueChange={v => setFilters({ ...filters, store: v ?? "" })}>
                    <SelectTrigger size="sm" className="rounded-[6px]">
                      <SelectValue placeholder="All Stores" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Stores</SelectItem>
                      {uniqueStores.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-[#737373]">Recipient</Label>
                  <Input
                    placeholder="Search recipient..."
                    value={filters.recipient}
                    onChange={e => setFilters({ ...filters, recipient: e.target.value })}
                    className="h-8 text-sm rounded-[6px]"
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
