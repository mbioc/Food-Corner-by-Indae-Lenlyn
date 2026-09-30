// /api/admin/users: owner manages the team (list, add staff, change role, deactivate, reset password).

import { randomBytes } from 'node:crypto'
import { authAdmin, db, HttpError, requireStaff, route } from '../../server/supabase.mjs'

const tempPassword = () => 'FC-' + randomBytes(9).toString('base64url').slice(0, 10)

export const GET = route(async (request) => {
  await requireStaff(request, { owner: true })
  const users = await db.select('profiles', 'select=*&order=created_at')
  return Response.json({ users })
})

export const POST = route(async (request) => {
  await requireStaff(request, { owner: true })
  const { email, fullName = '', role = 'staff' } = await request.json().catch(() => ({}))
  if (!/^\S+@\S+\.\S+$/.test(email ?? '')) throw new HttpError(400, 'Enter a valid email.')
  if (!['owner', 'staff'].includes(role)) throw new HttpError(400, 'Unknown role.')
  const password = tempPassword()
  let user
  try {
    user = await authAdmin.createUser(email.trim().toLowerCase(), password, fullName)
  } catch (e) {
    if (String(e.message).includes('already')) throw new HttpError(409, 'That email already has an account.')
    throw e
  }
  const [profile] = await db.insert('profiles', { id: user.id, email: user.email, full_name: fullName.trim(), role })
  return Response.json({ user: profile, tempPassword: password })
})

export const PATCH = route(async (request) => {
  const me = await requireStaff(request, { owner: true })
  const { id, role, active, fullName, resetPassword } = await request.json().catch(() => ({}))
  if (!id) throw new HttpError(400, 'Missing user.')
  if (id === me.id && (role === 'staff' || active === false)) throw new HttpError(400, "You can't remove your own owner access.")
  const patch = {}
  if (role !== undefined) {
    if (!['owner', 'staff'].includes(role)) throw new HttpError(400, 'Unknown role.')
    patch.role = role
  }
  if (active !== undefined) patch.active = !!active
  if (fullName !== undefined) patch.full_name = String(fullName).slice(0, 120)
  let password
  if (resetPassword) {
    password = tempPassword()
    await authAdmin.updateUser(id, { password })
  }
  if (active !== undefined) await authAdmin.updateUser(id, { ban_duration: active ? 'none' : '876000h' })
  const [user] = Object.keys(patch).length ? await db.update('profiles', `id=eq.${id}`, patch) : await db.select('profiles', `id=eq.${id}&select=*`)
  return Response.json({ user, tempPassword: password })
})
