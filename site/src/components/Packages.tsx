import { Gift, Storefront, UsersThree } from '@phosphor-icons/react'
import { useMemo, useState } from 'react'
import { PACKAGES, PAX_FILTERS, type Package } from '../data/menu'
import { peso, useOrder } from '../lib/order'
import { PackageBuilder } from './PackageBuilder'
import { Button, PriceTag } from './ui'

type PaxId = (typeof PAX_FILTERS)[number]['id']

function spreadImages(p: Package) {
  const imgs = [...p.fixed.map((f) => f.img), ...p.groups.flatMap((g) => g.options.slice(0, g.choose).map((o) => o.img))]
  const unique = Array.from(new Set(imgs))
  if (unique.length <= 3) return unique
  // Fill all six places on the table so the spread never shows holes.
  return Array.from({ length: 6 }, (_, i) => unique[i % unique.length])
}

const paxText = (p: Package) => (p.paxMin === p.paxMax ? `${p.paxMin}` : `${p.paxMin}–${p.paxMax}`)

export function Packages({ pax, onPax }: { pax: PaxId; onPax: (p: PaxId) => void }) {
  const { add } = useOrder()
  const [building, setBuilding] = useState<Package | null>(null)
  const filter = PAX_FILTERS.find((f) => f.id === pax)!

  const list = useMemo(() => {
    const fits = (p: Package) => p.paxMax >= filter.min && p.paxMin <= filter.max
    return [...PACKAGES].sort((a, b) => Number(fits(b)) - Number(fits(a)) || a.price - b.price).map((p) => ({ p, fits: fits(p) }))
  }, [filter])

  return (
    <section id="packages" className="mx-auto max-w-7xl px-4 py-14 md:px-8 md:py-20" aria-labelledby="packages-h">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <h2 id="packages-h" className="display text-4xl font-extrabold leading-[1.05] md:text-5xl">
            Handaan packages
          </h2>
          <p className="mt-3 text-lg text-ink-soft">Priced per headcount. Choose your dishes inside each package and we cook it fresh for your date.</p>
        </div>
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0" role="group" aria-label="Filter by number of guests">
          {PAX_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              aria-pressed={pax === f.id}
              onClick={() => onPax(f.id)}
              className={`num h-10 shrink-0 cursor-pointer rounded-full px-4 text-sm font-semibold transition-colors ${pax === f.id ? 'bg-leaf text-white' : 'bg-white ring-1 ring-inset ring-ink/12 hover:ring-leaf/50'}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <ul className="mt-10 grid gap-5 lg:grid-cols-2">
        {list.map(({ p, fits }) => {
          const imgs = spreadImages(p)
          const needsChoice = p.groups.length > 0
          return (
            <li key={p.id} className={`group grid grid-cols-[minmax(0,1fr)] overflow-hidden rounded-[24px] bg-white shadow-[0_1px_0_rgb(13_21_13/0.06),0_14px_30px_-22px_rgb(13_21_13/0.5)] transition-opacity sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] ${fits ? '' : 'opacity-55 hover:opacity-100'}`}>
              <div className="leaf grid grid-cols-6 content-center gap-2 p-3 sm:p-4" aria-hidden>
                {imgs.map((src, i) => (
                  <div key={`${src}-${i}`} className={`foil ${imgs.length <= 3 ? (i === 0 ? 'col-span-6 aspect-[16/9]' : 'col-span-3 aspect-[4/3]') : i === 0 ? 'col-span-4 row-span-2' : 'col-span-2 aspect-square'}`}>
                    <img src={src} alt="" loading="lazy" />
                  </div>
                ))}
              </div>
              <div className="flex flex-col p-5 sm:p-6">
                <div className="flex items-center gap-2 text-sm font-semibold text-ink-soft">
                  <span className="num rounded-[6px] bg-ink/6 px-2 py-0.5 text-xs tracking-wide text-ink">{p.code}</span>
                  {p.pickupOnly && (
                    <span className="inline-flex items-center gap-1 text-leaf">
                      <Storefront size={16} weight="bold" /> Pick-up only
                    </span>
                  )}
                </div>
                <h3 className="display mt-2 text-2xl font-extrabold leading-tight">{p.name}</h3>
                <p className="mt-1.5 text-ink-soft">{p.summary}</p>
                <div className="mt-5 flex items-end gap-5">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Good for</p>
                    <p className="num display mt-1 flex items-center gap-1.5 text-3xl font-extrabold text-leaf">
                      <UsersThree size={26} weight="bold" aria-hidden />
                      {paxText(p)}
                      <span className="text-lg font-bold">pax</span>
                    </p>
                  </div>
                  <div className="ml-auto text-right">
                    <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Price</p>
                    <PriceTag amount={peso(p.price)} className="mt-1 text-3xl text-ink" />
                  </div>
                </div>
                {p.freebies && (
                  <p className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-leaf">
                    <Gift size={16} weight="bold" /> Free {p.freebies.join(', ')}
                  </p>
                )}
                <div className="mt-auto pt-5">
                  {needsChoice ? (
                    <Button variant="leaf" className="w-full" onClick={() => setBuilding(p)}>
                      Choose dishes
                    </Button>
                  ) : (
                    <Button
                      variant="leaf"
                      className="w-full"
                      onClick={(e) => add({ kind: 'package', refId: p.id, choices: {}, addOns: {} }, e.currentTarget.closest('li')?.querySelector('.foil'))}
                    >
                      Add to table · {peso(p.price)}
                    </Button>
                  )}
                </div>
              </div>
            </li>
          )
        })}
      </ul>
      <PackageBuilder pkg={building} onClose={() => setBuilding(null)} />
    </section>
  )
}
