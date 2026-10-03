import { ArrowRight, MagnifyingGlass, Plus, X } from '@phosphor-icons/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { Package } from '../data/menu'
import { asset } from '../lib/asset'
import { useMenu } from '../lib/menu'
import { peso, useOrder } from '../lib/order'
import { PackageBuilder } from './PackageBuilder'

type Result =
  | { kind: 'tray'; id: string; name: string; sub: string; img: string }
  | { kind: 'package'; id: string; name: string; sub: string; img: string; pkg: Package }
  | { kind: 'section'; id: string; name: string; sub: string; img: string }

/**
 * Search for the customer site. A magnifier button in the header opens an input under it;
 * results add straight to the table (trays, fixed packages) or open the dish chooser.
 */
export function MenuSearch({ open, onOpen, onClose }: { open: boolean; onOpen: () => void; onClose: () => void }) {
  const menu = useMenu()
  const { add } = useOrder()
  const [q, setQ] = useState('')
  const [building, setBuilding] = useState<Package | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    setQ('')
    inputRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      onClose()
      buttonRef.current?.focus()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const results = useMemo<Result[]>(() => {
    const words = q.toLowerCase().split(/\s+/).filter(Boolean)
    if (!words.length) return []
    const hit = (text: string) => words.every((w) => text.toLowerCase().includes(w))
    const range = (list: { price: number }[]) => (list.length ? `${peso(Math.min(...list.map((o) => o.price)))} to ${peso(Math.max(...list.map((o) => o.price)))}` : '')
    // Dishes first, then lechon, then packages; within that, a match on the name beats a match on what's inside.
    const out: (Result & { byName: boolean })[] = []
    for (const t of menu.trays) if (hit(`${t.name} ${t.category} tray`)) out.push({ kind: 'tray', id: t.id, name: t.name, sub: `Large tray · ${peso(t.price)}`, img: t.img, byName: hit(t.name) })
    if (menu.whole.length && hit('whole lechon baboy pig letchon')) out.push({ kind: 'section', id: 'whole', name: 'Whole Lechon', sub: range(menu.whole), img: asset('/img/hero/lechon-whole.webp'), byName: true })
    if (menu.belly.length && hit('lechon belly letchon')) out.push({ kind: 'section', id: 'belly', name: 'Lechon Belly', sub: range(menu.belly), img: asset('/img/hero/lechon-belly.webp'), byName: true })
    if (menu.inyuha.length && hit('lechon inyuha own pig baboy roasting letchon')) out.push({ kind: 'section', id: 'inyuha', name: 'Lechon Inyuha (your own pig)', sub: range(menu.inyuha), img: asset('/img/hero/lechon-spit.webp'), byName: true })
    // A package also matches on the dishes inside it, so "humba" finds every package that has humba.
    for (const p of menu.packages) {
      const inside = [...p.fixed.map((f) => f.name), ...p.groups.flatMap((g) => g.options.map((o) => o.name)), ...(p.freebies ?? [])].join(' ')
      if (hit(`${p.name} ${p.code} ${p.summary} ${inside} package`))
        out.push({ kind: 'package', id: p.id, name: p.name, sub: `Package · ${p.paxMin === p.paxMax ? p.paxMin : `${p.paxMin}–${p.paxMax}`} pax · ${peso(p.price)}`, img: p.fixed[0]?.img ?? p.groups[0]?.options[0]?.img ?? '', pkg: p, byName: hit(`${p.name} ${p.code}`) })
    }
    out.sort((x, y) => Number(y.byName) - Number(x.byName))
    return out
  }, [q, menu])

  const choose = (r: Result, from: HTMLElement) => {
    if (r.kind === 'tray') return add({ kind: 'tray', refId: r.id }, from)
    if (r.kind === 'package') {
      if (r.pkg.groups.length) {
        onClose()
        return setBuilding(r.pkg)
      }
      return add({ kind: 'package', refId: r.id, choices: {}, addOns: {} }, from)
    }
    onClose()
    document.getElementById('lechon')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => (open ? onClose() : onOpen())}
        aria-label={open ? 'Close search' : 'Search the menu'}
        aria-expanded={open}
        aria-controls="menu-search"
        className={`grid size-11 cursor-pointer place-items-center rounded-[12px] transition-colors ${open ? 'bg-leaf text-white' : 'text-leaf hover:bg-leaf/8'}`}
      >
        {open ? <X size={22} weight="bold" /> : <MagnifyingGlass size={22} weight="bold" />}
      </button>

      {open && (
        <>
          {/* The header's blur makes it the anchor for fixed children, so the page dimmer is drawn on <body>. */}
          {createPortal(<div className="fixed inset-x-0 bottom-0 top-[72px] z-20 bg-ink/45" onClick={onClose} aria-hidden />, document.body)}
          <div id="menu-search" role="search" className="absolute inset-x-0 top-full z-30 border-b border-ink/10 bg-ground shadow-[var(--shadow-lift)]">
            <div className="mx-auto max-w-3xl px-4 py-3 md:px-8">
              <label className="relative block">
                <span className="sr-only">Search dishes, packages and lechon</span>
                <MagnifyingGlass size={20} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-soft" />
                <input
                  ref={inputRef}
                  type="search"
                  enterKeyHint="search"
                  autoComplete="off"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search dishes, packages, lechon…"
                  className="h-12 w-full rounded-[14px] border-2 border-ink/12 bg-white pl-11 pr-4 text-base focus:border-leaf focus:outline-none"
                />
              </label>

              {q.trim() !== '' && (
                <div className="mt-3 max-h-[min(60dvh,28rem)] overflow-y-auto overscroll-contain" aria-live="polite">
                  {results.length === 0 ? (
                    <p className="px-1 py-4 text-ink-soft">
                      Nothing matches "<span className="font-semibold text-ink">{q.trim()}</span>". Try a dish name like humba, lumpia or spaghetti.
                    </p>
                  ) : (
                    <ul className="divide-y divide-ink/10">
                      {results.map((r) => (
                        <li key={`${r.kind}-${r.id}`} className="flex items-center gap-3 py-2.5">
                          <div className="foil size-14 shrink-0 !p-[3px]">{r.img && <img src={r.img} alt="" loading="lazy" />}</div>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold leading-snug">{r.name}</p>
                            <p className="num text-sm text-ink-soft">{r.sub}</p>
                          </div>
                          {r.kind === 'section' ? (
                            <button type="button" onClick={(e) => choose(r, e.currentTarget)} className="inline-flex h-11 shrink-0 cursor-pointer items-center gap-1.5 rounded-[12px] bg-leaf/10 px-3 text-sm font-semibold text-leaf-700 hover:bg-leaf/15">
                              View <ArrowRight size={16} weight="bold" />
                            </button>
                          ) : r.kind === 'package' && r.pkg.groups.length > 0 ? (
                            <button type="button" onClick={(e) => choose(r, e.currentTarget)} className="inline-flex h-11 shrink-0 cursor-pointer items-center rounded-[12px] bg-leaf px-3 text-sm font-semibold text-white hover:bg-leaf-600">
                              Choose dishes
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => choose(r, e.currentTarget.closest('li')?.querySelector('.foil') ?? e.currentTarget)}
                              aria-label={`Add ${r.name} to your table`}
                              className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-[12px] bg-sun text-ink transition-[background-color,transform] duration-200 hover:bg-sun-deep active:scale-[0.94]"
                            >
                              <Plus size={20} weight="bold" />
                            </button>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}
      {createPortal(<PackageBuilder pkg={building} onClose={() => setBuilding(null)} />, document.body)}
    </>
  )
}
