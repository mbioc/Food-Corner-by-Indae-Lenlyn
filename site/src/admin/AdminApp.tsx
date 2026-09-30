import { CalendarDots, ChartBar, ForkKnife, Receipt, SignOut, UserCircle, UsersThree, type Icon } from '@phosphor-icons/react'
import type { Session } from '@supabase/supabase-js'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState, type FormEvent } from 'react'
import { asset } from '../lib/asset'
import { Button, Field, inputClass } from '../components/ui'
import { Account } from './Account'
import { Analytics } from './Analytics'
import { CalendarView } from './Calendar'
import { AdminData, useAdmin } from './data'
import { MenuManager } from './MenuManager'
import { Orders } from './Orders'
import { supabase, type Profile } from './sb'
import { Team } from './Team'

type Section = 'orders' | 'calendar' | 'analytics' | 'menu' | 'team' | 'account'

const NAV: { id: Section; label: string; icon: Icon; owner?: boolean }[] = [
  { id: 'orders', label: 'Orders', icon: Receipt },
  { id: 'calendar', label: 'Calendar', icon: CalendarDots },
  { id: 'analytics', label: 'Sales', icon: ChartBar },
  { id: 'menu', label: 'Menu', icon: ForkKnife, owner: true },
  { id: 'team', label: 'Team', icon: UsersThree, owner: true },
  { id: 'account', label: 'Account', icon: UserCircle },
]

const sectionFromHash = (): Section => {
  const h = window.location.hash.replace('#', '') as Section
  return NAV.some((n) => n.id === h) ? h : 'orders'
}

export default function AdminApp() {
  if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY)
    return (
      <Center>
        <h1 className="display text-2xl font-extrabold">Admin isn't connected yet</h1>
        <p className="mt-2 text-ink-soft">Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in Vercel, then redeploy.</p>
      </Center>
    )
  return <AdminGate />
}

function AdminGate() {
  const [session, setSession] = useState<Session | null | undefined>(undefined)
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined)

  useEffect(() => {
    document.title = 'Admin · Food Corner'
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session) {
      setProfile(session === null ? null : undefined)
      return
    }
    supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .maybeSingle()
      .then(({ data }) => setProfile((data as Profile) ?? null))
  }, [session])

  if (session === undefined || (session && profile === undefined)) return <Splash />
  if (!session) return <Login />
  if (!profile || !profile.active)
    return (
      <Center>
        <h1 className="display text-2xl font-extrabold">No access</h1>
        <p className="mt-2 text-ink-soft">{session.user.email} isn't on the Food Corner team yet. Ask the owner to add you.</p>
        <Button variant="ghost" className="mt-6" onClick={() => supabase.auth.signOut()}>
          Sign out
        </Button>
      </Center>
    )

  return (
    <AdminData me={profile}>
      <Shell />
    </AdminData>
  )
}

function Shell() {
  const { me, toasts, orders } = useAdmin()
  const [section, setSection] = useState<Section>(sectionFromHash)
  const nav = NAV.filter((n) => !n.owner || me.role === 'owner')
  const pending = orders.filter((o) => o.status === 'pending').length

  useEffect(() => {
    const on = () => setSection(sectionFromHash())
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])

  const go = (s: Section) => {
    window.location.hash = s
    setSection(s)
  }

  const current = nav.some((n) => n.id === section) ? section : 'orders'

  return (
    <div className="min-h-dvh bg-ground md:grid md:grid-cols-[232px_1fr]">
      <aside className="leaf on-leaf sticky top-0 hidden h-dvh flex-col p-4 md:flex print:hidden">
        <div className="flex items-center gap-2.5 px-2 pb-6 pt-2">
          <img src={asset('/img/logo-badge.webp')} alt="" className="size-10 rounded-full object-cover ring-2 ring-sun/60" />
          <div className="leading-tight">
            <p className="display font-extrabold text-white">Food Corner</p>
            <p className="text-xs text-white/70">Admin</p>
          </div>
        </div>
        <nav className="flex flex-col gap-1" aria-label="Admin sections">
          {nav.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => go(n.id)}
              aria-current={current === n.id ? 'page' : undefined}
              className={`flex h-11 cursor-pointer items-center gap-3 rounded-[12px] px-3 text-[15px] font-semibold transition-colors ${current === n.id ? 'bg-sun text-ink' : 'text-white/85 hover:bg-white/10'}`}
            >
              <n.icon size={20} weight={current === n.id ? 'fill' : 'regular'} />
              {n.label}
              {n.id === 'orders' && pending > 0 && <span className="num ml-auto rounded-full bg-chili px-2 py-0.5 text-xs text-white">{pending}</span>}
            </button>
          ))}
        </nav>
        <div className="mt-auto rounded-[14px] bg-white/8 p-3 text-sm">
          <p className="truncate font-semibold text-white">{me.full_name || me.email}</p>
          <p className="text-white/70 capitalize">{me.role}</p>
          <button type="button" onClick={() => supabase.auth.signOut()} className="mt-2 inline-flex cursor-pointer items-center gap-1.5 font-semibold text-sun hover:underline">
            <SignOut size={16} /> Sign out
          </button>
        </div>
      </aside>

      <main className="min-w-0 pb-24 md:pb-10">
        {current === 'orders' && <Orders />}
        {current === 'calendar' && <CalendarView />}
        {current === 'analytics' && <Analytics />}
        {current === 'menu' && <MenuManager />}
        {current === 'team' && <Team />}
        {current === 'account' && <Account />}
      </main>

      <nav className="leaf on-leaf fixed inset-x-0 bottom-0 z-30 grid border-t border-white/10 pb-[env(safe-area-inset-bottom)] md:hidden print:hidden" style={{ gridTemplateColumns: `repeat(${nav.length}, minmax(0,1fr))` }} aria-label="Admin sections">
        {nav.map((n) => (
          <button key={n.id} type="button" onClick={() => go(n.id)} aria-current={current === n.id ? 'page' : undefined} className={`relative flex h-16 cursor-pointer flex-col items-center justify-center gap-0.5 text-[11px] font-semibold ${current === n.id ? 'text-sun' : 'text-white/75'}`}>
            <n.icon size={22} weight={current === n.id ? 'fill' : 'regular'} />
            {n.label}
            {n.id === 'orders' && pending > 0 && <span className="num absolute right-[22%] top-2 rounded-full bg-chili px-1.5 text-[10px] text-white">{pending}</span>}
          </button>
        ))}
      </nav>

      <div className="pointer-events-none fixed right-4 top-4 z-[80] flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2 print:hidden" aria-live="polite">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div key={t.id} initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="pointer-events-auto rounded-[14px] bg-ink px-4 py-3 text-sm font-semibold text-white shadow-[var(--shadow-lift)]">
              {t.msg}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}

function Center({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh place-items-center bg-ground px-4">
      <div className="w-full max-w-sm text-center">{children}</div>
    </div>
  )
}

function Splash() {
  return (
    <Center>
      <img src={asset('/img/logo-badge.webp')} alt="" className="mx-auto size-16 animate-pulse rounded-full" />
    </Center>
  )
}

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    setBusy(false)
    if (error) setError(error.message === 'Invalid login credentials' ? 'Wrong email or password.' : error.message)
  }

  return (
    <div className="grid min-h-dvh place-items-center bg-ground px-4">
      <form onSubmit={submit} className="w-full max-w-sm rounded-[24px] bg-white p-6 shadow-[0_14px_30px_-22px_rgb(13_21_13/0.5)] sm:p-8">
        <img src={asset('/img/logo-badge.webp')} alt="" className="size-14 rounded-full object-cover" />
        <h1 className="display mt-4 text-2xl font-extrabold">Food Corner admin</h1>
        <p className="mt-1 text-ink-soft">Sign in to manage orders and the menu.</p>
        <div className="mt-6 grid gap-4">
          <Field label="Email" htmlFor="login-email">
            <input id="login-email" type="email" autoComplete="username" className={inputClass()} value={email} onChange={(e) => setEmail(e.target.value)} required />
          </Field>
          <Field label="Password" htmlFor="login-password" error={error || undefined}>
            <input id="login-password" type="password" autoComplete="current-password" className={inputClass(!!error)} value={password} onChange={(e) => setPassword(e.target.value)} required />
          </Field>
          <Button type="submit" size="lg" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in'}
          </Button>
        </div>
        <a href={asset('/')} className="mt-5 inline-block text-sm font-semibold text-leaf underline">
          Back to the website
        </a>
      </form>
    </div>
  )
}
