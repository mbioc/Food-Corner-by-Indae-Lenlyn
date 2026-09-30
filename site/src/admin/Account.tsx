import { useState, type FormEvent } from 'react'
import { Button, Field, inputClass } from '../components/ui'
import { useAdmin } from './data'
import { supabase } from './sb'
import { Page } from './ui'

export function Account() {
  const { me, toast } = useAdmin()
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const save = async (e: FormEvent) => {
    e.preventDefault()
    if (pw.length < 8) return setError('Use at least 8 characters.')
    if (pw !== pw2) return setError("The two passwords don't match.")
    setBusy(true)
    const { error } = await supabase.auth.updateUser({ password: pw })
    setBusy(false)
    if (error) return setError(error.message)
    setError('')
    setPw('')
    setPw2('')
    toast('Password changed.')
  }

  return (
    <Page title="Account">
      <div className="max-w-md rounded-[20px] bg-white p-5 ring-1 ring-inset ring-ink/8">
        <p className="font-semibold">{me.full_name || me.email}</p>
        <p className="text-ink-soft">
          {me.email} · <span className="capitalize">{me.role}</span>
        </p>
      </div>
      <form onSubmit={save} className="mt-6 grid max-w-md gap-4 rounded-[20px] bg-white p-5 ring-1 ring-inset ring-ink/8">
        <h2 className="display text-lg font-bold">Change password</h2>
        <Field label="New password" htmlFor="pw1">
          <input id="pw1" type="password" autoComplete="new-password" className={inputClass()} value={pw} onChange={(e) => setPw(e.target.value)} />
        </Field>
        <Field label="Type it again" htmlFor="pw2" error={error || undefined}>
          <input id="pw2" type="password" autoComplete="new-password" className={inputClass(!!error)} value={pw2} onChange={(e) => setPw2(e.target.value)} />
        </Field>
        <Button type="submit" disabled={busy}>
          {busy ? 'Saving…' : 'Save password'}
        </Button>
      </form>
      <Button variant="ghost" className="mt-6" onClick={() => supabase.auth.signOut()}>
        Sign out
      </Button>
    </Page>
  )
}
