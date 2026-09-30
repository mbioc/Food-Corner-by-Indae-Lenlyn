// Minimal Supabase client for serverless functions (no dependencies).
// Uses the secret key, which bypasses row level security: only call from server code.

const base = () => {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SECRET_KEY
  if (!url || !key) throw new HttpError(503, 'The database is not configured yet.')
  return { url, key }
}

export class HttpError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

async function call(path, { method = 'GET', body, headers = {}, raw = false } = {}) {
  const { url, key } = base()
  const res = await fetch(`${url}${path}`, {
    method,
    headers: { apikey: key, Authorization: `Bearer ${key}`, ...(body && !raw ? { 'content-type': 'application/json' } : {}), ...headers },
    body: body === undefined ? undefined : raw ? body : JSON.stringify(body),
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`Supabase ${method} ${path.split('?')[0]} → ${res.status}: ${text.slice(0, 300)}`)
  return text ? JSON.parse(text) : null
}

export const db = {
  select: (table, query = '') => call(`/rest/v1/${table}?${query}`),
  insert: (table, rows) => call(`/rest/v1/${table}`, { method: 'POST', body: rows, headers: { Prefer: 'return=representation' } }),
  update: (table, query, patch) => call(`/rest/v1/${table}?${query}`, { method: 'PATCH', body: patch, headers: { Prefer: 'return=representation' } }),
  rpc: (fn, args = {}) => call(`/rest/v1/rpc/${fn}`, { method: 'POST', body: args }),
}

export const storage = {
  upload: (bucket, path, bytes, contentType) =>
    call(`/storage/v1/object/${bucket}/${path}`, { method: 'POST', body: bytes, raw: true, headers: { 'content-type': contentType, 'x-upsert': 'true' } }),
}

export const authAdmin = {
  createUser: (email, password, fullName) =>
    call('/auth/v1/admin/users', { method: 'POST', body: { email, password, email_confirm: true, user_metadata: { full_name: fullName } } }),
  updateUser: (id, patch) => call(`/auth/v1/admin/users/${id}`, { method: 'PUT', body: patch }),
}

/** Resolves the signed-in staff member from the request's bearer token, or throws 401/403. */
export async function requireStaff(request, { owner = false } = {}) {
  const { url, key } = base()
  const token = (request.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '')
  if (!token) throw new HttpError(401, 'Please sign in.')
  const res = await fetch(`${url}/auth/v1/user`, { headers: { apikey: key, Authorization: `Bearer ${token}` } })
  if (!res.ok) throw new HttpError(401, 'Your session expired. Please sign in again.')
  const user = await res.json()
  const [profile] = await db.select('profiles', `id=eq.${user.id}&select=*`)
  if (!profile || !profile.active) throw new HttpError(403, 'This account does not have access.')
  if (owner && profile.role !== 'owner') throw new HttpError(403, 'Only the owner can do this.')
  return profile
}

/** Wraps a handler so thrown HttpErrors become JSON responses. */
export const route = (fn) => async (request) => {
  try {
    return await fn(request)
  } catch (err) {
    if (err instanceof HttpError) return Response.json({ error: err.message }, { status: err.status })
    console.error(err)
    return Response.json({ error: 'Something went wrong on the server.' }, { status: 500 })
  }
}
