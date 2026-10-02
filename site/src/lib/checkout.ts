import { BUSINESS, PICKUP_ID, SETTINGS, TUPPERWARE, type Zone } from '../data/business'
import { feeLabel, peso, type Line, type ResolvedLine } from './order'

export interface CheckoutForm {
  name: string
  mobile: string
  email: string
  fbName: string
  eventDate: string
  eventTime: string
  occasion: string
  pax: string
  zone: string
  address: string
  landmark: string
  notes: string
  tupperware: boolean
  payChannel: string
  payPlan: 'full' | 'down'
  reference: string
}

export const EMPTY_FORM: CheckoutForm = {
  name: '',
  mobile: '',
  email: '',
  fbName: '',
  eventDate: '',
  eventTime: '',
  occasion: '',
  pax: '',
  zone: '',
  address: '',
  landmark: '',
  notes: '',
  tupperware: false,
  payChannel: '',
  payPlan: 'full',
  reference: '',
}

export const OCCASIONS = ['Birthday', 'Fiesta', 'Baptism', 'Wedding', 'Reunion', 'Company event', 'Family salu-salo', 'Other']

export type Errors = Partial<Record<keyof CheckoutForm | 'submit', string>>

const PH_MOBILE = /^(\+?63|0)9\d{9}$/

export function validateStep(step: number, f: CheckoutForm, pickupOnly: boolean, blocked: string[] = []): Errors {
  const e: Errors = {}
  if (step === 0) {
    if (!f.name.trim()) e.name = 'Please enter your name.'
    if (!PH_MOBILE.test(f.mobile.replace(/[\s-]/g, ''))) e.mobile = 'Enter a PH mobile number, like 0917 123 4567.'
    if (f.email && !/^\S+@\S+\.\S+$/.test(f.email)) e.email = 'That email looks incomplete.'
  }
  if (step === 1) {
    if (!f.eventDate) e.eventDate = 'Pick the date you need the food.'
    else if (f.eventDate < todayISO()) e.eventDate = 'That date has passed. Pick today or later.'
    else if (blocked.includes(f.eventDate)) e.eventDate = 'Lenlyn is fully booked on this date. Please pick another day.'
    if (!f.eventTime) e.eventTime = 'Pick a time.'
    if (!f.zone) e.zone = 'Choose delivery or pick-up.'
    if (pickupOnly && f.zone && f.zone !== PICKUP_ID) e.zone = 'Your order has a pick-up-only package. Choose pick-up.'
    if (f.zone && f.zone !== PICKUP_ID && !f.address.trim()) e.address = 'We need the delivery address.'
  }
  if (step === 2) {
  }
  return e
}

export function todayISO() {
  const d = new Date()
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 10)
}

export interface Downpayment {
  enabled: boolean
  rate: number
}

export function amountDue(subtotal: number, plan: CheckoutForm['payPlan'], dp: Downpayment) {
  return plan === 'down' && dp.enabled ? Math.round(subtotal * dp.rate) : subtotal
}

export function formatDate(iso: string) {
  if (!iso) return ''
  return new Date(`${iso}T00:00:00`).toLocaleDateString('en-PH', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
}

export function formatTime(t: string) {
  if (!t) return ''
  const [h, m] = t.split(':').map(Number)
  const d = new Date()
  d.setHours(h, m)
  return d.toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' })
}

/** Plain-text order used for Messenger, email and the owner's records. */
export function orderText(orderId: string, lines: ResolvedLine[], subtotal: number, f: CheckoutForm, zones: Zone[], dp: Downpayment) {
  const zone = zones.find((z) => z.id === f.zone)
  const out: string[] = []
  out.push(`FOOD CORNER ORDER ${orderId}`)
  out.push('')
  for (const r of lines) {
    out.push(`${r.line.qty} × ${r.title} — ${peso(r.total)}`)
    for (const d of r.detail) out.push(`   ${d}`)
  }
  out.push('')
  out.push(`Food total: ${peso(subtotal)}`)
  if (zone) out.push(`${zone.id === PICKUP_ID ? 'Pick-up' : `Delivery (${zone.label})`}: ${feeLabel(zone.id, zones)}${zone.id !== PICKUP_ID ? ' (to be confirmed)' : ''}`)
  const paid = amountDue(subtotal, f.payPlan, dp)
  out.push(`To pay: ${peso(paid)}${paid < subtotal ? ' (down payment)' : ''}. Lenlyn will send the payment details.`)
  if (paid < subtotal) out.push(`Balance: ${peso(subtotal - paid)}, due on pick-up or delivery`)
  out.push('')
  out.push(`When: ${formatDate(f.eventDate)}, ${formatTime(f.eventTime)}${f.occasion ? ` · ${f.occasion}` : ''}${f.pax ? ` · ${f.pax} pax` : ''}`)
  out.push(`Name: ${f.name}`)
  out.push(`Mobile: ${f.mobile}`)
  if (f.email) out.push(`Email: ${f.email}`)
  if (f.fbName) out.push(`Facebook: ${f.fbName}`)
  if (zone && zone.id !== PICKUP_ID) {
    out.push(`Address: ${f.address}`)
    if (f.landmark) out.push(`Landmark: ${f.landmark}`)
  }
  if (f.tupperware) out.push(`Packaging: white tupperware containers (+₱${TUPPERWARE.fee} per ${TUPPERWARE.per} dishes, Lenlyn confirms the amount)`)
  if (f.notes) out.push(`Notes: ${f.notes}`)
  return out.join('\n')
}

export const messengerUrl = () => `https://m.me/${BUSINESS.messenger}`

/** Downscale the payment screenshot so it fits in an email and uploads fast on mobile data. */
export async function compressImage(file: File, maxSide = 1400, quality = 0.8): Promise<{ dataUrl: string; name: string }> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  const dataUrl = canvas.toDataURL('image/jpeg', quality)
  return { dataUrl, name: file.name.replace(/\.[^.]+$/, '') + '.jpg' }
}

export interface SubmitResult {
  saved: boolean
  /** true when the server refused the order itself (sold out, fully booked…), so the customer must fix it */
  rejected?: boolean
  orderId?: string
  emailed?: boolean
  error?: string
}

export async function submitOrder(payload: { lines: Line[]; form: CheckoutForm }): Promise<SubmitResult> {
  try {
    const res = await fetch(SETTINGS.orderEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, lines: payload.lines.map(({ key: _key, ...l }) => l) }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) return { saved: false, rejected: res.status >= 400 && res.status < 500, error: data.error || `Server answered ${res.status}` }
    return { saved: true, orderId: data.orderId, emailed: data.emailed }
  } catch {
    return { saved: false, error: 'No connection to the order server.' }
  }
}
