import type { Category, Game } from '../types'

export type SortKey = 'trending' | 'new' | 'rtp'
export type CatFilter = 'all' | Category

export type FloorQuery = {
  q: string
  cat: CatFilter
  providers: string[]
  tag: string
  sort: SortKey
  play: string
  focus: string
}

export function readQuery(params: URLSearchParams): FloorQuery {
  const cat = params.get('cat')
  const sort = params.get('sort')
  return {
    q: params.get('q') ?? '',
    cat: cat === 'slots' || cat === 'table' || cat === 'live' ? cat : 'all',
    providers: (params.get('prov') ?? '').split(',').filter(Boolean),
    tag: params.get('tag') ?? '',
    sort: sort === 'new' || sort === 'rtp' ? sort : 'trending',
    play: params.get('play') ?? '',
    focus: params.get('focus') ?? '',
  }
}

export function filterGames(games: Game[], query: FloorQuery) {
  const needle = query.q.trim().toLowerCase()
  const next = games.filter((game) => {
    if (query.cat !== 'all' && game.category !== query.cat) return false
    if (query.providers.length && !query.providers.includes(game.providerId)) return false
    if (query.tag && !game.tags.includes(query.tag as Game['tags'][number])) return false
    if (!needle) return true
    const hay = `${game.title} ${game.provider}`.toLowerCase()
    return hay.includes(needle)
  })
  next.sort((a, b) => {
    if (query.sort === 'rtp') return b.rtp - a.rtp || a.title.localeCompare(b.title)
    if (query.sort === 'new') return b.released.localeCompare(a.released) || a.title.localeCompare(b.title)
    return b.heat - a.heat || a.title.localeCompare(b.title)
  })
  return next
}

export function clearFilters(next: URLSearchParams) {
  next.delete('q')
  next.delete('cat')
  next.delete('prov')
  next.delete('tag')
  next.delete('sort')
  next.delete('focus')
}
