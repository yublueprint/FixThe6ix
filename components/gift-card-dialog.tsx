"use client"

import * as React from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ShoppingBasket01Icon, GiveBloodIcon, ArrowUp01Icon,
} from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"

// ── Types (kept structurally identical to the page's GiftCard / Transaction) ──

export type GiftCardDialogCard = {
  id: number
  store: string
  last4: string
  initialBalance: number
  remainingBalance: number
  status: string
  addedBy: string
}

export type GiftCardDialogTxn = {
  id: number
  date: string
  type: "spend" | "donation"
  amount: number
  volunteer: string
  recipient: string | null
  notes: string
}

type Props = {
  card: GiftCardDialogCard | null
  transactions: GiftCardDialogTxn[]
  volunteers: string[]
  open: boolean
  onClose: () => void
  onSpend: (amount: number, volunteer: string, notes: string) => void
  onDonate: (amount: number, volunteer: string, recipient: string, notes: string) => void
}

// ── Store branding for the card visual ───────────────────────────────────────
// Brand colors are intentionally literal (they are brand identities, not theme
// tokens). Everything structural below uses semantic tokens.

type Brand = { gradient: string; wordmark: string; spark?: boolean }

function brandFor(store: string): Brand {
  const key = store.toLowerCase()
  if (key.includes("walmart")) return { gradient: "from-[#0071dc] to-[#004a99]", wordmark: "Walmart", spark: true }
  if (key.includes("target")) return { gradient: "from-[#cc0000] to-[#8b0000]", wordmark: "Target" }
  if (key.includes("amazon")) return { gradient: "from-[#232f3e] to-[#131a24]", wordmark: "amazon" }
  if (key.includes("starbucks")) return { gradient: "from-[#00754a] to-[#00362a]", wordmark: "Starbucks" }
  if (key.includes("kroger")) return { gradient: "from-[#004990] to-[#002a55]", wordmark: "Kroger" }
  if (key.includes("costco")) return { gradient: "from-[#005daa] to-[#e31837]", wordmark: "Costco" }
  if (key.includes("best buy")) return { gradient: "from-[#0046be] to-[#002a73]", wordmark: "Best Buy" }
  if (key.includes("mcdonald")) return { gradient: "from-[#da291c] to-[#a01f15]", wordmark: "McDonald's" }
  return { gradient: "from-slate-700 to-slate-900", wordmark: store }
}

function money(n: number) {
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
}

function fmt(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit", hour12: true,
  })
}

// ── The store-branded gift card visual ───────────────────────────────────────

function GiftCardVisual({ card }: { card: GiftCardDialogCard }) {
  const brand = brandFor(card.store)
  return (
    <div
      className={cn(
        "relative h-44 w-full overflow-hidden rounded-2xl bg-gradient-to-br p-5 text-white shadow-sm",
        brand.gradient
      )}
    >
      {/* Walmart spark, otherwise nothing — wordmark carries the brand */}
      {brand.spark && (
        <svg
          viewBox="0 0 100 100"
          className="absolute left-4 top-4 size-16 text-[#ffc220]"
          aria-hidden="true"
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <rect
              key={i}
              x="46" y="6" width="8" height="30" rx="4"
              fill="currentColor"
              transform={`rotate(${i * 60} 50 50)`}
            />
          ))}
        </svg>
      )}

      <span className="absolute right-5 top-4 text-lg font-semibold tracking-tight">
        {brand.wordmark}
      </span>

      <div className="absolute bottom-5 right-5 text-right">
        <div className="leading-none">
          <span className="text-3xl font-bold">{money(card.remainingBalance)}</span>
          <span className="ml-1 text-base font-medium text-white/70">/ {money(card.initialBalance)}</span>
        </div>
        <div className="mt-2 font-mono text-sm tracking-widest text-white/80">
          •••• {card.last4}
        </div>
      </div>
    </div>
  )
}

// ── Dialog ───────────────────────────────────────────────────────────────────

export function GiftCardDialog({
  card, transactions, volunteers, open, onClose, onSpend, onDonate,
}: Props) {
  const panelRef = React.useRef<HTMLDivElement>(null)
  const prevFocus = React.useRef<HTMLElement | null>(null)

  const canRecord = !!card && card.remainingBalance > 0
  const [tab, setTab] = React.useState<string>("spend")

  // form state (shared across spend/donate; recipient only used for donate)
  const [amount, setAmount] = React.useState("")
  const [volunteer, setVolunteer] = React.useState("")
  const [recipient, setRecipient] = React.useState("")
  const [notes, setNotes] = React.useState("")
  const [error, setError] = React.useState("")

  const resetForm = React.useCallback(() => {
    setAmount(""); setVolunteer(""); setRecipient(""); setNotes(""); setError("")
  }, [])

  // Reset whenever a different card is opened.
  React.useEffect(() => {
    if (!open || !card) return
    resetForm()
    setTab(card.remainingBalance > 0 ? "spend" : "history")
  }, [open, card?.id, resetForm]) // eslint-disable-line react-hooks/exhaustive-deps

  // Clear errors when switching tabs.
  React.useEffect(() => { setError("") }, [tab])

  // Esc to close + body scroll lock + focus management.
  React.useEffect(() => {
    if (!open) return
    prevFocus.current = document.activeElement as HTMLElement
    const { overflow } = document.body.style
    document.body.style.overflow = "hidden"
    panelRef.current?.focus()

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = overflow
      prevFocus.current?.focus?.()
    }
  }, [open, onClose])

  if (!open || !card) return null

  function validAmount(): number | null {
    const value = Number(Number(amount).toFixed(2))
    if (!amount || isNaN(value) || value <= 0) { setError("Enter an amount greater than $0."); return null }
    if (value > card!.remainingBalance) {
      setError(`That's more than the ${money(card!.remainingBalance)} left on this card.`); return null
    }
    return value
  }

  function confirmSpend() {
    setError("")
    const value = validAmount()
    if (value === null) return
    if (!volunteer) { setError("Choose a volunteer."); return }
    onSpend(value, volunteer, notes.trim())
    resetForm()
    setTab("history")
  }

  function confirmDonate() {
    setError("")
    const value = validAmount()
    if (value === null) return
    if (!volunteer) { setError("Choose a volunteer."); return }
    if (!recipient.trim()) { setError("Enter a recipient."); return }
    onDonate(value, volunteer, recipient.trim(), notes.trim())
    resetForm()
    setTab("history")
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="gift-card-dialog-title"
        tabIndex={-1}
        className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-background shadow-xl outline-none"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5">
          <h2 id="gift-card-dialog-title" className="text-base font-semibold text-foreground">
            Gift Card Details
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <HugeiconsIcon icon={ArrowUp01Icon} strokeWidth={2} className="size-5 rotate-45" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 pb-2 pt-4">
          <GiftCardVisual card={card} />

          <Tabs value={tab} onValueChange={(v) => setTab(v as string)} className="mt-5">
            <TabsList className="w-full">
              <TabsTrigger value="spend" disabled={!canRecord} className="flex-1">
                <HugeiconsIcon icon={ShoppingBasket01Icon} strokeWidth={2} />
                Record Spending
              </TabsTrigger>
              <TabsTrigger value="donation" disabled={!canRecord} className="flex-1">
                <HugeiconsIcon icon={GiveBloodIcon} strokeWidth={2} />
                Record Donation
              </TabsTrigger>
              <TabsTrigger value="history" className="flex-1">
                Transaction History
              </TabsTrigger>
            </TabsList>

            {/* Record Spending — amount, volunteer, notes (no recipient) */}
            <TabsContent value="spend" className="pt-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Amount">
                  <Input
                    type="number" min="0.01" step="0.01" placeholder="e.g. $30"
                    value={amount} onChange={(e) => setAmount(e.target.value)}
                  />
                </Field>
                <Field label="Volunteer">
                  <VolunteerSelect value={volunteer} onChange={setVolunteer} volunteers={volunteers} />
                </Field>
              </div>
              <Field label="Notes" className="mt-3">
                <Textarea
                  placeholder="e.g. Weekly groceries for the family"
                  value={notes} onChange={(e) => setNotes(e.target.value)}
                  className="min-h-16"
                />
              </Field>
              {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
            </TabsContent>

            {/* Record Donation — amount, volunteer, recipient, notes */}
            <TabsContent value="donation" className="pt-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Amount">
                  <Input
                    type="number" min="0.01" step="0.01" placeholder="e.g. $30"
                    value={amount} onChange={(e) => setAmount(e.target.value)}
                  />
                </Field>
                <Field label="Volunteer">
                  <VolunteerSelect value={volunteer} onChange={setVolunteer} volunteers={volunteers} />
                </Field>
              </div>
              <Field label="Recipient" className="mt-3">
                <Input
                  placeholder="e.g. Family A"
                  value={recipient} onChange={(e) => setRecipient(e.target.value)}
                />
              </Field>
              <Field label="Notes" className="mt-3">
                <Textarea
                  placeholder="e.g. Weekly groceries for the family"
                  value={notes} onChange={(e) => setNotes(e.target.value)}
                  className="min-h-16"
                />
              </Field>
              {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
            </TabsContent>

            {/* Transaction History — read-only */}
            <TabsContent value="history" className="pt-4">
              {transactions.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No transactions yet. Record a spend or donation to start the history.
                </p>
              ) : (
                <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50 text-left">
                        <th className="px-3 py-2 text-xs font-medium text-muted-foreground">Date &amp; Time</th>
                        <th className="px-3 py-2 text-xs font-medium text-muted-foreground">Type</th>
                        <th className="px-3 py-2 text-xs font-medium text-muted-foreground">Amount</th>
                        <th className="px-3 py-2 text-xs font-medium text-muted-foreground">Volunteer</th>
                        <th className="px-3 py-2 text-xs font-medium text-muted-foreground">Recipient</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((t, i) => (
                        <tr key={t.id} className={i < transactions.length - 1 ? "border-b" : ""}>
                          <td className="whitespace-nowrap px-3 py-2.5 text-muted-foreground">{fmt(t.date)}</td>
                          <td className="px-3 py-2.5">
                            <span
                              className={cn(
                                "rounded-full px-2 py-0.5 text-xs font-semibold",
                                t.type === "spend"
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-blue-100 text-blue-700"
                              )}
                            >
                              {t.type === "spend" ? "Spent" : "Donated"}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 font-medium text-red-600">-{money(t.amount)}</td>
                          <td className="px-3 py-2.5 text-muted-foreground">{t.volunteer}</td>
                          <td className="px-3 py-2.5 text-muted-foreground">{t.recipient ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer — Cancel + Confirm (hidden on the read-only history tab) */}
        {tab !== "history" && (
          <div className="flex items-center justify-end gap-2 border-t px-6 py-4">
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            {tab === "spend" ? (
              <Button onClick={confirmSpend}>Confirm Spend</Button>
            ) : (
              <Button onClick={confirmDonate}>Confirm Donation</Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Small local helpers ──────────────────────────────────────────────────────

function Field({
  label, children, className,
}: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
    </div>
  )
}

function VolunteerSelect({
  value, onChange, volunteers,
}: { value: string; onChange: (v: string) => void; volunteers: string[] }) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v ?? "")}>
      <SelectTrigger size="sm" className="w-full">
        <SelectValue placeholder="Select Volunteer" />
      </SelectTrigger>
      <SelectContent>
        {volunteers.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
      </SelectContent>
    </Select>
  )
}
