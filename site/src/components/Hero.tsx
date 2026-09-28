import { AnimatePresence, motion } from 'motion/react'
import { PAX_FILTERS } from '../data/menu'
import { useOrder } from '../lib/order'
import { BUSINESS } from '../data/business'
import { asset } from '../lib/asset'

type PaxId = (typeof PAX_FILTERS)[number]['id']

const SAMPLE = [
  { img: asset('/img/hero/lechon-whole.webp'), label: 'Whole lechon', span: 'col-span-6 row-span-2', shape: 'foil' },
  { img: asset('/img/dish/creamy-spaghetti.webp'), label: 'Spaghetti', span: 'col-span-3', shape: 'foil' },
  { img: asset('/img/dish/chicken-buffalo.webp'), label: 'Chicken Buffalo', span: 'col-span-3', shape: 'foil' },
  { img: asset('/img/hero/bilao-lumpia.webp'), label: 'Lumpia bilao', span: 'col-span-2', shape: 'bilao' },
  { img: asset('/img/dish/pork-humba.webp'), label: 'Pork Humba', span: 'col-span-2', shape: 'foil' },
  { img: asset('/img/hero/bilao-bami.webp'), label: 'Bam-i bilao', span: 'col-span-2', shape: 'bilao' },
]

export function Hero({ pax, onPax }: { pax: PaxId; onPax: (p: PaxId) => void }) {
  const { resolved } = useOrder()
  const mine = resolved.length > 0
  const items = mine
    ? resolved.slice(0, 8).map((r, i) => ({ img: r.img, label: `${r.line.qty}× ${r.title}`, span: i === 0 && resolved.length < 5 ? 'col-span-6 row-span-2' : 'col-span-3', shape: 'foil', key: r.line.key }))
    : SAMPLE.map((s) => ({ ...s, key: s.label }))

  return (
    <section id="top" className="mx-auto grid max-w-7xl gap-8 px-4 pb-14 pt-8 md:px-8 md:pt-12 lg:grid-cols-[1fr_1.1fr] lg:items-center lg:gap-14 lg:pb-20">
      <div className="max-w-xl">
        <h1 className="display text-[2.6rem] font-extrabold leading-[1.02] text-ink sm:text-5xl lg:text-[4rem]">
          Fill the handaan table. <span className="text-leaf">Lenlyn cooks everything on it.</span>
        </h1>
        <p className="mt-5 max-w-[52ch] text-lg leading-relaxed text-ink-soft">
          Party trays, bilao and whole lechon from her kitchen in Tabgas, Albuera, cooking since {BUSINESS.since}. Pick a size, choose your dishes, pay by bank QR, and we deliver across Western Leyte.
        </p>
        <fieldset className="mt-8">
          <legend className="display text-lg font-bold">How many guests are you feeding?</legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {PAX_FILTERS.map((p) => {
              const on = pax === p.id
              return (
                <label
                  key={p.id}
                  className={`relative inline-flex h-11 cursor-pointer items-center rounded-full px-4 text-[15px] font-semibold transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-leaf ${
                    on ? 'bg-leaf text-white' : 'bg-white text-ink ring-1 ring-inset ring-ink/12 hover:ring-leaf/50'
                  }`}
                >
                  <input
                    type="radio"
                    name="pax"
                    value={p.id}
                    checked={on}
                    onChange={() => {
                      onPax(p.id)
                      document.getElementById('packages')?.scrollIntoView({ behavior: 'smooth' })
                    }}
                    className="sr-only"
                  />
                  <span className="num">{p.label}</span>
                </label>
              )
            })}
          </div>
        </fieldset>
      </div>

      <div className="relative">
        <div className="leaf on-leaf relative overflow-hidden rounded-[28px] p-4 sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="display text-lg font-bold text-white">{mine ? 'Your table' : 'A 20-pax handaan'}</p>
            <span className="tag px-2.5 py-1 text-xs font-bold">{mine ? `${resolved.reduce((n, r) => n + r.line.qty, 0)} on the table` : 'Sample spread'}</span>
          </div>
          <div className="grid auto-rows-[88px] grid-cols-6 gap-3 sm:auto-rows-[112px] sm:gap-4">
            <AnimatePresence mode="popLayout" initial={false}>
              {items.map((it, i) => (
                <motion.figure
                  key={it.key}
                  layout
                  className={`relative m-0 ${it.span}`}
                  initial={{ opacity: 0, y: -24, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  transition={{ type: 'spring', bounce: 0.25, duration: 0.55, delay: mine ? 0 : i * 0.05 }}
                >
                  <div className={`${it.shape} h-full ${it.shape === 'bilao' ? 'mx-auto aspect-square !h-auto max-h-full w-auto' : ''}`}>
                    <img src={it.img} alt={it.label} loading={i < 2 ? 'eager' : 'lazy'} />
                  </div>
                  <figcaption className="tag absolute -bottom-2 left-2 max-w-[90%] truncate px-2 py-0.5 text-[11px] font-bold sm:text-xs">{it.label}</figcaption>
                </motion.figure>
              ))}
            </AnimatePresence>
          </div>
          <p className="mt-6 text-xs text-white/70">Sample photos. Real photos of Lenlyn's food are coming soon.</p>
        </div>
      </div>
    </section>
  )
}
