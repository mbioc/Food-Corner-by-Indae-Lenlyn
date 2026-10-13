import type { Order } from './sb'

// Order slip for a 58 mm thermal receipt printer (about 48 mm of printable width).
// Thermal heads print black only, so the layout uses weight, size and rules instead of colour.

const esc = (s: unknown) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)
const peso = (n: number) => `₱${Number(n).toLocaleString('en-PH')}`

function longDate(iso: string) {
  return new Date(`${iso.slice(0, 10)}T00:00:00`).toLocaleDateString('en-PH', { weekday: 'short', month: 'short', day: 'numeric' })
}
function time12(t: string) {
  const [h, m] = t.split(':').map(Number)
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`
}

const CSS = `
@page { size: 58mm auto; margin: 0; }
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { width: 58mm; }
body { padding: 2mm 5mm 6mm 5mm; font: 600 10pt/1.3 Arial, Helvetica, sans-serif; color: #000; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.c { text-align: center; }
.shop { font-size: 13pt; font-weight: 800; letter-spacing: .2px; }
.sub { font-size: 8.5pt; font-weight: 600; }
.rule { border-top: 0.4mm dashed #000; margin: 2mm 0; }
.solid { border-top: 0.6mm solid #000; margin: 2mm 0; }
.id { font-size: 17pt; font-weight: 800; line-height: 1.1; }
.tag { display: inline-block; border: 0.5mm solid #000; padding: 0 1.5mm; font-size: 9pt; font-weight: 800; margin-top: 1mm; }
.lbl { font-size: 8pt; font-weight: 800; text-transform: uppercase; letter-spacing: .4px; }
.big { font-size: 14pt; font-weight: 800; line-height: 1.15; }
.box { border: 0.6mm solid #000; padding: 1.5mm 2mm; margin: 2mm 0; }
.row { display: flex; justify-content: space-between; gap: 2mm; }
.row > :last-child { text-align: right; white-space: nowrap; }
.item { margin-bottom: 1.8mm; break-inside: avoid; }
.item .name { font-size: 11pt; font-weight: 800; line-height: 1.2; }
.item .d { font-size: 9pt; font-weight: 600; padding-left: 3mm; }
.tot { font-size: 12pt; font-weight: 800; }
.note { font-size: 10pt; font-weight: 700; }
.foot { font-size: 8pt; font-weight: 600; margin-top: 3mm; }
`

/** Full HTML document for one order slip. */
export function slipHtml(o: Order, printedAt = new Date()): string {
  const pickup = o.zone_id === 'pickup'
  const balance = o.subtotal - o.amount_paid
  const paid = o.amount_paid > 0 && o.payment_status !== 'rejected'
  const unchecked = paid && o.payment_status === 'unverified'
  const items = o.items
    .map(
      (it) => `<div class="item">
  <div class="name">${esc(it.qty)} x ${esc(it.title)}</div>
  ${(it.detail ?? []).map((d) => `<div class="d">${esc(d)}</div>`).join('')}
  <div class="row"><span></span><span>${peso(it.total)}</span></div>
</div>`,
    )
    .join('')

  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(o.id)}</title><style>${CSS}</style></head><body>
<div class="c">
  <div class="shop">FOOD CORNER</div>
  <div class="sub">by Indae Lenlyn · Tabgas, Albuera</div>
  <div class="sub">0951 510 6845</div>
</div>
<div class="solid"></div>
<div class="c">
  <div class="lbl">Order</div>
  <div class="id">${esc(o.id)}</div>
  ${o.source === 'walk-in' ? '<div class="tag">WALK-IN</div>' : ''}${o.status === 'cancelled' ? '<div class="tag">CANCELLED</div>' : ''}
</div>
<div class="box c">
  <div class="lbl">Needed on</div>
  <div class="big">${esc(longDate(o.event_date))}</div>
  <div class="big">${esc(time12(o.event_time))}</div>
  ${[o.occasion, o.pax ? `${o.pax} pax` : ''].filter(Boolean).length ? `<div class="sub">${esc([o.occasion, o.pax ? `${o.pax} pax` : ''].filter(Boolean).join(' · '))}</div>` : ''}
</div>
<div class="lbl">${pickup ? 'Pick-up at the kitchen' : 'Delivery'}</div>
${pickup ? '' : `<div class="note">${esc(o.zone_label)}</div><div>${esc(o.address)}</div>${o.landmark ? `<div>Landmark: ${esc(o.landmark)}</div>` : ''}`}
<div class="rule"></div>
<div class="lbl">Customer</div>
<div class="note">${esc(o.customer_name)}</div>
${o.mobile ? `<div>${esc(o.mobile)}</div>` : ''}
${o.fb_name ? `<div>FB: ${esc(o.fb_name)}</div>` : ''}
<div class="solid"></div>
<div class="lbl">Items</div>
<div style="margin-top:1mm">${items}</div>
<div class="solid"></div>
<div class="row tot"><span>Food total</span><span>${peso(o.subtotal)}</span></div>
${pickup ? '' : `<div class="row"><span>Delivery fee</span><span>${o.delivery_fee == null ? 'to confirm' : peso(o.delivery_fee)}</span></div>`}
<div class="row"><span>${paid ? `Paid${o.pay_channel ? ` (${esc(o.pay_channel)})` : ''}${unchecked ? ', to check' : ''}` : 'Paid'}</span><span>${paid ? peso(o.amount_paid) : '₱0'}</span></div>
${
  !paid
    ? `<div class="box c"><div class="lbl">Not paid yet · to collect</div><div class="big">${peso(o.subtotal)}</div></div>`
    : balance > 0 && !o.balance_paid_at
      ? `<div class="box c"><div class="lbl">Balance to collect</div><div class="big">${peso(balance)}</div></div>`
      : '<div class="c tot" style="margin-top:1.5mm">FULLY PAID</div>'
}
${o.notes ? `<div class="rule"></div><div class="lbl">Customer note</div><div class="note">${esc(o.notes)}</div>` : ''}
${o.staff_note ? `<div class="rule"></div><div class="lbl">Kitchen note</div><div class="note">${esc(o.staff_note)}</div>` : ''}
<div class="rule"></div>
<div class="c foot">Printed ${esc(printedAt.toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }))}</div>
<div class="c foot">Salamat po!</div>
</body></html>`
}

/** Opens the slip in a small window and sends it to the printer. */
export function printSlip(o: Order) {
  const w = window.open('', '_blank', 'width=420,height=760')
  if (!w) return false
  w.document.write(slipHtml(o))
  w.document.close()
  w.onload = () => {
    w.focus()
    w.print()
  }
  return true
}
