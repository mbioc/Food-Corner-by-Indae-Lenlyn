// POST /api/order: a customer places an order from the website.
// Prices are recomputed from the database, never trusted from the browser.

import { choiceError, DOWNPAYMENT_RATE, PICKUP_ID, peso, resolveLine, zoneFeeLabel } from '../site/src/shared/pricing.js'
import { esc, page, sendEmail } from '../server/email.mjs'
import { loadMenu } from '../server/menu.mjs'
import { db, HttpError, route, storage } from '../server/supabase.mjs'

const MAX_PROOF_BYTES = 4 * 1024 * 1024
const PH_MOBILE = /^(\+?63|0)9\d{9}$/
const clean = (v, max = 300) => (typeof v === 'string' ? v.trim().slice(0, max) : '')

function fmtDate(iso) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('en-PH', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
}
function fmtTime(t) {
  const [h, m] = t.split(':').map(Number)
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`
}

export const POST = route(async (request) => {
  let data
  try {
    data = await request.json()
  } catch {
    throw new HttpError(400, 'Bad request.')
  }
  const f = data?.form ?? {}
  const form = {
    name: clean(f.name, 120),
    mobile: clean(f.mobile, 20).replace(/[\s-]/g, ''),
    email: clean(f.email, 160),
    fbName: clean(f.fbName, 120),
    eventDate: clean(f.eventDate, 10),
    eventTime: clean(f.eventTime, 5),
    occasion: clean(f.occasion, 60),
    pax: Number.parseInt(f.pax, 10) || null,
    zone: clean(f.zone, 40),
    address: clean(f.address, 400),
    landmark: clean(f.landmark, 200),
    notes: clean(f.notes, 600),
    tupperware: f.tupperware === true,
    down: f.payPlan === 'down',
    payChannel: clean(f.payChannel, 40),
    reference: clean(f.reference, 80),
  }
  if (!form.name || !PH_MOBILE.test(form.mobile)) throw new HttpError(400, 'Name and a valid PH mobile number are required.')
  if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) throw new HttpError(400, 'That email looks incomplete.')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(form.eventDate) || !/^\d{2}:\d{2}$/.test(form.eventTime)) throw new HttpError(400, 'Pick a date and time.')
  const today = new Date(Date.now() + 8 * 3600e3).toISOString().slice(0, 10) // Asia/Manila
  if (form.eventDate < today) throw new HttpError(400, 'That date has passed.')

  const [blocked] = await db.select('blocked_dates', `day=eq.${form.eventDate}&select=day`)
  if (blocked) throw new HttpError(409, 'Lenlyn is fully booked on that date. Please pick another day.')

  const menu = await loadMenu()
  const lines = Array.isArray(data?.lines) ? data.lines.slice(0, 40) : []
  if (!lines.length) throw new HttpError(400, 'Your table is empty.')
  const resolved = []
  for (const l of lines) {
    const err = choiceError(l, menu)
    if (err) throw new HttpError(409, err)
    const r = resolveLine(l, menu)
    if (!r) throw new HttpError(409, 'Something on your table is no longer available. Please review your order.')
    resolved.push(r)
  }
  const subtotal = resolved.reduce((n, r) => n + r.total, 0)
  const PAY = { maribank: 'MariBank', pnb: 'PNB' }
  form.payChannel = PAY[form.payChannel] ?? form.payChannel
  const amountPaid = form.down ? Math.round(subtotal * DOWNPAYMENT_RATE) : subtotal
  const pickupOnly = resolved.some((r) => r.pickupOnly)

  const zone = menu.zones.find((z) => z.id === form.zone)
  if (!zone) throw new HttpError(400, 'Choose delivery or pick-up.')
  if (pickupOnly && zone.id !== PICKUP_ID) throw new HttpError(400, 'Your order has a pick-up-only package.')
  if (zone.id !== PICKUP_ID && !form.address) throw new HttpError(400, 'We need the delivery address.')

  const m = /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/.exec(data?.proof?.dataUrl ?? '')
  if (!m) throw new HttpError(400, 'Upload the screenshot of your payment.')
  const bytes = Buffer.from(m[2], 'base64')
  if (bytes.length > MAX_PROOF_BYTES) throw new HttpError(413, 'Payment screenshot is too large.')

  const orderId = await db.rpc('next_order_id')
  const ext = m[1].split('/')[1].replace('jpeg', 'jpg')
  const proofPath = `${form.eventDate.slice(0, 7)}/${orderId}.${ext}`
  await storage.upload('payment-proofs', proofPath, bytes, m[1])

  const items = resolved.map((r) => ({ kind: r.line.kind, refId: r.line.refId, choices: r.line.choices, addOns: r.line.addOns, paluto: r.line.paluto, title: r.title, detail: r.detail, qty: r.line.qty, unitPrice: r.unitPrice, total: r.total }))
  const summary = [
    `FOOD CORNER ORDER ${orderId}`,
    '',
    ...resolved.flatMap((r) => [`${r.line.qty} × ${r.title} — ${peso(r.total)}`, ...r.detail.map((d) => `   ${d}`)]),
    '',
    `Food total: ${peso(subtotal)}`,
    `${zone.id === PICKUP_ID ? 'Pick-up' : `Delivery (${zone.label})`}: ${zoneFeeLabel(zone)}${zone.id !== PICKUP_ID ? ' (to be confirmed)' : ''}`,
    `Paid ${peso(amountPaid)}${form.down ? ' (down payment)' : ''} via ${form.payChannel || '—'}${form.reference ? ` · Ref ${form.reference}` : ''}`,
    ...(form.down ? [`Balance: ${peso(subtotal - amountPaid)}, due on pick-up or delivery`] : []),
    '',
    `When: ${fmtDate(form.eventDate)}, ${fmtTime(form.eventTime)}${form.occasion ? ` · ${form.occasion}` : ''}${form.pax ? ` · ${form.pax} pax` : ''}`,
    `Name: ${form.name}`,
    `Mobile: ${form.mobile}`,
    ...(form.email ? [`Email: ${form.email}`] : []),
    ...(form.fbName ? [`Facebook: ${form.fbName}`] : []),
    ...(zone.id !== PICKUP_ID ? [`Address: ${form.address}`, ...(form.landmark ? [`Landmark: ${form.landmark}`] : [])] : []),
    ...(form.tupperware ? ['Packaging: white tupperware containers (+₱150 per 5 dishes, Lenlyn confirms the amount)'] : []),
    ...(form.notes ? [`Notes: ${form.notes}`] : []),
  ].join('\n')

  await db.insert('orders', {
    id: orderId,
    customer_name: form.name,
    mobile: form.mobile,
    email: form.email || null,
    fb_name: form.fbName || null,
    event_date: form.eventDate,
    event_time: form.eventTime,
    occasion: form.occasion || null,
    pax: form.pax,
    zone_id: zone.id,
    zone_label: zone.label,
    address: form.address || null,
    landmark: form.landmark || null,
    notes: [form.tupperware ? 'Wants white tupperware containers (+₱150 per 5 dishes).' : '', form.notes].filter(Boolean).join(' ') || null,
    pay_channel: form.payChannel || null,
    reference: form.reference || null,
    items,
    subtotal,
    delivery_fee: zone.id === PICKUP_ID ? 0 : zone.feeMin === zone.feeMax && !zone.quote ? zone.feeMin : null,
    amount_paid: amountPaid,
    proof_path: proofPath,
    summary,
  })
  await db.insert('order_events', { order_id: orderId, status: 'pending', note: 'Order placed on the website', actor_name: form.name })

  let emailed = false
  if (process.env.OWNER_EMAIL) {
    emailed = await sendEmail({
      to: [{ email: process.env.OWNER_EMAIL, name: 'Lenlyn' }],
      replyTo: form.email ? { email: form.email, name: form.name } : undefined,
      subject: `New order ${orderId} · ${form.name} · ${form.eventDate}`,
      html: page(`New order ${orderId}`, `From <b>${esc(form.name)}</b> · <a href="tel:${esc(form.mobile)}">${esc(form.mobile)}</a>. Payment screenshot attached. Open the admin panel to confirm it.`, summary),
      text: summary,
      attachment: [{ name: `${orderId}-payment.${ext}`, content: m[2] }],
    })
  }
  if (form.email) {
    await sendEmail({
      to: [{ email: form.email, name: form.name }],
      subject: `We got your order ${orderId} · Food Corner`,
      html: page(`Salamat, ${form.name}!`, `We received your order <b>${esc(orderId)}</b>. Lenlyn will check your payment and email you once it's confirmed.`, summary),
      text: summary,
    })
  }

  return Response.json({ ok: true, orderId, subtotal, emailed, summary })
})
