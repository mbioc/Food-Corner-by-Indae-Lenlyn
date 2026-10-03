import { asset } from '../lib/asset'
// Source of truth: research/business-brief.md (Facebook menu post, Sept 2026).
// Photos are placeholders cropped from the owner's AI-generated posters until real photos arrive.

export type TrayCategory = 'chicken' | 'pork' | 'beef' | 'seafood' | 'noodles' | 'veggies'

export interface Tray {
  id: string
  name: string
  price: number
  img: string
  category: TrayCategory
  note?: string
}

export const TRAY_CATEGORIES: { id: TrayCategory; label: string }[] = [
  { id: 'chicken', label: 'Chicken' },
  { id: 'pork', label: 'Pork' },
  { id: 'beef', label: 'Beef' },
  { id: 'seafood', label: 'Fish & seafood' },
  { id: 'noodles', label: 'Noodles & pasta' },
  { id: 'veggies', label: 'Veggies' },
]

const d = (slug: string) => asset(`/img/dish/${slug}.webp`)

export const TRAYS: Tray[] = [
  { id: 'chicken-buffalo', name: 'Chicken Buffalo', price: 700, img: d('chicken-buffalo'), category: 'chicken' },
  { id: 'fried-chicken', name: 'Fried Chicken', price: 700, img: d('fried-chicken'), category: 'chicken' },
  { id: 'chicken-curry', name: 'Chicken Curry', price: 700, img: d('chicken-curry'), category: 'chicken' },
  { id: 'chicken-afritada', name: 'Chicken Afritada', price: 700, img: d('chicken-afritada'), category: 'chicken' },
  { id: 'cordon-bleu', name: 'Cordon Bleu', price: 900, img: d('cordon-bleu'), category: 'chicken' },
  { id: 'pork-sisig', name: 'Pork Sisig', price: 1000, img: d('pork-sisig'), category: 'pork' },
  { id: 'pork-menudo', name: 'Pork Menudo', price: 750, img: d('pork-menudo'), category: 'pork' },
  { id: 'pork-humba', name: 'Pork Humba', price: 750, img: d('pork-humba'), category: 'pork' },
  { id: 'pork-steak', name: 'Pork Steak', price: 750, img: d('pork-steak'), category: 'pork' },
  { id: 'pork-lumpia', name: 'Pork Lumpia', price: 600, img: d('pork-lumpia'), category: 'pork', note: '100 pcs' },
  { id: 'beef-broccoli', name: 'Beef Broccoli', price: 1100, img: d('beef-broccoli'), category: 'beef' },
  { id: 'beef-caldereta', name: 'Beef Caldereta', price: 1100, img: d('beef-caldereta'), category: 'beef' },
  { id: 'sweet-sour-fish', name: 'Sweet & Sour Fish Fillet', price: 900, img: d('sweet-sour-fish'), category: 'seafood' },
  { id: 'buttered-shrimp', name: 'Buttered Shrimps', price: 850, img: d('buttered-shrimp'), category: 'seafood' },
  { id: 'fish-fillet', name: 'Fish Fillet', price: 800, img: d('fish-fillet'), category: 'seafood' },
  { id: 'creamy-spaghetti', name: 'Creamy Spaghetti', price: 700, img: d('creamy-spaghetti'), category: 'noodles' },
  { id: 'special-bami', name: 'Special Bam-i', price: 600, img: d('special-bami'), category: 'noodles' },
  { id: 'pancit-bihon', name: 'Pancit Bihon', price: 550, img: d('pancit-bihon'), category: 'noodles' },
  { id: 'special-chopsuey', name: 'Special Chopsuey', price: 800, img: d('chopsuey'), category: 'veggies' },
  { id: 'regular-chopsuey', name: 'Regular Chopsuey', price: 500, img: d('chopsuey'), category: 'veggies' },
]

export const trayById = (id: string) => TRAYS.find((t) => t.id === id)

// Dishes that appear only inside packages (no à la carte price posted).
export const PACKAGE_ONLY_IMG: Record<string, string> = {
  spaghetti: d('creamy-spaghetti'),
  bami: d('special-bami'),
  lumpia: d('pork-lumpia'),
  maja: asset('/img/hero/maja.webp'),
  fruits: asset('/img/hero/fruits.webp'),
  'lechon-belly': asset('/img/hero/lechon-belly.webp'),
  'lechon-whole': asset('/img/hero/lechon-whole.webp'),
  'mix-seafood': d('buttered-shrimp'),
  carbonara: d('creamy-spaghetti'),
  'ribs-caldereta': d('beef-caldereta'),
  'bicol-express': d('pork-humba'),
  'chicken-menudo': d('pork-menudo'),
  chopsuey: d('chopsuey'),
}

/* ---------- Lechon ---------- */

export interface LechonOption {
  id: string
  label: string
  kilos: number
  price: number
}

export const WHOLE_LECHON: LechonOption[] = [
  { id: 'lechon-20', label: '20 kg', kilos: 20, price: 8500 },
  { id: 'lechon-25', label: '25 kg', kilos: 25, price: 10000 },
  { id: 'lechon-30', label: '30 kg', kilos: 30, price: 11500 },
  { id: 'lechon-40', label: '40 kg', kilos: 40, price: 14500 },
]

export const LECHON_BELLY: LechonOption[] = [
  { id: 'belly-3', label: '3 kg', kilos: 3, price: 1500 },
  { id: 'belly-5', label: '5 kg', kilos: 5, price: 2500 },
]

export const FREE_PALUTO = ['Paklay', 'Dinuguan'] as const

// Roasting fee when the customer brings their own pig (Lechon Inyuha Babuy).
export const LECHON_INYUHA: LechonOption[] = [
  { id: 'inyuha-20-40', label: '20 to 40 kg', kilos: 40, price: 2500 },
  { id: 'inyuha-40-50', label: '40 to 50 kg', kilos: 50, price: 2800 },
  { id: 'inyuha-50-60', label: '50 to 60 kg', kilos: 60, price: 3000 },
  { id: 'inyuha-60-70', label: '60 to 70 kg', kilos: 70, price: 3500 },
]

/* ---------- Packages ---------- */

export interface ChoiceGroup {
  id: string
  label: string
  choose: number
  options: { id: string; name: string; img: string }[]
}

export interface Package {
  id: string
  code: string
  name: string
  price: number
  paxMin: number
  paxMax: number
  summary: string
  fixed: { name: string; img: string }[] // always included
  groups: ChoiceGroup[] // customer picks
  freebies?: string[]
  pickupOnly?: boolean
  addOns?: { id: string; name: string; price: number; perUnit?: string; max?: number }[]
}

const opt = (id: string, name: string, img?: string) => ({ id, name, img: img ?? trayById(id)?.img ?? PACKAGE_ONLY_IMG[id] })

// The dishes a customer picks five from (Choice Your Food and the Lechon Package).
const FIVE_OF_EIGHT = [
  opt('spaghetti', 'Spaghetti'),
  opt('pork-lumpia', 'Lumpia (100 pcs)'),
  opt('chicken-buffalo', 'Chicken Buffalo'),
  opt('fried-chicken', 'Fried Chicken'),
  opt('chicken-curry', 'Chicken Curry'),
  opt('pork-humba', 'Pork Humba'),
  opt('pork-steak', 'Pork Steak'),
  opt('special-bami', 'Special Bam-i'),
  opt('chicken-afritada', 'Chicken Afritada'),
]

export const PACKAGES: Package[] = [
  {
    id: 'three-bilao',
    code: 'BLO-3',
    name: '3 Bilao, large',
    price: 1400,
    paxMin: 15,
    paxMax: 17,
    summary: 'Three big bilao: noodles, chicken and lumpia.',
    fixed: [{ name: 'Lumpia (50 pcs)', img: asset('/img/hero/bilao-lumpia.webp') }],
    groups: [
      { id: 'noodle', label: 'Noodles', choose: 1, options: [opt('spaghetti', 'Spaghetti', asset('/img/hero/bilao-spaghetti.webp')), opt('bami', 'Bam-i', asset('/img/hero/bilao-bami.webp'))] },
      { id: 'chicken', label: 'Chicken', choose: 1, options: [opt('chicken-buffalo', 'Chicken Buffalo'), opt('fried-chicken', 'Fried Chicken', asset('/img/hero/bilao-chicken.webp'))] },
    ],
  },
  {
    id: 'bilao-belly',
    code: 'BLO-LB',
    name: '3 Bilao with Lechon Belly',
    price: 2900,
    paxMin: 17,
    paxMax: 17,
    summary: 'The 3 bilao set plus 3 kg of lechon belly.',
    fixed: [
      { name: 'Lechon Belly (3 kg)', img: asset('/img/hero/lechon-belly.webp') },
      { name: 'Lumpia bilao', img: asset('/img/hero/bilao-lumpia.webp') },
    ],
    groups: [
      { id: 'noodle', label: 'Noodles', choose: 1, options: [opt('spaghetti', 'Spaghetti', asset('/img/hero/bilao-spaghetti.webp')), opt('bami', 'Bam-i', asset('/img/hero/bilao-bami.webp'))] },
      { id: 'chicken', label: 'Chicken', choose: 1, options: [opt('fried-chicken', 'Fried Chicken', asset('/img/hero/bilao-chicken.webp')), opt('chicken-buffalo', 'Chicken Buffalo')] },
    ],
  },
  {
    id: 'medium-ten',
    code: 'MED-10',
    name: 'Medium Tray, 10 dishes',
    price: 3500,
    paxMin: 12,
    paxMax: 15,
    summary: 'Ten medium trays covering a full handaan, dessert and fruit included.',
    fixed: [
      { name: 'Bam-i', img: d('special-bami') },
      { name: 'Spaghetti', img: d('creamy-spaghetti') },
      { name: 'Maja', img: asset('/img/hero/maja.webp') },
      { name: 'Pork Steak', img: d('pork-steak') },
      { name: 'Fried Chicken', img: d('fried-chicken') },
      { name: 'Chicken Buffalo', img: d('chicken-buffalo') },
      { name: 'Lumpia', img: d('pork-lumpia') },
      { name: 'Chicken Menudo', img: d('pork-menudo') },
      { name: 'Chopsuey', img: d('chopsuey') },
      { name: 'Fruits', img: asset('/img/hero/fruits.webp') },
    ],
    groups: [],
    pickupOnly: true,
  },
  {
    id: 'choice-five',
    code: 'PKG-5',
    name: 'Choice Your Food, 5 large trays',
    price: 3500,
    paxMin: 20,
    paxMax: 25,
    summary: 'Pick any five large trays from nine favourites.',
    fixed: [],
    groups: [{ id: 'dishes', label: 'Your 5 trays', choose: 5, options: FIVE_OF_EIGHT }],
    freebies: ['Maja'],
  },
  {
    id: 'sulit',
    code: 'SULIT',
    name: 'Sulit Package',
    price: 4000,
    paxMin: 20,
    paxMax: 20,
    summary: 'Lechon belly, three main dishes of your choice and lumpia.',
    fixed: [
      { name: 'Lechon Belly (3 kg)', img: asset('/img/hero/lechon-belly.webp') },
      { name: 'Lumpia (50 pcs)', img: d('pork-lumpia') },
    ],
    groups: [
      {
        id: 'mains',
        label: '3 main dishes (large tray)',
        choose: 3,
        options: [
          opt('bami', 'Pancit (Bam-i)'),
          opt('chicken-buffalo', 'Chicken Buffalo'),
          opt('pork-steak', 'Pork Steak'),
          opt('fried-chicken', 'Fried Chicken'),
          opt('pork-humba', 'Pork Humba'),
          opt('chicken-curry', 'Chicken Curry'),
          opt('spaghetti', 'Spaghetti'),
        ],
      },
    ],
  },
  {
    id: 'package-belly',
    code: 'PKG-LB',
    name: 'Food Package with Lechon Belly',
    price: 5000,
    paxMin: 20,
    paxMax: 25,
    summary: 'Five large trays plus 3 kg lechon belly.',
    fixed: [
      { name: 'Lechon Belly (3 kg)', img: asset('/img/hero/lechon-belly.webp') },
      { name: 'Lumpia (100 pcs)', img: d('pork-lumpia') },
      { name: 'Menudo', img: d('pork-menudo') },
    ],
    groups: [
      { id: 'noodle', label: 'Noodles', choose: 1, options: [opt('bami', 'Bam-i'), opt('spaghetti', 'Spaghetti')] },
      { id: 'pork', label: 'Pork', choose: 1, options: [opt('pork-humba', 'Humba'), opt('pork-steak', 'Pork Steak')] },
      { id: 'chicken', label: 'Chicken', choose: 1, options: [opt('fried-chicken', 'Fried Chicken'), opt('chicken-buffalo', 'Chicken Buffalo'), opt('chicken-afritada', 'Chicken Afritada')] },
    ],
    freebies: ['Maja'],
  },
  {
    id: 'tray-six',
    code: 'TRAY-9',
    name: 'Food Tray Package',
    price: 6000,
    paxMin: 20,
    paxMax: 25,
    summary: 'Nine large trays, ready as is, with Bicol Express, afritada and curry.',
    // All nine trays are included; the owner confirmed there are no dish choices in this package.
    fixed: [
      { name: 'Buffalo Chicken', img: d('chicken-buffalo') },
      { name: 'Fried Chicken', img: d('fried-chicken') },
      { name: 'Special Bam-i', img: d('special-bami') },
      { name: 'Creamy Spaghetti', img: d('creamy-spaghetti') },
      { name: 'Chicken Afritada', img: d('chicken-afritada') },
      { name: 'Pork Steak', img: d('pork-steak') },
      { name: 'Lumpia (100 pcs)', img: d('pork-lumpia') },
      { name: 'Bicol Express', img: d('pork-humba') },
      { name: 'Chicken Curry', img: d('chicken-curry') },
    ],
    groups: [],
    freebies: ['Maja'],
  },
  {
    id: 'large-ten',
    code: 'LRG-10',
    name: 'Large 10-Tray Package',
    price: 7000,
    paxMin: 25,
    paxMax: 30,
    summary: 'Ten large trays with seafood, carbonara and ribs caldereta.',
    fixed: [
      { name: 'Mix Seafood', img: d('buttered-shrimp') },
      { name: 'Creamy Carbonara', img: d('creamy-spaghetti') },
      { name: 'Pork Lumpia (100 pcs)', img: d('pork-lumpia') },
      { name: 'Chicken Curry', img: d('chicken-curry') },
      { name: 'Pork Ribs Caldereta', img: d('beef-caldereta') },
      { name: 'Chicken Buffalo', img: d('chicken-buffalo') },
      { name: 'Pork Humba', img: d('pork-humba') },
      { name: 'Bicol Express', img: d('pork-sisig') },
      { name: 'Fried Chicken', img: d('fried-chicken') },
      { name: 'Sweet & Sour Fish', img: d('sweet-sour-fish') },
    ],
    groups: [],
  },
  {
    id: 'lechon-package',
    code: 'LCH-40',
    name: 'Lechon Package',
    price: 11500,
    paxMin: 40,
    paxMax: 40,
    summary: 'A 20 kg whole lechon plus any five large trays.',
    fixed: [{ name: 'Whole Lechon (20 kg live weight)', img: asset('/img/hero/lechon-whole.webp') }],
    groups: [{ id: 'dishes', label: 'Your 5 trays', choose: 5, options: FIVE_OF_EIGHT }],
    addOns: [
      { id: 'paluto-lamanloob', name: 'Paluto sa laman-loob', price: 250, max: 1 },
      { id: 'lechon-upgrade', name: 'Upgrade lechon weight', price: 300, perUnit: 'kg', max: 20 },
    ],
  },
]

export const packageById = (id: string) => PACKAGES.find((p) => p.id === id)

export const PAX_FILTERS = [
  { id: 'all', label: 'Any size', min: 0, max: 999 },
  { id: 'small', label: '12–17 pax', min: 12, max: 17 },
  { id: 'mid', label: '20–25 pax', min: 20, max: 25 },
  { id: 'big', label: '25–30 pax', min: 25, max: 30 },
  { id: 'fiesta', label: '40 pax', min: 40, max: 40 },
] as const
