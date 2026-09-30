import { useRef, useState } from 'react'
import { FREE_PALUTO } from '../shared/pricing.js'
import { useMenu } from '../lib/menu'
import { BUSINESS } from '../data/business'
import { peso, useOrder } from '../lib/order'
import { Button } from './ui'
import { asset } from '../lib/asset'

function Segmented<T extends string>({ name, value, onChange, options }: { name: string; value: T; onChange: (v: T) => void; options: { value: T; label: string; sub?: string }[] }) {
  return (
    <div role="radiogroup" aria-label={name} className="grid gap-2" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
      {options.map((o) => {
        const on = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.value)}
            className={`cursor-pointer rounded-[14px] px-2 py-2.5 text-center transition-colors ${on ? 'bg-sun text-ink' : 'bg-white/10 text-white hover:bg-white/18'}`}
          >
            <span className="num display block text-lg font-extrabold leading-tight">{o.label}</span>
            {o.sub && <span className={`num block text-xs font-semibold ${on ? 'text-ink/75' : 'text-white/75'}`}>{o.sub}</span>}
          </button>
        )
      })}
    </div>
  )
}

export function Lechon() {
  const { add } = useOrder()
  const { whole: WHOLE_LECHON, belly: LECHON_BELLY } = useMenu()
  const [whole, setWhole] = useState(WHOLE_LECHON[0]?.id ?? '')
  const [paluto, setPaluto] = useState<string>(FREE_PALUTO[0])
  const [belly, setBelly] = useState(LECHON_BELLY[0]?.id ?? '')
  const wholeImg = useRef<HTMLDivElement>(null)
  const bellyImg = useRef<HTMLDivElement>(null)
  // Fall back to the first size if the owner removed the selected one.
  const w = WHOLE_LECHON.find((x) => x.id === whole) ?? WHOLE_LECHON[0]
  const b = LECHON_BELLY.find((x) => x.id === belly) ?? LECHON_BELLY[0]
  if (!w || !b) return null

  return (
    <section id="lechon" className="leaf on-leaf" aria-labelledby="lechon-h">
      <div className="mx-auto max-w-7xl px-4 py-16 md:px-8 md:py-24">
        <div className="max-w-2xl">
          <h2 id="lechon-h" className="display text-4xl font-extrabold leading-[1.05] text-white md:text-5xl">
            Lechon, freshly roasted in Tabgas
          </h2>
          <p className="mt-3 text-lg text-white/85">Order the whole pig or just the belly. Every whole lechon comes with a free paluto of paklay or dinuguan.</p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1.35fr_1fr]">
          <article className="overflow-hidden rounded-[24px] bg-leaf-800/60 ring-1 ring-inset ring-white/10">
            <div ref={wholeImg} className="aspect-[16/8] overflow-hidden">
              <img src={asset('/img/hero/lechon-whole.webp')} alt="Whole roasted lechon on banana leaves" className="size-full object-cover" loading="lazy" />
            </div>
            <div className="p-5 sm:p-7">
              <div className="flex items-baseline justify-between gap-4">
                <h3 className="display text-2xl font-extrabold text-white">Whole Lechon</h3>
                <p className="num display text-3xl font-extrabold text-sun">{peso(w.price)}</p>
              </div>
              <p className="mt-1 text-sm text-white/75">Priced by live weight. For 40 guests, see the Lechon Package: 20 kg lechon plus 5 trays.</p>
              <div className="mt-5">
                <Segmented name="Lechon size" value={w?.id ?? ''} onChange={setWhole} options={WHOLE_LECHON.map((o) => ({ value: o.id, label: o.label, sub: peso(o.price) }))} />
              </div>
              <p className="mt-5 text-sm font-semibold text-white">Free paluto</p>
              <div className="mt-2 max-w-sm">
                <Segmented name="Free paluto" value={paluto} onChange={setPaluto} options={FREE_PALUTO.map((p) => ({ value: p, label: p }))} />
              </div>
              <Button className="mt-6 w-full sm:w-auto" size="lg" onClick={() => add({ kind: 'lechon', refId: w.id, paluto }, wholeImg.current)}>
                <span className="num">Add {w.label} lechon · {peso(w.price)}</span>
              </Button>
            </div>
          </article>

          <div className="flex flex-col gap-6">
            <article className="overflow-hidden rounded-[24px] bg-leaf-800/60 ring-1 ring-inset ring-white/10">
              <div ref={bellyImg} className="aspect-[16/9] overflow-hidden">
                <img src={asset('/img/hero/lechon-belly.webp')} alt="Rolled lechon belly on skewers" className="size-full object-cover" loading="lazy" />
              </div>
              <div className="p-5 sm:p-6">
                <div className="flex items-baseline justify-between gap-4">
                  <h3 className="display text-2xl font-extrabold text-white">Lechon Belly</h3>
                  <p className="num display text-3xl font-extrabold text-sun">{peso(b.price)}</p>
                </div>
                <p className="mt-1 text-sm text-white/75">Crispy skin, juicy inside, freshly roasted.</p>
                <div className="mt-4">
                  <Segmented name="Belly size" value={b?.id ?? ''} onChange={setBelly} options={LECHON_BELLY.map((o) => ({ value: o.id, label: o.label, sub: peso(o.price) }))} />
                </div>
                <Button className="mt-5 w-full" onClick={() => add({ kind: 'belly', refId: b.id }, bellyImg.current)}>
                  <span className="num">Add belly · {peso(b.price)}</span>
                </Button>
              </div>
            </article>
            <aside className="rounded-[24px] bg-sun p-5 text-ink sm:p-6">
              <h3 className="display text-xl font-extrabold">Have your own pig?</h3>
              <p className="mt-1.5">
                We also roast lechon from your own baboy (Lechon Inyuha). Message or call Lenlyn for the price.
              </p>
              <a href={`tel:${BUSINESS.phoneIntl}`} className="num mt-3 inline-block font-bold text-leaf-700 underline">
                Call {BUSINESS.phone}
              </a>
            </aside>
          </div>
        </div>
      </div>
    </section>
  )
}
