import { Storefront, Trash } from '@phosphor-icons/react'
import { peso, useOrder } from '../lib/order'
import { Sheet } from './Sheet'
import { Button, Stepper } from './ui'

export function TableSheet({ open, onClose, onCheckout }: { open: boolean; onClose: () => void; onCheckout: () => void }) {
  const { resolved, subtotal, setQty, remove, hasPickupOnly, count } = useOrder()

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Your handaan table"
      footer={
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-ink-soft">Food total · delivery fee added next</p>
            <p className="num display text-2xl font-extrabold">{peso(subtotal)}</p>
          </div>
          <Button size="lg" onClick={onCheckout} disabled={count === 0} data-autofocus>
            Checkout
          </Button>
        </div>
      }
    >
      {resolved.length === 0 ? (
        <div className="py-10 text-center">
          <p className="display text-xl font-bold">Nothing on the table yet.</p>
          <p className="mt-2 text-ink-soft">Add a package, a tray or a lechon and it will show up here.</p>
          <Button variant="ghost" className="mt-6" onClick={onClose}>
            Browse the menu
          </Button>
        </div>
      ) : (
        <>
          <div className="leaf mb-5 grid grid-cols-4 gap-2.5 rounded-[18px] p-3.5 sm:grid-cols-5" aria-hidden>
            {resolved.flatMap((r) => Array.from({ length: Math.min(r.line.qty, 4) }, (_, i) => (
              <div key={`${r.line.key}-${i}`} className="foil aspect-[4/3]">
                <img src={r.img} alt="" />
              </div>
            )))}
          </div>
          {hasPickupOnly && (
            <p className="mb-4 flex items-start gap-2 rounded-[12px] bg-sun/35 p-3 text-sm">
              <Storefront size={20} weight="duotone" className="mt-0.5 shrink-0 text-leaf" />
              The Medium Tray package is pick-up only, because the trays bend when stacked on a rider's motor.
            </p>
          )}
          <ul className="divide-y divide-ink/10">
            {resolved.map((r) => (
              <li key={r.line.key} className="flex gap-3 py-4">
                <div className="foil size-16 shrink-0">
                  <img src={r.img} alt="" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-semibold leading-snug">{r.title}</p>
                    <p className="num shrink-0 font-bold">{peso(r.total)}</p>
                  </div>
                  {r.detail.length > 0 && (
                    <ul className="mt-1 space-y-0.5 text-sm text-ink-soft">
                      {r.detail.map((d) => (
                        <li key={d}>{d}</li>
                      ))}
                    </ul>
                  )}
                  <div className="mt-2.5 flex items-center justify-between">
                    <Stepper label={`quantity of ${r.title}`} value={r.line.qty} onChange={(n) => setQty(r.line.key, n)} />
                    <button type="button" onClick={() => remove(r.line.key)} className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-[10px] px-3 text-sm font-medium text-chili transition-colors hover:bg-chili/10">
                      <Trash size={16} weight="bold" /> Remove
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </Sheet>
  )
}
