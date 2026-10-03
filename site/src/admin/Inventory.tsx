import { MagnifyingGlass, Minus, Plus, Trash, WarningCircle } from '@phosphor-icons/react'
import { useEffect, useMemo, useState } from 'react'
import { Sheet } from '../components/Sheet'
import { Button, Field, inputClass } from '../components/ui'
import { useAdmin } from './data'
import { peso } from './meta'
import { supabase } from './sb'
import { Empty, Page } from './ui'

interface Item {
  id: string
  name: string
  category: string
  unit: string
  quantity: number
  low_level: number | null
  cost: number | null
  note: string | null
  updated_at: string
}

interface Move {
  id: number
  change: number
  quantity_after: number
  reason: string
  note: string | null
  actor_name: string | null
  created_at: string
}

const CATEGORIES = ['Meat', 'Seafood', 'Vegetables', 'Rice & noodles', 'Condiments & spices', 'Oil & dry goods', 'Packaging', 'Fuel', 'Other']
const UNITS = ['kg', 'g', 'pcs', 'pack', 'L', 'mL', 'bottle', 'can', 'sack', 'tray', 'box', 'bundle']
const IN_REASONS = ['Bought', 'Correction']
const OUT_REASONS = ['Used for cooking', 'Spoiled or wasted', 'Correction']

const num = (n: number) => Number(n).toLocaleString('en-PH', { maximumFractionDigits: 3 })
const isLow = (i: Item) => i.low_level !== null && Number(i.quantity) <= Number(i.low_level)
const fromRow = (r: Item): Item => ({ ...r, quantity: Number(r.quantity), low_level: r.low_level === null ? null : Number(r.low_level), cost: r.cost === null ? null : Number(r.cost) })

type Draft = { id?: string; name: string; category: string; unit: string; quantity: string; low_level: string; cost: string; note: string }

export function Inventory() {
  const { me, toast } = useAdmin()
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('All')
  const [draft, setDraft] = useState<Draft | null>(null)
  const [moves, setMoves] = useState<Move[]>([])
  const [adjust, setAdjust] = useState<{ item: Item; dir: 1 | -1 } | null>(null)
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase
      .from('inventory_items')
      .select('*')
      .order('name')
      .then(({ data, error }) => {
        if (error) toast(error.message)
        setItems((data ?? []).map(fromRow))
        setLoading(false)
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Built-in categories plus any custom ones already used on an item, with Other kept last.
  const allCats = useMemo(() => {
    const custom = [...new Set(items.map((i) => i.category))].filter((c) => !CATEGORIES.includes(c)).sort((a, b) => a.localeCompare(b))
    return [...CATEGORIES.filter((c) => c !== 'Other'), ...custom, 'Other']
  }, [items])
  const [newCat, setNewCat] = useState(false)
  const cats = useMemo(() => ['All', ...allCats.filter((c) => items.some((i) => i.category === c)), ...(items.some(isLow) ? ['Low stock'] : [])], [items, allCats])
  const list = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return items.filter((i) => (cat === 'All' || (cat === 'Low stock' ? isLow(i) : i.category === cat)) && (!needle || i.name.toLowerCase().includes(needle)))
  }, [items, q, cat])
  const lowCount = items.filter(isLow).length
  const value = items.reduce((n, i) => n + (i.cost ? i.cost * i.quantity : 0), 0)

  const upsert = (i: Item) => setItems((cur) => (cur.some((x) => x.id === i.id) ? cur.map((x) => (x.id === i.id ? i : x)) : [...cur, i]).sort((a, b) => a.name.localeCompare(b.name)))

  const openEdit = (i: Item) => {
    setError('')
    setNewCat(false)
    setDraft({ id: i.id, name: i.name, category: i.category, unit: i.unit, quantity: String(i.quantity), low_level: i.low_level === null ? '' : String(i.low_level), cost: i.cost === null ? '' : String(i.cost), note: i.note ?? '' })
    setMoves([])
    supabase
      .from('inventory_moves')
      .select('*')
      .eq('item_id', i.id)
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data }) => setMoves((data as Move[]) ?? []))
  }

  const saveItem = async () => {
    if (!draft) return
    if (!draft.name.trim()) return setError('Enter the item name.')
    const category = draft.category.trim().replace(/\s+/g, ' ').slice(0, 40)
    if (!category) return setError('Type a name for the new category.')
    setBusy(true)
    setError('')
    const fields = {
      name: draft.name.trim(),
      // Reuse an existing category when she types the same name in different capitals.
      category: allCats.find((c) => c.toLowerCase() === category.toLowerCase()) ?? category,
      unit: draft.unit,
      low_level: draft.low_level === '' ? null : Math.max(0, Number(draft.low_level) || 0),
      cost: draft.cost === '' ? null : Math.max(0, Number(draft.cost) || 0),
      note: draft.note.trim() || null,
    }
    if (draft.id) {
      const { data, error } = await supabase.from('inventory_items').update(fields).eq('id', draft.id).select().single()
      setBusy(false)
      if (error) return setError(error.message)
      upsert(fromRow(data as Item))
      toast('Item saved')
    } else {
      // A new item starts at zero; its opening quantity goes through the log like every other change.
      const { data, error } = await supabase.from('inventory_items').insert(fields).select().single()
      if (error) {
        setBusy(false)
        return setError(error.message)
      }
      let item = fromRow(data as Item)
      const opening = Math.max(0, Number(draft.quantity) || 0)
      if (opening > 0) {
        const r = await supabase.rpc('inventory_adjust', { p_item: item.id, p_change: opening, p_reason: 'Starting stock', p_note: null })
        if (r.error) toast(r.error.message)
        else item = fromRow(r.data as Item)
      }
      setBusy(false)
      upsert(item)
      toast(`${item.name} added`)
    }
    setDraft(null)
  }

  const removeItem = async () => {
    if (!draft?.id) return
    if (!window.confirm(`Delete "${draft.name}" and its stock history? This cannot be undone.`)) return
    const { error } = await supabase.from('inventory_items').delete().eq('id', draft.id)
    if (error) return setError(error.message)
    setItems((cur) => cur.filter((x) => x.id !== draft.id))
    toast('Item deleted')
    setDraft(null)
  }

  const openAdjust = (item: Item, dir: 1 | -1) => {
    setError('')
    setAmount('')
    setNote('')
    setReason(dir === 1 ? IN_REASONS[0] : OUT_REASONS[0])
    setAdjust({ item, dir })
  }

  const saveAdjust = async () => {
    if (!adjust) return
    const n = Number(amount)
    if (!Number.isFinite(n) || n <= 0) return setError('Enter an amount more than 0.')
    if (adjust.dir === -1 && n > adjust.item.quantity) return setError(`Only ${num(adjust.item.quantity)} ${adjust.item.unit} in stock.`)
    setBusy(true)
    setError('')
    const { data, error } = await supabase.rpc('inventory_adjust', { p_item: adjust.item.id, p_change: n * adjust.dir, p_reason: reason, p_note: note.trim() || null })
    setBusy(false)
    if (error) return setError(error.message)
    const item = fromRow(data as Item)
    upsert(item)
    toast(`${item.name}: now ${num(item.quantity)} ${item.unit}`)
    setAdjust(null)
  }

  // The form has one error at a time; show it under the category box when that is what's missing.
  const catError = !!error && newCat && !!draft?.name.trim() && !draft?.category.trim()
  const after = adjust && Number(amount) > 0 ? adjust.item.quantity + Number(amount) * adjust.dir : null

  return (
    <Page
      title="Stock"
      actions={
        <>
          <Button variant="leaf" size="sm" className="!h-11" onClick={() => (setError(''), setNewCat(false), setMoves([]), setDraft({ name: '', category: CATEGORIES[0], unit: UNITS[0], quantity: '', low_level: '', cost: '', note: '' }))}>
            <Plus size={16} weight="bold" /> Add item
          </Button>
          <label className="relative">
            <span className="sr-only">Search stock</span>
            <MagnifyingGlass size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search items" className="h-11 w-56 max-w-[60vw] rounded-[12px] border-2 border-ink/10 bg-white pl-9 pr-3 focus:border-leaf focus:outline-none" />
          </label>
        </>
      }
    >
      <p className="-mt-3 mb-5 text-ink-soft">
        Ingredients and supplies for cooking.
        {items.length > 0 && (
          <>
            {' '}
            <span className="num font-semibold text-ink">{items.length}</span> {items.length === 1 ? 'item' : 'items'}
            {lowCount > 0 && (
              <>
                , <span className="num font-semibold text-chili">{lowCount} low</span>
              </>
            )}
            {value > 0 && (
              <>
                , worth about <span className="num font-semibold text-ink">{peso(Math.round(value))}</span>
              </>
            )}
            .
          </>
        )}
      </p>

      {loading ? (
        <div className="grid gap-2">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="h-[72px] animate-pulse rounded-[16px] bg-ink/5" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <Empty title="No stock items yet">
          Tap <b>Add item</b> to list an ingredient or supply, like pork, cooking oil, charcoal or aluminum trays.
        </Empty>
      ) : (
        <>
          <div className="mb-5 flex flex-wrap gap-2" role="group" aria-label="Filter by category">
            {cats.map((c) => (
              <button key={c} type="button" aria-pressed={cat === c} onClick={() => setCat(c)} className={`h-10 cursor-pointer rounded-full px-4 text-sm font-semibold transition-colors ${cat === c ? 'bg-leaf text-white' : 'bg-white ring-1 ring-inset ring-ink/12 hover:ring-leaf/50'}`}>
                {c}
              </button>
            ))}
          </div>
          {list.length === 0 ? (
            <Empty title="No items match" />
          ) : (
            <ul className="grid gap-2">
              {list.map((i) => (
                <li key={i.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-[16px] bg-white p-3 pl-4 ring-1 ring-inset ring-ink/8">
                  <button type="button" onClick={() => openEdit(i)} className="min-w-0 flex-1 cursor-pointer text-left">
                    <p className="truncate font-semibold">{i.name}</p>
                    <p className="truncate text-sm text-ink-soft">
                      {i.category}
                      {i.low_level !== null && ` · low at ${num(i.low_level)} ${i.unit}`}
                    </p>
                  </button>
                  <div className="text-right">
                    <p className={`num display text-xl font-extrabold leading-tight ${isLow(i) ? 'text-chili' : ''}`}>
                      {num(i.quantity)} <span className="text-sm font-bold">{i.unit}</span>
                    </p>
                    {isLow(i) && (
                      <p className="inline-flex items-center gap-1 text-xs font-bold text-chili">
                        <WarningCircle size={14} weight="bold" /> Low stock
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1.5">
                    <button type="button" onClick={() => openAdjust(i, -1)} disabled={i.quantity <= 0} aria-label={`Use ${i.name}`} className="grid size-11 cursor-pointer place-items-center rounded-[12px] bg-ink/6 transition-colors hover:bg-ink/10 disabled:cursor-not-allowed disabled:opacity-35">
                      <Minus size={18} weight="bold" />
                    </button>
                    <button type="button" onClick={() => openAdjust(i, 1)} aria-label={`Add stock of ${i.name}`} className="grid size-11 cursor-pointer place-items-center rounded-[12px] bg-leaf text-white transition-colors hover:bg-leaf-600">
                      <Plus size={18} weight="bold" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {/* Add stock / use stock */}
      <Sheet
        open={!!adjust}
        onClose={() => setAdjust(null)}
        title={adjust ? `${adjust.dir === 1 ? 'Add stock' : 'Use stock'}: ${adjust.item.name}` : ''}
        footer={
          <Button size="lg" className="w-full" disabled={busy} onClick={saveAdjust}>
            {busy ? 'Saving…' : adjust?.dir === 1 ? 'Add to stock' : 'Take from stock'}
          </Button>
        }
      >
        {adjust && (
          <div className="grid gap-4">
            <p className="rounded-[14px] bg-tag p-4">
              In stock now: <span className="num font-bold">{num(adjust.item.quantity)} {adjust.item.unit}</span>
              {after !== null && after >= 0 && (
                <>
                  {' '}
                  → after: <span className="num font-bold">{num(after)} {adjust.item.unit}</span>
                </>
              )}
            </p>
            <Field label={`How many ${adjust.item.unit}?`} htmlFor="adj-amount" error={error || undefined}>
              <input id="adj-amount" data-autofocus type="number" inputMode="decimal" min={0} step="any" className={`num ${inputClass(!!error)}`} value={amount} onChange={(e) => (setAmount(e.target.value), setError(''))} />
            </Field>
            <Field label="Reason" htmlFor="adj-reason">
              <select id="adj-reason" className={inputClass()} value={reason} onChange={(e) => setReason(e.target.value)}>
                {(adjust.dir === 1 ? IN_REASONS : OUT_REASONS).map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </Field>
            <Field label="Note" htmlFor="adj-note" optional>
              <input id="adj-note" className={inputClass()} placeholder={adjust.dir === 1 ? 'Supplier, receipt no.…' : 'Which order or event…'} value={note} onChange={(e) => setNote(e.target.value)} />
            </Field>
          </div>
        )}
      </Sheet>

      {/* Add or edit an item */}
      <Sheet
        open={!!draft}
        onClose={() => setDraft(null)}
        title={draft?.id ? 'Edit item' : 'New stock item'}
        footer={
          <div className="flex items-center gap-2">
            {draft?.id && me.role === 'owner' && (
              <Button variant="ghost" className="!text-chili" onClick={removeItem}>
                <Trash size={16} weight="bold" /> Delete
              </Button>
            )}
            <Button size="lg" className="ml-auto" disabled={busy} onClick={saveItem}>
              {busy ? 'Saving…' : 'Save'}
            </Button>
          </div>
        }
      >
        {draft && (
          <div className="grid gap-4">
            <Field label="Item name" htmlFor="inv-name" error={catError ? undefined : error || undefined}>
              <input id="inv-name" data-autofocus className={inputClass(!!error && !catError)} placeholder="Pork belly, cooking oil, charcoal…" value={draft.name} onChange={(e) => (setDraft({ ...draft, name: e.target.value }), setError(''))} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Category" htmlFor="inv-cat">
                <select
                  id="inv-cat"
                  className={inputClass()}
                  value={newCat ? '__new' : draft.category}
                  onChange={(e) => {
                    const add = e.target.value === '__new'
                    setNewCat(add)
                    setDraft({ ...draft, category: add ? '' : e.target.value })
                    setError('')
                  }}
                >
                  {allCats.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                  <option value="__new">+ Add new category…</option>
                </select>
              </Field>
              <Field label="Unit" htmlFor="inv-unit">
                <select id="inv-unit" className={inputClass()} value={draft.unit} onChange={(e) => setDraft({ ...draft, unit: e.target.value })}>
                  {UNITS.map((u) => (
                    <option key={u}>{u}</option>
                  ))}
                </select>
              </Field>
            </div>
            {newCat && (
              <Field label="New category name" htmlFor="inv-newcat" error={catError ? error : undefined} hint="It joins the list once this item is saved.">
                <input id="inv-newcat" autoFocus maxLength={40} className={inputClass(catError)} placeholder="Dairy, Drinks, Cleaning supplies…" value={draft.category} onChange={(e) => (setDraft({ ...draft, category: e.target.value }), setError(''))} />
              </Field>
            )}
            <div className="grid grid-cols-2 gap-3">
              {draft.id ? (
                <Field label="In stock" htmlFor="inv-qty" hint="Change it with the + and − buttons on the list.">
                  <input id="inv-qty" className={`num ${inputClass()} bg-ink/5`} value={`${num(Number(draft.quantity))} ${draft.unit}`} readOnly />
                </Field>
              ) : (
                <Field label={`In stock now (${draft.unit})`} htmlFor="inv-qty" optional>
                  <input id="inv-qty" type="number" inputMode="decimal" min={0} step="any" className={`num ${inputClass()}`} value={draft.quantity} onChange={(e) => setDraft({ ...draft, quantity: e.target.value })} />
                </Field>
              )}
              <Field label={`Warn when at or below (${draft.unit})`} htmlFor="inv-low" optional>
                <input id="inv-low" type="number" inputMode="decimal" min={0} step="any" className={`num ${inputClass()}`} value={draft.low_level} onChange={(e) => setDraft({ ...draft, low_level: e.target.value })} />
              </Field>
            </div>
            <Field label={`Cost per ${draft.unit} (₱)`} htmlFor="inv-cost" optional hint="Used only to estimate what the stock is worth.">
              <input id="inv-cost" type="number" inputMode="decimal" min={0} step="any" className={`num ${inputClass()}`} value={draft.cost} onChange={(e) => setDraft({ ...draft, cost: e.target.value })} />
            </Field>
            <Field label="Note" htmlFor="inv-note" optional>
              <input id="inv-note" className={inputClass()} placeholder="Supplier, brand, where it's kept…" value={draft.note} onChange={(e) => setDraft({ ...draft, note: e.target.value })} />
            </Field>

            {draft.id && (
              <section className="mt-2">
                <h3 className="display text-lg font-bold">Recent changes</h3>
                {moves.length === 0 ? (
                  <p className="mt-1 text-sm text-ink-soft">No stock changes recorded yet.</p>
                ) : (
                  <ol className="mt-2 space-y-2 border-l-2 border-leaf/25 pl-4">
                    {moves.map((m) => (
                      <li key={m.id} className="text-sm">
                        <p className="font-semibold">
                          <span className={`num ${Number(m.change) < 0 ? 'text-chili' : 'text-leaf-700'}`}>
                            {Number(m.change) > 0 ? '+' : '−'}
                            {num(Math.abs(Number(m.change)))} {draft.unit}
                          </span>{' '}
                          · {m.reason} · now <span className="num">{num(Number(m.quantity_after))}</span>
                        </p>
                        <p className="text-ink-soft">
                          {new Date(m.created_at).toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                          {m.actor_name ? ` · ${m.actor_name}` : ''}
                          {m.note ? ` · ${m.note}` : ''}
                        </p>
                      </li>
                    ))}
                  </ol>
                )}
              </section>
            )}
          </div>
        )}
      </Sheet>
    </Page>
  )
}
