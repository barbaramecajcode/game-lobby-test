import { useEffect, useId, useRef } from 'react'
import { useI18n } from '../i18n'
import type { Dict } from '../i18n/en'
import { useMediaQuery } from '../lib/useMedia'
import { useFloorQuery } from '../lib/useQuery'
import { useCatalog } from '../state/catalog'
import type { Tag } from '../types'
import { IconClose } from './icons'

const TAGS: Tag[] = ['megaways', 'jackpot', 'bonus', 'classic', 'hold', 'exclusive', 'high-limit', 'new']

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

export function Filters({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useI18n()
  const { games, status } = useCatalog()
  const { query, patch } = useFloorQuery()
  const wide = useMediaQuery('(min-width: 1100px)')
  const closeRef = useRef<HTMLButtonElement>(null)
  const titleId = useId()

  useEffect(() => {
    if (open && !wide) closeRef.current?.focus()
  }, [open, wide])

  const studios = [...new Map(games.map((game) => [game.providerId, game.provider])).entries()]

  function toggleProvider(id: string) {
    patch((next) => {
      const selected = new Set((next.get('prov') ?? '').split(',').filter(Boolean))
      if (selected.has(id)) selected.delete(id)
      else selected.add(id)
      if (selected.size) next.set('prov', [...selected].join(','))
      else next.delete('prov')
      next.delete('focus')
    })
  }

  function toggleTag(tag: string) {
    patch((next) => {
      if (!tag || next.get('tag') === tag) next.delete('tag')
      else next.set('tag', tag)
      next.delete('focus')
    })
  }

  const shown = wide || open

  return (
    <>
      {open && !wide ? <button type="button" className="scrim side-scrim" aria-label={t('filters.close')} onClick={onClose} /> : null}
      <aside
        className={shown && !wide ? 'side open' : 'side'}
        inert={!shown ? true : undefined}
        aria-labelledby={titleId}
      >
        <div className="side-top">
          <h2 id={titleId}>{t('filters.open')}</h2>
          {!wide ? (
            <button ref={closeRef} type="button" className="icon-btn" onClick={onClose} aria-label={t('filters.close')}>
              <IconClose />
            </button>
          ) : null}
        </div>
        {status === 'loading' ? (
          <p className="muted">{t('filters.loading')}</p>
        ) : (
          <>
            <fieldset>
              <legend>{t('filters.studios')}</legend>
              <div className="checks">
                {studios.map(([id, name]) => (
                  <label key={id}>
                    <input
                      type="checkbox"
                      checked={query.providers.includes(id)}
                      onChange={() => toggleProvider(id)}
                    />
                    <span>{name}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend>{t('filters.tags')}</legend>
              <div className="tag-row">
                <button type="button" className="tag-btn" aria-pressed={query.tag === ''} onClick={() => toggleTag('')}>
                  {t('filters.anyTag')}
                </button>
                {TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    className="tag-btn"
                    aria-pressed={query.tag === tag}
                    onClick={() => toggleTag(tag)}
                  >
                    {t(TAG_KEY[tag])}
                  </button>
                ))}
              </div>
            </fieldset>
            {!wide ? (
              <button type="button" className="solid" onClick={onClose}>
                {t('filters.show')}
              </button>
            ) : null}
          </>
        )}
      </aside>
    </>
  )
}
