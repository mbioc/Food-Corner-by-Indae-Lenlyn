import { CalendarBlank } from '@phosphor-icons/react'
import { useState } from 'react'
import { inputClass } from './ui'

/**
 * Date field that always reads MM/DD/YYYY. The native date input sits invisibly on top,
 * so tapping still opens the device's calendar, but its locale-dependent text is never shown.
 */
export function DateField({ id, value, min, invalid, onChange }: { id: string; value: string; min?: string; invalid?: boolean; onChange: (iso: string) => void }) {
  const [y, m, d] = value ? value.split('-') : []
  return (
    <div className="relative">
      <div aria-hidden className={`${inputClass(invalid)} flex items-center justify-between gap-2 has-[+input:focus-visible]:border-leaf`}>
        <span className={`num ${value ? '' : 'text-ink-soft/70'}`}>{value ? `${m}/${d}/${y}` : 'MM/DD/YYYY'}</span>
        <CalendarBlank size={20} className="shrink-0 text-ink-soft" />
      </div>
      <input
        id={id}
        type="date"
        min={min}
        value={value}
        aria-invalid={invalid}
        onChange={(e) => onChange(e.target.value)}
        onClick={(e) => {
          // Desktop browsers only open the calendar from their own small icon unless asked.
          try {
            e.currentTarget.showPicker?.()
          } catch {
            /* not allowed in this browser: the native control still works */
          }
        }}
        className="absolute inset-0 size-full cursor-pointer opacity-0"
      />
    </div>
  )
}

const HOURS = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
const MINUTES = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55']

const to24 = (h: string, p: string) => (Number(h) % 12) + (p === 'PM' ? 12 : 0)

/**
 * 12-hour time picker (hour, minute, AM/PM). The value stays in 24-hour "HH:MM" for the order.
 * With `fromHour`/`toHour` (24-hour, inclusive, e.g. 8 and 18) only times in that window can be picked.
 */
export function TimeField({ id, value, invalid, onChange, fromHour, toHour }: { id: string; value: string; invalid?: boolean; onChange: (hhmm: string) => void; fromHour?: number; toHour?: number }) {
  const limited = fromHour !== undefined && toHour !== undefined
  const allowed = (h24: number) => !limited || (h24 >= fromHour && h24 <= toHour)
  const [h24, min] = value ? value.split(':') : []
  const [hour, setHour] = useState(value ? String(Number(h24) % 12 || 12) : '')
  // Times typed before this picker existed may not sit on a 5-minute step: keep them selectable.
  const [minute, setMinute] = useState(min ?? '00')
  const [period, setPeriod] = useState(value ? (Number(h24) < 12 ? 'AM' : 'PM') : '')

  // Hours that have at least one allowed time, in clock order starting from the opening hour.
  const hours = limited ? Array.from({ length: toHour - fromHour + 1 }, (_, i) => (fromHour + i) % 12 || 12).filter((h, i, all) => all.indexOf(h) === i) : HOURS
  const periods = ['AM', 'PM'].filter((p) => !limited || HOURS.some((h) => allowed(to24(String(h), p))))
  // The closing hour itself is the last slot: 6:00 PM, not 6:05 PM.
  const atClose = limited && hour !== '' && period !== '' && to24(hour, period) === toHour
  const base = atClose ? ['00'] : MINUTES
  const minutes = base.includes(minute) || atClose ? base : [...base, minute].sort()

  const update = (h: string, m: string, p: string) => {
    if (limited && h) {
      // Inside the window each hour belongs to only one of AM or PM, so choose it for the customer.
      const fits = ['AM', 'PM'].filter((x) => allowed(to24(h, x)))
      if (fits.length === 1) p = fits[0]
      else if (p && !allowed(to24(h, p))) p = ''
      if (p && to24(h, p) === toHour) m = '00'
    }
    setHour(h)
    setMinute(m)
    setPeriod(p)
    if (!h || !p) return onChange('')
    onChange(`${String(to24(h, p)).padStart(2, '0')}:${m}`)
  }

  const cls = `num ${inputClass(invalid)} !px-2 text-center`
  return (
    <div className="grid grid-cols-3 gap-2" role="group" aria-label="Time">
      <select id={id} aria-label="Hour" aria-invalid={invalid} className={cls} value={hour} onChange={(e) => update(e.target.value, minute, period)}>
        <option value="">Hour</option>
        {hours.map((h) => (
          <option key={h} value={h}>
            {h}
          </option>
        ))}
      </select>
      <select aria-label="Minute" className={cls} value={minute} onChange={(e) => update(hour, e.target.value, period)}>
        {minutes.map((m) => (
          <option key={m} value={m}>
            :{m}
          </option>
        ))}
      </select>
      <select aria-label="AM or PM" aria-invalid={invalid} className={cls} value={period} onChange={(e) => update(hour, minute, e.target.value)}>
        <option value="">AM/PM</option>
        {periods.map((p) => (
          <option key={p} value={p} disabled={limited && hour !== '' && !allowed(to24(hour, p))}>
            {p}
          </option>
        ))}
      </select>
    </div>
  )
}
