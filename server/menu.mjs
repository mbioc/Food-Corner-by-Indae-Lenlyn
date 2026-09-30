import { db } from './supabase.mjs'

/** Loads the live menu from the database in the shape shared/pricing.js expects. */
export async function loadMenu({ includeUnavailable = false } = {}) {
  const avail = includeUnavailable ? '' : '&available=eq.true'
  const [trays, lechon, packages, zones] = await Promise.all([
    db.select('trays', `select=*${avail}&order=sort`),
    db.select('lechon_options', `select=*${avail}&order=sort`),
    db.select('packages', `select=*${avail}&order=sort`),
    db.select('zones', `select=*${includeUnavailable ? '' : '&active=eq.true'}&order=sort`),
  ])
  return {
    trays: trays.map((t) => ({ id: t.id, name: t.name, price: t.price, img: t.img, category: t.category, note: t.note })),
    lechon: lechon.map((o) => ({ id: o.id, kind: o.kind, label: o.label, kilos: Number(o.kilos), price: o.price })),
    packages: packages.map((p) => ({
      id: p.id, code: p.code, name: p.name, price: p.price, paxMin: p.pax_min, paxMax: p.pax_max, summary: p.summary,
      fixed: p.fixed, groups: p.groups, freebies: p.freebies, pickupOnly: p.pickup_only, addOns: p.add_ons,
    })),
    zones: zones.map((z) => ({ id: z.id, label: z.label, detail: z.detail, feeMin: z.fee_min, feeMax: z.fee_max, quote: z.quote })),
  }
}
