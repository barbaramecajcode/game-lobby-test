import { memo, useEffect, useState, type KeyboardEvent } from 'react'
import { gameCount, useI18n } from '../i18n'
import type { Dict } from '../i18n/en'
import { money, percent } from '../lib/money'
import { clearFilters, filterGames } from '../lib/query'
import { useFloorQuery } from '../lib/useQuery'
import { useCatalog } from '../state/catalog'
import { useFavorites } from '../state/favorites'
import type { Game, Tag } from '../types'
import { IconStar } from './icons'
import { Mark } from './Mark'

const CATS = ['all', 'slots', 'table', 'live'] as const
type Cat = (typeof CATS)[number]

const CAT_KEY: Record<Cat, keyof Dict> = {
  all: 'filters.all',
  slots: 'filters.slots',
  table: 'filters.table',
  live: 'filters.live',
}

const TAG_KEY: Record<Tag, keyof Dict> = {
  megaways: 'tag.megaways',
  jackpot: 'tag.jackpot',
  bonus: 'tag.bonus',
  classic: 'tag.classic',
  hold: 'tag.hold',
  exclusive: 'tag.exclusive',
  'high-limit': 'tag.high-limit',
  new: 'tag.new',
}

export const Catalog = memo(function Catalog({ onOpenFilters }: { onOpenFilters: () => void }) {
  const { t, lang } = useI18n()
  const catalog = useCatalog()
  const { query, patch } = useFloorQuery()
  const favs = useFavorites()
  const offline = useOffline()
  const games = catalog.status === 'ready' ? filterGames(catalog.games, query) : []

  useEffect(() => {
    if (!query.focus || catalog.status !== 'ready') return
    const node = document.getElementById(`game-${query.focus}`)
    if (!node) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    node.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' })
  }, [query.focus, catalog.status, games.length])

  function setCat(cat: Cat) {
    patch((next) => {
      if (cat === 'all') next.delete('cat')
      else next.set('cat', cat)
      next.delete('focus')
    })
  }

  function onTabKey(event: KeyboardEvent, cat: Cat) {
    if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return
    event.preventDefault()
    const index = CATS.indexOf(cat)
    const mirror = document.dir === 'rtl' ? -1 : 1
    let next = index
    if (event.key === 'ArrowRight') next = (index + mirror + CATS.length) % CATS.length
    if (event.key === 'ArrowLeft') next = (index - mirror + CATS.length) % CATS.length
    if (event.key === 'Home') next = document.dir === 'rtl' ? CATS.length - 1 : 0
    if (event.key === 'End') next = document.dir === 'rtl' ? 0 : CATS.length - 1
    const value = CATS[next]
    setCat(value)
    requestAnimationFrame(() => document.getElementById(`tab-${value}`)?.focus())
  }

  return (
    <section className="games" id="games" aria-labelledby="games-title">
      <div className="toolbar">
        <h2 id="games-title">{t('catalog.games')}</h2>
        <div className="tabs" role="tablist" aria-label={t('filters.category')}>
          {CATS.map((cat) => (
            <button
              key={cat}
              id={`tab-${cat}`}
              type="button"
              role="tab"
              aria-selected={query.cat === cat}
              tabIndex={query.cat === cat ? 0 : -1}
              onClick={() => setCat(cat)}
              onKeyDown={(event) => onTabKey(event, cat)}
            >
              {t(CAT_KEY[cat])}
            </button>
          ))}
        </div>
        <label className="sort">
          <span>{t('filters.sort')}</span>
          <select
            value={query.sort}
            onChange={(event) => {
              const value = event.target.value
              patch((next) => {
                if (value === 'trending') next.delete('sort')
                else next.set('sort', value)
                next.delete('focus')
              })
            }}
          >
            <option value="trending">{t('filters.trending')}</option>
            <option value="new">{t('filters.new')}</option>
            <option value="rtp">{t('filters.rtp')}</option>
          </select>
        </label>
        <button type="button" className="text-btn filter-launch" onClick={onOpenFilters}>
          {t('filters.open')}
        </button>
        <button type="button" className="text-btn" onClick={() => patch(clearFilters)}>
          {t('filters.clear')}
        </button>
      </div>

      {catalog.status === 'ready' ? (
        <p className="count" aria-live="polite">
          {gameCount(lang, games.length, t)}
        </p>
      ) : null}
      {catalog.stale ? <p className="banner">{t('catalog.stale')}</p> : null}
      {!catalog.stale && offline && catalog.status === 'ready' ? <p className="banner">{t('catalog.offline')}</p> : null}

      {catalog.status === 'loading' ? <Loading label={t('catalog.loading')} /> : null}
      {catalog.status === 'error' ? (
        <div className="state">
          <p>{t('catalog.error')}</p>
          <button type="button" className="solid" onClick={catalog.reload}>
            {t('catalog.retry')}
          </button>
        </div>
      ) : null}
      {catalog.status === 'ready' && games.length === 0 ? (
        <div className="state">
          <p>{catalog.games.length === 0 ? t('catalog.none') : t('catalog.empty')}</p>
          {catalog.games.length > 0 ? (
            <button type="button" className="solid" onClick={() => patch(clearFilters)}>
              {t('filters.clear')}
            </button>
          ) : null}
        </div>
      ) : null}
      {catalog.status === 'ready' && games.length > 0 ? (
        <div className="grid">
          {games.map((game) => (
            <Card
              key={game.id}
              game={game}
              hot={query.focus === game.id}
              saved={favs.has(game.id)}
              onToggle={() => favs.toggle(game.id)}
              onOpen={() => {
                patch((next) => {
                  next.set('play', game.id)
                })
              }}
            />
          ))}
        </div>
      ) : null}
    </section>
  )
})

function Card({
  game,
  hot,
  saved,
  onToggle,
  onOpen,
}: {
  game: Game
  hot: boolean
  saved: boolean
  onToggle: () => void
  onOpen: () => void
}) {
  const { t, lang } = useI18n()
  return (
    <article className="card" id={`game-${game.id}`} data-hot={hot ? 'true' : 'false'}>
      <button type="button" className="card-open" onClick={onOpen}>
        <Mark seed={game.id} label={game.title} />
        <span className="card-title">{game.title}</span>
        <span className="card-provider">{game.provider}</span>
        <span className="card-meta">
          <span>{game.tags.map((tag) => t(TAG_KEY[tag])).join(' · ')}</span>
          <span>{t('catalog.rtp', { rtp: percent(game.rtp, lang, 1) })}</span>
        </span>
        <span className="card-bets">
          {t('catalog.bets', { min: money(game.minBet, lang), max: money(game.maxBet, lang) })}
        </span>
      </button>
      <button
        type="button"
        className={saved ? 'star on' : 'star'}
        aria-pressed={saved}
        aria-label={saved ? t('catalog.unsave', { title: game.title }) : t('catalog.save', { title: game.title })}
        onClick={onToggle}
      >
        <IconStar filled={saved} />
      </button>
    </article>
  )
}

function Loading({ label }: { label: string }) {
  return (
    <div className="grid" aria-busy="true">
      <span className="sr">{label}</span>
      {Array.from({ length: 8 }, (_, index) => (
        <div className="card skel-card" key={index}>
          <div className="skel skel-art" />
          <div className="skel skel-line" />
          <div className="skel skel-line short" />
        </div>
      ))}
    </div>
  )
}

function useOffline() {
  const [offline, setOffline] = useState(!navigator.onLine)
  useEffect(() => {
    const on = () => setOffline(false)
    const off = () => setOffline(true)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])
  return offline
}
