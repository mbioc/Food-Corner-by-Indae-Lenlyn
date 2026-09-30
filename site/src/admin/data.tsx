import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase, type Order, type Profile } from './sb'

interface Ctx {
  me: Profile
  orders: Order[]
  loading: boolean
  error: string | null
  reload: () => Promise<void>
  replaceOrder: (o: Order) => void
  toast: (msg: string) => void
  toasts: { id: number; msg: string }[]
}

const DataCtx = createContext<Ctx | null>(null)

export function AdminData({ me, children }: { me: Profile; children: ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [toasts, setToasts] = useState<{ id: number; msg: string }[]>([])

  const toast = useCallback((msg: string) => {
    const id = Date.now() + Math.random()
    setToasts((t) => [...t, { id, msg }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4500)
  }, [])

  const reload = useCallback(async () => {
    const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(2000)
    if (error) setError(error.message)
    else {
      setError(null)
      setOrders(data as Order[])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    void reload()
    // New orders appear on every open admin screen without refreshing.
    const ch = supabase
      .channel('orders-live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (p) => {
        const o = p.new as Order
        setOrders((list) => (list.some((x) => x.id === o.id) ? list : [o, ...list]))
        toast(`New order ${o.id} from ${o.customer_name}`)
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, (p) => {
        const o = p.new as Order
        setOrders((list) => list.map((x) => (x.id === o.id ? o : x)))
      })
      .subscribe()
    return () => {
      void supabase.removeChannel(ch)
    }
  }, [reload, toast])

  const replaceOrder = useCallback((o: Order) => setOrders((list) => list.map((x) => (x.id === o.id ? o : x))), [])

  return <DataCtx.Provider value={{ me, orders, loading, error, reload, replaceOrder, toast, toasts }}>{children}</DataCtx.Provider>
}

export function useAdmin() {
  const c = useContext(DataCtx)
  if (!c) throw new Error('useAdmin outside AdminData')
  return c
}
