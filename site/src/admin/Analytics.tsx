import { useMemo, useState } from 'react'
import { useAdmin } from './data'
import { fmtDate, manilaToday, peso } from './meta'
import type { Order } from './sb'
import { Empty, Page } from './ui'

const RANGES = [
  { id: 7, label: '7 days' },
  { id: 30, label: '30 days' },
  { id: 90, label: '90 days' },
  { id: 365, label: '12 months' },
] as const

const dayKey = (iso: string) => new Date(new Date(iso).getTime() + 8 * 3600e3).toISOString().slice(0, 10) // Manila date

export function Analytics() {
  const { orders, loading } = useAdmin()
  const [range, setRange] = useState<(typeof RANGES)[number]['id']>(30)

  const data = useMemo(() => {
    const today = manilaToday()
    const start = new Date(`${today}T00:00:00`)
    start.setDate(start.getDate() - (range - 1))
    const startKey = start.toISOString().slice(0, 10)
    const inRange = orders.filter((o) => dayKey(o.created_at) >= startKey)
    const counted = inRange.filter((o) => o.status !== 'cancelled')
    const sales = counted.reduce((n, o) => n + o.subtotal, 0)

    // Sales over time: daily buckets for short ranges, weekly for 90 days, monthly for a year.
    const bucket = range <= 30 ? 'day' : range <= 90 ? 'week' : 'month'
    const buckets: { key: string; label: string; total: number; orders: number }[] = []
    const cursor = new Date(start)
    while (cursor.toISOString().slice(0, 10) <= today) {
      const k = cursor.toISOString().slice(0, 10)
      const label =
        bucket === 'day'
          ? fmtDate(k, { month: 'short', day: 'numeric' })
          : bucket === 'week'
            ? `Wk of ${fmtDate(k, { month: 'short', day: 'numeric' })}`
            : fmtDate(k, { month: 'short', year: '2-digit' })
      buckets.push({ key: k, label, total: 0, orders: 0 })
      if (bucket === 'day') cursor.setDate(cursor.getDate() + 1)
      else if (bucket === 'week') cursor.setDate(cursor.getDate() + 7)
      else cursor.setMonth(cursor.getMonth() + 1, 1)
    }
    for (const o of counted) {
      const k = dayKey(o.created_at)
      const b = [...buckets].reverse().find((x) => x.key <= k)
      if (b) {
        b.total += o.subtotal
        b.orders += 1
      }
    }

    const items = new Map<string, { qty: number; total: number }>()
    for (const o of counted)
      for (const it of o.items) {
        const cur = items.get(it.title) ?? { qty: 0, total: 0 }
        items.set(it.title, { qty: cur.qty + it.qty, total: cur.total + it.total })
      }
    const top = [...items.entries()].map(([name, v]) => ({ name, ...v })).sort((a, b) => b.total - a.total).slice(0, 8)

    const areas = new Map<string, number>()
    for (const o of counted) areas.set(o.zone_id === 'pickup' ? 'Pick-up' : (o.zone_label ?? 'Other'), (areas.get(o.zone_id === 'pickup' ? 'Pick-up' : (o.zone_label ?? 'Other')) ?? 0) + 1)
    const byArea = [...areas.entries()].map(([name, n]) => ({ name, n })).sort((a, b) => b.n - a.n)

    // Cooking load: the next 14 days by event date (all non-cancelled orders).
    const load = Array.from({ length: 14 }, (_, i) => {
      const d = new Date(`${today}T00:00:00`)
      d.setDate(d.getDate() + i)
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      const list = orders.filter((o) => o.event_date === k && o.status !== 'cancelled')
      return { key: k, label: fmtDate(k, { weekday: 'short', day: 'numeric' }), orders: list.length, total: list.reduce((n, o) => n + o.subtotal, 0) }
    })

    return {
      sales,
      count: counted.length,
      avg: counted.length ? Math.round(sales / counted.length) : 0,
      cancelled: inRange.length - counted.length,
      toCheck: orders.filter((o) => o.status !== 'cancelled' && o.payment_status === 'unverified').length,
      buckets,
      bucket,
      top,
      byArea,
      load,
    }
  }, [orders, range])

  return (
    <Page
      title="Sales"
      actions={
        <div className="flex gap-1 rounded-[12px] bg-white p-1 ring-1 ring-inset ring-ink/10" role="group" aria-label="Date range">
          {RANGES.map((r) => (
            <button key={r.id} type="button" aria-pressed={range === r.id} onClick={() => setRange(r.id)} className={`h-9 cursor-pointer rounded-[9px] px-3 text-sm font-semibold ${range === r.id ? 'bg-leaf text-white' : 'hover:bg-ink/5'}`}>
              {r.label}
            </button>
          ))}
        </div>
      }
    >
      {loading ? (
        <div className="h-64 animate-pulse rounded-[20px] bg-ink/5" />
      ) : (
        <>
          <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat label="Sales" value={peso(data.sales)} note={`last ${RANGES.find((r) => r.id === range)!.label}, excluding cancelled`} />
            <Stat label="Orders" value={String(data.count)} note={data.cancelled ? `${data.cancelled} cancelled` : 'none cancelled'} />
            <Stat label="Average order" value={peso(data.avg)} />
            <Stat label="Payments to check" value={String(data.toCheck)} note="all open orders" />
          </dl>

          <Panel title={`Sales by ${data.bucket}`} className="mt-6">
            {data.count === 0 ? <Empty title="No sales in this period yet" /> : <SalesChart buckets={data.buckets} />}
          </Panel>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <Panel title="Best sellers">
              {data.top.length === 0 ? <Empty title="No items sold yet" /> : <HBars rows={data.top.map((t) => ({ name: t.name, value: t.total, label: `${peso(t.total)} · ${t.qty} sold` }))} />}
            </Panel>
            <Panel title="Orders by area">
              {data.byArea.length === 0 ? <Empty title="No orders yet" /> : <HBars rows={data.byArea.map((a) => ({ name: a.name, value: a.n, label: `${a.n} ${a.n === 1 ? 'order' : 'orders'}` }))} />}
            </Panel>
          </div>

          <Panel title="Cooking load, next 14 days" className="mt-6">
            <HBars rows={data.load.map((d) => ({ name: d.label, value: d.orders, label: d.orders ? `${d.orders} ${d.orders === 1 ? 'order' : 'orders'} · ${peso(d.total)}` : '—' }))} compact />
          </Panel>
        </>
      )}
    </Page>
  )
}

function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="rounded-[18px] bg-white p-4 ring-1 ring-inset ring-ink/8">
      <dt className="text-sm font-semibold text-ink-soft">{label}</dt>
      <dd className="num display mt-1 text-2xl font-extrabold">{value}</dd>
      {note && <dd className="mt-0.5 text-xs text-ink-soft">{note}</dd>}
    </div>
  )
}

function Panel({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-[20px] bg-white p-4 ring-1 ring-inset ring-ink/8 sm:p-5 ${className}`}>
      <h2 className="display mb-4 text-lg font-bold">{title}</h2>
      {children}
    </section>
  )
}

/** Vertical bars, one series (leaf). Hover or focus a bar for its value; a table sits behind the toggle. */
function SalesChart({ buckets }: { buckets: { key: string; label: string; total: number; orders: number }[] }) {
  const [hover, setHover] = useState<number | null>(null)
  const [asTable, setAsTable] = useState(false)
  const max = Math.max(1, ...buckets.map((b) => b.total))
  const H = 200
  const ticks = [0, 0.5, 1].map((f) => Math.round(max * f))
  const every = Math.ceil(buckets.length / 8)

  if (asTable)
    return (
      <>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink/10 text-left text-ink-soft">
              <th className="py-1.5 font-semibold">Period</th>
              <th className="py-1.5 text-right font-semibold">Orders</th>
              <th className="py-1.5 text-right font-semibold">Sales</th>
            </tr>
          </thead>
          <tbody>
            {buckets.map((b) => (
              <tr key={b.key} className="border-b border-ink/5">
                <td className="py-1.5">{b.label}</td>
                <td className="num py-1.5 text-right">{b.orders}</td>
                <td className="num py-1.5 text-right font-semibold">{peso(b.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <button type="button" onClick={() => setAsTable(false)} className="mt-3 cursor-pointer text-sm font-semibold text-leaf underline">
          Show chart
        </button>
      </>
    )

  return (
    <div>
      <div className="relative flex gap-2">
        <div className="num flex w-14 shrink-0 flex-col justify-between text-right text-xs text-ink-soft" style={{ height: H }}>
          {[...ticks].reverse().map((t) => (
            <span key={t}>{t >= 1000 ? `₱${Math.round(t / 1000)}k` : `₱${t}`}</span>
          ))}
        </div>
        <div className="relative min-w-0 flex-1">
          <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-col justify-between" style={{ height: H }} aria-hidden>
            {ticks.map((t) => (
              <span key={t} className="block border-t border-ink/8" />
            ))}
          </div>
          <div className="relative flex items-end gap-[2px]" style={{ height: H }} role="img" aria-label="Sales per period">
            {buckets.map((b, i) => (
              <button
                key={b.key}
                type="button"
                className="group relative flex h-full min-w-0 flex-1 cursor-default items-end focus:outline-none"
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(i)}
                onBlur={() => setHover(null)}
                aria-label={`${b.label}: ${peso(b.total)}, ${b.orders} orders`}
              >
                <span
                  className={`block w-full rounded-t-[4px] transition-colors ${hover === i ? 'bg-leaf-700' : 'bg-leaf'}`}
                  style={{ height: b.total ? Math.max(3, (b.total / max) * H) : 0 }}
                />
              </button>
            ))}
          </div>
          {hover !== null && (
            <div
              className="pointer-events-none absolute -top-2 z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-[10px] bg-ink px-3 py-2 text-xs text-white shadow-lg"
              style={{ left: `${((hover + 0.5) / buckets.length) * 100}%` }}
            >
              <p className="font-semibold">{buckets[hover].label}</p>
              <p className="num">
                {peso(buckets[hover].total)} · {buckets[hover].orders} {buckets[hover].orders === 1 ? 'order' : 'orders'}
              </p>
            </div>
          )}
          <div className="mt-1.5 grid gap-[2px] text-[11px] text-ink-soft" style={{ gridTemplateColumns: `repeat(${buckets.length}, minmax(0, 1fr))` }} aria-hidden>
            {buckets.map((b, i) =>
              i % every === 0 ? (
                <span key={b.key} className="truncate" style={{ gridColumn: `span ${Math.min(every, buckets.length - i)}` }}>
                  {b.label.replace('Wk of ', '')}
                </span>
              ) : null,
            )}
          </div>
        </div>
      </div>
      <button type="button" onClick={() => setAsTable(true)} className="mt-3 cursor-pointer text-sm font-semibold text-leaf underline">
        Show as table
      </button>
    </div>
  )
}

/** Horizontal bars, one hue, labels in ink beside each bar. */
function HBars({ rows, compact = false }: { rows: { name: string; value: number; label: string }[]; compact?: boolean }) {
  const max = Math.max(1, ...rows.map((r) => r.value))
  return (
    <ul className={compact ? 'space-y-1.5' : 'space-y-3'}>
      {rows.map((r) => (
        <li key={r.name} className="grid grid-cols-[minmax(0,9rem)_1fr] items-center gap-3 text-sm sm:grid-cols-[minmax(0,12rem)_1fr]">
          <span className="truncate font-semibold" title={r.name}>
            {r.name}
          </span>
          <span className="flex min-w-0 items-center gap-2">
            <span className="h-3 rounded-r-[4px] bg-leaf" style={{ width: `${(r.value / max) * 70}%`, minWidth: r.value ? 4 : 0 }} />
            <span className="num shrink-0 text-ink-soft">{r.label}</span>
          </span>
        </li>
      ))}
    </ul>
  )
}

export type { Order }
