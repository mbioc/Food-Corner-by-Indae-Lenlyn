import { useEffect, useState, type FormEvent } from 'react'
import { Button, Field, inputClass } from '../components/ui'
import { useAdmin } from './data'
import { adminApi, type Profile } from './sb'
import { Page, Toggle } from './ui'

export function Team() {
  const { me, toast } = useAdmin()
  const [users, setUsers] = useState<Profile[]>([])
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState<'staff' | 'owner'>('staff')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [secret, setSecret] = useState<{ email: string; password: string } | null>(null)

  const load = () => adminApi<{ users: Profile[] }>('users').then((r) => setUsers(r.users)).catch((e) => toast(e.message))
  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const add = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const r = await adminApi<{ user: Profile; tempPassword: string }>('users', { body: { email, fullName: name, role } })
      setUsers((u) => [...u, r.user])
      setSecret({ email: r.user.email, password: r.tempPassword })
      setEmail('')
      setName('')
      setRole('staff')
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const patch = async (id: string, body: Record<string, unknown>, done: string) => {
    try {
      const r = await adminApi<{ user: Profile; tempPassword?: string }>('users', { method: 'PATCH', body: { id, ...body } })
      setUsers((u) => u.map((x) => (x.id === id ? r.user : x)))
      if (r.tempPassword) setSecret({ email: r.user.email, password: r.tempPassword })
      toast(done)
    } catch (err) {
      toast((err as Error).message)
    }
  }

  return (
    <Page title="Team">
      {secret && (
        <div className="mb-6 rounded-[18px] bg-sun/40 p-4" role="status">
          <p className="font-semibold">Send these sign-in details to {secret.email}:</p>
          <p className="num mt-2 select-all rounded-[10px] bg-white px-3 py-2 font-mono text-sm">
            {window.location.origin}/admin · {secret.email} · {secret.password}
          </p>
          <p className="mt-2 text-sm">This password is shown only once. They can change it under Account after signing in.</p>
          <button type="button" onClick={() => setSecret(null)} className="mt-2 cursor-pointer text-sm font-semibold underline">
            Done
          </button>
        </div>
      )}

      <ul className="grid gap-2">
        {users.map((u) => (
          <li key={u.id} className={`flex flex-wrap items-center gap-3 rounded-[16px] bg-white p-4 ring-1 ring-inset ring-ink/8 ${u.active ? '' : 'opacity-60'}`}>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">
                {u.full_name || u.email} {u.id === me.id && <span className="text-sm font-normal text-ink-soft">(you)</span>}
              </p>
              <p className="truncate text-sm text-ink-soft">{u.email}</p>
            </div>
            <select
              aria-label={`Role for ${u.email}`}
              value={u.role}
              disabled={u.id === me.id}
              onChange={(e) => patch(u.id, { role: e.target.value }, 'Role updated')}
              className={`${inputClass()} !h-10 !w-auto`}
            >
              <option value="owner">Owner</option>
              <option value="staff">Staff</option>
            </select>
            <label className="flex items-center gap-2 text-sm font-semibold">
              <Toggle checked={u.active} label={`Allow ${u.email} to sign in`} onChange={(v) => u.id !== me.id && patch(u.id, { active: v }, v ? 'Access restored' : 'Access removed')} />
              {u.active ? 'Active' : 'Blocked'}
            </label>
            {u.id !== me.id && (
              <Button variant="ghost" size="sm" onClick={() => patch(u.id, { resetPassword: true }, 'New password created')}>
                Reset password
              </Button>
            )}
          </li>
        ))}
      </ul>

      <form onSubmit={add} className="mt-8 grid max-w-xl gap-4 rounded-[20px] bg-white p-5 ring-1 ring-inset ring-ink/8">
        <h2 className="display text-lg font-bold">Add a team member</h2>
        <p className="-mt-2 text-sm text-ink-soft">Staff can manage orders and the calendar. Owners can also change the menu, prices and the team.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Email" htmlFor="t-email" error={error || undefined}>
            <input id="t-email" type="email" required className={inputClass(!!error)} value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field label="Name" htmlFor="t-name" optional>
            <input id="t-name" className={inputClass()} value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
        </div>
        <Field label="Role" htmlFor="t-role">
          <select id="t-role" className={inputClass()} value={role} onChange={(e) => setRole(e.target.value as 'staff' | 'owner')}>
            <option value="staff">Staff</option>
            <option value="owner">Owner</option>
          </select>
        </Field>
        <Button type="submit" disabled={busy}>
          {busy ? 'Adding…' : 'Add and create password'}
        </Button>
      </form>
    </Page>
  )
}
