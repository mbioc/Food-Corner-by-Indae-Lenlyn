import type { OrderStatus } from './sb'

export const STATUS: Record<OrderStatus, { label: string; tone: string }> = {
  pending: { label: 'New', tone: 'bg-sun/60 text-ink' },
  confirmed: { label: 'Confirmed', tone: 'bg-leaf/12 text-leaf-700' },
  cooking: { label: 'Cooking', tone: 'bg-lime/45 text-ink' },
  out_for_delivery: { label: 'Out for delivery', tone: 'bg-sky-100 text-sky-900' },
  ready_for_pickup: { label: 'Ready for pick-up', tone: 'bg-sky-100 text-sky-900' },
  completed: { label: 'Completed', tone: 'bg-ink/8 text-ink-soft' },
  cancelled: { label: 'Cancelled', tone: 'bg-chili/10 text-chili' },
}

/** The usual next step for an order, used for the big primary button. */
export function nextStatus(s: OrderStatus, pickup: boolean): OrderStatus | null {
  switch (s) {
    case 'pending':
      return 'confirmed'
    case 'confirmed':
      return 'cooking'
    case 'cooking':
      return pickup ? 'ready_for_pickup' : 'out_for_delivery'
    case 'out_for_delivery':
    case 'ready_for_pickup':
      return 'completed'
    default:
      return null
  }
}

export const ACTIVE: OrderStatus[] = ['pending', 'confirmed', 'cooking', 'out_for_delivery', 'ready_for_pickup']

export const peso = (n: number) => `₱${n.toLocaleString('en-PH')}`

export const manilaToday = () => new Date(Date.now() + 8 * 3600e3).toISOString().slice(0, 10)

export function fmtDate(iso: string, opts: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric' }) {
  return new Date(`${iso.slice(0, 10)}T00:00:00`).toLocaleDateString('en-PH', opts)
}

export function fmtTime(t: string) {
  const [h, m] = t.split(':').map(Number)
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`
}

export function timeAgo(iso: string) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)} min ago`
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`
  return new Date(iso).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })
}
