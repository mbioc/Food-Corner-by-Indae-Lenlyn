// POST /api/admin/order-status: staff move an order along and the customer gets an email.

import { esc, page, sendEmail } from '../../server/email.mjs'
import { db, HttpError, requireStaff, route } from '../../server/supabase.mjs'

const STATUSES = ['pending', 'confirmed', 'cooking', 'out_for_delivery', 'ready_for_pickup', 'completed', 'cancelled']
const PAYMENT = ['unverified', 'verified', 'rejected']

const MESSAGES = {
  confirmed: (o) => ({
    subject: `Order ${o.id} confirmed · Food Corner`,
    title: 'Your order is confirmed!',
    body: `Salamat po, ${esc(o.customer_name)}! Lenlyn confirmed your order <b>${esc(o.id)}</b> for <b>${esc(o.event_date)}</b>.${
      o.delivery_fee ? ` Delivery fee: <b>₱${o.delivery_fee.toLocaleString('en-PH')}</b>, paid to the rider.` : ''
    }`,
  }),
  out_for_delivery: (o) => ({ subject: `Order ${o.id} is on the way`, title: 'Your food is on the way', body: `The rider has your order <b>${esc(o.id)}</b> and is heading to you now.` }),
  ready_for_pickup: (o) => ({ subject: `Order ${o.id} is ready for pick-up`, title: 'Ready for pick-up', body: `Your order <b>${esc(o.id)}</b> is ready at the kitchen in Tabgas, behind Mother Blessed.` }),
  cancelled: (o) => ({ subject: `Order ${o.id} was cancelled`, title: 'Order cancelled', body: `Your order <b>${esc(o.id)}</b> was cancelled. Lenlyn will message you about your payment.` }),
}

export const POST = route(async (request) => {
  const staff = await requireStaff(request)
  const body = await request.json().catch(() => ({}))
  const { orderId, status, paymentStatus, deliveryFee, staffNote, note, notify = true } = body
  if (!orderId) throw new HttpError(400, 'Missing order.')
  const [order] = await db.select('orders', `id=eq.${encodeURIComponent(orderId)}&select=*`)
  if (!order) throw new HttpError(404, 'Order not found.')

  const patch = {}
  if (status !== undefined) {
    if (!STATUSES.includes(status)) throw new HttpError(400, 'Unknown status.')
    patch.status = status
  }
  if (paymentStatus !== undefined) {
    if (!PAYMENT.includes(paymentStatus)) throw new HttpError(400, 'Unknown payment status.')
    patch.payment_status = paymentStatus
  }
  if (deliveryFee !== undefined) patch.delivery_fee = deliveryFee === null || deliveryFee === '' ? null : Math.max(0, Math.round(Number(deliveryFee)))
  if (staffNote !== undefined) patch.staff_note = String(staffNote).slice(0, 1000)
  if (!Object.keys(patch).length) throw new HttpError(400, 'Nothing to update.')

  const [updated] = await db.update('orders', `id=eq.${encodeURIComponent(orderId)}`, patch)

  const changes = []
  if (patch.status && patch.status !== order.status) changes.push(patch.status)
  if (patch.payment_status && patch.payment_status !== order.payment_status) changes.push(`payment_${patch.payment_status}`)
  if ('delivery_fee' in patch && patch.delivery_fee !== order.delivery_fee) changes.push('delivery_fee')
  for (const c of changes.length ? changes : note ? ['note'] : []) {
    await db.insert('order_events', {
      order_id: orderId,
      status: c,
      note: c === 'delivery_fee' ? `Delivery fee set to ₱${patch.delivery_fee ?? '—'}` : note || null,
      actor: staff.id,
      actor_name: staff.full_name || staff.email,
    })
  }

  let emailed = false
  const msg = patch.status && patch.status !== order.status && MESSAGES[patch.status]
  if (notify && msg && updated.email) {
    const m = msg(updated)
    emailed = await sendEmail({ to: [{ email: updated.email, name: updated.customer_name }], subject: m.subject, html: page(m.title, m.body, updated.summary), text: `${m.title}\n\n${updated.summary}` })
  }
  return Response.json({ ok: true, order: updated, emailed })
})
