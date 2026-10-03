import { ArrowLeft, ArrowsOut, Check, CheckCircle, CopySimple, DownloadSimple, ImageSquare, MessengerLogo, Phone, ShareNetwork, WarningCircle } from '@phosphor-icons/react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import { createPortal } from 'react-dom'
import { BUSINESS, PAYMENTS, PICKUP_ID, TUPPERWARE, type PayChannel } from '../data/business'
import { asset } from '../lib/asset'
import { useMenu } from '../lib/menu'
import {
  EMPTY_FORM,
  OCCASIONS,
  amountDue,
  compressImage,
  formatDate,
  formatTime,
  messengerUrl,
  orderText,
  submitOrder,
  todayISO,
  validateStep,
  type CheckoutForm,
  type Errors,
} from '../lib/checkout'
import { feeLabel, makeOrderId, peso, useOrder } from '../lib/order'
import type { Zone } from '../data/business'
import { DateField, TimeField } from './DateTimeFields'
import { Sheet } from './Sheet'
import { Button, Field, inputClass } from './ui'

const STEP_TITLES = ['Your details', 'When and where', 'Pay and send']

interface Done {
  orderId: string
  text: string
  emailed: boolean
  error?: string
}

export function Checkout({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { lines, resolved, subtotal, hasPickupOnly, clear } = useOrder()
  const { zones: ZONES, blocked, downpayment: dp } = useMenu()
  const reduce = useReducedMotion()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<CheckoutForm>(EMPTY_FORM)
  const [errors, setErrors] = useState<Errors>({})
  const [proof, setProof] = useState<{ dataUrl: string; name: string } | null>(null)
  const [proofBusy, setProofBusy] = useState(false)
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState<Done | null>(null)
  const orderId = useMemo(() => makeOrderId(), [open]) // eslint-disable-line react-hooks/exhaustive-deps
  const bodyRef = useRef<HTMLDivElement>(null)

  const set = <K extends keyof CheckoutForm>(k: K, v: CheckoutForm[K]) => {
    setForm((f) => ({ ...f, [k]: v }))
    setErrors((e) => ({ ...e, [k]: undefined }))
  }

  const zone = ZONES.find((z) => z.id === form.zone)
  const pay = PAYMENTS.find((p) => p.id === form.payChannel)
  const due = amountDue(subtotal, form.payPlan, dp)

  const close = () => {
    if (done) {
      setDone(null)
      setStep(0)
      setForm(EMPTY_FORM)
      setProof(null)
    }
    onClose()
  }

  const next = () => {
    const e = validateStep(step, form, !!proof, hasPickupOnly, blocked)
    setErrors(e)
    if (Object.keys(e).length) {
      const first = Object.keys(e)[0]
      requestAnimationFrame(() => document.getElementById(`co-${first}`)?.focus())
      return
    }
    if (step < 2) {
      setStep(step + 1)
      bodyRef.current?.closest('.overflow-y-auto')?.scrollTo({ top: 0 })
    } else void send()
  }

  const send = async () => {
    if (!proof) return
    setSending(true)
    const res = await submitOrder({ lines, form, proof })
    setSending(false)
    if (res.rejected) {
      // The server rejected the order (sold out, fully booked…): keep the table so the customer can fix it.
      setErrors({ proof: res.error })
      return
    }
    const id = res.orderId ?? orderId
    setDone({ orderId: id, text: orderText(id, resolved, subtotal, form, ZONES, dp), emailed: res.saved, error: res.error })
    clear()
    // The payment step is scrolled down; bring the order number back into view.
    bodyRef.current?.closest('.overflow-y-auto')?.scrollTo({ top: 0 })
  }

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setErrors((x) => ({ ...x, proof: 'Please upload an image (screenshot or photo).' }))
      return
    }
    setProofBusy(true)
    try {
      setProof(await compressImage(file))
      setErrors((x) => ({ ...x, proof: undefined }))
    } catch {
      setErrors((x) => ({ ...x, proof: 'We could not read that image. Try another screenshot.' }))
    } finally {
      setProofBusy(false)
    }
  }

  const footer = done ? null : (
    <div className="flex items-center gap-3">
      {step > 0 && (
        <Button variant="ghost" onClick={() => setStep(step - 1)} aria-label="Back">
          <ArrowLeft size={18} weight="bold" />
        </Button>
      )}
      <div className="mr-auto min-w-0">
        <p className="text-sm text-ink-soft">{step === 2 ? 'Amount to pay now' : 'Food total'}</p>
        <p className="num display text-xl font-extrabold">{peso(step === 2 ? due : subtotal)}</p>
      </div>
      <Button size="lg" onClick={next} disabled={sending || proofBusy}>
        {sending ? 'Sending…' : step < 2 ? 'Continue' : 'Send order'}
      </Button>
    </div>
  )

  return (
    <Sheet open={open} onClose={close} title={done ? 'Order sent' : STEP_TITLES[step]} footer={footer} wideClass="md:w-[600px]">
      <div ref={bodyRef}>
        {!done && (
          <ol className="mb-6 flex gap-2" aria-label="Checkout progress">
            {STEP_TITLES.map((t, i) => (
              <li key={t} className="flex-1" aria-current={i === step ? 'step' : undefined}>
                <span className={`block h-1.5 rounded-full transition-colors duration-300 ${i <= step ? 'bg-leaf' : 'bg-ink/12'}`} />
                <span className={`mt-1.5 block text-xs font-semibold ${i === step ? 'text-ink' : 'text-ink-soft'}`}>{t}</span>
              </li>
            ))}
          </ol>
        )}

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={done ? 'done' : step}
            initial={reduce ? { opacity: 0 } : { opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, x: -24 }}
            transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
          >
            {done ? (
              <Confirmation done={done} />
            ) : step === 0 ? (
              <div className="grid gap-5">
                <Field label="Your name" htmlFor="co-name" error={errors.name}>
                  <input id="co-name" data-autofocus className={inputClass(!!errors.name)} autoComplete="name" value={form.name} onChange={(e) => set('name', e.target.value)} aria-invalid={!!errors.name} aria-describedby={errors.name ? 'co-name-error' : undefined} />
                </Field>
                <Field label="Mobile number" htmlFor="co-mobile" error={errors.mobile} hint="Lenlyn will text or call this number to confirm.">
                  <input id="co-mobile" type="tel" inputMode="tel" className={`num ${inputClass(!!errors.mobile)}`} autoComplete="tel" placeholder="0917 123 4567" value={form.mobile} onChange={(e) => set('mobile', e.target.value)} aria-invalid={!!errors.mobile} />
                </Field>
                <Field label="Email" htmlFor="co-email" error={errors.email} optional hint="We'll email you a copy of your order.">
                  <input id="co-email" type="email" inputMode="email" className={inputClass(!!errors.email)} autoComplete="email" value={form.email} onChange={(e) => set('email', e.target.value)} aria-invalid={!!errors.email} />
                </Field>
                <Field label="Facebook name" htmlFor="co-fbName" optional hint="So Lenlyn can find your message on Messenger.">
                  <input id="co-fbName" className={inputClass()} value={form.fbName} onChange={(e) => set('fbName', e.target.value)} />
                </Field>
              </div>
            ) : step === 1 ? (
              <div className="grid gap-5">
                <div className="grid gap-5 sm:grid-cols-2 sm:gap-3">
                  <Field label="Date needed" htmlFor="co-eventDate" error={errors.eventDate}>
                    <DateField id="co-eventDate" min={todayISO()} value={form.eventDate} invalid={!!errors.eventDate} onChange={(v) => set('eventDate', v)} />
                  </Field>
                  <Field label="Time" htmlFor="co-eventTime" error={errors.eventTime}>
                    <TimeField id="co-eventTime" value={form.eventTime} invalid={!!errors.eventTime} onChange={(v) => set('eventTime', v)} />
                  </Field>
                </div>
                {form.eventDate === todayISO() && (
                  <p className="flex gap-2 rounded-[12px] bg-sun/40 p-3 text-sm">
                    <Phone size={18} weight="bold" className="mt-0.5 shrink-0 text-leaf" />
                    <span>
                      Same-day order? Please also call <a className="num font-semibold underline" href={`tel:${BUSINESS.phoneIntl}`}>{BUSINESS.phone}</a> so Lenlyn can confirm she can cook it in time.
                    </span>
                  </p>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Occasion" htmlFor="co-occasion" optional>
                    <select id="co-occasion" className={inputClass()} value={form.occasion} onChange={(e) => set('occasion', e.target.value)}>
                      <option value="">Choose…</option>
                      {OCCASIONS.map((o) => (
                        <option key={o}>{o}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Number of guests" htmlFor="co-pax" optional>
                    <input id="co-pax" type="number" inputMode="numeric" min={1} className={`num ${inputClass()}`} value={form.pax} onChange={(e) => set('pax', e.target.value)} />
                  </Field>
                </div>

                <fieldset>
                  <legend className="text-sm font-semibold">Delivery or pick-up</legend>
                  {hasPickupOnly && <p className="mt-1 text-sm text-ink-soft">Your order includes a pick-up-only package.</p>}
                  <div className="mt-2.5 grid gap-2" role="radiogroup" aria-label="Delivery or pick-up">
                    {ZONES.map((z, i) => {
                      const on = form.zone === z.id
                      const blocked = hasPickupOnly && z.id !== PICKUP_ID
                      return (
                        <button
                          key={z.id}
                          id={i === 0 ? 'co-zone' : undefined}
                          type="button"
                          role="radio"
                          aria-checked={on}
                          disabled={blocked}
                          onClick={() => set('zone', z.id)}
                          className={`flex cursor-pointer items-center justify-between gap-3 rounded-[14px] px-4 py-3 text-left transition-[background-color,box-shadow] disabled:cursor-not-allowed disabled:opacity-40 ${
                            on ? 'bg-leaf text-white' : 'bg-white ring-1 ring-inset ring-ink/10 hover:ring-leaf/50'
                          }`}
                        >
                          <span>
                            <span className="block font-semibold">{z.label}</span>
                            <span className={`block text-sm ${on ? 'text-white/80' : 'text-ink-soft'}`}>{z.detail}</span>
                          </span>
                          <span className={`num shrink-0 font-bold ${on ? 'text-sun' : 'text-leaf'}`}>{feeLabel(z.id, ZONES)}</span>
                        </button>
                      )
                    })}
                  </div>
                  {errors.zone && (
                    <p className="mt-2 text-sm font-medium text-chili" role="alert">
                      {errors.zone}
                    </p>
                  )}
                </fieldset>

                {zone && zone.id !== PICKUP_ID && (
                  <>
                    <Field label="Delivery address" htmlFor="co-address" error={errors.address}>
                      <textarea id="co-address" rows={2} className={`${inputClass(!!errors.address)} h-auto py-3`} autoComplete="street-address" placeholder="House no., street, barangay, town" value={form.address} onChange={(e) => set('address', e.target.value)} aria-invalid={!!errors.address} />
                    </Field>
                    <Field label="Landmark" htmlFor="co-landmark" optional>
                      <input id="co-landmark" className={inputClass()} placeholder="Near the chapel, blue gate…" value={form.landmark} onChange={(e) => set('landmark', e.target.value)} />
                    </Field>
                    <p className="text-sm text-ink-soft">The delivery fee ({feeLabel(zone.id, ZONES)}) is paid separately. Lenlyn confirms the exact amount with you.</p>
                  </>
                )}
                <label className="flex cursor-pointer items-start gap-3 rounded-[14px] bg-white p-4 ring-1 ring-inset ring-ink/10">
                  <input type="checkbox" checked={form.tupperware} onChange={(e) => set('tupperware', e.target.checked)} className="mt-1 size-5 shrink-0 accent-[var(--color-leaf)]" />
                  <span>
                    <span className="block font-semibold">Use white tupperware containers</span>
                    <span className="block text-sm text-ink-soft">
                      Aluminum trays are free. Tupperware adds <span className="num">₱{TUPPERWARE.fee}</span> for every {TUPPERWARE.per} dishes, paid separately. Lenlyn confirms the amount.
                    </span>
                  </span>
                </label>
                <Field label="Notes for Lenlyn" htmlFor="co-notes" optional>
                  <textarea id="co-notes" rows={2} className={`${inputClass()} h-auto py-3`} placeholder="Less spicy, extra sauce, gate code…" value={form.notes} onChange={(e) => set('notes', e.target.value)} />
                </Field>
              </div>
            ) : (
              <div className="grid gap-6">
                <OrderRecap form={form} zones={ZONES} />
                {dp.enabled && (
                  <fieldset>
                    <legend className="text-sm font-semibold">How much will you pay now?</legend>
                    <div className="mt-2 grid grid-cols-2 gap-2" role="radiogroup" aria-label="Payment amount">
                      {(['full', 'down'] as const).map((p) => {
                        const on = form.payPlan === p
                        const amount = p === 'full' ? subtotal : Math.round(subtotal * dp.rate)
                        return (
                          <button key={p} type="button" role="radio" aria-checked={on} onClick={() => set('payPlan', p)} className={`cursor-pointer rounded-[14px] px-3 py-3 text-left transition-colors ${on ? 'bg-leaf text-white' : 'bg-white ring-1 ring-inset ring-ink/10 hover:ring-leaf/50'}`}>
                            <span className="block text-sm font-semibold">{p === 'full' ? 'Full payment' : `${Math.round(dp.rate * 100)}% down payment`}</span>
                            <span className={`num display block text-xl font-extrabold ${on ? 'text-sun' : 'text-leaf'}`}>{peso(amount)}</span>
                          </button>
                        )
                      })}
                    </div>
                    {form.payPlan === 'down' && (
                      <p className="mt-2 text-sm text-ink-soft">
                        The balance of <span className="num font-semibold text-ink">{peso(subtotal - due)}</span> is paid on pick-up or delivery.
                      </p>
                    )}
                  </fieldset>
                )}
                <fieldset>
                  <legend className="text-sm font-semibold">
                    Send <span className="num">{peso(due)}</span> to one of these
                  </legend>
                  <div className="mt-2.5 grid grid-cols-2 gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Payment channel">
                    {PAYMENTS.map((p, i) => {
                      const on = form.payChannel === p.id
                      return (
                        <button
                          key={p.id}
                          id={i === 0 ? 'co-payChannel' : undefined}
                          type="button"
                          role="radio"
                          aria-checked={on}
                          onClick={() => set('payChannel', p.id)}
                          className={`flex cursor-pointer items-center gap-2 rounded-[14px] px-3 py-3 text-left font-semibold transition-[background-color,box-shadow] ${on ? 'bg-leaf text-white' : 'bg-white ring-1 ring-inset ring-ink/10 hover:ring-leaf/50'}`}
                        >
                          <span className="size-3 shrink-0 rounded-full ring-2 ring-white/70" style={{ background: p.color }} aria-hidden />
                          {p.bank}
                        </button>
                      )
                    })}
                  </div>
                  <p className="mt-2 text-sm font-semibold text-chili">GCash is not accepted.</p>
                  {errors.payChannel && (
                    <p className="mt-1 text-sm font-medium text-chili" role="alert">
                      {errors.payChannel}
                    </p>
                  )}
                </fieldset>

                {pay && <PayCard pay={pay} amount={due} />}

                <Field label="Screenshot of your payment" htmlFor="co-proof" error={errors.proof}>
                  <label
                    htmlFor="co-proof"
                    className={`flex cursor-pointer items-center gap-3 rounded-[14px] border-2 border-dashed p-4 transition-colors hover:border-leaf ${errors.proof ? 'border-chili' : 'border-ink/20'} has-[:focus-visible]:border-leaf`}
                  >
                    {proof ? (
                      <img src={proof.dataUrl} alt="Your payment screenshot" className="size-16 rounded-[10px] object-cover" />
                    ) : (
                      <span className="grid size-16 place-items-center rounded-[10px] bg-leaf/10 text-leaf">
                        <ImageSquare size={28} weight="duotone" />
                      </span>
                    )}
                    <span className="text-sm">
                      <span className="block font-semibold">{proofBusy ? 'Preparing image…' : proof ? 'Screenshot attached. Tap to change.' : 'Tap to upload the screenshot'}</span>
                      <span className="text-ink-soft">JPG or PNG from your banking app</span>
                    </span>
                    <input id="co-proof" type="file" accept="image/*" className="sr-only" onChange={onFile} />
                  </label>
                </Field>
                <Field label="Reference number" htmlFor="co-reference" optional>
                  <input id="co-reference" className={`num ${inputClass()}`} value={form.reference} onChange={(e) => set('reference', e.target.value)} />
                </Field>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </Sheet>
  )
}

// Facebook, Messenger and Instagram open links in their own built-in browser.
const IN_APP_BROWSER = typeof navigator !== 'undefined' && /FBAN|FBAV|FB_IAB|Messenger|Instagram/i.test(navigator.userAgent)

const qrButton = 'inline-flex h-12 cursor-pointer items-center justify-center gap-2 rounded-[14px] bg-leaf/10 px-3 text-sm font-semibold text-leaf-700 transition-colors hover:bg-leaf/15'

function PayCard({ pay, amount }: { pay: PayChannel; amount: number }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(pay.accountNumber)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }
  // Load the QR as a file up front so the share sheet can open in the same tap.
  const [qrFile, setQrFile] = useState<File | null>(null)
  useEffect(() => {
    let alive = true
    setQrFile(null)
    fetch(asset(pay.qr))
      .then((r) => r.blob())
      .then((blob) => {
        const file = new File([blob], `food-corner-${pay.id}-qr.png`, { type: 'image/png' })
        // Only offer sharing where the phone can share image files.
        if (alive && navigator.canShare?.({ files: [file] })) setQrFile(file)
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [pay.id, pay.qr])
  const [big, setBig] = useState(false)
  useEffect(() => {
    if (!big) return
    // Escape closes only the QR, not the whole checkout underneath.
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      e.stopImmediatePropagation()
      setBig(false)
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [big])
  const shareQr = () => {
    if (!qrFile) return
    navigator.share({ files: [qrFile], title: `${pay.bank} QR, Food Corner` }).catch(() => {
      /* the customer closed the share sheet */
    })
  }
  return (
    <div className="rounded-[18px] bg-white p-4 ring-1 ring-inset ring-ink/10">
      <p className="display text-lg font-bold">{pay.bank}</p>
      <p className="text-sm">{pay.accountName}</p>
      <p className="num mt-1 select-all text-xl font-extrabold tracking-wide">{pay.accountNumber}</p>
      <Button variant="leaf" className="mt-3 w-full" onClick={copy}>
        <CopySimple size={18} weight="bold" /> {copied ? 'Account number copied' : 'Transfer'}
      </Button>
      <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-ink-soft">
        <li>Tap Transfer. The account number is copied for you.</li>
        <li>
          Open your bank or e-wallet app, paste the account number and send <span className="num font-semibold text-ink">{peso(amount)}</span>.
        </li>
      </ol>
      <div className="mt-4 border-t border-ink/10 pt-4">
        <p className="text-center text-sm font-semibold">Or pay with this InstaPay QR</p>
        <button type="button" onClick={() => setBig(true)} aria-label="Show the QR code full screen" className="mx-auto mt-3 block w-full max-w-64 cursor-pointer">
          <img src={asset(pay.qr)} alt={`${pay.bank} InstaPay QR code for ${pay.accountName}`} className="w-full rounded-[10px]" />
        </button>
        <div className="mt-3 grid gap-2">
          <button type="button" onClick={() => setBig(true)} className={qrButton}>
            <ArrowsOut size={18} weight="bold" /> Show QR full screen
          </button>
          {/* Facebook and Messenger's built-in browser cannot download files, so Save and Share are left out there. */}
          {!IN_APP_BROWSER && (
            <div className={`grid gap-2 ${qrFile ? 'grid-cols-2' : ''}`}>
              <a href={asset(pay.qr)} download={`food-corner-${pay.id}-qr.png`} className={qrButton}>
                <DownloadSimple size={18} weight="bold" /> Save QR
              </a>
              {qrFile && (
                <button type="button" onClick={shareQr} className={qrButton}>
                  <ShareNetwork size={18} weight="bold" /> Share to app
                </button>
              )}
            </div>
          )}
        </div>
        <p className="mt-3 text-sm font-semibold">Paying from this same phone?</p>
        <ol className="mt-1 list-decimal space-y-1 pl-5 text-sm text-ink-soft">
          <li>
            Tap <b className="text-ink">Show QR full screen</b> and take a <b className="text-ink">screenshot</b>.
          </li>
          <li>
            Open your bank or e-wallet app and tap <b className="text-ink">Scan QR</b> or <b className="text-ink">Pay QR</b>.
          </li>
          <li>
            Tap <b className="text-ink">Upload</b> or the <b className="text-ink">gallery</b> icon and choose the screenshot, then send <span className="num font-semibold text-ink">{peso(amount)}</span>.
          </li>
        </ol>
      </div>
      {big &&
        createPortal(
          <div role="dialog" aria-modal="true" aria-label={`${pay.bank} QR code, full screen`} className="fixed inset-0 z-[90] flex flex-col items-center justify-center overflow-y-auto bg-white px-5 py-6 text-center text-ink">
            <p className="display text-2xl font-extrabold">Take a screenshot now</p>
            <p className="mt-1 text-sm text-ink-soft">Then open your bank app, tap Scan QR and upload this screenshot.</p>
            <img src={asset(pay.qr)} alt={`${pay.bank} InstaPay QR code for ${pay.accountName}`} className="mt-4 w-full max-w-[340px]" />
            <p className="mt-3 font-semibold">
              {pay.bank} · {pay.accountName}
            </p>
            <p className="text-sm text-ink-soft">
              Amount to send: <span className="num font-bold text-ink">{peso(amount)}</span>
            </p>
            <Button className="mt-5 w-full max-w-[340px]" size="lg" onClick={() => setBig(false)} autoFocus>
              Done, back to my order
            </Button>
          </div>,
          document.body,
        )}
    </div>
  )
}

function OrderRecap({ form, zones }: { form: CheckoutForm; zones: Zone[] }) {
  const { resolved, subtotal } = useOrder()
  const zone = zones.find((z) => z.id === form.zone)
  return (
    <div className="rounded-[18px] bg-tag p-4">
      <ul className="space-y-1.5 text-sm">
        {resolved.map((r) => (
          <li key={r.line.key} className="flex justify-between gap-3">
            <span>
              <span className="num font-semibold">{r.line.qty}×</span> {r.title}
            </span>
            <span className="num font-semibold">{peso(r.total)}</span>
          </li>
        ))}
      </ul>
      <div className="mt-3 border-t border-ink/15 pt-3 text-sm">
        <p className="flex justify-between font-bold">
          <span>Food total</span>
          <span className="num">{peso(subtotal)}</span>
        </p>
        {zone && (
          <p className="mt-1 flex justify-between text-ink-soft">
            <span>{zone.id === PICKUP_ID ? 'Pick-up' : `Delivery, ${zone.label}`}</span>
            <span className="num">{feeLabel(zone.id, zones)}{zone.id !== PICKUP_ID && !zone.quote ? ', paid separately' : ''}</span>
          </p>
        )}
        <p className="mt-1 text-ink-soft">
          {formatDate(form.eventDate)} · {formatTime(form.eventTime)}
        </p>
      </div>
    </div>
  )
}

function Confirmation({ done }: { done: Done }) {
  const [copied, setCopied] = useState(false)
  const copyAndOpen = () => {
    // Start the copy and open Messenger in the same tap: a tab opened after an await is blocked as a pop-up.
    const copying = navigator.clipboard?.writeText(done.text)
    window.open(messengerUrl(), '_blank', 'noopener')
    copying?.then(() => setCopied(true)).catch(() => setCopied(false))
  }
  return (
    <div>
      <div className="leaf on-leaf rounded-[20px] p-5 text-center">
        <CheckCircle size={44} weight="fill" className="mx-auto text-sun" />
        <p className="mt-2 text-white/85">Your order number</p>
        <p className="num display text-4xl font-extrabold text-sun">{done.orderId}</p>
        <p className="mt-2 text-white/90">Salamat po! Lenlyn will check your payment and confirm by text or Messenger.</p>
      </div>

      {done.emailed ? (
        <p className="mt-4 flex items-start gap-2 text-sm">
          <Check size={18} weight="bold" className="mt-0.5 shrink-0 text-leaf" /> Your order and payment screenshot were sent to Lenlyn.
        </p>
      ) : (
        <p className="mt-4 flex items-start gap-2 rounded-[12px] bg-sun/40 p-3 text-sm">
          <WarningCircle size={20} weight="bold" className="mt-0.5 shrink-0 text-chili" />
          <span>
            We couldn't send your order automatically. <strong>Please send it on Messenger</strong> with your payment screenshot so Lenlyn receives it.
          </span>
        </p>
      )}

      <h3 className="display mt-6 text-lg font-bold">Send a copy on Messenger</h3>
      <p className="mt-1 text-sm text-ink-soft">Copy your order, open Lenlyn's Messenger, then paste it and attach your payment screenshot.</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <Button variant="leaf" onClick={copyAndOpen}>
          <MessengerLogo size={20} weight="fill" /> Copy and open Messenger
        </Button>
        <Button
          variant="ghost"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(done.text)
              setCopied(true)
            } catch {
              setCopied(false)
            }
          }}
        >
          <CopySimple size={18} weight="bold" /> {copied ? 'Copied' : 'Copy order text'}
        </Button>
      </div>
      <pre className="mt-4 max-h-60 overflow-auto whitespace-pre-wrap rounded-[14px] bg-white p-4 font-body text-sm ring-1 ring-inset ring-ink/10">{done.text}</pre>
    </div>
  )
}
