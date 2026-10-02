import { Camera, Plus, Trash } from '@phosphor-icons/react'
import { useEffect, useRef, useState } from 'react'
import { Sheet } from '../components/Sheet'
import { Button, Field, inputClass } from '../components/ui'
import { TRAY_CATEGORIES } from '../data/menu'
import { compressImage } from '../lib/checkout'
import { imgUrl } from '../lib/menu'
import { useAdmin } from './data'
import { peso } from './meta'
import { supabase } from './sb'
import { Empty, Page, Toggle } from './ui'

/* eslint-disable @typescript-eslint/no-explicit-any */
type Row = Record<string, any>
type Tab = 'trays' | 'packages' | 'lechon' | 'zones' | 'payment'

const TABS: { id: Tab; label: string }[] = [
  { id: 'trays', label: 'Dishes' },
  { id: 'packages', label: 'Packages' },
  { id: 'lechon', label: 'Lechon' },
  { id: 'zones', label: 'Delivery areas' },
  { id: 'payment', label: 'Settings' },
]

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40) || `item-${Date.now()}`

async function uploadPhoto(file: File, folder: string) {
  const { dataUrl } = await compressImage(file, 1200, 0.82)
  const blob = await (await fetch(dataUrl)).blob()
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.jpg`
  const { error } = await supabase.storage.from('menu').upload(path, blob, { contentType: 'image/jpeg' })
  if (error) throw error
  return supabase.storage.from('menu').getPublicUrl(path).data.publicUrl
}

function PhotoPicker({ src, onChange, folder, label }: { src: string; onChange: (url: string) => void; folder: string; label: string }) {
  const { toast } = useAdmin()
  const [busy, setBusy] = useState(false)
  const ref = useRef<HTMLInputElement>(null)
  return (
    <button type="button" onClick={() => ref.current?.click()} aria-label={`Change photo for ${label}`} className="foil relative size-16 shrink-0 cursor-pointer">
      {src ? <img src={imgUrl(src)} alt="" /> : <span className="grid size-full place-items-center rounded-[10px] bg-ink/5 text-ink-soft" />}
      <span className="absolute bottom-1 right-1 grid size-6 place-items-center rounded-full bg-ink/75 text-white">{busy ? '…' : <Camera size={14} weight="bold" />}</span>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={async (e) => {
          const f = e.target.files?.[0]
          if (!f) return
          setBusy(true)
          try {
            onChange(await uploadPhoto(f, folder))
          } catch (err) {
            toast(`Photo upload failed: ${(err as Error).message}`)
          } finally {
            setBusy(false)
            e.target.value = ''
          }
        }}
      />
    </button>
  )
}

function useTable(table: string) {
  const { toast } = useAdmin()
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const load = async () => {
    const { data, error } = await supabase.from(table).select('*').order('sort')
    if (error) toast(error.message)
    setRows(data ?? [])
    setLoading(false)
  }
  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table])
  const save = async (row: Row, msg = 'Saved') => {
    const { data, error } = await supabase.from(table).upsert(row).select().single()
    if (error) {
      toast(error.message)
      return false
    }
    setRows((r) => (r.some((x) => x.id === data.id) ? r.map((x) => (x.id === data.id ? data : x)) : [...r, data]))
    toast(msg)
    return true
  }
  const remove = async (id: string, name: string) => {
    if (!window.confirm(`Delete "${name}"? Customers won't see it anymore. Hiding it instead keeps it for later.`)) return
    const { error } = await supabase.from(table).delete().eq('id', id)
    if (error) return toast(error.message)
    setRows((r) => r.filter((x) => x.id !== id))
    toast('Deleted')
  }
  return { rows, loading, save, remove }
}

export function MenuManager() {
  const [tab, setTab] = useState<Tab>('trays')
  return (
    <Page title="Menu">
      <p className="-mt-3 mb-5 text-ink-soft">Changes show on the website right away. Turn an item off to hide it when it's sold out.</p>
      <div className="mb-6 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap" role="tablist">
        {TABS.map((t) => (
          <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)} className={`h-11 cursor-pointer rounded-full px-4 text-sm font-semibold ${tab === t.id ? 'bg-leaf text-white' : 'bg-white ring-1 ring-inset ring-ink/12 hover:ring-leaf/50'}`}>
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'trays' && <Trays />}
      {tab === 'packages' && <Packages />}
      {tab === 'lechon' && <Lechon />}
      {tab === 'zones' && <Zones />}
      {tab === 'payment' && (
        <div className="grid gap-6">
          <NotifySettings />
          <PaymentSettings />
        </div>
      )}
    </Page>
  )
}

/* ---------- Dishes ---------- */

function Trays() {
  const { rows, loading, save, remove } = useTable('trays')
  const [draft, setDraft] = useState<Row | null>(null)
  if (loading) return <div className="h-40 animate-pulse rounded-[20px] bg-ink/5" />
  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button variant="leaf" size="sm" onClick={() => setDraft({ id: '', name: '', price: 0, category: 'chicken', img: '', note: '', available: true, sort: rows.length })}>
          <Plus size={16} weight="bold" /> Add dish
        </Button>
      </div>
      <ul className="grid gap-2">
        {rows.map((t) => (
          <li key={t.id} className={`flex items-center gap-3 rounded-[16px] bg-white p-3 ring-1 ring-inset ring-ink/8 ${t.available ? '' : 'opacity-60'}`}>
            <PhotoPicker src={t.img} folder="trays" label={t.name} onChange={(img) => save({ ...t, img }, 'Photo updated')} />
            <button type="button" onClick={() => setDraft(t)} className="min-w-0 flex-1 cursor-pointer text-left">
              <p className="truncate font-semibold">{t.name}</p>
              <p className="text-sm text-ink-soft">
                <span className="num font-semibold text-leaf">{peso(t.price)}</span> · {TRAY_CATEGORIES.find((c) => c.id === t.category)?.label}
                {t.note ? ` · ${t.note}` : ''}
              </p>
            </button>
            <Toggle checked={t.available} label={`${t.name} available`} onChange={(v) => save({ ...t, available: v }, v ? `${t.name} is back on the menu` : `${t.name} hidden`)} />
          </li>
        ))}
      </ul>
      <Sheet open={!!draft} onClose={() => setDraft(null)} title={draft?.id ? 'Edit dish' : 'New dish'} footer={draft && <SaveBar onSave={async () => (await save({ ...draft, id: draft.id || slug(draft.name), price: Number(draft.price) || 0 })) && setDraft(null)} onDelete={draft.id ? async () => (await remove(draft.id, draft.name), setDraft(null)) : undefined} disabled={!draft.name.trim()} />}>
        {draft && (
          <div className="grid gap-4">
            <Field label="Dish name" htmlFor="d-name">
              <input id="d-name" data-autofocus className={inputClass()} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Price per large tray (₱)" htmlFor="d-price">
                <input id="d-price" type="number" inputMode="numeric" min={0} className={`num ${inputClass()}`} value={draft.price} onChange={(e) => setDraft({ ...draft, price: e.target.value })} />
              </Field>
              <Field label="Category" htmlFor="d-cat">
                <select id="d-cat" className={inputClass()} value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })}>
                  {TRAY_CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <Field label="Short note" htmlFor="d-note" optional hint="Shown next to the price, e.g. 100 pcs">
              <input id="d-note" className={inputClass()} value={draft.note ?? ''} onChange={(e) => setDraft({ ...draft, note: e.target.value })} />
            </Field>
            <div className="flex items-center gap-3">
              <PhotoPicker src={draft.img} folder="trays" label={draft.name || 'new dish'} onChange={(img) => setDraft({ ...draft, img })} />
              <p className="text-sm text-ink-soft">Tap the photo to upload one. Square or landscape photos work best.</p>
            </div>
          </div>
        )}
      </Sheet>
    </>
  )
}

function SaveBar({ onSave, onDelete, disabled }: { onSave: () => unknown; onDelete?: () => unknown; disabled?: boolean }) {
  const [busy, setBusy] = useState(false)
  return (
    <div className="flex items-center gap-2">
      {onDelete && (
        <Button variant="ghost" className="!text-chili" onClick={() => onDelete()}>
          <Trash size={16} weight="bold" /> Delete
        </Button>
      )}
      <Button
        size="lg"
        className="ml-auto"
        disabled={disabled || busy}
        onClick={async () => {
          setBusy(true)
          await onSave()
          setBusy(false)
        }}
      >
        {busy ? 'Saving…' : 'Save'}
      </Button>
    </div>
  )
}

/* ---------- Packages ---------- */

function Packages() {
  const { rows, loading, save, remove } = useTable('packages')
  const trays = useTable('trays').rows
  const [draft, setDraft] = useState<Row | null>(null)
  if (loading) return <div className="h-40 animate-pulse rounded-[20px] bg-ink/5" />

  const set = (patch: Row) => setDraft((d) => ({ ...d!, ...patch }))
  const setGroup = (i: number, patch: Row) => set({ groups: draft!.groups.map((g: Row, j: number) => (j === i ? { ...g, ...patch } : g)) })
  const trayOpt = (id: string) => {
    const t = trays.find((x) => x.id === id)
    return t ? { id: t.id, name: t.name, img: t.img } : null
  }

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button
          variant="leaf"
          size="sm"
          onClick={() => setDraft({ id: '', code: '', name: '', price: 0, pax_min: 10, pax_max: 15, summary: '', fixed: [], groups: [], freebies: [], pickup_only: false, add_ons: [], available: true, sort: rows.length })}
        >
          <Plus size={16} weight="bold" /> Add package
        </Button>
      </div>
      {rows.length === 0 ? (
        <Empty title="No packages yet" />
      ) : (
        <ul className="grid gap-2 lg:grid-cols-2">
          {rows.map((p) => (
            <li key={p.id} className={`flex items-center gap-3 rounded-[16px] bg-white p-3 ring-1 ring-inset ring-ink/8 ${p.available ? '' : 'opacity-60'}`}>
              <button type="button" onClick={() => setDraft(structuredClone(p))} className="min-w-0 flex-1 cursor-pointer text-left">
                <p className="truncate font-semibold">
                  <span className="num text-sm text-ink-soft">{p.code}</span> {p.name}
                </p>
                <p className="text-sm text-ink-soft">
                  <span className="num font-semibold text-leaf">{peso(p.price)}</span> · {p.pax_min === p.pax_max ? p.pax_min : `${p.pax_min}–${p.pax_max}`} pax
                  {p.pickup_only ? ' · pick-up only' : ''}
                </p>
              </button>
              <Toggle checked={p.available} label={`${p.name} available`} onChange={(v) => save({ ...p, available: v }, v ? 'Package shown' : 'Package hidden')} />
            </li>
          ))}
        </ul>
      )}

      <Sheet
        open={!!draft}
        onClose={() => setDraft(null)}
        title={draft?.id ? 'Edit package' : 'New package'}
        wideClass="md:w-[680px]"
        footer={
          draft && (
            <SaveBar
              disabled={!draft.name.trim() || draft.groups.some((g: Row) => !g.label || g.options.length < g.choose)}
              onSave={async () =>
                (await save({ ...draft, id: draft.id || slug(draft.name), code: draft.code || slug(draft.name).toUpperCase().slice(0, 8), price: Number(draft.price) || 0, pax_min: Number(draft.pax_min) || 0, pax_max: Number(draft.pax_max) || 0 })) && setDraft(null)
              }
              onDelete={draft.id ? async () => (await remove(draft.id, draft.name), setDraft(null)) : undefined}
            />
          )
        }
      >
        {draft && (
          <div className="grid gap-5">
            <div className="grid gap-3 sm:grid-cols-[1fr_8rem]">
              <Field label="Package name" htmlFor="p-name">
                <input id="p-name" data-autofocus className={inputClass()} value={draft.name} onChange={(e) => set({ name: e.target.value })} />
              </Field>
              <Field label="Code" htmlFor="p-code" optional>
                <input id="p-code" className={`num ${inputClass()}`} value={draft.code} onChange={(e) => set({ code: e.target.value.toUpperCase() })} />
              </Field>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Price (₱)" htmlFor="p-price">
                <input id="p-price" type="number" min={0} className={`num ${inputClass()}`} value={draft.price} onChange={(e) => set({ price: e.target.value })} />
              </Field>
              <Field label="Pax from" htmlFor="p-min">
                <input id="p-min" type="number" min={1} className={`num ${inputClass()}`} value={draft.pax_min} onChange={(e) => set({ pax_min: e.target.value })} />
              </Field>
              <Field label="Pax to" htmlFor="p-max">
                <input id="p-max" type="number" min={1} className={`num ${inputClass()}`} value={draft.pax_max} onChange={(e) => set({ pax_max: e.target.value })} />
              </Field>
            </div>
            <Field label="Short description" htmlFor="p-sum">
              <input id="p-sum" className={inputClass()} value={draft.summary} onChange={(e) => set({ summary: e.target.value })} />
            </Field>
            <label className="flex items-center gap-3 font-semibold">
              <Toggle checked={draft.pickup_only} label="Pick-up only" onChange={(v) => set({ pickup_only: v })} /> Pick-up only (no delivery)
            </label>

            <fieldset className="rounded-[16px] bg-white p-4 ring-1 ring-inset ring-ink/8">
              <legend className="display px-1 font-bold">Always included</legend>
              <ul className="grid gap-2">
                {draft.fixed.map((f: Row, i: number) => (
                  <li key={i} className="flex items-center gap-2">
                    <PhotoPicker src={f.img} folder="packages" label={f.name} onChange={(img) => set({ fixed: draft.fixed.map((x: Row, j: number) => (j === i ? { ...x, img } : x)) })} />
                    <input aria-label="Item name" className={inputClass()} value={f.name} onChange={(e) => set({ fixed: draft.fixed.map((x: Row, j: number) => (j === i ? { ...x, name: e.target.value } : x)) })} />
                    <button type="button" aria-label={`Remove ${f.name}`} onClick={() => set({ fixed: draft.fixed.filter((_: Row, j: number) => j !== i) })} className="grid size-10 shrink-0 cursor-pointer place-items-center rounded-[10px] text-chili hover:bg-chili/10">
                      <Trash size={18} />
                    </button>
                  </li>
                ))}
              </ul>
              <TrayAdder trays={trays} label="Add included item" onPick={(o) => set({ fixed: [...draft.fixed, { name: o.name, img: o.img }] })} allowCustom />
            </fieldset>

            <fieldset className="grid gap-3">
              <legend className="display mb-2 font-bold">Customer chooses</legend>
              {draft.groups.map((g: Row, i: number) => (
                <div key={i} className="rounded-[16px] bg-white p-4 ring-1 ring-inset ring-ink/8">
                  <div className="grid gap-3 sm:grid-cols-[1fr_7rem_auto]">
                    <input aria-label="Choice label" placeholder="e.g. Your 5 trays" className={inputClass(!g.label)} value={g.label} onChange={(e) => setGroup(i, { label: e.target.value })} />
                    <label className="flex items-center gap-2 text-sm font-semibold">
                      Pick
                      <input type="number" min={1} aria-label="How many to pick" className={`num ${inputClass()}`} value={g.choose} onChange={(e) => setGroup(i, { choose: Math.max(1, Number(e.target.value) || 1) })} />
                    </label>
                    <button type="button" onClick={() => set({ groups: draft.groups.filter((_: Row, j: number) => j !== i) })} className="h-12 cursor-pointer rounded-[12px] px-3 text-sm font-semibold text-chili hover:bg-chili/10">
                      Remove choice
                    </button>
                  </div>
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {g.options.map((o: Row) => (
                      <li key={o.id} className="inline-flex items-center gap-1.5 rounded-full bg-leaf/10 py-1 pl-3 pr-1 text-sm font-semibold text-leaf-700">
                        {o.name}
                        <button type="button" aria-label={`Remove ${o.name}`} onClick={() => setGroup(i, { options: g.options.filter((x: Row) => x.id !== o.id) })} className="grid size-6 cursor-pointer place-items-center rounded-full hover:bg-leaf/20">
                          ×
                        </button>
                      </li>
                    ))}
                  </ul>
                  {g.options.length < g.choose && <p className="mt-2 text-sm text-chili">Add at least {g.choose} options.</p>}
                  <TrayAdder
                    trays={trays.filter((t) => !g.options.some((o: Row) => o.id === t.id))}
                    label="Add option"
                    allowCustom
                    onPick={(o) => setGroup(i, { options: [...g.options, { ...o, id: o.id || slug(o.name) }] })}
                    resolve={trayOpt}
                  />
                </div>
              ))}
              <Button variant="ghost" size="sm" className="w-fit" onClick={() => set({ groups: [...draft.groups, { id: `g${Date.now().toString(36)}`, label: '', choose: 1, options: [] }] })}>
                <Plus size={16} weight="bold" /> Add a choice
              </Button>
            </fieldset>

            <Field label="Free items" htmlFor="p-free" optional hint="Separate with commas, e.g. Maja">
              <input id="p-free" className={inputClass()} value={(draft.freebies ?? []).join(', ')} onChange={(e) => set({ freebies: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })} />
            </Field>

            <fieldset className="rounded-[16px] bg-white p-4 ring-1 ring-inset ring-ink/8">
              <legend className="display px-1 font-bold">Add-ons</legend>
              {draft.add_ons.map((a: Row, i: number) => {
                const up = (patch: Row) => set({ add_ons: draft.add_ons.map((x: Row, j: number) => (j === i ? { ...x, ...patch } : x)) })
                return (
                  <div key={i} className="mb-2 grid grid-cols-2 gap-2 sm:grid-cols-[1fr_6rem_5rem_5rem_auto]">
                    <input aria-label="Add-on name" className={`col-span-2 sm:col-span-1 ${inputClass()}`} value={a.name} onChange={(e) => up({ name: e.target.value, id: a.id || slug(e.target.value) })} placeholder="Name" />
                    <input aria-label="Price" type="number" className={`num ${inputClass()}`} value={a.price} onChange={(e) => up({ price: Number(e.target.value) || 0 })} placeholder="₱" />
                    <input aria-label="Per unit" className={inputClass()} value={a.perUnit ?? ''} onChange={(e) => up({ perUnit: e.target.value || undefined })} placeholder="per (kg)" />
                    <input aria-label="Maximum" type="number" className={`num ${inputClass()}`} value={a.max ?? ''} onChange={(e) => up({ max: Number(e.target.value) || undefined })} placeholder="max" />
                    <button type="button" aria-label="Remove add-on" onClick={() => set({ add_ons: draft.add_ons.filter((_: Row, j: number) => j !== i) })} className="grid h-12 cursor-pointer place-items-center rounded-[10px] px-2 text-chili hover:bg-chili/10">
                      <Trash size={18} />
                    </button>
                  </div>
                )
              })}
              <Button variant="ghost" size="sm" onClick={() => set({ add_ons: [...draft.add_ons, { id: '', name: '', price: 0, max: 1 }] })}>
                <Plus size={16} weight="bold" /> Add add-on
              </Button>
            </fieldset>
          </div>
        )}
      </Sheet>
    </>
  )
}

function TrayAdder({ trays, label, onPick, allowCustom, resolve }: { trays: Row[]; label: string; onPick: (o: { id: string; name: string; img: string }) => void; allowCustom?: boolean; resolve?: (id: string) => { id: string; name: string; img: string } | null }) {
  const [custom, setCustom] = useState('')
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      <select
        aria-label={label}
        className={`${inputClass()} !h-10 !w-auto min-w-48 text-sm`}
        value=""
        onChange={(e) => {
          const t = resolve ? resolve(e.target.value) : trays.find((x) => x.id === e.target.value)
          if (t) onPick({ id: t.id, name: t.name, img: t.img })
        }}
      >
        <option value="">{label} from dishes…</option>
        {trays.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>
      {allowCustom && (
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            if (!custom.trim()) return
            onPick({ id: '', name: custom.trim(), img: '' })
            setCustom('')
          }}
        >
          <input aria-label="Other item name" placeholder="or type another item" className={`${inputClass()} !h-10 w-44 text-sm`} value={custom} onChange={(e) => setCustom(e.target.value)} />
          <Button type="submit" variant="ghost" size="sm">
            Add
          </Button>
        </form>
      )}
    </div>
  )
}

/* ---------- Lechon ---------- */

function Lechon() {
  const { rows, loading, save, remove } = useTable('lechon_options')
  const [draft, setDraft] = useState<Row | null>(null)
  if (loading) return <div className="h-40 animate-pulse rounded-[20px] bg-ink/5" />
  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button variant="leaf" size="sm" onClick={() => setDraft({ id: '', kind: 'whole', label: '', kilos: 0, price: 0, available: true, sort: rows.length })}>
          <Plus size={16} weight="bold" /> Add size
        </Button>
      </div>
      {(['whole', 'belly', 'inyuha'] as const).map((kind) => (
        <section key={kind} className="mb-6">
          <h2 className="display mb-2 text-lg font-bold">{kind === 'whole' ? 'Whole lechon' : kind === 'belly' ? 'Lechon belly' : 'Lechon Inyuha (customer brings the pig)'}</h2>
          <ul className="grid gap-2 sm:grid-cols-2">
            {rows
              .filter((r) => r.kind === kind)
              .map((o) => (
                <li key={o.id} className={`flex items-center gap-3 rounded-[16px] bg-white p-3 ring-1 ring-inset ring-ink/8 ${o.available ? '' : 'opacity-60'}`}>
                  <button type="button" onClick={() => setDraft(o)} className="flex-1 cursor-pointer text-left">
                    <p className="font-semibold">{o.label}</p>
                    <p className="num text-sm font-semibold text-leaf">{peso(o.price)}</p>
                  </button>
                  <Toggle checked={o.available} label={`${o.label} available`} onChange={(v) => save({ ...o, available: v })} />
                </li>
              ))}
          </ul>
        </section>
      ))}
      <Sheet
        open={!!draft}
        onClose={() => setDraft(null)}
        title={draft?.id ? 'Edit lechon size' : 'New lechon size'}
        footer={draft && <SaveBar disabled={!draft.label.trim()} onSave={async () => (await save({ ...draft, id: draft.id || `${draft.kind}-${slug(draft.label)}`, kilos: Number(draft.kilos) || 0, price: Number(draft.price) || 0 })) && setDraft(null)} onDelete={draft.id ? async () => (await remove(draft.id, draft.label), setDraft(null)) : undefined} />}
      >
        {draft && (
          <div className="grid gap-4">
            <Field label="Type" htmlFor="l-kind">
              <select id="l-kind" className={inputClass()} value={draft.kind} onChange={(e) => setDraft({ ...draft, kind: e.target.value })} disabled={!!draft.id}>
                <option value="whole">Whole lechon</option>
                <option value="belly">Lechon belly</option>
                <option value="inyuha">Lechon Inyuha (roasting fee)</option>
              </select>
            </Field>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Label" htmlFor="l-label">
                <input id="l-label" data-autofocus placeholder="20 kg" className={inputClass()} value={draft.label} onChange={(e) => setDraft({ ...draft, label: e.target.value })} />
              </Field>
              <Field label="Kilos" htmlFor="l-kg">
                <input id="l-kg" type="number" className={`num ${inputClass()}`} value={draft.kilos} onChange={(e) => setDraft({ ...draft, kilos: e.target.value })} />
              </Field>
              <Field label="Price (₱)" htmlFor="l-price">
                <input id="l-price" type="number" className={`num ${inputClass()}`} value={draft.price} onChange={(e) => setDraft({ ...draft, price: e.target.value })} />
              </Field>
            </div>
          </div>
        )}
      </Sheet>
    </>
  )
}

/* ---------- Delivery areas ---------- */

function Zones() {
  const { rows, loading, save, remove } = useTable('zones')
  const [draft, setDraft] = useState<Row | null>(null)
  if (loading) return <div className="h-40 animate-pulse rounded-[20px] bg-ink/5" />
  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button variant="leaf" size="sm" onClick={() => setDraft({ id: '', label: '', detail: '', fee_min: 0, fee_max: 0, quote: false, active: true, sort: rows.length })}>
          <Plus size={16} weight="bold" /> Add area
        </Button>
      </div>
      <ul className="grid gap-2">
        {rows.map((z) => (
          <li key={z.id} className={`flex items-center gap-3 rounded-[16px] bg-white p-3 ring-1 ring-inset ring-ink/8 ${z.active ? '' : 'opacity-60'}`}>
            <button type="button" onClick={() => setDraft(z)} className="min-w-0 flex-1 cursor-pointer text-left">
              <p className="font-semibold">{z.label}</p>
              <p className="text-sm text-ink-soft">
                <span className="num font-semibold text-leaf">{z.id === 'pickup' ? 'Free' : z.quote ? 'Quoted' : z.fee_min === z.fee_max ? peso(z.fee_min) : `${peso(z.fee_min)}–${peso(z.fee_max)}`}</span> · {z.detail}
              </p>
            </button>
            <Toggle checked={z.active} label={`${z.label} active`} onChange={(v) => save({ ...z, active: v })} />
          </li>
        ))}
      </ul>
      <Sheet
        open={!!draft}
        onClose={() => setDraft(null)}
        title={draft?.id ? 'Edit delivery area' : 'New delivery area'}
        footer={draft && <SaveBar disabled={!draft.label.trim()} onSave={async () => (await save({ ...draft, id: draft.id || slug(draft.label), fee_min: Number(draft.fee_min) || 0, fee_max: Number(draft.fee_max) || Number(draft.fee_min) || 0 })) && setDraft(null)} onDelete={draft.id && draft.id !== 'pickup' ? async () => (await remove(draft.id, draft.label), setDraft(null)) : undefined} />}
      >
        {draft && (
          <div className="grid gap-4">
            <Field label="Area name" htmlFor="z-label">
              <input id="z-label" data-autofocus className={inputClass()} value={draft.label} onChange={(e) => setDraft({ ...draft, label: e.target.value })} />
            </Field>
            <Field label="Details" htmlFor="z-detail" optional>
              <input id="z-detail" className={inputClass()} value={draft.detail} onChange={(e) => setDraft({ ...draft, detail: e.target.value })} />
            </Field>
            {draft.id !== 'pickup' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Fee from (₱)" htmlFor="z-min">
                    <input id="z-min" type="number" className={`num ${inputClass()}`} value={draft.fee_min} onChange={(e) => setDraft({ ...draft, fee_min: e.target.value })} />
                  </Field>
                  <Field label="Fee up to (₱)" htmlFor="z-max">
                    <input id="z-max" type="number" className={`num ${inputClass()}`} value={draft.fee_max} onChange={(e) => setDraft({ ...draft, fee_max: e.target.value })} />
                  </Field>
                </div>
                <label className="flex items-center gap-3 font-semibold">
                  <Toggle checked={draft.quote} label="Quote each time" onChange={(v) => setDraft({ ...draft, quote: v })} /> No fixed fee, Lenlyn quotes each order
                </label>
              </>
            )}
          </div>
        )}
      </Sheet>
    </>
  )
}
/* ---------- Order notification email ---------- */

function NotifySettings() {
  const { toast } = useAdmin()
  const [emails, setEmails] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    supabase
      .from('notify_settings')
      .select('owner_emails')
      .eq('id', 1)
      .maybeSingle()
      .then(({ data }) => {
        setEmails(data?.owner_emails ?? '')
        setLoading(false)
      })
  }, [])

  const list = emails.split(',').map((e) => e.trim()).filter(Boolean)
  const valid = list.length > 0 && list.every((e) => /^\S+@\S+\.\S+$/.test(e))
  const save = async () => {
    setBusy(true)
    const { error } = await supabase.from('notify_settings').update({ owner_emails: list.join(', ') }).eq('id', 1)
    setBusy(false)
    toast(error ? error.message : 'Notification email saved')
  }

  if (loading) return <div className="h-32 animate-pulse rounded-[20px] bg-ink/5" />
  return (
    <div className="grid max-w-xl gap-4 rounded-[20px] bg-white p-5 ring-1 ring-inset ring-ink/8">
      <div>
        <h2 className="display text-lg font-bold">New-order emails</h2>
        <p className="text-sm text-ink-soft">Each new order is emailed here with the payment screenshot attached.</p>
      </div>
      <Field label="Send new orders to" htmlFor="notify-emails" error={valid ? undefined : 'Enter at least one valid email address.'} hint={valid ? 'For more than one address, separate them with commas.' : undefined}>
        <input id="notify-emails" type="text" inputMode="email" autoComplete="off" className={inputClass(!valid)} value={emails} onChange={(e) => setEmails(e.target.value)} />
      </Field>
      <Button className="w-fit" disabled={busy || !valid} onClick={save}>
        {busy ? 'Saving…' : 'Save'}
      </Button>
    </div>
  )
}

/* ---------- Payment ---------- */

function PaymentSettings() {
  const { toast } = useAdmin()
  const [enabled, setEnabled] = useState(true)
  const [percent, setPercent] = useState('50')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    supabase
      .from('settings')
      .select('*')
      .eq('id', 1)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setEnabled(data.allow_downpayment)
          setPercent(String(Math.round(Number(data.downpayment_rate) * 100)))
        }
        setLoading(false)
      })
  }, [])

  const n = Number(percent)
  const valid = Number.isFinite(n) && n >= 10 && n <= 90
  const save = async () => {
    setBusy(true)
    const { error } = await supabase.from('settings').update({ allow_downpayment: enabled, downpayment_rate: n / 100 }).eq('id', 1)
    setBusy(false)
    toast(error ? error.message : 'Payment settings saved')
  }

  if (loading) return <div className="h-40 animate-pulse rounded-[20px] bg-ink/5" />
  return (
    <div className="grid max-w-xl gap-5 rounded-[20px] bg-white p-5 ring-1 ring-inset ring-ink/8">
      <div>
        <h2 className="display text-lg font-bold">Down payment</h2>
        <p className="text-sm text-ink-soft">Let customers pay part of the food total now and the balance on pick-up or delivery.</p>
      </div>
      <label className="flex items-center gap-3 font-semibold">
        <Toggle checked={enabled} label="Allow down payment" onChange={setEnabled} /> {enabled ? 'Customers can choose a down payment' : 'Full payment only'}
      </label>
      {enabled && (
        <Field label="Down payment share (%)" htmlFor="dp-rate" error={valid ? undefined : 'Enter a number from 10 to 90.'} hint={valid ? `A ₱10,000 order would need ${peso(Math.round(10000 * (n / 100)))} now and ${peso(10000 - Math.round(10000 * (n / 100)))} later.` : undefined}>
          <input id="dp-rate" type="number" inputMode="numeric" min={10} max={90} className={`num ${inputClass(!valid)} max-w-40`} value={percent} onChange={(e) => setPercent(e.target.value)} />
        </Field>
      )}
      <Button className="w-fit" disabled={busy || (enabled && !valid)} onClick={save}>
        {busy ? 'Saving…' : 'Save'}
      </Button>
    </div>
  )
}
/* eslint-enable @typescript-eslint/no-explicit-any */
