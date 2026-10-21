export const PROMOS = [
  { id: 'sunday', tone: 28 },
  { id: 'reload', tone: 168 },
  { id: 'felt', tone: 210 },
  { id: 'reel', tone: 12 },
  { id: 'high', tone: 332 },
  { id: 'loss', tone: 86 },
] as const

export type PromoId = (typeof PROMOS)[number]['id']
