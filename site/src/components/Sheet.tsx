import { X } from '@phosphor-icons/react'
import { AnimatePresence, motion, useDragControls, useReducedMotion, type PanInfo } from 'motion/react'
import { useEffect, useRef, useState, type ReactNode } from 'react'

function useWide() {
  const q = '(min-width: 768px)'
  const [wide, setWide] = useState(() => typeof window !== 'undefined' && window.matchMedia(q).matches)
  useEffect(() => {
    const m = window.matchMedia(q)
    const on = () => setWide(m.matches)
    m.addEventListener('change', on)
    return () => m.removeEventListener('change', on)
  }, [])
  return wide
}

/**
 * Bottom sheet on phones (drag down to close), side panel on desktop.
 * Enter and exit share one path so it leaves the way it came.
 */
export function Sheet({ open, onClose, title, children, footer, wideClass = 'md:w-[560px]' }: { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode; wideClass?: string }) {
  const wide = useWide()
  const reduce = useReducedMotion()
  const panelRef = useRef<HTMLDivElement>(null)
  const lastFocus = useRef<HTMLElement | null>(null)
  const drag = useDragControls()
  // Parents pass a new onClose on every render; keep the latest in a ref so the
  // focus/scroll-lock effect below runs only when the sheet opens or closes.
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    if (!open) return
    lastFocus.current = document.activeElement as HTMLElement
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current()
      if (e.key === 'Tab' && panelRef.current) {
        const f = panelRef.current.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
        const list = Array.from(f).filter((el) => !el.hasAttribute('disabled'))
        if (!list.length) return
        const first = list[0]
        const last = list[list.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    window.addEventListener('keydown', onKey)
    requestAnimationFrame(() => panelRef.current?.querySelector<HTMLElement>('[data-autofocus]')?.focus() ?? panelRef.current?.focus())
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
      lastFocus.current?.focus?.()
    }
  }, [open])

  const hidden = reduce ? { opacity: 0 } : wide ? { x: '100%' } : { y: '100%' }
  const shown = reduce ? { opacity: 1 } : wide ? { x: 0 } : { y: 0 }
  const spring = { type: 'spring' as const, bounce: 0, duration: 0.42 }

  const onDragEnd = (_: unknown, info: PanInfo) => {
    // Project the flick forward (Apple's decay projection) and close if it lands past a third of the sheet.
    const projected = info.offset.y + (info.velocity.y / 1000) * (0.998 / (1 - 0.998))
    const h = panelRef.current?.offsetHeight ?? 600
    if (projected > h / 3) onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50" role="presentation">
          <motion.div className="absolute inset-0 bg-ink/55" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} onClick={onClose} />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            tabIndex={-1}
            className={`absolute inset-x-0 bottom-0 flex max-h-[92dvh] flex-col rounded-t-[22px] bg-ground shadow-[var(--shadow-lift)] focus:outline-none md:inset-y-0 md:left-auto md:right-0 md:max-h-none md:rounded-none md:rounded-l-[22px] ${wideClass}`}
            initial={hidden}
            animate={shown}
            exit={hidden}
            transition={spring}
            drag={wide || reduce ? false : 'y'}
            dragControls={drag}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.05, bottom: 0.6 }}
            onDragEnd={onDragEnd}
          >
            <div className="flex touch-none items-center justify-between gap-3 border-b border-ink/10 px-5 pb-3 pt-3 md:touch-auto md:pt-5" onPointerDown={(e) => !wide && !reduce && drag.start(e)}>
              <div className="flex flex-col">
                <span aria-hidden className="mx-auto mb-2 h-1.5 w-11 rounded-full bg-ink/20 md:hidden" />
                <h2 className="display text-xl font-extrabold">{title}</h2>
              </div>
              <button type="button" onClick={onClose} className="grid size-11 cursor-pointer place-items-center rounded-full bg-ink/6 text-ink transition-colors hover:bg-ink/12" aria-label="Close">
                <X size={20} weight="bold" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5">{children}</div>
            {footer && <div className="border-t border-ink/10 bg-ground px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
