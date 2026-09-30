import { createContext, useContext, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from 'react'
import type { Zone } from '../data/business'
import { resolveLine as sharedResolve, zoneFeeLabel } from '../shared/pricing.js'
import { usePricingMenu } from './menu'

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

type PricingMenu = ReturnType<typeof usePricingMenu>

export function resolveLine(line: Line, menu: PricingMenu): ResolvedLine | null {
  return sharedResolve(line, menu) as ResolvedLine | null
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
  const menu = usePricingMenu()

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lines))
    } catch {
      /* storage unavailable: the table just won't survive a reload */
    }
  }, [lines])

  const value = useMemo<OrderCtx>(() => {
    const resolved = lines.map((l) => resolveLine(l, menu)).filter((r): r is ResolvedLine => r !== null)
    return {
      lines,
      resolved,
      count: resolved.reduce((n, r) => n + r.line.qty, 0),
      subtotal: resolved.reduce((n, r) => n + r.total, 0),
      hasPickupOnly: resolved.some((r) => r.pickupOnly),
      add: (line, from) => {
        dispatch({ type: 'add', line })
        const r = resolveLine({ ...(line as Line), key: 'x', qty: 1 }, menu)
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
  }, [lines, flights, bump, menu])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useOrder() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useOrder outside OrderProvider')
  return c
}

/* ---------- Formatting ---------- */

export const peso = (n: number) => `₱${n.toLocaleString('en-PH')}`

export function feeLabel(zoneId: string, zones: Zone[]) {
  return zoneFeeLabel(zones.find((x) => x.id === zoneId))
}

export function makeOrderId(date = new Date()) {
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  const rand = Math.floor(1000 + Math.random() * 9000)
  return `FC-${mm}${dd}-${rand}`
}
