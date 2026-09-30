import { createClient } from '@supabase/supabase-js'

// Placeholder values only keep the module loadable when env vars are missing; AdminApp shows a setup message instead.
export const supabase = createClient((import.meta.env.VITE_SUPABASE_URL as string) || 'https://placeholder.supabase.co', (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string) || 'missing', {
  auth: { persistSession: true, autoRefreshToken: true, storageKey: 'fc-admin-auth' },
})

/** Calls one of our /api/admin endpoints with the signed-in user's token. */
export async function adminApi<T = unknown>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const { data } = await supabase.auth.getSession()
  const res = await fetch(`/api/admin/${path}`, {
    method: init.method ?? (init.body ? 'POST' : 'GET'),
    headers: { 'content-type': 'application/json', Authorization: `Bearer ${data.session?.access_token ?? ''}` },
    body: init.body ? JSON.stringify(init.body) : undefined,
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.error || `Request failed (${res.status})`)
  return json as T
}

export interface Profile {
  id: string
  email: string
  full_name: string
  role: 'owner' | 'staff'
  active: boolean
  created_at: string
}

export interface OrderItem {
  kind: string
  refId: string
  title: string
  detail: string[]
  qty: number
  unitPrice: number
  total: number
}

export type OrderStatus = 'pending' | 'confirmed' | 'cooking' | 'out_for_delivery' | 'ready_for_pickup' | 'completed' | 'cancelled'

export interface Order {
  id: string
  created_at: string
  status: OrderStatus
  payment_status: 'unverified' | 'verified' | 'rejected'
  customer_name: string
  mobile: string
  email: string | null
  fb_name: string | null
  event_date: string
  event_time: string
  occasion: string | null
  pax: number | null
  zone_id: string | null
  zone_label: string | null
  address: string | null
  landmark: string | null
  notes: string | null
  pay_channel: string | null
  reference: string | null
  items: OrderItem[]
  subtotal: number
  delivery_fee: number | null
  amount_paid: number
  proof_path: string | null
  summary: string
  staff_note: string | null
  updated_at: string
}

export interface OrderEvent {
  id: number
  order_id: string
  status: string
  note: string | null
  actor_name: string | null
  created_at: string
}
