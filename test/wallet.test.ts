import assert from 'node:assert/strict'
import { test } from 'node:test'
import { filterGames, type FloorQuery } from '../src/lib/query.ts'
import { amountEndsWith9, Ledger, settleDeposit } from '../src/lib/walletMath.ts'
import type { Game } from '../src/types.ts'

test('19 and 18.99 fail, 19.50 and 90 do not', () => {
  assert.equal(amountEndsWith9(1900), true)
  assert.equal(amountEndsWith9(900), true)
  assert.equal(amountEndsWith9(1899), true)
  assert.equal(amountEndsWith9(1990), true)
  assert.equal(amountEndsWith9(1950), false)
  assert.equal(amountEndsWith9(2000), false)
  assert.equal(amountEndsWith9(9000), false)
})

test('a spin during a declined deposit is kept', () => {
  const book = new Ledger(25000)
  const result = settleDeposit(book, 1899, 1, 100)
  assert.equal(result.fail, true)
  assert.equal(result.took, true)
  assert.equal(result.cents, 24900)
})

test('a spin during a posted deposit stays on the new balance', () => {
  const book = new Ledger(25000)
  const result = settleDeposit(book, 1950, 1, 100)
  assert.equal(result.fail, false)
  assert.equal(result.cents, 26850)
})

test('two stakes cannot overdraw the same balance', () => {
  const book = new Ledger(150)
  assert.equal(book.take(100), true)
  assert.equal(book.take(100), false)
  assert.equal(book.cents, 50)
})

test('gbp converts once, then the same cents come back off', () => {
  const book = new Ledger(0)
  const result = settleDeposit(book, 1900, 1.17, null)
  assert.equal(result.fail, true)
  assert.equal(result.credit, 2223)
  assert.equal(result.cents, 0)
})

function game(partial: Pick<Game, 'title' | 'provider' | 'providerId' | 'category' | 'tags' | 'rtp' | 'heat' | 'released'>): Game {
  return { id: partial.title, minBet: 20, maxBet: 100, ...partial }
}

const floor = (patch: Partial<FloorQuery>): FloorQuery => ({
  q: '',
  cat: 'all',
  providers: [],
  tag: '',
  sort: 'trending',
  play: '',
  focus: '',
  ...patch,
})

test('filters combine, and search matches the studio name', () => {
  const games = [
    game({ title: 'Orchard Line', provider: 'Marlowe', providerId: 'marlowe', category: 'slots', tags: ['megaways'], rtp: 0.96, heat: 10, released: '2026-01-01' }),
    game({ title: 'Sevens', provider: 'Keel', providerId: 'keel', category: 'slots', tags: ['classic'], rtp: 0.97, heat: 80, released: '2026-08-01' }),
    game({ title: 'Hot 27', provider: 'Keel', providerId: 'keel', category: 'slots', tags: ['megaways'], rtp: 0.95, heat: 40, released: '2026-09-01' }),
    game({ title: 'Roulette', provider: 'Keel', providerId: 'keel', category: 'table', tags: ['classic'], rtp: 0.99, heat: 70, released: '2026-07-01' }),
  ]
  const combined = filterGames(games, floor({ q: 'line', cat: 'slots', providers: ['keel'], tag: 'megaways', sort: 'rtp' }))
  assert.deepEqual(combined.map((item) => item.title), [])
  const keel = filterGames(games, floor({ cat: 'slots', providers: ['keel'], sort: 'rtp' }))
  assert.deepEqual(keel.map((item) => item.title), ['Sevens', 'Hot 27'])
  const byStudio = filterGames(games, floor({ q: 'keel' }))
  assert.equal(byStudio.length, 3)
})
