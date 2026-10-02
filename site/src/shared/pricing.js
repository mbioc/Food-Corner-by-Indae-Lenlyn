// Shared by the website (cart display) and the server (/api/order re-prices every order from the database).
// Plain JS with JSDoc so the Vercel functions can import it without a build step.

/**
 * @typedef {{ id: string, name: string, price: number, img: string, category: string, note?: string | null }} Tray
 * @typedef {{ id: string, kind: 'whole' | 'belly' | 'inyuha', label: string, kilos: number, price: number }} LechonOption
 * @typedef {{ id: string, name: string, img: string }} Opt
 * @typedef {{ id: string, label: string, choose: number, options: Opt[] }} ChoiceGroup
 * @typedef {{ id: string, name: string, price: number, perUnit?: string, max?: number }} AddOn
 * @typedef {{ id: string, code: string, name: string, price: number, paxMin: number, paxMax: number, summary: string,
 *   fixed: { name: string, img: string }[], groups: ChoiceGroup[], freebies?: string[], pickupOnly?: boolean, addOns?: AddOn[] }} Package
 * @typedef {{ id: string, label: string, detail: string, feeMin: number, feeMax: number, quote?: boolean }} Zone
 * @typedef {{ trays: Tray[], lechon: LechonOption[], packages: Package[], zones: Zone[] }} Menu
 */

export const FREE_PALUTO = ['Paklay', 'Dinuguan']
export const PICKUP_ID = 'pickup'

/**
 * @param {any} line  { kind, refId, qty, choices?, addOns?, paluto? }
 * @param {Menu} menu
 */
export function resolveLine(line, menu) {
  const qty = Math.max(1, Math.min(20, Math.floor(Number(line?.qty) || 1)))
  if (line.kind === 'tray') {
    const t = menu.trays.find((x) => x.id === line.refId)
    if (!t) return null
    return { line: { ...line, qty }, title: t.name, detail: ['Large tray', ...(t.note ? [t.note] : [])], unitPrice: t.price, total: t.price * qty, img: t.img, pickupOnly: false }
  }
  if (line.kind === 'lechon' || line.kind === 'belly' || line.kind === 'inyuha') {
    const kind = line.kind === 'lechon' ? 'whole' : line.kind
    const o = menu.lechon.find((x) => x.id === line.refId && x.kind === kind)
    if (!o) return null
    const whole = kind === 'whole'
    const paluto = FREE_PALUTO.includes(line.paluto) ? line.paluto : FREE_PALUTO[0]
    return {
      line: { ...line, qty, ...(whole ? { paluto } : {}) },
      title: whole ? `Whole Lechon, ${o.label}` : kind === 'belly' ? `Lechon Belly, ${o.label}` : `Lechon Inyuha roasting, ${o.label}`,
      detail: whole ? [`Free paluto: ${paluto}`] : kind === 'inyuha' ? ['You bring the pig, we roast it'] : [],
      unitPrice: o.price,
      total: o.price * qty,
      img: menu.lechonImg?.[kind] ?? '',
      pickupOnly: false,
    }
  }
  if (line.kind === 'package') {
    const p = menu.packages.find((x) => x.id === line.refId)
    if (!p) return null
    const choices = line.choices ?? {}
    const detail = []
    for (const g of p.groups) {
      const names = (choices[g.id] ?? []).map((/** @type {string} */ id) => g.options.find((o) => o.id === id)?.name).filter(Boolean)
      detail.push(`${g.label}: ${names.join(', ')}`)
    }
    if (p.fixed.length) detail.push(`Includes: ${p.fixed.map((f) => f.name).join(', ')}`)
    if (p.freebies?.length) detail.push(`Free: ${p.freebies.join(', ')}`)
    let addOnTotal = 0
    const addOns = line.addOns ?? {}
    for (const a of p.addOns ?? []) {
      const units = Math.max(0, Math.min(a.max ?? 10, Math.floor(Number(addOns[a.id]) || 0)))
      if (units > 0) {
        addOnTotal += units * a.price
        detail.push(`Add-on: ${a.name}${a.perUnit ? ` +${units} ${a.perUnit}` : ''}`)
      }
    }
    const unitPrice = p.price + addOnTotal
    return {
      line: { ...line, qty },
      title: p.name,
      detail,
      unitPrice,
      total: unitPrice * qty,
      img: p.fixed[0]?.img ?? p.groups[0]?.options[0]?.img ?? '',
      pickupOnly: !!p.pickupOnly,
    }
  }
  return null
}

/** Returns an error message when a package's dish choices break its rules, else null. */
export function choiceError(line, menu) {
  if (line.kind !== 'package') return null
  const p = menu.packages.find((x) => x.id === line.refId)
  if (!p) return 'This package is no longer available.'
  for (const g of p.groups) {
    const picked = line.choices?.[g.id] ?? []
    if (!Array.isArray(picked) || new Set(picked).size !== g.choose) return `${p.name}: choose ${g.choose} for ${g.label}.`
    if (picked.some((id) => !g.options.some((o) => o.id === id))) return `${p.name}: one of the dishes is no longer offered.`
  }
  return null
}

export const peso = (/** @type {number} */ n) => `₱${n.toLocaleString('en-PH')}`

/** @param {Zone | undefined} z */
export function zoneFeeLabel(z) {
  if (!z) return ''
  if (z.id === PICKUP_ID) return 'Free'
  if (z.quote) return 'To be quoted'
  return z.feeMin === z.feeMax ? peso(z.feeMin) : `${peso(z.feeMin)}–${peso(z.feeMax)}`
}
