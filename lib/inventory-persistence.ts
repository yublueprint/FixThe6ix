export type PersistedGiftCard = {
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

const STORAGE_KEY = "fixthe6ix.persistedGiftCards"

function isBrowser() {
  return typeof window !== "undefined"
}

export function loadPersistedGiftCards(): PersistedGiftCard[] {
  if (!isBrowser()) return []

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed as PersistedGiftCard[]
  } catch {
    return []
  }
}

export function savePersistedGiftCards(cards: PersistedGiftCard[]) {
  if (!isBrowser()) return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cards))
}

export function upsertPersistedGiftCard(card: PersistedGiftCard) {
  const existing = loadPersistedGiftCards()
  const key = `${card.store.toLowerCase()}::${card.last4}`
  const idx = existing.findIndex(c => `${c.store.toLowerCase()}::${c.last4}` === key)

  if (idx >= 0) {
    existing[idx] = card
  } else {
    existing.unshift(card)
  }

  savePersistedGiftCards(existing)
}
