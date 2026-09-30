// Business facts and settings. Values marked TODO still need the owner's confirmation.

export const BUSINESS = {
  name: 'Food Corner by Indae Lenlyn',
  shortName: 'Food Corner',
  owner: 'Juvilyn "Indae Lenlyn" Cabaltera',
  since: 2021,
  phone: '0951 510 6845',
  phoneIntl: '+639515106845',
  // Messenger handle of the owner's profile. TODO: switch to a Facebook Page username if one is created.
  messenger: 'juvilyn.cabaltera',
  facebook: 'https://www.facebook.com/juvilyn.cabaltera',
  address: 'Tabgas, Albuera, Leyte',
  directions: [
    'Beside Tabgas Fuel Station on the highway',
    'Across the road is Mother Blessed Paanakan',
    'Take the small road behind Mother Blessed',
  ],
  mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Tabgas+Fuel+Station+Albuera+Leyte',
}

/* ---------- Delivery ---------- */

export interface Zone {
  id: string
  label: string
  detail: string
  feeMin: number
  feeMax: number
  quote?: boolean
}

export const PICKUP_ID = 'pickup'

export const ZONES: Zone[] = [
  { id: PICKUP_ID, label: 'Pick-up at the kitchen', detail: 'Tabgas, behind Mother Blessed', feeMin: 0, feeMax: 0 },
  { id: 'albuera', label: 'Albuera proper to Gungab', detail: 'Tabgas, Albuera town, Gungab', feeMin: 150, feeMax: 150 },
  { id: 'siguinon', label: 'Siguinon', detail: 'Tabgas to Siguinon', feeMin: 200, feeMax: 250 },
  { id: 'damulan', label: 'Damulan and nearby', detail: 'Tabgas to Damulan (or farther)', feeMin: 200, feeMax: 350 },
  { id: 'baybay', label: 'Baybay City', detail: 'Tabgas to Baybay', feeMin: 700, feeMax: 700 },
  { id: 'ormoc', label: 'Ormoc City (city proper)', detail: 'Motor ₱270 · Tricycle ₱500 · Car ₱600, depending on how much food', feeMin: 270, feeMax: 600 },
  { id: 'other', label: 'Other area', detail: 'Lenlyn will quote the delivery fee', feeMin: 0, feeMax: 0, quote: true },
]

/* ---------- Payment ---------- */

export interface PayChannel {
  id: string
  bank: string
  accountName: string
  accountHint: string
  // Path to the real InstaPay QR image in /public/qr. null until the owner provides it.
  qr: string | null
  color: string
}

export const PAYMENTS: PayChannel[] = [
  { id: 'maya', bank: 'Maya', accountName: 'Juvilyn Cabaltera', accountHint: '+63 ••• ••• 6797', qr: null, color: '#00B464' },
  { id: 'gotyme', bank: 'GoTyme Bank', accountName: 'Juvilyn Cabaltera', accountHint: '•••• 8241', qr: null, color: '#0A2540' },
  { id: 'bpi', bank: 'BPI', accountName: 'Indae Len', accountHint: '•••• 293', qr: null, color: '#B11116' },
  { id: 'pnb', bank: 'PNB', accountName: 'Juvilyn Cabaltera', accountHint: '•••• 4807', qr: null, color: '#1D3E8A' },
  { id: 'maribank', bank: 'MariBank', accountName: 'Juvilyn Cabaltera', accountHint: '•••• 5610', qr: null, color: '#F05A22' },
]

export const SETTINGS = {
  // TODO(owner): confirm whether a downpayment is accepted instead of full payment.
  allowDownpayment: false,
  downpaymentRate: 0.5,
  // Vercel function that saves the order and emails the owner and the customer (see /api/order.mjs).
  orderEndpoint: '/api/order',
}
