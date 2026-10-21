import { hash } from '../lib/hash'
import type { Category, Game, Tag } from '../types'

export const PROVIDERS = [
  { id: 'keel', name: 'Keel' },
  { id: 'holm', name: 'Holm' },
  { id: 'northwind', name: 'Northwind' },
  { id: 'pewter', name: 'Pewter' },
  { id: 'lantern', name: 'Lantern & Co.' },
  { id: 'brig', name: 'Brig' },
  { id: 'marlowe', name: 'Marlowe' },
  { id: 'redloom', name: 'Red Loom' },
] as const

const SLOT_TAGS: Tag[] = ['megaways', 'jackpot', 'bonus', 'classic', 'hold', 'exclusive']

const RAW: Array<[string, Category]> = [
  ['Orchard Line', 'slots'],
  ['Night Tram', 'slots'],
  ['Copper Kettle', 'slots'],
  ['Salt Hotel', 'slots'],
  ['Joker 27', 'slots'],
  ['Glass Harbour', 'slots'],
  ['Low Tide', 'slots'],
  ['Kindling', 'slots'],
  ['Red Foyer', 'slots'],
  ['Tin Circus', 'slots'],
  ['Winter Ledger', 'slots'],
  ['Honey Circuit', 'slots'],
  ['Black Walnut', 'slots'],
  ['Pale Motel', 'slots'],
  ['Gilded Thorn', 'slots'],
  ['Sevens', 'slots'],
  ['Shining Fruits', 'slots'],
  ['Crazy 7s', 'slots'],
  ['Extra Crown', 'slots'],
  ['Last Ferry', 'slots'],
  ['Hot 27', 'slots'],
  ['Brass Orchard', 'slots'],
  ['Cinder Lane', 'slots'],
  ['Rook and Ribbon', 'slots'],
  ['Sunday Vault', 'slots'],
  ['Milk Glass', 'slots'],
  ['North Heat', 'slots'],
  ['Royal Hold', 'slots'],
  ['Wild Hold', 'slots'],
  ['Yellow Room', 'slots'],
  ['Book of Holm', 'slots'],
  ['Oven Door', 'slots'],
  ['Pearl Circuit', 'slots'],
  ['Cold Supper', 'slots'],
  ['Lantern Gems', 'slots'],
  ['Fire 7s', 'slots'],
  ['House of Tens', 'slots'],
  ['Burning Star', 'slots'],
  ['Old Radio', 'slots'],
  ['Bell Strike', 'slots'],
  ['Sugar Ramp', 'slots'],
  ['Finch and Co', 'slots'],
  ['Second Chance', 'slots'],
  ['Ivory Stair', 'slots'],
  ['Bad Lamp', 'slots'],
  ['Book of Keel', 'slots'],
  ['Window Seat', 'slots'],
  ['Triple Chance', 'slots'],
  ['Night Clerk', 'slots'],
  ['Gold Sevens', 'slots'],
  ['Slow Horseshoe', 'slots'],
  ['Velvet Meter', 'slots'],
  ['Bell Bonus', 'slots'],
  ['The Dry Bar', 'slots'],
  ['Little Comet', 'slots'],
  ['Salt and Pepper', 'slots'],
  ['Open Ledger', 'slots'],
  ['Warm Static', 'slots'],
  ['Kettle Black', 'slots'],
  ['Extra Spin', 'slots'],
  ['Crown Fruits', 'slots'],
  ['Red Hot 2', 'slots'],
  ['Double Cherry', 'slots'],
  ['Moon Index', 'slots'],
  ['The Polite Wolf', 'table'],
  ['Cedar Room', 'table'],
  ['Five Minutes', 'table'],
  ['Blackjack VIP', 'table'],
  ['Blackjack Six', 'table'],
  ['Casino War', 'table'],
  ['Orchard After Dark', 'table'],
  ['Baccarat', 'table'],
  ['Three Card', 'table'],
  ['European Roulette', 'table'],
  ['Casino Hold\'em', 'table'],
  ['Punto Banco', 'table'],
  ['Low Ceiling', 'table'],
  ['Mirror Stake', 'table'],
  ['Evening Shift', 'table'],
  ['The Last Chip', 'table'],
  ['Roulette', 'table'],
  ['Table Four', 'table'],
  ['Late Seating', 'table'],
  ['Pit Lane', 'table'],
  ['Counting Room', 'table'],
  ['The Open Chair', 'table'],
  ['Lucky Wheel', 'live'],
  ['Camera Three', 'live'],
  ['Live from Holborn', 'live'],
  ['Midnight Spin', 'live'],
  ['The Quiet Pit', 'live'],
  ['Red Camera', 'live'],
  ['Studio B', 'live'],
  ['Seat Nine', 'live'],
  ['Live Roulette', 'live'],
  ['Speed Roulette', 'live'],
  ['Roulette Late', 'live'],
  ['Studio North', 'live'],
  ['Infinite Blackjack', 'live'],
  ['Auto Roulette', 'live'],
  ['Speed Baccarat', 'live'],
  ['Blackjack Azure', 'live'],
  ['Live Baccarat', 'live'],
  ['Night Pit', 'live'],
  ['Lens Two', 'live'],
  ['The Call', 'live'],
  ['Table Camera', 'live'],
  ['Stud Poker', 'live'],
]

const TODAY = Date.UTC(2026, 9, 21)

function slug(title: string) {
  return title
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function tagsFor(category: Category, h: number, daysAgo: number): Tag[] {
  const tags = new Set<Tag>()
  if (category === 'slots') {
    tags.add(SLOT_TAGS[h % SLOT_TAGS.length])
    if (h % 3 === 0) tags.add(SLOT_TAGS[(h >>> 4) % SLOT_TAGS.length])
  } else if (category === 'table') {
    tags.add(h % 2 === 0 ? 'classic' : 'high-limit')
  } else {
    tags.add('exclusive')
    if (h % 4 === 0) tags.add('jackpot')
  }
  if (h % 11 === 0) tags.add('high-limit')
  if (daysAgo < 45) tags.add('new')
  return [...tags]
}

function stakes(category: Category, high: boolean, h: number) {
  if (category === 'slots') {
    const min = high ? 100 : 20
    return { min, max: min * (25 + (h % 40)) }
  }
  if (category === 'table') {
    const min = high ? 2500 : 500
    return { min, max: min * (16 + (h % 20)) }
  }
  const min = high ? 1000 : 100
  return { min, max: min * (20 + (h % 24)) }
}

export const GAMES: Game[] = RAW.map(([title, category]) => {
  const h = hash(title)
  const provider = PROVIDERS[h % PROVIDERS.length]
  const daysAgo = h % 500
  const tags = tagsFor(category, h, daysAgo)
  const bet = stakes(category, tags.includes('high-limit'), h)
  const released = new Date(TODAY - daysAgo * 86400000).toISOString().slice(0, 10)
  return {
    id: slug(title),
    title,
    provider: provider.name,
    providerId: provider.id,
    category,
    tags,
    rtp: (945 + (h % 26)) / 1000,
    minBet: bet.min,
    maxBet: bet.max,
    heat: h % 100,
    released,
  }
})

export const GAME_BY_ID = new Map(GAMES.map((game) => [game.id, game]))
