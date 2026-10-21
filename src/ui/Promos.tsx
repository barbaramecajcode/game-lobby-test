import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { loadPromos } from '../api'
import { PROMOS, type PromoId } from '../data/promos'
import { useI18n } from '../i18n'
import type { Dict } from '../i18n/en'
import { IconChevron } from './icons'

const COPY: Record<PromoId, { title: keyof Dict; detail: keyof Dict; meta: keyof Dict }> = {
  sunday: { title: 'promo.sunday.title', detail: 'promo.sunday.detail', meta: 'promo.sunday.meta' },
  reload: { title: 'promo.reload.title', detail: 'promo.reload.detail', meta: 'promo.reload.meta' },
  felt: { title: 'promo.felt.title', detail: 'promo.felt.detail', meta: 'promo.felt.meta' },
  reel: { title: 'promo.reel.title', detail: 'promo.reel.detail', meta: 'promo.reel.meta' },
  high: { title: 'promo.high.title', detail: 'promo.high.detail', meta: 'promo.high.meta' },
  loss: { title: 'promo.loss.title', detail: 'promo.loss.detail', meta: 'promo.loss.meta' },
}

export function Promos() {
  const { t } = useI18n()
  const [attempt, setAttempt] = useState(1)
  const [status, setStatus] = useState<'loading' | 'error' | 'ready'>('loading')
  const [ids, setIds] = useState<PromoId[]>([])
  const row = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancel = false
    setStatus('loading')
    loadPromos(attempt)
      .then((res) => {
        if (cancel) return
        setIds(res.promos)
        setStatus('ready')
      })
      .catch(() => {
        if (!cancel) setStatus('error')
      })
    return () => {
      cancel = true
    }
  }, [attempt])

  function scrollByDir(dir: number) {
    const el = row.current
    if (!el) return
    const sign = document.dir === 'rtl' ? -1 : 1
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    el.scrollBy({
      left: sign * dir * Math.min(el.clientWidth * 0.85, 340),
      behavior: reduce ? 'auto' : 'smooth',
    })
  }

  const tone = new Map(PROMOS.map((promo) => [promo.id, promo.tone]))

  return (
    <section className="board" aria-labelledby="promo-title">
      <div className="board-head">
        <h2 id="promo-title">{t('promo.region')}</h2>
        <p className="kicker">{t('promo.kicker')}</p>
        <div className="board-nav">
          <button type="button" className="icon-btn" onClick={() => scrollByDir(-1)} aria-label={t('promo.prev')}>
            <IconChevron dir="start" />
          </button>
          <button type="button" className="icon-btn" onClick={() => scrollByDir(1)} aria-label={t('promo.next')}>
            <IconChevron dir="end" />
          </button>
        </div>
      </div>
      {status === 'loading' ? (
        <div className="board-row" aria-busy="true">
          <span className="sr">{t('promo.loading')}</span>
          <div className="skel promo-skel" />
          <div className="skel promo-skel" />
          <div className="skel promo-skel" />
        </div>
      ) : null}
      {status === 'error' ? (
        <div className="state">
          <p>{t('promo.error')}</p>
          <button type="button" className="solid" onClick={() => setAttempt((n) => n + 1)}>
            {t('promo.retry')}
          </button>
        </div>
      ) : null}
      {status === 'ready' && ids.length === 0 ? <p className="muted">{t('promo.empty')}</p> : null}
      {status === 'ready' && ids.length > 0 ? (
        <div ref={row} className="board-row" tabIndex={0} role="region" aria-label={t('promo.region')}>
          {ids.map((id) => {
            const copy = COPY[id]
            return (
              <article key={id} className="promo" style={{ '--tone': tone.get(id) ?? 28 } as CSSProperties}>
                <p className="kicker">{t(copy.meta)}</p>
                <h3>{t(copy.title)}</h3>
                <p>{t(copy.detail)}</p>
              </article>
            )
          })}
        </div>
      ) : null}
    </section>
  )
}
