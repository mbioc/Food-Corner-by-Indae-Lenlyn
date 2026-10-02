import { ChatText, Check, MessengerLogo, Phone, Printer, X } from '@phosphor-icons/react'
import { useEffect, useRef, useState } from 'react'
import { Sheet } from '../components/Sheet'
import { Button, inputClass } from '../components/ui'
import { useAdmin } from './data'
import { fmtDate, fmtTime, nextStatus, peso, STATUS } from './meta'
import { adminApi, supabase, type Order, type OrderEvent, type OrderStatus } from './sb'
import { PayPill, StatusPill } from './ui'

const EVENT_LABEL: Record<string, string> = {
  ...Object.fromEntries(Object.entries(STATUS).map(([k, v]) => [k, v.label])),
  payment_verified: 'Payment verified',
  payment_rejected: 'Payment marked as a problem',
  payment_unverified: 'Payment set back to unchecked',
  delivery_fee: 'Delivery fee updated',
  balance_paid: 'Balance received, fully paid',
  balance_unpaid: 'Balance set back to unpaid',
  note: 'Note',
}

export function OrderDrawer({ order: incoming, onClose }: { order: Order | null; onClose: () => void }) {
  const last = useRef<Order | null>(null)
  if (incoming) last.current = incoming
  const order = incoming ?? last.current
  const { replaceOrder, toast } = useAdmin()
  const [events, setEvents] = useState<OrderEvent[]>([])
  const [proofUrl, setProofUrl] = useState<string | null>(null)
  const [fee, setFee] = useState('')
  const [note, setNote] = useState('')
  const [notify, setNotify] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)

  const id = incoming?.id
  useEffect(() => {
    if (!id || !incoming) return
    setFee(incoming.delivery_fee?.toString() ?? '')
    setNote(incoming.staff_note ?? '')
    setProofUrl(null)
    supabase.from('order_events').select('*').eq('order_id', id).order('created_at').then(({ data }) => setEvents((data as OrderEvent[]) ?? []))
    if (incoming.proof_path)
      supabase.storage
        .from('payment-proofs')
        .createSignedUrl(incoming.proof_path, 3600)
        .then(({ data }) => setProofUrl(data?.signedUrl ?? null))
    // Only when a different order opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  if (!order) return null
  const pickup = order.zone_id === 'pickup'
  const next = nextStatus(order.status, pickup)

  const update = async (key: string, body: Record<string, unknown>, done: string) => {
    setBusy(key)
    try {
      const res = await adminApi<{ order: Order; emailed: boolean }>('order-status', { body: { orderId: order.id, notify, ...body } })
      replaceOrder(res.order)
      const { data } = await supabase.from('order_events').select('*').eq('order_id', order.id).order('created_at')
      setEvents((data as OrderEvent[]) ?? [])
      toast(res.emailed ? `${done} · customer emailed` : done)
    } catch (e) {
      toast((e as Error).message)
    } finally {
      setBusy(null)
    }
  }

  const setStatus = (s: OrderStatus) => update(s, { status: s }, `Marked as ${STATUS[s].label}`)

  return (
    <Sheet
      open={!!incoming}
      onClose={onClose}
      title={`Order ${order.id}`}
      wideClass="md:w-[640px]"
      footer={
        <div className="flex flex-wrap items-center gap-2">
          {next && (
            <Button size="lg" className="flex-1" disabled={!!busy} onClick={() => setStatus(next)} data-autofocus>
              {busy === next ? 'Saving…' : `Mark as ${STATUS[next].label}`}
            </Button>
          )}
          <select
            aria-label="Set status"
            value={order.status}
            disabled={!!busy}
            onChange={(e) => setStatus(e.target.value as OrderStatus)}
            className={`${inputClass()} !h-14 !w-auto flex-1 font-semibold sm:flex-none`}
          >
            {Object.entries(STATUS).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </select>
        </div>
      }
    >
      <div className="flex flex-wrap items-center gap-2">
        <StatusPill status={order.status} />
        <PayPill status={order.payment_status} />
        <span className="text-sm text-ink-soft">Placed {new Date(order.created_at).toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
      </div>

      <div className="leaf on-leaf mt-4 grid grid-cols-2 gap-4 rounded-[18px] p-4">
        <div>
          <p className="text-sm text-white/75">Needed on</p>
          <p className="num display text-xl font-extrabold text-sun">{fmtDate(order.event_date, { weekday: 'short', month: 'long', day: 'numeric' })}</p>
          <p className="num text-white">{fmtTime(order.event_time)}</p>
        </div>
        <div>
          <p className="text-sm text-white/75">Food total</p>
          <p className="num display text-xl font-extrabold text-sun">{peso(order.subtotal)}</p>
          <p className="text-sm text-white">{[order.occasion, order.pax ? `${order.pax} pax` : null].filter(Boolean).join(' · ') || '—'}</p>
        </div>
      </div>

      <section className="mt-6">
        <h3 className="display text-lg font-bold">Customer</h3>
        <p className="mt-1 font-semibold">{order.customer_name}</p>
        <p className="num text-ink-soft">
          {order.mobile}
          {order.email ? ` · ${order.email}` : ''}
          {order.fb_name ? ` · FB: ${order.fb_name}` : ''}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <a href={`tel:${order.mobile}`} className="inline-flex h-10 items-center gap-1.5 rounded-[10px] bg-leaf px-3 text-sm font-semibold text-white">
            <Phone size={16} weight="bold" /> Call
          </a>
          <a href={`sms:${order.mobile}`} className="inline-flex h-10 items-center gap-1.5 rounded-[10px] bg-leaf/10 px-3 text-sm font-semibold text-leaf-700">
            <ChatText size={16} weight="bold" /> Text
          </a>
          {order.fb_name && (
            <a href={`https://www.facebook.com/search/people/?q=${encodeURIComponent(order.fb_name)}`} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center gap-1.5 rounded-[10px] bg-leaf/10 px-3 text-sm font-semibold text-leaf-700">
              <MessengerLogo size={16} weight="bold" /> Find on Facebook
            </a>
          )}
        </div>
      </section>

      <section className="mt-6">
        <h3 className="display text-lg font-bold">{pickup ? 'Pick-up at the kitchen' : `Delivery · ${order.zone_label}`}</h3>
        {!pickup && (
          <>
            <p className="mt-1">{order.address}</p>
            {order.landmark && <p className="text-ink-soft">Landmark: {order.landmark}</p>}
            <div className="mt-3 flex items-end gap-2">
              <label className="flex-1">
                <span className="text-sm font-semibold">Delivery fee (₱)</span>
                <input type="number" inputMode="numeric" min={0} value={fee} onChange={(e) => setFee(e.target.value)} className={`num mt-1.5 ${inputClass()}`} placeholder="Not set yet" />
              </label>
              <Button variant="ghost" disabled={!!busy || fee === (order.delivery_fee?.toString() ?? '')} onClick={() => update('fee', { deliveryFee: fee === '' ? null : Number(fee) }, 'Delivery fee saved')}>
                Save fee
              </Button>
            </div>
          </>
        )}
        {order.notes && <p className="mt-3 rounded-[12px] bg-tag p-3 text-sm">Customer note: {order.notes}</p>}
      </section>

      <section className="mt-6">
        <h3 className="display text-lg font-bold">Items</h3>
        <ul className="mt-2 divide-y divide-ink/10">
          {order.items.map((it, i) => (
            <li key={i} className="py-3">
              <div className="flex justify-between gap-3">
                <p className="font-semibold">
                  <span className="num">{it.qty}×</span> {it.title}
                </p>
                <p className="num font-bold">{peso(it.total)}</p>
              </div>
              {it.detail?.length > 0 && (
                <ul className="mt-1 space-y-0.5 text-sm text-ink-soft">
                  {it.detail.map((d) => (
                    <li key={d}>{d}</li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-6">
        <h3 className="display text-lg font-bold">Payment</h3>
        <p className="mt-1 text-ink-soft">
          <span className="num font-semibold text-ink">{peso(order.amount_paid)}</span>
          {order.amount_paid < order.subtotal ? ' down payment' : ''} via {order.pay_channel ?? '—'}
          {order.reference ? ` · Ref ${order.reference}` : ''}
        </p>
        {order.amount_paid < order.subtotal &&
          (order.balance_paid_at ? (
            <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-[12px] bg-leaf/10 p-3 text-sm font-semibold text-leaf-700">
              <span>
                Balance of <span className="num">{peso(order.subtotal - order.amount_paid)}</span> received. Fully paid.
              </span>
              <button type="button" disabled={!!busy} onClick={() => update('bal', { balancePaid: false }, 'Balance set back to unpaid')} className="cursor-pointer font-semibold underline">
                Undo
              </button>
            </p>
          ) : (
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-[12px] bg-sun/40 p-3">
              <p className="text-sm font-semibold">
                Balance to collect on {pickup ? 'pick-up' : 'delivery'}: <span className="num">{peso(order.subtotal - order.amount_paid)}</span>
              </p>
              <Button variant="leaf" size="sm" disabled={!!busy} onClick={() => update('bal', { balancePaid: true }, 'Balance marked as received')}>
                <Check size={16} weight="bold" /> Balance received
              </Button>
            </div>
          ))}
        {order.proof_path ? (
          proofUrl ? (
            <a href={proofUrl} target="_blank" rel="noreferrer" className="mt-3 block w-fit">
              <img src={proofUrl} alt={`Payment screenshot for ${order.id}`} className="max-h-72 rounded-[14px] ring-1 ring-ink/10" />
              <span className="mt-1 block text-sm font-semibold text-leaf underline">Open full size</span>
            </a>
          ) : (
            <div className="mt-3 h-48 w-40 animate-pulse rounded-[14px] bg-ink/6" />
          )
        ) : (
          <p className="mt-2 text-sm text-ink-soft">No screenshot uploaded.</p>
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          <Button variant="leaf" size="sm" disabled={!!busy || order.payment_status === 'verified'} onClick={() => update('pv', { paymentStatus: 'verified' }, 'Payment verified')}>
            <Check size={16} weight="bold" /> Payment received
          </Button>
          <Button variant="ghost" size="sm" disabled={!!busy || order.payment_status === 'rejected'} onClick={() => update('pr', { paymentStatus: 'rejected' }, 'Payment marked as a problem')}>
            <X size={16} weight="bold" /> Problem with payment
          </Button>
        </div>
      </section>

      <section className="mt-6">
        <label htmlFor="staff-note" className="display text-lg font-bold">
          Kitchen note
        </label>
        <textarea id="staff-note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} className={`${inputClass()} mt-2 h-auto py-3`} placeholder="Only the team sees this" />
        <Button variant="ghost" size="sm" className="mt-2" disabled={!!busy || note === (order.staff_note ?? '')} onClick={() => update('note', { staffNote: note, note: note ? `Note: ${note}` : undefined }, 'Note saved')}>
          Save note
        </Button>
      </section>

      <section className="mt-6">
        <div className="flex items-center justify-between gap-3">
          <h3 className="display text-lg font-bold">History</h3>
          <Button variant="ghost" size="sm" onClick={() => printSlip(order)}>
            <Printer size={16} weight="bold" /> Print slip
          </Button>
        </div>
        <ol className="mt-3 space-y-2 border-l-2 border-leaf/25 pl-4">
          {events.map((e) => (
            <li key={e.id} className="text-sm">
              <p className="font-semibold">{EVENT_LABEL[e.status] ?? e.status}</p>
              <p className="text-ink-soft">
                {new Date(e.created_at).toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                {e.actor_name ? ` · ${e.actor_name}` : ''}
                {e.note && e.status !== 'note' ? ` · ${e.note}` : ''}
              </p>
              {e.status === 'note' && e.note && <p className="text-ink-soft">{e.note}</p>}
            </li>
          ))}
        </ol>
      </section>

      {order.email && (
        <label className="mt-6 flex cursor-pointer items-center gap-2 text-sm">
          <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} className="size-4 accent-[var(--color-leaf)]" />
          Email the customer when I change the status
        </label>
      )}
    </Sheet>
  )
}

function printSlip(o: Order) {
  const w = window.open('', '_blank', 'width=480,height=720')
  if (!w) return
  const esc = (s: string) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]!)
  w.document.write(`<!doctype html><title>${o.id}</title><style>body{font:14px/1.45 Arial,sans-serif;margin:24px;color:#0d150d}h1{font-size:20px;margin:0 0 4px}pre{white-space:pre-wrap;font:inherit}</style>
  <h1>Food Corner by Indae Lenlyn</h1><p>Kitchen slip · printed ${new Date().toLocaleString('en-PH')}</p>
  <pre>${esc(o.summary)}</pre>${o.delivery_fee != null ? `<p>Delivery fee: ₱${o.delivery_fee}</p>` : ''}${o.staff_note ? `<p><b>Kitchen note:</b> ${esc(o.staff_note)}</p>` : ''}
  <script>window.onload=()=>{window.print()}</script>`)
  w.document.close()
}
