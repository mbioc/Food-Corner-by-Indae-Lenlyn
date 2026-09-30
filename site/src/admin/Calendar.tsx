import { CaretLeft, CaretRight, Prohibit } from '@phosphor-icons/react'
import { useEffect, useMemo, useState } from 'react'
import { Button, inputClass } from '../components/ui'
import { useAdmin } from './data'
import { fmtDate, fmtTime, manilaToday, peso } from './meta'
import { OrderDrawer } from './OrderDrawer'
import { supabase } from './sb'
import { Page, StatusPill } from './ui'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export function CalendarView() {
  const { orders, toast } = useAdmin()
  const today = manilaToday()
  const [month, setMonth] = useState(() => new Date(`${today.slice(0, 7)}-01T00:00:00`))
  const [selected, setSelected] = useState(today)
  const [blocked, setBlocked] = useState<Record<string, string>>({})
  const [reason, setReason] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)

  useEffect(() => {
    supabase
      .from('blocked_dates')
      .select('day, reason')
      .then(({ data }) => setBlocked(Object.fromEntries((data ?? []).map((b) => [b.day, b.reason]))))
  }, [])

  const byDay = useMemo(() => {
    const m: Record<string, typeof orders> = {}
    for (const o of orders) if (o.status !== 'cancelled') (m[o.event_date] ??= []).push(o)
    for (const k in m) m[k].sort((a, b) => a.event_time.localeCompare(b.event_time))
    return m
  }, [orders])

  const cells = useMemo(() => {
    const first = new Date(month)
    const start = new Date(first)
    start.setDate(1 - first.getDay())
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      return d
    })
  }, [month])

  const shift = (n: number) => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + n, 1))
  const dayOrders = byDay[selected] ?? []
  const isBlocked = selected in blocked

  const toggleBlock = async () => {
    if (isBlocked) {
      const { error } = await supabase.from('blocked_dates').delete().eq('day', selected)
      if (error) return toast(error.message)
      setBlocked(({ [selected]: _, ...rest }) => rest)
      toast(`${fmtDate(selected)} is open for orders again`)
    } else {
      const { error } = await supabase.from('blocked_dates').insert({ day: selected, reason: reason.trim() })
      if (error) return toast(error.message)
      setBlocked((b) => ({ ...b, [selected]: reason.trim() }))
      setReason('')
      toast(`${fmtDate(selected)} is now fully booked on the website`)
    }
  }

  return (
    <Page title="Calendar">
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-[20px] bg-white p-3 ring-1 ring-inset ring-ink/8 sm:p-5">
          <div className="mb-4 flex items-center justify-between">
            <button type="button" onClick={() => shift(-1)} aria-label="Previous month" className="grid size-10 cursor-pointer place-items-center rounded-[10px] hover:bg-ink/6">
              <CaretLeft size={20} weight="bold" />
            </button>
            <h2 className="display text-xl font-bold">{month.toLocaleDateString('en-PH', { month: 'long', year: 'numeric' })}</h2>
            <button type="button" onClick={() => shift(1)} aria-label="Next month" className="grid size-10 cursor-pointer place-items-center rounded-[10px] hover:bg-ink/6">
              <CaretRight size={20} weight="bold" />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-ink-soft">
            {WEEKDAYS.map((d) => (
              <div key={d} className="pb-1">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((d) => {
              const key = iso(d)
              const list = byDay[key] ?? []
              const inMonth = d.getMonth() === month.getMonth()
              const sel = key === selected
              const past = key < today
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelected(key)}
                  aria-pressed={sel}
                  aria-label={`${fmtDate(key)}: ${list.length} orders${key in blocked ? ', fully booked' : ''}`}
                  className={`relative flex aspect-square cursor-pointer flex-col items-start rounded-[10px] p-1.5 text-left transition-colors sm:aspect-[1.1] sm:p-2 ${
                    sel ? 'bg-leaf text-white' : key in blocked ? 'bg-chili/8' : list.length ? 'bg-sun/30 hover:bg-sun/45' : 'hover:bg-ink/5'
                  } ${inMonth ? '' : 'opacity-35'}`}
                >
                  <span className={`num text-sm font-bold ${key === today && !sel ? 'rounded-full bg-ink px-1.5 text-white' : ''} ${past && !sel ? 'text-ink-soft' : ''}`}>{d.getDate()}</span>
                  {list.length > 0 && <span className={`num mt-auto text-xs font-bold ${sel ? 'text-sun' : 'text-leaf-700'}`}>{list.length} {list.length === 1 ? 'order' : 'orders'}</span>}
                  {key in blocked && <Prohibit size={14} weight="bold" className={`absolute right-1.5 top-1.5 ${sel ? 'text-white' : 'text-chili'}`} aria-hidden />}
                </button>
              )
            })}
          </div>
          <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-soft">
            <span className="inline-flex items-center gap-1.5">
              <span className="size-3 rounded bg-sun/45" /> Has orders
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Prohibit size={12} weight="bold" className="text-chili" /> Fully booked (closed on the website)
            </span>
          </p>
        </div>

        <div>
          <h2 className="display text-xl font-bold">{fmtDate(selected, { weekday: 'long', month: 'long', day: 'numeric' })}</h2>
          <p className="text-ink-soft">
            {dayOrders.length} {dayOrders.length === 1 ? 'order' : 'orders'}
            {dayOrders.length > 0 && ` · ${peso(dayOrders.reduce((n, o) => n + o.subtotal, 0))}`}
            {dayOrders.some((o) => o.pax) && ` · ${dayOrders.reduce((n, o) => n + (o.pax ?? 0), 0)} guests`}
          </p>
          <ul className="mt-4 grid gap-2">
            {dayOrders.map((o) => (
              <li key={o.id}>
                <button type="button" onClick={() => setOpenId(o.id)} className="w-full cursor-pointer rounded-[14px] bg-white p-3 text-left ring-1 ring-inset ring-ink/8 hover:ring-leaf/40">
                  <div className="flex items-center justify-between gap-2">
                    <p className="num font-bold">{fmtTime(o.event_time)}</p>
                    <StatusPill status={o.status} />
                  </div>
                  <p className="font-semibold">{o.customer_name}</p>
                  <p className="text-sm text-ink-soft">{o.items.map((i) => `${i.qty}× ${i.title}`).join(', ')}</p>
                </button>
              </li>
            ))}
          </ul>
          {selected >= today && (
            <div className="mt-5 rounded-[16px] bg-white p-4 ring-1 ring-inset ring-ink/8">
              {isBlocked ? (
                <p className="text-sm">
                  <b>Fully booked.</b> Customers can't pick this date on the website.{blocked[selected] ? ` Reason: ${blocked[selected]}` : ''}
                </p>
              ) : (
                <label className="block text-sm">
                  <span className="font-semibold">Block this date</span>
                  <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason (optional), e.g. big fiesta order" className={`${inputClass()} mt-1.5`} />
                </label>
              )}
              <Button variant={isBlocked ? 'ghost' : 'leaf'} size="sm" className="mt-3" onClick={toggleBlock}>
                {isBlocked ? 'Open this date again' : 'Mark as fully booked'}
              </Button>
            </div>
          )}
        </div>
      </div>
      <OrderDrawer order={orders.find((o) => o.id === openId) ?? null} onClose={() => setOpenId(null)} />
    </Page>
  )
}
