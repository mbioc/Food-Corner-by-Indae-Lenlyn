import { ArrowRight, ForkKnife } from '@phosphor-icons/react'
import { AnimatePresence, motion, useAnimationControls, useReducedMotion } from 'motion/react'
import { useEffect } from 'react'
import { peso, useOrder, type Flight } from '../lib/order'

/** A tray lifts off the tapped dish and lands on the table bar. */
function FlyingTray({ flight, onLand }: { flight: Flight; onLand: () => void }) {
  const { barRef } = useOrder()
  const target = barRef.current?.querySelector('[data-table-target]')?.getBoundingClientRect()
  const size = 64
  const fromX = flight.from.left + flight.from.width / 2 - size / 2
  const fromY = flight.from.top + flight.from.height / 2 - size / 2
  const toX = target ? target.left + target.width / 2 - size / 2 : window.innerWidth / 2
  const toY = target ? target.top + target.height / 2 - size / 2 : window.innerHeight - 60
  return (
    <motion.div
      className="foil pointer-events-none fixed left-0 top-0 z-[60]"
      style={{ width: size, height: size }}
      initial={{ x: fromX, y: fromY, scale: 1.4, opacity: 1, rotate: -6 }}
      animate={{ x: toX, y: toY, scale: 0.55, opacity: 0.9, rotate: 0 }}
      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
      onAnimationComplete={onLand}
    >
      <img src={flight.img} alt="" />
    </motion.div>
  )
}

export function TableBar({ onOpen }: { onOpen: () => void }) {
  const { count, subtotal, flights, land, bump, barRef, resolved } = useOrder()
  const reduce = useReducedMotion()
  const pulse = useAnimationControls()

  useEffect(() => {
    if (bump === 0 || reduce) return
    pulse.start({ scale: [1, 1.08, 1], transition: { type: 'spring', bounce: 0.5, duration: 0.45 } })
  }, [bump, reduce, pulse])

  const empty = count === 0
  const thumbs = resolved.slice(-3)

  return (
    <>
      {!reduce && flights.map((f) => <FlyingTray key={f.id} flight={f} onLand={() => land(f.id)} />)}
      {reduce && flights.length > 0 && flights.map((f) => <LandNow key={f.id} onLand={() => land(f.id)} />)}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:px-6 md:pb-5">
        <motion.section
          ref={barRef as React.RefObject<HTMLElement>}
          aria-label="Your table"
          className="leaf on-leaf pointer-events-auto mx-auto flex max-w-3xl items-center gap-3 rounded-[20px] p-2.5 pl-3 shadow-[var(--shadow-lift)] md:p-3 md:pl-4"
          animate={pulse}
        >
          <div data-table-target className="flex shrink-0 items-center">
            {empty ? (
              <span className="grid size-11 place-items-center rounded-[12px] bg-white/10 text-lime">
                <ForkKnife size={22} weight="duotone" />
              </span>
            ) : (
              <div className="flex -space-x-4">
                <AnimatePresence initial={false}>
                  {thumbs.map((r) => (
                    <motion.div
                      key={r.line.key}
                      className="foil size-11 !p-[3px]"
                      initial={{ scale: 0.4, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.4, opacity: 0 }}
                      transition={{ type: 'spring', bounce: 0.35, duration: 0.4 }}
                    >
                      <img src={r.img} alt="" />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-sm text-white/80">{empty ? 'Your table is empty' : `${count} ${count === 1 ? 'item' : 'items'} on your table`}</p>
            <p className="num display truncate text-lg font-extrabold text-sun sm:text-xl" aria-live="polite">
              {empty ? 'Add food' : peso(subtotal)}
            </p>
          </div>
          <button
            type="button"
            onClick={onOpen}
            disabled={empty}
            className="inline-flex h-12 shrink-0 cursor-pointer items-center gap-2 rounded-[14px] bg-sun px-4 font-semibold text-ink transition-[background-color,transform] duration-200 hover:bg-sun-deep active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 md:px-5"
          >
            Order na
            <ArrowRight size={18} weight="bold" />
          </button>
        </motion.section>
      </div>
    </>
  )
}

function LandNow({ onLand }: { onLand: () => void }) {
  useEffect(() => {
    onLand()
  }, [onLand])
  return null
}
