import { MagnifyingGlass, Truck, Storefront } from '@phosphor-icons/react'
import { useMemo, useState } from 'react'
import { useAdmin } from './data'
import { ACTIVE, fmtDate, fmtTime, peso, timeAgo } from './meta'
import { OrderDrawer } from './OrderDrawer'
import type { Order, OrderStatus } from './sb'
import { Empty, Page, PayPill, StatusPill } from './ui'

type Tab = 'active' | OrderStatus | 'all'

const TABS: { id: Tab; label: string; match: (o: Order) => boolean }[] = [
  { id: 'active', label: 'Active', match: (o) => ACTIVE.includes(o.status) },
  { id: 'pending', label: 'New', match: (o) => o.status === 'pending' },
  { id: 'confirmed', label: 'Confirmed', match: (o) => o.status === 'confirmed' },
  { id: 'cooking', label: 'Cooking', match: (o) => o.status === 'cooking' },
  { id: 'out_for_delivery', label: 'Out / Ready', match: (o) => o.status === 'out_for_delivery' || o.status === 'ready_for_pickup' },
  { id: 'completed', label: 'Completed', match: (o) => o.status === 'completed' },
  { id: 'cancelled', label: 'Cancelled', match: (o) => o.status === 'cancelled' },
  { id: 'all', label: 'All', match: () => true },
]

export function Orders() {
  const { orders, loading, error } = useAdmin()
  const [tab, setTab] = useState<Tab>('active')
  const [q, setQ] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)

  const counts = useMemo(() => Object.fromEntries(TABS.map((t) => [t.id, orders.filter(t.match).length])), [orders])
  const list = useMemo(() => {
    const t = TABS.find((x) => x.id === tab)!
    const needle = q.trim().toLowerCase()
    const rows = orders.filter(t.match).filter((o) => !needle || `${o.id} ${o.customer_name} ${o.mobile} ${o.zone_label ?? ''}`.toLowerCase().includes(needle))
    // Upcoming work sorts by the event date; history sorts newest first.
    return tab === 'active' || ACTIVE.includes(tab as OrderStatus)
      ? rows.sort((a, b) => `${a.event_date}${a.event_time}`.localeCompare(`${b.event_date}${b.event_time}`))
      : rows
  }, [orders, tab, q])

  const open = orders.find((o) => o.id === openId) ?? null

  return (
    <Page
      title="Orders"
      actions={
        <label className="relative">
          <span className="sr-only">Search orders</span>
          <MagnifyingGlass size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name, mobile, order no." className="h-11 w-64 max-w-[70vw] rounded-[12px] border-2 border-ink/10 bg-white pl-9 pr-3 focus:border-leaf focus:outline-none" />
        </label>
      }
    >
      <div className="mb-5 flex flex-wrap gap-2" role="tablist" aria-label="Order status">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`inline-flex h-10 shrink-0 cursor-pointer items-center gap-2 rounded-full px-4 text-sm font-semibold transition-colors ${tab === t.id ? 'bg-leaf text-white' : 'bg-white ring-1 ring-inset ring-ink/12 hover:ring-leaf/50'}`}
          >
            {t.label}
            <span className={`num rounded-full px-1.5 text-xs ${tab === t.id ? 'bg-white/20' : 'bg-ink/6'}`}>{counts[t.id]}</span>
          </button>
        ))}
      </div>

      {error && <p className="mb-4 rounded-[12px] bg-chili/10 p-3 text-sm font-semibold text-chili">Couldn't load orders: {error}</p>}

      {loading ? (
        <div className="grid gap-2">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="h-[76px] animate-pulse rounded-[16px] bg-ink/5" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <Empty title={q ? 'No orders match that search' : tab === 'pending' ? 'No new orders' : 'Nothing here yet'}>
          {!q && tab === 'active' && 'New orders from the website will show up here the moment they arrive.'}
        </Empty>
      ) : (
        <ul className="grid gap-2">
          {list.map((o) => {
            const pickup = o.zone_id === 'pickup'
            return (
              <li key={o.id}>
                <button
                  type="button"
                  onClick={() => setOpenId(o.id)}
                  className="grid w-full cursor-pointer grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 rounded-[16px] bg-white p-4 text-left ring-1 ring-inset ring-ink/8 transition-shadow hover:ring-leaf/40 md:grid-cols-[120px_1.4fr_1fr_110px_auto]"
                >
                  <div className="md:order-none">
                    <p className="num font-bold">{fmtDate(o.event_date)}</p>
                    <p className="num text-sm text-ink-soft">{fmtTime(o.event_time)}</p>
                  </div>
                  <div className="col-span-2 min-w-0 md:col-span-1">
                    <p className="truncate font-semibold">
                      {o.customer_name} <span className="num font-normal text-ink-soft">· {o.id}</span>
                    </p>
                    <p className="truncate text-sm text-ink-soft">{o.items.map((i) => `${i.qty}× ${i.title}`).join(', ')}</p>
                  </div>
                  <p className="hidden items-center gap-1.5 truncate text-sm text-ink-soft md:flex">
                    {pickup ? <Storefront size={16} /> : <Truck size={16} />}
                    {pickup ? 'Pick-up' : o.zone_label}
                  </p>
                  <p className="num font-bold md:text-right">{peso(o.subtotal)}</p>
                  <div className="col-span-2 flex flex-wrap items-center gap-1.5 md:col-span-1 md:justify-end">
                    <StatusPill status={o.status} />
                    {o.status !== 'cancelled' && <PayPill status={o.payment_status} />}
                    {o.amount_paid < o.subtotal && !o.balance_paid_at && o.status !== 'cancelled' && <span className="inline-flex h-6 items-center whitespace-nowrap rounded-full bg-ink/8 px-2.5 text-xs font-bold">Balance {peso(o.subtotal - o.amount_paid)}</span>}
                    <span className="text-xs text-ink-soft md:hidden">· {timeAgo(o.created_at)}</span>
                  </div>
                </button>
              </li>
            )
          })}
        </ul>
      )}
      <OrderDrawer order={open} onClose={() => setOpenId(null)} />
    </Page>
  )
}
