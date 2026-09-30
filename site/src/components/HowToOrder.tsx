import { MapPin, Prohibit, Receipt, SealCheck } from '@phosphor-icons/react'
import { BUSINESS, PAYMENTS, PICKUP_ID } from '../data/business'
import { useMenu } from '../lib/menu'
import { feeLabel } from '../lib/order'
import { asset } from '../lib/asset'

const STEPS = [
  { t: 'Fill your table', d: 'Pick a package, lechon or trays. Choose your dishes inside each package.' },
  { t: 'Set the date and place', d: 'Tell us when and where. Delivery or pick-up at the kitchen.' },
  { t: 'Pay by bank QR', d: 'Scan Maya, GoTyme, BPI, PNB or MariBank, then upload the screenshot.' },
  { t: 'Lenlyn confirms and cooks', d: 'She checks your order and the delivery fee, then cooks it fresh for your handaan.' },
]

export function HowToOrder() {
  const { zones: ZONES } = useMenu()
  return (
    <section id="how" className="border-t border-ink/8 bg-white" aria-labelledby="how-h">
      <div className="mx-auto max-w-7xl px-4 py-16 md:px-8 md:py-24">
        <h2 id="how-h" className="display max-w-2xl text-4xl font-extrabold leading-[1.05] md:text-5xl">
          How ordering works
        </h2>
        <ol className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <li key={s.t} className="relative pl-14">
              <span className="num display absolute left-0 top-0 grid size-10 place-items-center rounded-full bg-sun text-lg font-extrabold">{i + 1}</span>
              <h3 className="display text-xl font-bold">{s.t}</h3>
              <p className="mt-1.5 text-ink-soft">{s.d}</p>
            </li>
          ))}
        </ol>

        <div className="mt-16 grid gap-10 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <h3 className="display text-2xl font-extrabold">Delivery fees</h3>
            <p className="mt-1.5 text-ink-soft">Delivered by local riders. The fee depends on the distance and how much food you order, so Lenlyn confirms the final amount.</p>
            <table className="mt-5 w-full border-collapse text-left">
              <caption className="sr-only">Delivery fee by area, starting from Tabgas, Albuera</caption>
              <thead>
                <tr className="border-b-2 border-ink/10 text-sm text-ink-soft">
                  <th scope="col" className="py-2 pr-4 font-semibold">Area</th>
                  <th scope="col" className="py-2 text-right font-semibold">Fee</th>
                </tr>
              </thead>
              <tbody>
                {ZONES.filter((z) => z.id !== PICKUP_ID && !z.quote).map((z) => (
                  <tr key={z.id} className="border-b border-ink/8">
                    <td className="py-3 pr-4">
                      <span className="font-semibold">{z.label}</span>
                      <span className="block text-sm text-ink-soft">{z.detail}</span>
                    </td>
                    <td className="num whitespace-nowrap py-3 text-right font-bold text-leaf">{feeLabel(z.id, ZONES)}</td>
                  </tr>
                ))}
                <tr>
                  <td className="py-3 pr-4">
                    <span className="font-semibold">Pick-up at the kitchen</span>
                    <span className="block text-sm text-ink-soft">Required for the Medium Tray package</span>
                  </td>
                  <td className="py-3 text-right font-bold text-leaf">Free</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-8">
            <div>
              <h3 className="display text-2xl font-extrabold">Payment</h3>
              <ul className="mt-4 flex flex-wrap gap-2">
                {PAYMENTS.map((p) => (
                  <li key={p.id} className="inline-flex items-center gap-2 rounded-full bg-ground px-3.5 py-2 text-sm font-semibold ring-1 ring-inset ring-ink/10">
                    <span className="size-2.5 rounded-full" style={{ background: p.color }} aria-hidden />
                    {p.bank}
                  </li>
                ))}
              </ul>
              <p className="mt-3 inline-flex items-center gap-2 rounded-[12px] bg-chili/8 px-3 py-2 text-sm font-semibold text-chili">
                <Prohibit size={18} weight="bold" /> Sorry po, GCash is not accepted.
              </p>
            </div>

            <div>
              <h3 className="display text-2xl font-extrabold">Find the kitchen</h3>
              <ol className="mt-4 space-y-2.5">
                {BUSINESS.directions.map((d, i) => (
                  <li key={d} className="flex gap-3">
                    <MapPin size={22} weight={i === BUSINESS.directions.length - 1 ? 'fill' : 'bold'} className="mt-0.5 shrink-0 text-leaf" />
                    <span>{d}</span>
                  </li>
                ))}
              </ol>
              <a href={BUSINESS.mapsUrl} target="_blank" rel="noreferrer" className="mt-3 inline-block font-semibold text-leaf underline">
                Open Tabgas Fuel Station in Google Maps
              </a>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <p className="flex items-start gap-2.5 rounded-[16px] bg-leaf/8 p-4">
                <SealCheck size={24} weight="duotone" className="shrink-0 text-leaf" />
                <span>
                  <span className="block font-bold">BIR-registered</span>
                  <span className="text-sm text-ink-soft">We issue an Official Receipt.</span>
                </span>
              </p>
              <p className="flex items-start gap-2.5 rounded-[16px] bg-leaf/8 p-4">
                <Receipt size={24} weight="duotone" className="shrink-0 text-leaf" />
                <span>
                  <span className="block font-bold">Cooking since {BUSINESS.since}</span>
                  <span className="text-sm text-ink-soft">Rush orders welcome. Call first.</span>
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export function Footer() {
  return (
    <footer className="leaf on-leaf pb-36">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-14 md:flex-row md:items-center md:justify-between md:px-8">
        <div className="flex items-center gap-4">
          <img src={asset('/img/logo-badge.webp')} alt="Food Corner by Indae Lenlyn logo" width={88} height={88} className="size-22 rounded-full object-cover ring-4 ring-sun/60" loading="lazy" />
          <div>
            <p className="display text-2xl font-extrabold text-white">Good food makes happy people.</p>
            <p className="mt-1 text-white/80">Mas masarap ang pagtitipon kapag kasama ang masarap na pagkain.</p>
          </div>
        </div>
        <address className="not-italic text-white/90">
          <p className="font-semibold text-white">{BUSINESS.name}</p>
          <p>{BUSINESS.address}</p>
          <p>
            <a href={`tel:${BUSINESS.phoneIntl}`} className="num font-semibold text-sun underline">
              {BUSINESS.phone}
            </a>
          </p>
          <p>
            <a href={BUSINESS.facebook} target="_blank" rel="noreferrer" className="font-semibold text-sun underline">
              Facebook
            </a>
          </p>
        </address>
      </div>
    </footer>
  )
}
