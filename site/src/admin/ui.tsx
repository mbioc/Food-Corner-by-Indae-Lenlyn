import type { ReactNode } from 'react'
import { STATUS } from './meta'
import type { OrderStatus } from './sb'

export function Page({ title, actions, children }: { title: string; actions?: ReactNode; children: ReactNode }) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="display text-3xl font-extrabold">{title}</h1>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {children}
    </div>
  )
}

export function StatusPill({ status }: { status: OrderStatus }) {
  const s = STATUS[status]
  return <span className={`inline-flex h-6 items-center whitespace-nowrap rounded-full px-2.5 text-xs font-bold ${s.tone}`}>{s.label}</span>
}

export function PayPill({ status }: { status: 'unverified' | 'verified' | 'rejected' }) {
  const map = {
    unverified: ['Check payment', 'bg-sun/40 text-ink'],
    verified: ['Paid', 'bg-leaf/12 text-leaf-700'],
    rejected: ['Payment problem', 'bg-chili/10 text-chili'],
  } as const
  const [label, tone] = map[status]
  return <span className={`inline-flex h-6 items-center whitespace-nowrap rounded-full px-2.5 text-xs font-bold ${tone}`}>{label}</span>
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 shrink-0 cursor-pointer rounded-full transition-colors ${checked ? 'bg-leaf' : 'bg-ink/20'}`}
    >
      <span className={`absolute left-0 top-1 size-5 rounded-full bg-white shadow transition-transform duration-200 ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  )
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded-[20px] border-2 border-dashed border-ink/12 px-6 py-12 text-center">
      <p className="display text-lg font-bold">{title}</p>
      {children && <div className="mt-1 text-ink-soft">{children}</div>}
    </div>
  )
}
