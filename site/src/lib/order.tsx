import { createContext, useContext, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from 'react'
import { PACKAGES, TRAYS, WHOLE_LECHON, LECHON_BELLY } from '../data/menu'
import { ZONES, PICKUP_ID } from '../data/business'
import { asset } from './asset'

/* ---------- Line items ---------- */

export type Line =
  | { key: string; kind: 'tray'; refId: string; qty: number }
  | { key: string; kind: 'lechon'; refId: string; qty: number; paluto?: string }
  | { key: string; kind: 'belly'; refId: string; qty: number }
  | {
      key: string
      kind: 'package'
      refId: string
      qty: number
      choices: Record<string, string[]> // groupId -> option ids
      addOns: Record<string, number> // addOnId -> units
    }

type DistOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never
export type NewLine = DistOmit<Line, 'key' | 'qty'> & { qty?: number }

export interface ResolvedLine {
  line: Line
  title: string
  detail: string[]
  unitPrice: number
  total: number
  img: string
  pickupOnly: boolean
}

export function resolveLine(line: Line): ResolvedLine | null {
  if (line.kind === 'tray') {
    const t = TRAYS.find((x) => x.id === line.refId)
    if (!t) return null
    return { line, title: t.name, detail: ['Large tray', ...(t.note ? [t.note] : [])], unitPrice: t.price, total: t.price * line.qty, img: t.img, pickupOnly: false }
  }
  if (line.kind === 'lechon') {
    const o = WHOLE_LECHON.find((x) => x.id === line.refId)
    if (!o) return null
    return {
      line,
      title: `Whole Lechon, ${o.label}`,
      detail: [`Free paluto: ${line.paluto ?? 'Paklay'}`],
      unitPrice: o.price,
      total: o.price * line.qty,
      img: asset('/img/hero/lechon-whole.webp'),
      pickupOnly: false,
    }
  }
  if (line.kind === 'belly') {
    const o = LECHON_BELLY.find((x) => x.id === line.refId)
    if (!o) return null
    return { line, title: `Lechon Belly, ${o.label}`, detail: [], unitPrice: o.price, total: o.price * line.qty, img: asset('/img/hero/lechon-belly.webp'), pickupOnly: false }
  }
  const p = PACKAGES.find((x) => x.id === line.refId)
  if (!p) return null
  const detail: string[] = []
  for (const g of p.groups) {
    const names = (line.choices[g.id] ?? []).map((id) => g.options.find((o) => o.id === id)?.name).filter(Boolean)
    detail.push(`${g.label}: ${names.join(', ')}`)
  }
  if (p.fixed.length) detail.push(`Includes: ${p.fixed.map((f) => f.name).join(', ')}`)
  if (p.freebies?.length) detail.push(`Free: ${p.freebies.join(', ')}`)
  let addOnTotal = 0
  for (const a of p.addOns ?? []) {
    const units = line.addOns[a.id] ?? 0
    if (units > 0) {
      addOnTotal += units * a.price
      detail.push(`Add-on: ${a.name}${a.perUnit ? ` +${units} ${a.perUnit}` : ''}`)
    }
  }
  const unitPrice = p.price + addOnTotal
  return { line, title: p.name, detail, unitPrice, total: unitPrice * line.qty, img: p.fixed[0]?.img ?? p.groups[0]?.options[0]?.img ?? '', pickupOnly: !!p.pickupOnly }
}

/* ---------- Store ---------- */

type Action =
  | { type: 'add'; line: NewLine }
  | { type: 'qty'; key: string; qty: number }
  | { type: 'remove'; key: string }
  | { type: 'clear' }

const lineSignature = (l: DistOmit<Line, 'key' | 'qty'>) => JSON.stringify(l)

function reducer(state: Line[], action: Action): Line[] {
  switch (action.type) {
    case 'add': {
      const { qty = 1, ...rest } = action.line
      const sig = lineSignature(rest as DistOmit<Line, 'key' | 'qty'>)
      const existing = state.find((l) => {
        const { key: _k, qty: _q, ...r } = l
        return lineSignature(r) === sig
      })
      if (existing) return state.map((l) => (l === existing ? { ...l, qty: l.qty + qty } : l))
      return [...state, { ...(rest as DistOmit<Line, 'key' | 'qty'>), key: crypto.randomUUID(), qty } as Line]
    }
    case 'qty':
      return state.map((l) => (l.key === action.key ? { ...l, qty: Math.max(1, Math.min(20, action.qty)) } : l))
    case 'remove':
      return state.filter((l) => l.key !== action.key)
    case 'clear':
      return []
  }
}

const STORAGE_KEY = 'fc-table-v1'

function loadLines(): Line[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Line[]) : []
  } catch {
    return []
  }
}

interface OrderCtx {
  lines: Line[]
  resolved: ResolvedLine[]
  count: number
  subtotal: number
  hasPickupOnly: boolean
  add: (line: NewLine, from?: HTMLElement | null) => void
  setQty: (key: string, qty: number) => void
  remove: (key: string) => void
  clear: () => void
  flights: Flight[]
  land: (id: string) => void
  bump: number
  barRef: React.RefObject<HTMLElement | null>
}

export interface Flight {
  id: string
  img: string
  from: DOMRect
}

const Ctx = createContext<OrderCtx | null>(null)

export function OrderProvider({ children }: { children: ReactNode }) {
  const [lines, dispatch] = useReducer(reducer, undefined, loadLines)
  const [flights, setFlights] = useState<Flight[]>([])
  const [bump, setBump] = useState(0)
  const barRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lines))
    } catch {
      /* storage unavailable: the table just won't survive a reload */
    }
  }, [lines])

  const value = useMemo<OrderCtx>(() => {
    const resolved = lines.map(resolveLine).filter((r): r is ResolvedLine => r !== null)
    return {
      lines,
      resolved,
      count: resolved.reduce((n, r) => n + r.line.qty, 0),
      subtotal: resolved.reduce((n, r) => n + r.total, 0),
      hasPickupOnly: resolved.some((r) => r.pickupOnly),
      add: (line, from) => {
        dispatch({ type: 'add', line })
        const r = resolveLine({ ...(line as Line), key: 'x', qty: 1 })
        if (from && r) {
          setFlights((f) => [...f, { id: crypto.randomUUID(), img: r.img, from: from.getBoundingClientRect() }])
        } else {
          setBump((b) => b + 1)
        }
      },
      setQty: (key, qty) => dispatch({ type: 'qty', key, qty }),
      remove: (key) => dispatch({ type: 'remove', key }),
      clear: () => dispatch({ type: 'clear' }),
      flights,
      land: (id) => {
        setFlights((f) => f.filter((x) => x.id !== id))
        setBump((b) => b + 1)
      },
      bump,
      barRef,
    }
  }, [lines, flights, bump])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useOrder() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useOrder outside OrderProvider')
  return c
}

/* ---------- Formatting ---------- */

export const peso = (n: number) => `₱${n.toLocaleString('en-PH')}`

export function feeLabel(zoneId: string) {
  const z = ZONES.find((x) => x.id === zoneId)
  if (!z) return ''
  if (z.id === PICKUP_ID) return 'Free'
  if (z.quote) return 'To be quoted'
  return z.feeMin === z.feeMax ? peso(z.feeMin) : `${peso(z.feeMin)}–${peso(z.feeMax)}`
}

export function makeOrderId(date = new Date()) {
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  const rand = Math.floor(1000 + Math.random() * 9000)
  return `FC-${mm}${dd}-${rand}`
}
