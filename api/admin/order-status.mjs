// POST /api/admin/order-status: staff move an order along and the customer gets an email.

import { esc, page, sendEmail } from '../../server/email.mjs'
import { db, HttpError, requireStaff, route } from '../../server/supabase.mjs'

const pesoText = (n) => `₱${Number(n).toLocaleString('en-PH')}`

// Rewrites the "Paid …" and "Balance …" lines of the stored order summary after the amount paid changes.
function summaryWithPaid(summary, paid, subtotal) {
  const lines = (summary ?? '').split('\n').filter((l) => !l.startsWith('Balance: '))
  const i = lines.findIndex((l) => /^Paid ₱|^Not paid yet/.test(l))
  if (i < 0) return summary
  const down = paid < subtotal
  const rest = lines[i].startsWith('Paid ') ? lines[i].replace(/^Paid ₱[\d,]+( \(down payment\))?/, '') : ''
  lines[i] = paid > 0 ? `Paid ${pesoText(paid)}${down ? ' (down payment)' : ''}${rest}` : 'Not paid yet'
  if (down) lines.splice(i + 1, 0, `Balance: ${pesoText(subtotal - paid)}, due on pick-up or delivery`)
  return lines.join('\n')
}

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
  const { orderId, status, paymentStatus, deliveryFee, staffNote, note, balancePaid, amountPaid, notify = true } = body
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
  if (balancePaid !== undefined) patch.balance_paid_at = balancePaid ? new Date().toISOString() : null
  if (amountPaid !== undefined) {
    // Staff correct the amount when the screenshot doesn't match the payment the customer chose.
    const n = Math.round(Number(amountPaid))
    if (!Number.isFinite(n) || n < 0 || n > order.subtotal) throw new HttpError(400, `Enter an amount from ₱0 to ${pesoText(order.subtotal)}.`)
    patch.amount_paid = n
    patch.summary = summaryWithPaid(order.summary, n, order.subtotal)
    // A new amount means the balance has not been collected yet.
    if (n !== order.amount_paid) patch.balance_paid_at = null
  }
  if (staffNote !== undefined) patch.staff_note = String(staffNote).slice(0, 1000)
  if (!Object.keys(patch).length) throw new HttpError(400, 'Nothing to update.')

  const [updated] = await db.update('orders', `id=eq.${encodeURIComponent(orderId)}`, patch)

  const changes = []
  if (patch.status && patch.status !== order.status) changes.push(patch.status)
  if (patch.payment_status && patch.payment_status !== order.payment_status) changes.push(`payment_${patch.payment_status}`)
  if ('delivery_fee' in patch && patch.delivery_fee !== order.delivery_fee) changes.push('delivery_fee')
  if ('amount_paid' in patch && patch.amount_paid !== order.amount_paid) changes.push('amount_paid')
  if ('balance_paid_at' in patch && !('amount_paid' in patch) && !!patch.balance_paid_at !== !!order.balance_paid_at) changes.push(patch.balance_paid_at ? 'balance_paid' : 'balance_unpaid')
  for (const c of changes.length ? changes : note ? ['note'] : []) {
    await db.insert('order_events', {
      order_id: orderId,
      status: c,
      note:
        c === 'delivery_fee'
          ? `Delivery fee set to ₱${patch.delivery_fee ?? '—'}`
          : c === 'amount_paid'
            ? `Amount paid changed from ${pesoText(order.amount_paid)} to ${pesoText(patch.amount_paid)}`
            : note || null,
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
