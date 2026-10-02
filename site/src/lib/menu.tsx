import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { LECHON_BELLY, LECHON_INYUHA, PACKAGES, TRAYS, WHOLE_LECHON, type LechonOption, type Package, type Tray, type TrayCategory } from '../data/menu'
import { ZONES, type Zone } from '../data/business'
import { asset } from './asset'

export interface Menu {
  trays: Tray[]
  packages: Package[]
  whole: LechonOption[]
  belly: LechonOption[]
  inyuha: LechonOption[] // roasting fee when the customer brings the pig
  zones: Zone[]
  blocked: string[] // YYYY-MM-DD days Lenlyn is fully booked
  live: boolean // true once loaded from the database
}

/** The menu that shipped with the site: shown instantly, and used if the database can't be reached. */
const STATIC_MENU: Menu = { trays: TRAYS, packages: PACKAGES, whole: WHOLE_LECHON, belly: LECHON_BELLY, inyuha: LECHON_INYUHA, zones: ZONES, blocked: [], live: false }

const SB_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined
const SB_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined

/** Stored image paths are either site-relative ("/img/…") or full Supabase Storage URLs. */
export const imgUrl = (src: string) => (!src ? '' : /^https?:\/\//.test(src) ? src : asset(src))

async function rest<T>(path: string): Promise<T> {
  const res = await fetch(`${SB_URL}/rest/v1/${path}`, { headers: { apikey: SB_KEY!, Authorization: `Bearer ${SB_KEY}` } })
  if (!res.ok) throw new Error(`${res.status}`)
  return res.json()
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export async function fetchMenu(): Promise<Menu> {
  const today = new Date(Date.now() + 8 * 3600e3).toISOString().slice(0, 10)
  const [trays, lechon, packages, zones, blocked] = await Promise.all([
    rest<any[]>('trays?select=*&available=eq.true&order=sort'),
    rest<any[]>('lechon_options?select=*&available=eq.true&order=sort'),
    rest<any[]>('packages?select=*&available=eq.true&order=sort'),
    rest<any[]>('zones?select=*&active=eq.true&order=sort'),
    rest<any[]>(`blocked_dates?select=day&day=gte.${today}`),
  ])
  const opt = (o: any) => ({ ...o, img: imgUrl(o.img) })
  return {
    trays: trays.map((t) => ({ id: t.id, name: t.name, price: t.price, img: imgUrl(t.img), category: t.category as TrayCategory, note: t.note ?? undefined })),
    whole: lechon.filter((o) => o.kind === 'whole').map((o) => ({ id: o.id, label: o.label, kilos: Number(o.kilos), price: o.price })),
    belly: lechon.filter((o) => o.kind === 'belly').map((o) => ({ id: o.id, label: o.label, kilos: Number(o.kilos), price: o.price })),
    inyuha: lechon.filter((o) => o.kind === 'inyuha').map((o) => ({ id: o.id, label: o.label, kilos: Number(o.kilos), price: o.price })),
    packages: packages.map((p) => ({
      id: p.id,
      code: p.code,
      name: p.name,
      price: p.price,
      paxMin: p.pax_min,
      paxMax: p.pax_max,
      summary: p.summary,
      fixed: (p.fixed ?? []).map(opt),
      groups: (p.groups ?? []).map((g: any) => ({ ...g, options: (g.options ?? []).map(opt) })),
      freebies: p.freebies?.length ? p.freebies : undefined,
      pickupOnly: p.pickup_only,
      addOns: p.add_ons?.length ? p.add_ons : undefined,
    })),
    zones: zones.map((z) => ({ id: z.id, label: z.label, detail: z.detail, feeMin: z.fee_min, feeMax: z.fee_max, quote: z.quote })),
    blocked: blocked.map((b) => b.day),
    live: true,
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */

const Ctx = createContext<Menu>(STATIC_MENU)

export function MenuProvider({ children }: { children: ReactNode }) {
  const [menu, setMenu] = useState<Menu>(STATIC_MENU)
  useEffect(() => {
    if (!SB_URL || !SB_KEY) return
    let alive = true
    fetchMenu()
      .then((m) => alive && setMenu(m))
      .catch(() => {
        /* offline or misconfigured: keep the built-in menu */
      })
    return () => {
      alive = false
    }
  }, [])
  return <Ctx.Provider value={menu}>{children}</Ctx.Provider>
}

export const useMenu = () => useContext(Ctx)

/** The menu in the shape shared/pricing.js expects. */
export function usePricingMenu() {
  const m = useMenu()
  return useMemo(
    () => ({
      trays: m.trays,
      packages: m.packages,
      zones: m.zones,
      lechon: [...m.whole.map((o) => ({ ...o, kind: 'whole' as const })), ...m.belly.map((o) => ({ ...o, kind: 'belly' as const })), ...m.inyuha.map((o) => ({ ...o, kind: 'inyuha' as const }))],
      lechonImg: { whole: asset('/img/hero/lechon-whole.webp'), belly: asset('/img/hero/lechon-belly.webp'), inyuha: asset('/img/hero/lechon-spit.webp') },
    }),
    [m],
  )
}
