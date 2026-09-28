import { Check } from '@phosphor-icons/react'
import { useEffect, useRef, useState } from 'react'
import type { Package } from '../data/menu'
import { peso, useOrder } from '../lib/order'
import { Sheet } from './Sheet'
import { Button, Stepper } from './ui'

export function PackageBuilder({ pkg: incoming, onClose }: { pkg: Package | null; onClose: () => void }) {
  const { add } = useOrder()
  // Keep the last package mounted so the sheet can animate out after it closes.
  const last = useRef<Package | null>(null)
  if (incoming) last.current = incoming
  const pkg = incoming ?? last.current
  const [choices, setChoices] = useState<Record<string, string[]>>({})
  const [addOns, setAddOns] = useState<Record<string, number>>({})
  const [qty, setQty] = useState(1)
  const firstImg = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setChoices({})
    setAddOns({})
    setQty(1)
  }, [pkg?.id])

  if (!pkg) return null

  const toggle = (groupId: string, optionId: string, limit: number) => {
    setChoices((c) => {
      const cur = c[groupId] ?? []
      if (cur.includes(optionId)) return { ...c, [groupId]: cur.filter((x) => x !== optionId) }
      if (limit === 1) return { ...c, [groupId]: [optionId] }
      if (cur.length >= limit) return c
      return { ...c, [groupId]: [...cur, optionId] }
    })
  }

  const missing = pkg.groups.filter((g) => (choices[g.id]?.length ?? 0) < g.choose)
  const addOnTotal = (pkg.addOns ?? []).reduce((n, a) => n + (addOns[a.id] ?? 0) * a.price, 0)
  const total = (pkg.price + addOnTotal) * qty

  return (
    <Sheet
      open={!!incoming}
      onClose={onClose}
      title={pkg.name}
      footer={
        <div className="flex flex-col gap-3">
          {missing.length > 0 && (
            <p className="text-sm text-ink-soft" aria-live="polite">
              Still to choose: {missing.map((g) => `${g.label} (${g.choose - (choices[g.id]?.length ?? 0)} more)`).join(', ')}
            </p>
          )}
          <div className="flex items-center gap-3">
            <Stepper label="packages" value={qty} onChange={setQty} max={10} />
            <Button
              size="lg"
              className="flex-1"
              disabled={missing.length > 0}
              onClick={() => {
                add({ kind: 'package', refId: pkg.id, choices, addOns, qty }, firstImg.current)
                onClose()
              }}
            >
              <span className="num">Add to table · {peso(total)}</span>
            </Button>
          </div>
        </div>
      }
    >
      <div ref={firstImg} className="leaf mb-5 flex items-center justify-between gap-4 rounded-[18px] p-4">
        <div>
          <p className="num display text-3xl font-extrabold text-sun">{peso(pkg.price)}</p>
          <p className="text-sm text-white/85">
            Good for <span className="num">{pkg.paxMin === pkg.paxMax ? pkg.paxMin : `${pkg.paxMin}–${pkg.paxMax}`}</span> pax, depending on how much your guests eat
          </p>
        </div>
        <span className="num tag shrink-0 px-2.5 py-1 text-xs font-bold">{pkg.code}</span>
      </div>

      {pkg.fixed.length > 0 && (
        <div className="mb-7">
          <h3 className="display text-lg font-bold">Already included</h3>
          <ul className="mt-3 flex flex-wrap gap-2">
            {pkg.fixed.map((f) => (
              <li key={f.name} className="inline-flex items-center gap-1.5 rounded-full bg-leaf/10 px-3 py-1.5 text-sm font-semibold text-leaf-700">
                <Check size={14} weight="bold" /> {f.name}
              </li>
            ))}
            {pkg.freebies?.map((f) => (
              <li key={f} className="inline-flex items-center gap-1.5 rounded-full bg-sun/50 px-3 py-1.5 text-sm font-semibold">
                Free {f}
              </li>
            ))}
          </ul>
        </div>
      )}

      {pkg.groups.map((g) => {
        const picked = choices[g.id] ?? []
        const full = picked.length >= g.choose
        return (
          <fieldset key={g.id} className="mb-7">
            <legend className="flex w-full items-baseline justify-between gap-3">
              <span className="display text-lg font-bold">{g.label}</span>
              <span className={`num text-sm font-semibold ${full ? 'text-leaf' : 'text-ink-soft'}`}>
                {g.choose === 1 ? 'Choose 1' : `${picked.length} of ${g.choose} chosen`}
              </span>
            </legend>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {g.options.map((o) => {
                const on = picked.includes(o.id)
                const locked = !on && full && g.choose > 1
                return (
                  <button
                    key={o.id}
                    type="button"
                    role={g.choose === 1 ? 'radio' : 'checkbox'}
                    aria-checked={on}
                    disabled={locked}
                    onClick={() => toggle(g.id, o.id, g.choose)}
                    className={`group relative cursor-pointer rounded-[16px] p-2 text-left transition-[background-color,box-shadow,opacity] duration-200 disabled:cursor-not-allowed disabled:opacity-40 ${
                      on ? 'bg-leaf text-white shadow-[var(--shadow-tray)]' : 'bg-white ring-1 ring-inset ring-ink/10 hover:ring-leaf/50'
                    }`}
                  >
                    <div className="foil aspect-[4/3]">
                      <img src={o.img} alt="" loading="lazy" />
                    </div>
                    <span className="mt-2 block px-1 pb-1 text-sm font-semibold leading-snug">{o.name}</span>
                    {on && (
                      <span className="absolute right-3.5 top-3.5 grid size-7 place-items-center rounded-full bg-sun text-ink shadow">
                        <Check size={16} weight="bold" />
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </fieldset>
        )
      })}

      {pkg.addOns && (
        <div className="mb-4">
          <h3 className="display text-lg font-bold">Add-ons</h3>
          <ul className="mt-3 divide-y divide-ink/10 rounded-[16px] bg-white px-4 ring-1 ring-inset ring-ink/10">
            {pkg.addOns.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 py-3">
                <div>
                  <p className="font-semibold">{a.name}</p>
                  <p className="num text-sm text-ink-soft">
                    +{peso(a.price)}
                    {a.perUnit ? ` per ${a.perUnit}` : ''}
                  </p>
                </div>
                <Stepper label={a.name} min={0} max={a.max ?? 10} value={addOns[a.id] ?? 0} onChange={(n) => setAddOns((s) => ({ ...s, [a.id]: n }))} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </Sheet>
  )
}
