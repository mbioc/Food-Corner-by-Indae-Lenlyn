import { useState } from 'react'
import { Checkout } from './components/Checkout'
import { Header } from './components/Header'
import { Hero } from './components/Hero'
import { Footer, HowToOrder } from './components/HowToOrder'
import { Lechon } from './components/Lechon'
import { Packages } from './components/Packages'
import { TableBar } from './components/TableBar'
import { TableSheet } from './components/TableSheet'
import { Trays } from './components/Trays'
import type { PAX_FILTERS } from './data/menu'
import { MenuProvider } from './lib/menu'
import { OrderProvider } from './lib/order'

type PaxId = (typeof PAX_FILTERS)[number]['id']

export default function App() {
  const [pax, setPax] = useState<PaxId>('all')
  const [tableOpen, setTableOpen] = useState(false)
  const [checkoutOpen, setCheckoutOpen] = useState(false)

  return (
    <MenuProvider>
    <OrderProvider>
      <a href="#packages" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[70] focus:rounded-[10px] focus:bg-sun focus:px-4 focus:py-2 focus:font-semibold">
        Skip to the menu
      </a>
      <Header />
      <main>
        <Hero pax={pax} onPax={setPax} />
        <Packages pax={pax} onPax={setPax} />
        <Lechon />
        <Trays />
        <HowToOrder />
      </main>
      <Footer />
      <TableBar onOpen={() => setTableOpen(true)} />
      <TableSheet
        open={tableOpen}
        onClose={() => setTableOpen(false)}
        onCheckout={() => {
          setTableOpen(false)
          setCheckoutOpen(true)
        }}
      />
      <Checkout open={checkoutOpen} onClose={() => setCheckoutOpen(false)} />
    </OrderProvider>
    </MenuProvider>
  )
}
