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
import { DownloadIcon } from "@hugeicons/core-free-icons"
import donationsData from "./data.json"

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

              {/* Table */}
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#fafafa] hover:bg-[#fafafa]">
                    <TableHead className="text-xs font-medium text-[#737373] py-3 pl-6">Date</TableHead>
                    <TableHead className="text-xs font-medium text-[#737373] py-3">Store</TableHead>
                    <TableHead className="text-xs font-medium text-[#737373] py-3">Amount</TableHead>
                    <TableHead className="text-xs font-medium text-[#737373] py-3">Volunteer</TableHead>
                    <TableHead className="text-xs font-medium text-[#737373] py-3">Recipient</TableHead>
                    <TableHead className="text-xs font-medium text-[#737373] py-3">Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.length > 0 ? (
                    filteredData.map(d => (
                      <TableRow key={d.id} className="border-[#e2e8f0] hover:bg-[#fafafa]">
                        <TableCell className="text-sm text-[#525252] py-3 pl-6">
                          {new Date(d.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-sm font-medium text-[#0a0a0a] py-3">{d.store}</TableCell>
                        <TableCell className="py-3">
                          <span className="bg-[#bbf7d0] text-[#166534] text-xs font-semibold px-2.5 py-1 rounded-full">
                            ${d.amount}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-[#525252] py-3">{d.volunteer}</TableCell>
                        <TableCell className="text-sm text-[#525252] py-3">{d.recipient}</TableCell>
                        <TableCell className="text-sm text-[#a3a3a3] py-3">{d.notes}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center text-[#737373] text-sm">
                        No donations found matching your filters.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              </div>{/* end overflow-x-auto */}

              {/* Footer count */}
              <div className="px-6 py-3 border-t border-[#e2e8f0]">
                <p className="text-xs text-[#737373]">
                  Showing {filteredData.length} of {donationsData.length} donations
                </p>
              </div>

            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
