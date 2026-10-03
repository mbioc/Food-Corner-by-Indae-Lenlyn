import { MessengerLogo, Phone } from '@phosphor-icons/react'
import { BUSINESS } from '../data/business'
import { messengerUrl } from '../lib/checkout'
import { useCallback, useState } from 'react'
import { asset } from '../lib/asset'
import { MenuSearch } from './MenuSearch'

const NAV = [
  { href: '#packages', label: 'Packages' },
  { href: '#lechon', label: 'Lechon' },
  { href: '#trays', label: 'Trays' },
  { href: '#how', label: 'How to order' },
]

export function Header() {
  const [searching, setSearching] = useState(false)
  const closeSearch = useCallback(() => setSearching(false), [])
  return (
    <header className="sticky top-0 z-30 border-b border-ink/8 bg-ground/85 backdrop-blur-md backdrop-saturate-150">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center gap-3 px-4 md:px-8">
        <a href="#top" className="flex min-w-0 items-center gap-2.5" aria-label={`${BUSINESS.name}, back to top`}>
          <img src={asset('/img/logo-badge.webp')} alt="" width={48} height={48} className="size-12 shrink-0 rounded-full object-cover ring-2 ring-leaf/20" />
          <span className="min-w-0 leading-none">
            <span className="display block truncate text-lg font-extrabold text-leaf">Food Corner</span>
            <span className="block truncate text-[13px] font-medium text-ink-soft">by Indae Lenlyn</span>
          </span>
        </a>
        <nav aria-label="Menu sections" className="ml-6 hidden flex-1 items-center gap-1 lg:flex">
          {NAV.map((n) => (
            <a key={n.href} href={n.href} className="rounded-[10px] px-3 py-2 text-[15px] font-semibold text-ink-soft transition-colors hover:bg-leaf/8 hover:text-leaf">
              {n.label}
            </a>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <MenuSearch open={searching} onOpen={() => setSearching(true)} onClose={closeSearch} />
          <a href={`tel:${BUSINESS.phoneIntl}`} className="hidden h-11 items-center gap-2 rounded-[12px] px-3 text-[15px] font-semibold text-leaf transition-colors hover:bg-leaf/8 sm:inline-flex">
            <Phone size={18} weight="bold" />
            <span className="num">{BUSINESS.phone}</span>
          </a>
          <a href={`tel:${BUSINESS.phoneIntl}`} aria-label={`Call ${BUSINESS.phone}`} className="grid size-11 place-items-center rounded-[12px] text-leaf transition-colors hover:bg-leaf/8 sm:hidden">
            <Phone size={22} weight="bold" />
          </a>
          <a href={messengerUrl()} target="_blank" rel="noreferrer" className="inline-flex h-11 items-center gap-2 rounded-[12px] bg-leaf px-3.5 text-[15px] font-semibold text-white transition-colors hover:bg-leaf-600">
            <MessengerLogo size={20} weight="fill" />
            <span className="hidden sm:inline">Message</span>
          </a>
        </div>
      </div>
    </header>
  )
}
