import { BUSINESS, PAYMENTS, PICKUP_ID, SETTINGS, TUPPERWARE, type Zone } from '../data/business'
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
  downAmount: string // pesos the customer chooses to pay now when payPlan is 'down'
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
  downAmount: '',
  reference: '',
}

export const OCCASIONS = ['Birthday', 'Fiesta', 'Baptism', 'Wedding', 'Reunion', 'Company event', 'Family salu-salo', 'Other']

export type Errors = Partial<Record<keyof CheckoutForm | 'proof', string>>

const PH_MOBILE = /^(\+?63|0)9\d{9}$/

export function validateStep(step: number, f: CheckoutForm, hasProof: boolean, pickupOnly: boolean, blocked: string[] = [], subtotal = 0, dp?: Downpayment): Errors {
  const e: Errors = {}
  if (step === 0) {
    if (!f.name.trim()) e.name = 'Please enter your name.'
    if (!PH_MOBILE.test(f.mobile.replace(/[\s-]/g, ''))) e.mobile = 'Enter a PH mobile number, like 0917 123 4567.'
    if (f.email.trim() && !/^\S+@\S+\.\S+$/.test(f.email.trim())) e.email = 'That email looks incomplete.'
    if (!f.fbName.trim()) e.fbName = 'Please enter your Facebook name.'
  }
  if (step === 1) {
    if (!f.eventDate) e.eventDate = 'Pick the date you need the food.'
    else if (f.eventDate < todayISO()) e.eventDate = 'That date has passed. Pick today or later.'
    else if (blocked.includes(f.eventDate)) e.eventDate = 'Lenlyn is fully booked on this date. Please pick another day.'
    if (!f.eventTime) e.eventTime = 'Pick a time.'
    else if (f.eventTime < '08:00' || f.eventTime > '18:00') e.eventTime = 'Pick a time between 8:00 AM and 6:00 PM.'
    if (!f.zone) e.zone = 'Choose delivery or pick-up.'
    if (pickupOnly && f.zone && f.zone !== PICKUP_ID) e.zone = 'Your order has a pick-up-only package. Choose pick-up.'
    if (f.zone && f.zone !== PICKUP_ID && !f.address.trim()) e.address = 'We need the delivery address.'
  }
  if (step === 2) {
    if (f.payPlan === 'down' && dp && canPayDown(subtotal, dp)) {
      const n = Number(f.downAmount)
      if (!Number.isFinite(n) || n < dp.min) e.downAmount = `The down payment must be at least ${peso(dp.min)}.`
      else if (n >= subtotal) e.downAmount = `Enter less than the total of ${peso(subtotal)}, or choose Full payment.`
    }
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

export interface Downpayment {
  enabled: boolean
  min: number
}

/** A down payment only makes sense when the order is bigger than the minimum. */
export const canPayDown = (subtotal: number, dp: Downpayment) => dp.enabled && subtotal > dp.min

export function amountDue(subtotal: number, f: Pick<CheckoutForm, 'payPlan' | 'downAmount'>, dp: Downpayment) {
  if (f.payPlan !== 'down' || !canPayDown(subtotal, dp)) return subtotal
  const n = Math.round(Number(f.downAmount) || 0)
  // While the customer is still typing, show at least the minimum and never more than the total.
  return Math.max(dp.min, Math.min(subtotal, n))
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
  if (zone) out.push(`${zone.id === PICKUP_ID ? 'Pick-up' : `Delivery (${zone.label})`}: ${feeLabel(zone.id, zones)}${zone.id !== PICKUP_ID ? ' (to be confirmed)' : ''}`)
  const paid = amountDue(subtotal, f, dp)
  if (pay) out.push(`Paid ${peso(paid)}${paid < subtotal ? ' (down payment)' : ''} via ${pay.bank}${f.reference ? ` · Ref ${f.reference}` : ''}`)
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

const IMAGE_EXT = /\.(jpe?g|png|webp|gif|heic|heif|bmp)$/i

/** True for anything that may be a picture. Some phones (and Messenger's browser) leave the file type blank. */
export const looksLikeImage = (file: File) => file.type.startsWith('image/') || (!file.type && (IMAGE_EXT.test(file.name) || !/\.[a-z0-9]+$/i.test(file.name)))

/** Opens the picture, trying the fast decoder first and a plain <img> on browsers without it (older iPhones). */
async function decodeImage(file: File): Promise<{ src: CanvasImageSource; w: number; h: number; done: () => void }> {
  if (typeof createImageBitmap === 'function') {
    try {
      const b = await createImageBitmap(file)
      return { src: b, w: b.width, h: b.height, done: () => b.close() }
    } catch {
      // fall through to <img>
    }
  }
  const url = URL.createObjectURL(file)
  const img = new Image()
  try {
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject(new Error('decode failed'))
      img.src = url
    })
  } catch (e) {
    URL.revokeObjectURL(url)
    throw e
  }
  return { src: img, w: img.naturalWidth, h: img.naturalHeight, done: () => URL.revokeObjectURL(url) }
}

const readDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(String(r.result))
    r.onerror = () => reject(r.error)
    r.readAsDataURL(file)
  })

/** Downscale the payment screenshot so it fits in an email and uploads fast on mobile data. */
export async function compressImage(file: File, maxSide = 1400, quality = 0.8): Promise<{ dataUrl: string; name: string }> {
  try {
    const img = await decodeImage(file)
    try {
      const scale = Math.min(1, maxSide / Math.max(img.w, img.h))
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(img.w * scale))
      canvas.height = Math.max(1, Math.round(img.h * scale))
      canvas.getContext('2d')!.drawImage(img.src, 0, 0, canvas.width, canvas.height)
      const dataUrl = canvas.toDataURL('image/jpeg', quality)
      if (!dataUrl.startsWith('data:image/jpeg')) throw new Error('canvas export failed')
      return { dataUrl, name: file.name.replace(/\.[^.]+$/, '') + '.jpg' }
    } finally {
      img.done()
    }
  } catch (err) {
    // Last resort: send the file as it is, when it's a type the server stores and small enough to upload.
    const type = file.type || (/\.png$/i.test(file.name) ? 'image/png' : /\.webp$/i.test(file.name) ? 'image/webp' : 'image/jpeg')
    if (/^image\/(jpeg|png|webp)$/.test(type) && file.size <= 3_000_000) {
      const raw = await readDataUrl(file)
      return { dataUrl: raw.replace(/^data:[^;]*;/, `data:${type};`), name: file.name }
    }
    throw err
  }
}

export interface SubmitResult {
  saved: boolean
  /** true when the server refused the order itself (sold out, fully booked…), so the customer must fix it */
  rejected?: boolean
  orderId?: string
  emailed?: boolean
  error?: string
}

export async function submitOrder(payload: { lines: Line[]; form: CheckoutForm; proof: { dataUrl: string; name: string } | null; proofLater?: boolean }): Promise<SubmitResult> {
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
