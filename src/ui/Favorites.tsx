import { useRef, useState } from 'react'
import { useI18n } from '../i18n'
import { useFloorQuery } from '../lib/useQuery'
import { useCatalog } from '../state/catalog'
import { useFavorites } from '../state/favorites'
import { IconChevron, IconGrip } from './icons'
import { Mark } from './Mark'

export function Favorites() {
  const { t } = useI18n()
  const catalog = useCatalog()
  const favs = useFavorites()
  const { patch } = useFloorQuery()
  const [note, setNote] = useState('')
  const row = useRef<HTMLDivElement>(null)
  const drag = useRef<{ id: string; over: string } | null>(null)
  const [over, setOver] = useState<string | null>(null)

  const games = favs.ids
    .map((id) => catalog.games.find((game) => game.id === id))
    .filter((game): game is NonNullable<typeof game> => Boolean(game))

  function nearest(x: number) {
    const cards = row.current?.querySelectorAll<HTMLElement>('[data-fav]')
    if (!cards?.length) return null
    let bestId = ''
    let bestDist = Number.POSITIVE_INFINITY
    for (const card of cards) {
      const box = card.getBoundingClientRect()
      const dist = Math.abs(x - (box.left + box.width / 2))
      if (dist < bestDist) {
        bestDist = dist
        bestId = card.dataset.fav ?? ''
      }
    }
    return bestId || null
  }

  function moveKey(id: string, dir: -1 | 1, title: string) {
    const index = favs.ids.indexOf(id)
    const next = index + dir
    if (index < 0 || next < 0 || next >= favs.ids.length) return
    favs.move(id, dir)
    setNote(t('fav.moved', { title }))
    requestAnimationFrame(() => document.getElementById(`fav-${id}`)?.focus())
  }

  if (catalog.status !== 'ready') return null

  return (
    <section className="saved" aria-labelledby="saved-title">
      <h2 id="saved-title">{t('fav.title')}</h2>
      <p className="sr" aria-live="polite">
        {note}
      </p>
      {games.length === 0 ? <p className="muted">{t('fav.empty')}</p> : null}
      {games.length > 0 ? (
        <div className="saved-row" ref={row}>
          {games.map((game) => (
            <article
              key={game.id}
              id={`fav-${game.id}`}
              className={over === game.id ? 'fav drop' : 'fav'}
              data-fav={game.id}
              tabIndex={0}
              onKeyDown={(event) => {
                if (!event.altKey) return
                if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
                  event.preventDefault()
                  moveKey(game.id, -1, game.title)
                }
                if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
                  event.preventDefault()
                  moveKey(game.id, 1, game.title)
                }
              }}
            >
              <button
                type="button"
                className="grip"
                aria-label={t('fav.grip', { title: game.title })}
                onPointerDown={(event) => {
                  if (event.button !== 0) return
                  event.currentTarget.setPointerCapture(event.pointerId)
                  drag.current = { id: game.id, over: game.id }
                }}
                onPointerMove={(event) => {
                  if (!drag.current || drag.current.id !== game.id) return
                  const hit = nearest(event.clientX)
                  if (!hit) return
                  drag.current.over = hit
                  setOver(hit)
                }}
                onPointerUp={() => {
                  const current = drag.current
                  drag.current = null
                  setOver(null)
                  if (current && current.over !== current.id) {
                    favs.reorder(current.id, current.over)
                    setNote(t('fav.moved', { title: game.title }))
                  }
                }}
              >
                <IconGrip />
              </button>
              <button
                type="button"
                className="fav-open"
                onClick={() => {
                  patch((next) => {
                    next.set('play', game.id)
                    next.set('focus', game.id)
                  })
                }}
              >
                <Mark seed={game.id} label={game.title} />
                <span>{game.title}</span>
              </button>
              <div className="fav-moves">
                <button type="button" className="icon-btn" aria-label={t('fav.earlier', { title: game.title })} onClick={() => moveKey(game.id, -1, game.title)}>
                  <IconChevron dir="start" />
                </button>
                <button type="button" className="icon-btn" aria-label={t('fav.later', { title: game.title })} onClick={() => moveKey(game.id, 1, game.title)}>
                  <IconChevron dir="end" />
                </button>
                <button type="button" className="icon-btn" aria-label={t('fav.remove', { title: game.title })} onClick={() => favs.toggle(game.id)}>
                  ×
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  )
}
