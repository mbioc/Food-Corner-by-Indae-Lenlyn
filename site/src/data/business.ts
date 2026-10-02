import { DOWNPAYMENT_RATE } from '../shared/pricing.js'

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
  accountNumber: string
  // InstaPay QR image in /public/qr
  qr: string
  color: string
}

export const PAYMENTS: PayChannel[] = [
  { id: 'maribank', bank: 'MariBank', accountName: 'Juvilyn Cabaltera', accountNumber: '10948965610', qr: '/qr/maribank.png', color: '#F05A22' },
  { id: 'pnb', bank: 'PNB', accountName: 'Juvilyn Cabaltera', accountNumber: '313710204807', qr: '/qr/pnb.png', color: '#1D3E8A' },
]

// White tupperware containers instead of aluminum trays (the owner's packaging notice).
export const TUPPERWARE = { fee: 150, per: 5 }

export const SETTINGS = {
  // Customers may pay a down payment now and the balance on pick-up or delivery.
  allowDownpayment: true,
  downpaymentRate: DOWNPAYMENT_RATE,
  // Vercel function that saves the order and emails the owner and the customer (see /api/order.mjs).
  orderEndpoint: '/api/order',
}
