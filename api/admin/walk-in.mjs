// POST /api/admin/walk-in: staff add an order for a customer who ordered in person.
// Prices come from the database, the same as website orders.

import { choiceError, PICKUP_ID, peso, resolveLine } from '../../site/src/shared/pricing.js'
import { loadMenu } from '../../server/menu.mjs'
import { db, HttpError, requireStaff, route } from '../../server/supabase.mjs'

const clean = (v, max = 300) => (typeof v === 'string' ? v.trim().slice(0, max) : '')
const PAY_METHODS = ['Cash', 'MariBank', 'PNB', 'Other']

function fmtDate(iso) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('en-PH', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
}
function fmtTime(t) {
  const [h, m] = t.split(':').map(Number)
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`
}

export const POST = route(async (request) => {
  const staff = await requireStaff(request)
  const data = await request.json().catch(() => ({}))
  const f = data?.form ?? {}
  const form = {
    name: clean(f.name, 120) || 'Walk-in customer',
    mobile: clean(f.mobile, 20).replace(/[\s-]/g, ''),
    eventDate: clean(f.eventDate, 10),
    eventTime: clean(f.eventTime, 5),
    zone: clean(f.zone, 40) || PICKUP_ID,
    address: clean(f.address, 400),
    notes: clean(f.notes, 600),
    payMethod: PAY_METHODS.includes(f.payMethod) ? f.payMethod : 'Cash',
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(form.eventDate) || !/^\d{2}:\d{2}$/.test(form.eventTime)) throw new HttpError(400, 'Pick the date and time the food is needed.')

  // Staff may add items the website hides (sold out online) but not ones that were deleted.
  const menu = await loadMenu({ includeUnavailable: true })
  const lines = Array.isArray(data?.lines) ? data.lines.slice(0, 40) : []
  if (!lines.length) throw new HttpError(400, 'Add at least one item.')
  const resolved = []
  for (const l of lines) {
    const err = choiceError(l, menu)
    if (err) throw new HttpError(409, err)
    const r = resolveLine(l, menu)
    if (!r) throw new HttpError(409, 'One of the items is no longer on the menu.')
    resolved.push(r)
  }
  const subtotal = resolved.reduce((n, r) => n + r.total, 0)

  const zone = menu.zones.find((z) => z.id === form.zone)
  if (!zone) throw new HttpError(400, 'Choose pick-up or a delivery area.')
  const pickup = zone.id === PICKUP_ID
  if (!pickup && !form.address) throw new HttpError(400, 'Enter the delivery address.')
  const feeIn = data?.deliveryFee
  const deliveryFee = pickup ? 0 : feeIn === '' || feeIn === null || feeIn === undefined ? null : Math.max(0, Math.round(Number(feeIn) || 0))

  const amountPaid = Math.max(0, Math.min(subtotal, Math.round(Number(data?.amountPaid) || 0)))
  const fullyPaid = amountPaid >= subtotal

  const orderId = await db.rpc('next_order_id')
  const summary = [
    `FOOD CORNER ORDER ${orderId} (walk-in)`,
    '',
    ...resolved.flatMap((r) => [`${r.line.qty} × ${r.title} — ${peso(r.total)}`, ...r.detail.map((d) => `   ${d}`)]),
    '',
    `Food total: ${peso(subtotal)}`,
    pickup ? 'Pick-up: Free' : `Delivery (${zone.label})${deliveryFee === null ? '' : `: ${peso(deliveryFee)}`}`,
    amountPaid > 0 ? `Paid ${peso(amountPaid)}${fullyPaid ? '' : ' (down payment)'} via ${form.payMethod}` : 'Not paid yet',
    ...(fullyPaid ? [] : [`Balance: ${peso(subtotal - amountPaid)}, due on pick-up or delivery`]),
    '',
    `When: ${fmtDate(form.eventDate)}, ${fmtTime(form.eventTime)}`,
    `Name: ${form.name}`,
    ...(form.mobile ? [`Mobile: ${form.mobile}`] : []),
    ...(pickup ? [] : [`Address: ${form.address}`]),
    ...(form.notes ? [`Notes: ${form.notes}`] : []),
  ].join('\n')

  const [order] = await db.insert('orders', {
    id: orderId,
    source: 'walk-in',
    status: 'confirmed',
    payment_status: amountPaid > 0 ? 'verified' : 'unverified',
    customer_name: form.name,
    mobile: form.mobile,
    event_date: form.eventDate,
    event_time: form.eventTime,
    zone_id: zone.id,
    zone_label: zone.label,
    address: form.address || null,
    notes: form.notes || null,
    pay_channel: amountPaid > 0 ? form.payMethod : null,
    items: resolved.map((r) => ({ kind: r.line.kind, refId: r.line.refId, choices: r.line.choices, addOns: r.line.addOns, paluto: r.line.paluto, title: r.title, detail: r.detail, qty: r.line.qty, unitPrice: r.unitPrice, total: r.total })),
    subtotal,
    delivery_fee: deliveryFee,
    amount_paid: amountPaid,
    summary,
  })
  await db.insert('order_events', { order_id: orderId, status: 'confirmed', note: 'Walk-in order added in the admin panel', actor: staff.id, actor_name: staff.full_name || staff.email })

  return Response.json({ ok: true, order })
})
