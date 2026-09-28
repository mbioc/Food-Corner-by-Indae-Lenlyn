import { Minus, Plus } from '@phosphor-icons/react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'sun' | 'leaf' | 'ghost' | 'ghost-light'

const variants: Record<Variant, string> = {
  sun: 'bg-sun text-ink hover:bg-sun-deep shadow-[0_8px_18px_-10px_rgb(13_21_13/0.6)]',
  leaf: 'bg-leaf text-white hover:bg-leaf-600',
  ghost: 'bg-transparent text-leaf ring-2 ring-inset ring-leaf/25 hover:ring-leaf/60 hover:bg-leaf/5',
  'ghost-light': 'bg-white/10 text-white ring-1 ring-inset ring-white/30 hover:bg-white/20',
}

export function Button({
  variant = 'sun',
  size = 'md',
  className = '',
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'h-10 px-4 text-sm', md: 'h-12 px-5 text-base', lg: 'h-14 px-7 text-lg' }
  return (
    <button
      {...rest}
      className={`inline-flex cursor-pointer select-none items-center justify-center gap-2 whitespace-nowrap rounded-[14px] font-semibold transition-[background-color,box-shadow,transform,color] duration-200 ease-out active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-45 disabled:active:scale-100 ${sizes[size]} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  )
}

export function Stepper({ value, onChange, min = 1, max = 20, label, dark = false }: { value: number; onChange: (n: number) => void; min?: number; max?: number; label: string; dark?: boolean }) {
  const btn = `grid size-9 cursor-pointer place-items-center rounded-[10px] transition-colors disabled:cursor-not-allowed disabled:opacity-35 ${
    dark ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-leaf/8 text-leaf hover:bg-leaf/15'
  }`
  return (
    <div className="inline-flex items-center gap-1" role="group" aria-label={label}>
      <button type="button" className={btn} onClick={() => onChange(value - 1)} disabled={value <= min} aria-label={`Less ${label}`}>
        <Minus weight="bold" size={16} />
      </button>
      <span className="num w-8 text-center font-semibold" aria-live="polite">
        {value}
      </span>
      <button type="button" className={btn} onClick={() => onChange(value + 1)} disabled={value >= max} aria-label={`More ${label}`}>
        <Plus weight="bold" size={16} />
      </button>
    </div>
  )
}

export function Field({ label, htmlFor, error, hint, children, optional }: { label: string; htmlFor: string; error?: string; hint?: string; children: ReactNode; optional?: boolean }) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={htmlFor} className="text-sm font-semibold text-ink">
        {label}
        {optional && <span className="ml-1.5 font-normal text-ink-soft">(optional)</span>}
      </label>
      {children}
      {hint && !error && <p className="text-sm text-ink-soft">{hint}</p>}
      {error && (
        <p id={`${htmlFor}-error`} className="text-sm font-medium text-chili" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

export const inputClass = (invalid?: boolean) =>
  `h-12 w-full rounded-[12px] border-2 bg-white px-3.5 text-base text-ink placeholder:text-ink-soft/70 transition-colors focus:outline-none focus:border-leaf ${
    invalid ? 'border-chili' : 'border-ink/12'
  }`

export function PriceTag({ amount, className = '' }: { amount: string; className?: string }) {
  return <span className={`num display inline-block font-extrabold leading-none tracking-[-0.02em] ${className}`}>{amount}</span>
}
