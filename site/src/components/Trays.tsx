import { Plus } from '@phosphor-icons/react'
import { useState } from 'react'
import { TRAY_CATEGORIES, type TrayCategory } from '../data/menu'
import { useMenu } from '../lib/menu'
import { peso, useOrder } from '../lib/order'

export function Trays() {
  const { add, lines } = useOrder()
  const { trays: TRAYS } = useMenu()
  const [cat, setCat] = useState<TrayCategory | 'all'>('all')
  const list = cat === 'all' ? TRAYS : TRAYS.filter((t) => t.category === cat)
  const qtyOf = (id: string) => lines.filter((l) => l.kind === 'tray' && l.refId === id).reduce((n, l) => n + l.qty, 0)

  return (
    <section id="trays" className="mx-auto max-w-7xl px-4 py-14 md:px-8 md:py-20" aria-labelledby="trays-h">
      <div className="max-w-2xl">
        <h2 id="trays-h" className="display text-4xl font-extrabold leading-[1.05] md:text-5xl">
          Build your own table, one tray at a time
        </h2>
        <p className="mt-3 text-lg text-ink-soft">Every price is for one large foil tray. Mix them with a package or order them on their own.</p>
      </div>

      <div className="mt-8 flex flex-wrap gap-2" role="group" aria-label="Filter trays">
        {[{ id: 'all' as const, label: 'All trays' }, ...TRAY_CATEGORIES].map((c) => (
          <button
            key={c.id}
            type="button"
            aria-pressed={cat === c.id}
            onClick={() => setCat(c.id)}
            className={`h-10 shrink-0 cursor-pointer rounded-full px-4 text-sm font-semibold transition-colors ${cat === c.id ? 'bg-leaf text-white' : 'bg-white ring-1 ring-inset ring-ink/12 hover:ring-leaf/50'}`}
          >
            {c.label}
          </button>
        ))}
      </div>

      <ul className="mt-8 grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {list.map((t) => {
          const q = qtyOf(t.id)
          return (
            <li key={t.id} className="flex flex-col">
              <div className="foil relative aspect-[4/3]">
                <img src={t.img} alt={t.name} loading="lazy" />
                {q > 0 && <span className="num absolute left-2.5 top-2.5 rounded-full bg-sun px-2 py-0.5 text-xs font-bold text-ink shadow">{q} on table</span>}
              </div>
              <div className="mt-3 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-semibold leading-snug">{t.name}</h3>
                  <p className="num display mt-0.5 text-xl font-extrabold text-leaf">
                    {peso(t.price)}
                    {t.note && <span className="ml-1.5 font-body text-sm font-semibold text-ink-soft">{t.note}</span>}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={(e) => add({ kind: 'tray', refId: t.id }, e.currentTarget.closest('li')?.querySelector('.foil'))}
                  aria-label={`Add ${t.name} to your table`}
                  className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-[12px] bg-sun text-ink transition-[background-color,transform] duration-200 hover:bg-sun-deep active:scale-[0.94]"
                >
                  <Plus size={20} weight="bold" />
                </button>
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
