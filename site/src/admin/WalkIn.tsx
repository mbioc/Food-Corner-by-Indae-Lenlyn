import { Check, Trash } from '@phosphor-icons/react'
import { useEffect, useMemo, useState } from 'react'
import { DateField, TimeField } from '../components/DateTimeFields'
import { Sheet } from '../components/Sheet'
import { Button, Field, Stepper, inputClass } from '../components/ui'
import type { Package } from '../data/menu'
import { fetchMenu, type Menu } from '../lib/menu'
import { FREE_PALUTO, PICKUP_ID, resolveLine } from '../shared/pricing.js'
import { useAdmin } from './data'
import { manilaToday, peso } from './meta'
import { adminApi, type Order } from './sb'

/* eslint-disable @typescript-eslint/no-explicit-any */
type Line = { kind: string; refId: string; qty: number; choices?: Record<string, string[]>; addOns?: Record<string, number>; paluto?: string }

const PAY_METHODS = ['Cash', 'MariBank', 'PNB', 'Other']

/** The current time rounded up to the next 5 minutes, as "HH:MM". */
function nowRounded() {
  const d = new Date()
  d.setMinutes(Math.ceil(d.getMinutes() / 5) * 5, 0, 0)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export function WalkInSheet({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: (o: Order) => void }) {
  const { toast } = useAdmin()
  const [menu, setMenu] = useState<Menu | null>(null)
  const [lines, setLines] = useState<Line[]>([])
  const [building, setBuilding] = useState<Package | null>(null)
  const [choices, setChoices] = useState<Record<string, string[]>>({})
  const [name, setName] = useState('')
  const [mobile, setMobile] = useState('')
  const [eventDate, setEventDate] = useState(manilaToday())
  const [eventTime, setEventTime] = useState(nowRounded)
  const [zone, setZone] = useState(PICKUP_ID)
  const [address, setAddress] = useState('')
  const [deliveryFee, setDeliveryFee] = useState('')
  const [paid, setPaid] = useState<string | null>(null) // null = follows the total
  const [payMethod, setPayMethod] = useState('Cash')
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  // Start with a clean form every time the sheet opens.
  useEffect(() => {
    if (!open) return
    setMenu(null) // the form mounts fresh once the menu has loaded
    setLines([])
    setBuilding(null)
    setChoices({})
    setName('')
    setMobile('')
    setEventDate(manilaToday())
    setEventTime(nowRounded())
    setZone(PICKUP_ID)
    setAddress('')
    setDeliveryFee('')
    setPaid(null)
    setPayMethod('Cash')
    setNotes('')
    setError('')
    fetchMenu().then(setMenu).catch((e) => setError(`Couldn't load the menu: ${e.message}`))
  }, [open])

  const pricing = useMemo(
    () =>
      menu && {
        trays: menu.trays,
        packages: menu.packages,
        zones: menu.zones,
        lechon: [...menu.whole.map((o) => ({ ...o, kind: 'whole' })), ...menu.belly.map((o) => ({ ...o, kind: 'belly' })), ...menu.inyuha.map((o) => ({ ...o, kind: 'inyuha' }))],
        lechonImg: {},
      },
    [menu],
  )
  const resolved = useMemo(() => (pricing ? lines.map((l) => resolveLine(l, pricing as any)).filter(Boolean) : []) as any[], [lines, pricing])
  const total = resolved.reduce((n, r) => n + r.total, 0)
  const paidNumber = paid === null ? total : Math.max(0, Math.min(total, Math.round(Number(paid) || 0)))

  const addLine = (l: Line) =>
    setLines((cur) => {
      const sig = (x: Line) => JSON.stringify({ ...x, qty: 0 })
      const hit = cur.findIndex((x) => sig(x) === sig(l))
      return hit >= 0 ? cur.map((x, i) => (i === hit ? { ...x, qty: Math.min(20, x.qty + 1) } : x)) : [...cur, l]
    })

  const pick = (value: string) => {
    if (!menu || !value) return
    const [kind, id] = value.split('|')
    if (kind === 'package') {
      const p = menu.packages.find((x) => x.id === id)
      if (!p) return
      if (p.groups.length === 0) return addLine({ kind, refId: id, qty: 1, choices: {}, addOns: {} })
      setChoices({})
      return setBuilding(p)
    }
    addLine({ kind, refId: id, qty: 1, ...(kind === 'lechon' ? { paluto: FREE_PALUTO[0] } : {}) })
  }

  const toggle = (groupId: string, optionId: string, limit: number) =>
    setChoices((c) => {
      const cur = c[groupId] ?? []
      if (cur.includes(optionId)) return { ...c, [groupId]: cur.filter((x) => x !== optionId) }
      if (limit === 1) return { ...c, [groupId]: [optionId] }
      return cur.length >= limit ? c : { ...c, [groupId]: [...cur, optionId] }
    })
  const buildingDone = !!building && building.groups.every((g) => (choices[g.id]?.length ?? 0) === g.choose)

  const save = async () => {
    setError('')
    if (!lines.length) return setError('Add at least one item.')
    if (!eventDate || !eventTime) return setError('Pick the date and time the food is needed.')
    if (zone !== PICKUP_ID && !address.trim()) return setError('Enter the delivery address.')
    setBusy(true)
    try {
      const r = await adminApi<{ order: Order }>('walk-in', {
        body: { lines, form: { name, mobile, eventDate, eventTime, zone, address, notes, payMethod }, deliveryFee, amountPaid: paidNumber },
      })
      toast(`Walk-in order ${r.order.id} saved`)
      onSaved(r.order)
      onClose()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Add walk-in order"
      wideClass="md:w-[640px]"
      footer={
        <div className="flex items-center gap-3">
          <div className="mr-auto min-w-0">
            <p className="text-sm text-ink-soft">Food total</p>
            <p className="num display text-xl font-extrabold">{peso(total)}</p>
          </div>
          <Button size="lg" disabled={busy || !lines.length} onClick={save}>
            {busy ? 'Saving…' : 'Save order'}
          </Button>
        </div>
      }
    >
      {!menu ? (
        error ? <p className="text-sm font-medium text-chili">{error}</p> : <div className="h-40 animate-pulse rounded-[16px] bg-ink/5" />
      ) : (
        <div className="grid gap-6">
          <section>
            <label htmlFor="wi-add" className="display text-lg font-bold">
              Food
            </label>
            <select id="wi-add" data-autofocus className={`${inputClass()} mt-2`} value="" onChange={(e) => pick(e.target.value)}>
              <option value="">Add an item…</option>
              <optgroup label="Packages">
                {menu.packages.map((p) => (
                  <option key={p.id} value={`package|${p.id}`}>
                    {p.name} · {peso(p.price)}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Whole lechon">
                {menu.whole.map((o) => (
                  <option key={o.id} value={`lechon|${o.id}`}>
                    Whole lechon {o.label} · {peso(o.price)}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Lechon belly">
                {menu.belly.map((o) => (
                  <option key={o.id} value={`belly|${o.id}`}>
                    Lechon belly {o.label} · {peso(o.price)}
                  </option>
                ))}
              </optgroup>
              {menu.inyuha.length > 0 && (
                <optgroup label="Lechon Inyuha (customer's pig)">
                  {menu.inyuha.map((o) => (
                    <option key={o.id} value={`inyuha|${o.id}`}>
                      Roasting {o.label} · {peso(o.price)}
                    </option>
                  ))}
                </optgroup>
              )}
              <optgroup label="Large trays">
                {menu.trays.map((t) => (
                  <option key={t.id} value={`tray|${t.id}`}>
                    {t.name} · {peso(t.price)}
                  </option>
                ))}
              </optgroup>
            </select>

            {building && (
              <div className="mt-3 rounded-[16px] bg-white p-4 ring-2 ring-inset ring-leaf/40">
                <p className="font-semibold">
                  {building.name} · <span className="num">{peso(building.price)}</span>
                </p>
                {building.groups.map((g) => {
                  const picked = choices[g.id] ?? []
                  return (
                    <fieldset key={g.id} className="mt-3">
                      <legend className="text-sm font-semibold">
                        {g.label} <span className="num font-normal text-ink-soft">({picked.length} of {g.choose})</span>
                      </legend>
                      <div className="mt-1.5 flex flex-wrap gap-2">
                        {g.options.map((o) => {
                          const on = picked.includes(o.id)
                          return (
                            <button
                              key={o.id}
                              type="button"
                              role={g.choose === 1 ? 'radio' : 'checkbox'}
                              aria-checked={on}
                              disabled={!on && g.choose > 1 && picked.length >= g.choose}
                              onClick={() => toggle(g.id, o.id, g.choose)}
                              className={`inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-full px-3.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${on ? 'bg-leaf text-white' : 'bg-ink/6 hover:bg-ink/10'}`}
                            >
                              {on && <Check size={14} weight="bold" />}
                              {o.name}
                            </button>
                          )
                        })}
                      </div>
                    </fieldset>
                  )
                })}
                <div className="mt-4 flex gap-2">
                  <Button
                    variant="leaf"
                    size="sm"
                    disabled={!buildingDone}
                    onClick={() => {
                      addLine({ kind: 'package', refId: building.id, qty: 1, choices, addOns: {} })
                      setBuilding(null)
                    }}
                  >
                    Add package
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setBuilding(null)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {resolved.length > 0 && (
              <ul className="mt-3 divide-y divide-ink/10 rounded-[16px] bg-white px-4 ring-1 ring-inset ring-ink/8">
                {resolved.map((r, i) => (
                  <li key={i} className="py-3">
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-semibold leading-snug">{r.title}</p>
                      <p className="num shrink-0 font-bold">{peso(r.total)}</p>
                    </div>
                    {r.detail.length > 0 && <p className="mt-0.5 text-sm text-ink-soft">{r.detail.join(' · ')}</p>}
                    {lines[i].kind === 'lechon' && (
                      <label className="mt-2 flex items-center gap-2 text-sm">
                        Free paluto
                        <select className={`${inputClass()} !h-9 !w-auto text-sm`} value={lines[i].paluto} onChange={(e) => setLines((cur) => cur.map((x, j) => (j === i ? { ...x, paluto: e.target.value } : x)))}>
                          {FREE_PALUTO.map((p: string) => (
                            <option key={p}>{p}</option>
                          ))}
                        </select>
                      </label>
                    )}
                    <div className="mt-2 flex items-center justify-between">
                      <Stepper label={`quantity of ${r.title}`} value={lines[i].qty} onChange={(n) => setLines((cur) => cur.map((x, j) => (j === i ? { ...x, qty: Math.max(1, Math.min(20, n)) } : x)))} />
                      <button type="button" onClick={() => setLines((cur) => cur.filter((_, j) => j !== i))} className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-[10px] px-3 text-sm font-medium text-chili hover:bg-chili/10">
                        <Trash size={16} weight="bold" /> Remove
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="grid gap-4">
            <h3 className="display text-lg font-bold">Customer</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name" htmlFor="wi-name" optional>
                <input id="wi-name" className={inputClass()} placeholder="Walk-in customer" value={name} onChange={(e) => setName(e.target.value)} />
              </Field>
              <Field label="Mobile number" htmlFor="wi-mobile" optional>
                <input id="wi-mobile" type="tel" inputMode="tel" className={`num ${inputClass()}`} value={mobile} onChange={(e) => setMobile(e.target.value)} />
              </Field>
            </div>
          </section>

          <section className="grid gap-4">
            <h3 className="display text-lg font-bold">When and where</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Date needed" htmlFor="wi-date">
                <DateField id="wi-date" value={eventDate} onChange={setEventDate} />
              </Field>
              <Field label="Time" htmlFor="wi-time">
                <TimeField id="wi-time" value={eventTime} onChange={setEventTime} />
              </Field>
            </div>
            <Field label="Pick-up or delivery" htmlFor="wi-zone">
              <select id="wi-zone" className={inputClass()} value={zone} onChange={(e) => setZone(e.target.value)}>
                {menu.zones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.label}
                  </option>
                ))}
              </select>
            </Field>
            {zone !== PICKUP_ID && (
              <div className="grid gap-4 sm:grid-cols-[1fr_9rem]">
                <Field label="Delivery address" htmlFor="wi-address">
                  <input id="wi-address" className={inputClass()} value={address} onChange={(e) => setAddress(e.target.value)} />
                </Field>
                <Field label="Delivery fee (₱)" htmlFor="wi-fee" optional>
                  <input id="wi-fee" type="number" inputMode="numeric" min={0} className={`num ${inputClass()}`} value={deliveryFee} onChange={(e) => setDeliveryFee(e.target.value)} />
                </Field>
              </div>
            )}
          </section>

          <section className="grid gap-4">
            <h3 className="display text-lg font-bold">Payment</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Amount received now (₱)" htmlFor="wi-paid" hint={paidNumber >= total ? 'Fully paid' : paidNumber > 0 ? `Balance to collect: ${peso(total - paidNumber)}` : `Not paid yet. To collect: ${peso(total)}`}>
                <input id="wi-paid" type="number" inputMode="numeric" min={0} max={total} className={`num ${inputClass()}`} value={paid === null ? total : paid} onChange={(e) => setPaid(e.target.value)} />
              </Field>
              <Field label="Paid by" htmlFor="wi-method">
                <select id="wi-method" className={inputClass()} value={payMethod} onChange={(e) => setPayMethod(e.target.value)}>
                  {PAY_METHODS.map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                </select>
              </Field>
            </div>
            <Field label="Note" htmlFor="wi-notes" optional>
              <textarea id="wi-notes" rows={2} className={`${inputClass()} h-auto py-3`} placeholder="Less spicy, extra sauce…" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </Field>
          </section>

          {error && (
            <p className="text-sm font-medium text-chili" role="alert">
              {error}
            </p>
          )}
        </div>
      )}
    </Sheet>
  )
}
/* eslint-enable @typescript-eslint/no-explicit-any */
