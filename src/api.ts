import { GAMES } from './data/games'
import { PROMOS, type PromoId } from './data/promos'
import type { Game } from './types'

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

function flag(name: string) {
  return new URLSearchParams(location.search).get(name)
}

export async function loadCatalog(attempt: number) {
  await wait(680)
  const broken = flag('broken')
  if ((broken === 'catalog' || broken === 'all') && attempt === 1) {
    throw new Error('catalog')
  }
  if (flag('empty') === 'catalog') return { games: [] as Game[], stale: false }
  if (!navigator.onLine) {
    const cached = readJson<Game[]>('halden.catalog')
    if (!cached) throw new Error('offline')
    return { games: cached, stale: true }
  }
  localStorage.setItem('halden.catalog', JSON.stringify(GAMES))
  return { games: GAMES, stale: false }
}

export async function loadPromos(attempt: number) {
  await wait(520)
  const broken = flag('broken')
  if ((broken === 'promos' || broken === 'all') && attempt === 1) {
    throw new Error('promos')
  }
  if (flag('empty') === 'promos') return { promos: [] as PromoId[], stale: false }
  if (!navigator.onLine) {
    const cached = readJson<PromoId[]>('halden.promos')
    if (!cached) throw new Error('offline')
    return { promos: cached, stale: true }
  }
  const ids = PROMOS.map((promo) => promo.id)
  localStorage.setItem('halden.promos', JSON.stringify(ids))
  return { promos: ids, stale: false }
}
