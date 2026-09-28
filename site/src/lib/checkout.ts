import { BUSINESS, PAYMENTS, ZONES, PICKUP_ID, SETTINGS } from '../data/business'
import { feeLabel, peso, type ResolvedLine } from './order'

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
  payChannel: '',
  payPlan: 'full',
  reference: '',
}

export const OCCASIONS = ['Birthday', 'Fiesta', 'Baptism', 'Wedding', 'Reunion', 'Company event', 'Family salu-salo', 'Other']

export type Errors = Partial<Record<keyof CheckoutForm | 'proof', string>>

const PH_MOBILE = /^(\+?63|0)9\d{9}$/

export function validateStep(step: number, f: CheckoutForm, hasProof: boolean, pickupOnly: boolean): Errors {
  const e: Errors = {}
  if (step === 0) {
    if (!f.name.trim()) e.name = 'Please enter your name.'
    if (!PH_MOBILE.test(f.mobile.replace(/[\s-]/g, ''))) e.mobile = 'Enter a PH mobile number, like 0917 123 4567.'
    if (f.email && !/^\S+@\S+\.\S+$/.test(f.email)) e.email = 'That email looks incomplete.'
  }
  if (step === 1) {
    if (!f.eventDate) e.eventDate = 'Pick the date you need the food.'
    else if (f.eventDate < todayISO()) e.eventDate = 'That date has passed. Pick today or later.'
    if (!f.eventTime) e.eventTime = 'Pick a time.'
    if (!f.zone) e.zone = 'Choose delivery or pick-up.'
    if (pickupOnly && f.zone && f.zone !== PICKUP_ID) e.zone = 'Your order has a pick-up-only package. Choose pick-up.'
    if (f.zone && f.zone !== PICKUP_ID && !f.address.trim()) e.address = 'We need the delivery address.'
  }
  if (step === 2) {
    if (!f.payChannel) e.payChannel = 'Choose where you sent the payment.'
    if (!hasProof) e.proof = 'Upload the screenshot of your payment.'
  }
  return e
}

export function todayISO() {
  const d = new Date()
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 10)
}

export function amountDue(subtotal: number, plan: CheckoutForm['payPlan']) {
  return plan === 'down' && SETTINGS.allowDownpayment ? Math.round(subtotal * SETTINGS.downpaymentRate) : subtotal
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
export function orderText(orderId: string, lines: ResolvedLine[], subtotal: number, f: CheckoutForm) {
  const zone = ZONES.find((z) => z.id === f.zone)
  const pay = PAYMENTS.find((p) => p.id === f.payChannel)
  const out: string[] = []
  out.push(`FOOD CORNER ORDER ${orderId}`)
  out.push('')
  for (const r of lines) {
    out.push(`${r.line.qty} × ${r.title} — ${peso(r.total)}`)
    for (const d of r.detail) out.push(`   ${d}`)
  }
  out.push('')
  out.push(`Food total: ${peso(subtotal)}`)
  if (zone) out.push(`${zone.id === PICKUP_ID ? 'Pick-up' : `Delivery (${zone.label})`}: ${feeLabel(zone.id)}${zone.id !== PICKUP_ID ? ' (to be confirmed)' : ''}`)
  if (pay) out.push(`Paid ${peso(amountDue(subtotal, f.payPlan))} via ${pay.bank}${f.reference ? ` · Ref ${f.reference}` : ''}`)
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
  emailed: boolean
  error?: string
}

export async function submitOrder(payload: {
  orderId: string
  text: string
  form: CheckoutForm
  subtotal: number
  amountPaid: number
  proof: { dataUrl: string; name: string }
}): Promise<SubmitResult> {
  try {
    const res = await fetch(SETTINGS.orderEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const msg = await res.text().catch(() => '')
      return { emailed: false, error: msg || `Server answered ${res.status}` }
    }
    return { emailed: true }
  } catch {
    return { emailed: false, error: 'No connection to the order server.' }
  }
}
