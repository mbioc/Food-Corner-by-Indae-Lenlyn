// Shared by the website (cart display) and the server (/api/order re-prices every order from the database).
// Plain JS with JSDoc so the Vercel functions can import it without a build step.

/**
 * @typedef {{ id: string, name: string, price: number, img: string, category: string, note?: string | null }} Tray
 * @typedef {{ id: string, kind: 'whole' | 'belly' | 'inyuha', label: string, kilos: number, price: number }} LechonOption
 * @typedef {{ id: string, name: string, img: string }} Opt
 * @typedef {{ id: string, label: string, choose: number, options: Opt[] }} ChoiceGroup
 * @typedef {{ id: string, name: string, price: number, perUnit?: string, max?: number, img?: string, options?: string[] }} AddOn
 * @typedef {{ id: string, code: string, name: string, price: number, paxMin: number, paxMax: number, summary: string,
 *   fixed: { name: string, img: string }[], groups: ChoiceGroup[], freebies?: string[], pickupOnly?: boolean, addOns?: AddOn[] }} Package
 * @typedef {{ id: string, label: string, detail: string, feeMin: number, feeMax: number, quote?: boolean }} Zone
 * @typedef {{ trays: Tray[], lechon: LechonOption[], packages: Package[], zones: Zone[] }} Menu
 */

// Smallest down payment a customer may choose (pesos). The owner can change it in the admin settings.
export const DOWNPAYMENT_MIN = 500

// Dishes the kitchen can cook from the lechon's laman-loob (innards). Each one picked is charged.
export const PALUTO_DISHES = ['Paklay', 'Dinuguan', 'Sha-i (Fried)']

// Priced extras sold on their own. Extras with `multi` charge their price once per option ticked.
export const EXTRAS = [
  { id: 'paluto', name: 'Paluto sa laman-loob', price: 250, options: PALUTO_DISHES, multi: true, optionLabel: 'Dishes' },
  { id: 'tupperware', name: 'Containers', price: 150, options: ['White tupperware', 'Aluminum'], optionLabel: 'Type' },
]
export const PICKUP_ID = 'pickup'

/** The options from `options` that `value` (an array, or one string) picks, in menu order. */
export function pickList(value, options) {
  const v = Array.isArray(value) ? value : typeof value === 'string' ? [value] : []
  return options.filter((o) => v.includes(o))
}

/**
 * @param {any} line  { kind, refId, qty, choices?, addOns?, addOnOptions?, option?, picks? }
 * @param {Menu} menu
 */
export function resolveLine(line, menu) {
  const qty = Math.max(1, Math.min(20, Math.floor(Number(line?.qty) || 1)))
  if (line.kind === 'tray') {
    const t = menu.trays.find((x) => x.id === line.refId)
    if (!t) return null
    return { line: { ...line, qty }, title: t.name, detail: ['Large tray', ...(t.note ? [t.note] : [])], unitPrice: t.price, total: t.price * qty, img: t.img, pickupOnly: false }
  }
  if (line.kind === 'extra') {
    const e = EXTRAS.find((x) => x.id === line.refId)
    if (!e) return null
    if (e.multi) {
      const found = pickList(line.picks, e.options)
      const picks = found.length ? found : [e.options[0]]
      return {
        line: { ...line, qty, picks },
        title: e.name,
        detail: [`${e.optionLabel}: ${picks.join(', ')}`],
        unitPrice: e.price * picks.length,
        total: e.price * picks.length * qty,
        img: menu.lechonImg?.whole ?? '',
        pickupOnly: false,
      }
    }
    const option = e.options.includes(line.option) ? line.option : e.options[0]
    return {
      line: { ...line, qty, option },
      title: e.name,
      detail: [`${e.optionLabel}: ${option}`],
      unitPrice: e.price,
      total: e.price * qty,
      img: '',
      pickupOnly: false,
    }
  }
  if (line.kind === 'lechon' || line.kind === 'belly' || line.kind === 'inyuha') {
    const kind = line.kind === 'lechon' ? 'whole' : line.kind
    const o = menu.lechon.find((x) => x.id === line.refId && x.kind === kind)
    if (!o) return null
    const whole = kind === 'whole'
    // Whole lechon no longer comes with a free paluto; customers add the paid one (EXTRAS) instead.
    const { paluto: _old, ...rest } = line
    return {
      line: { ...rest, qty },
      title: whole ? `Whole Lechon, ${o.label}` : kind === 'belly' ? `Lechon Belly, ${o.label}` : `Lechon Inyuha roasting, ${o.label}`,
      detail: kind === 'inyuha' ? ['You bring the pig, we roast it'] : [],
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
    const addOnOptions = {}
    for (const a of p.addOns ?? []) {
      if (a.options?.length) {
        // Add-ons with options (the paluto dishes) charge once per option ticked.
        const picks = pickList(line.addOnOptions?.[a.id], a.options)
        if (!picks.length) continue
        addOnOptions[a.id] = picks
        addOnTotal += picks.length * a.price
        detail.push(`Add-on ${a.name}: ${picks.join(', ')}`)
        continue
      }
      const units = Math.max(0, Math.min(a.max ?? 10, Math.floor(Number(addOns[a.id]) || 0)))
      if (units > 0) {
        addOnTotal += units * a.price
        detail.push(`Add-on: ${a.name}${a.perUnit ? ` +${units} ${a.perUnit}` : ''}`)
      }
    }
    const unitPrice = p.price + addOnTotal
    return {
      line: { ...line, qty, ...(Object.keys(addOnOptions).length ? { addOnOptions } : {}) },
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
