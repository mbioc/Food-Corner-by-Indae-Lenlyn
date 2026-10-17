import { ArrowRight, ChatCircleDots, MessengerLogo } from '@phosphor-icons/react'
import { messengerUrl } from '../lib/checkout'
import { Sheet } from './Sheet'
import { Button } from './ui'

/**
 * Shown before the order form. Orders filled in without a chat were sometimes missed,
 * so Lenlyn asks customers to message her first.
 */
export function ChatFirst({ open, onClose, onContinue }: { open: boolean; onClose: () => void; onContinue: () => void }) {
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Chat with us first"
      wideClass="md:w-[480px]"
      footer={
        <div className="grid gap-2">
          <a
            href={messengerUrl()}
            target="_blank"
            rel="noreferrer"
            data-autofocus
            className="inline-flex h-14 items-center justify-center gap-2 rounded-[14px] bg-leaf px-7 text-lg font-semibold text-white transition-colors hover:bg-leaf-600"
          >
            <MessengerLogo size={22} weight="fill" /> Chat on Messenger
          </a>
          <Button variant="ghost" size="lg" onClick={onContinue}>
            Continue to the order form <ArrowRight size={18} weight="bold" />
          </Button>
        </div>
      }
    >
      <div className="flex items-start gap-3 rounded-[16px] bg-sun/40 p-4">
        <ChatCircleDots size={28} weight="duotone" className="mt-0.5 shrink-0 text-leaf" />
        <div>
          <p className="font-semibold leading-snug">Palihug chat una sa amo sa Messenger sa dili pa mo-fill up sa order form.</p>
          <p className="mt-2 text-[15px] text-ink-soft">Aron dili ma-miss ang inyong order ug ma-check namo ang date, oras ug pagkaon.</p>
        </div>
      </div>
      <p className="mt-4 font-semibold leading-snug">Please message us on Messenger first, before you fill in the order form.</p>
      <p className="mt-2 text-[15px] text-ink-soft">This way we won't miss your order, and we can check the date, time and food with you.</p>
      <p className="mt-4 text-sm text-ink-soft">Already chatted with Lenlyn? Tap <b className="text-ink">Continue to the order form</b>.</p>
    </Sheet>
  )
}
