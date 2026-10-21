import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useI18n } from '../i18n'
import type { Dict } from '../i18n/en'
import { day, money, percent } from '../lib/money'
import { useFloorQuery } from '../lib/useQuery'
import {
  MACHINE_HIT,
  MACHINE_RTP,
  PAIR,
  STRIP,
  STAKES,
  SYMBOLS,
  TRIPLE,
  drawStop,
  linePayout,
  type SymbolId,
} from '../lib/slot'
import { useCatalog } from '../state/catalog'
import { useWallet } from '../state/wallet'
import type { Game, Tag } from '../types'
import { Dialog } from './Dialog'

const ROW = 58
const SYM_KEY: Record<SymbolId, keyof Dict> = {
  cherry: 'sym.cherry',
  lemon: 'sym.lemon',
  orange: 'sym.orange',
  plum: 'sym.plum',
  bell: 'sym.bell',
  bar: 'sym.bar',
  star: 'sym.star',
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

const CAT_KEY = {
  slots: 'filters.slots',
  table: 'filters.table',
  live: 'filters.live',
} as const

export function PlaySheet() {
  const { query, patch } = useFloorQuery()
  const catalog = useCatalog()
  const game = catalog.games.find((item) => item.id === query.play) ?? null
  if (!game) return null
  return <Cabinet game={game} onClose={() => patch((next) => next.delete('play'))} />
}

function Cabinet({ game, onClose }: { game: Game; onClose: () => void }) {
  const { t, lang } = useI18n()
  const wallet = useWallet()
  const [stakeIndex, setStakeIndex] = useState(2)
  const [stops, setStops] = useState([2, 6, 10])
  const [spinId, setSpinId] = useState(0)
  const [phase, setPhase] = useState<'idle' | 'spinning'>('idle')
  const [last, setLast] = useState<number | null>(null)
  const [short, setShort] = useState(false)
  const phaseRef = useRef<'idle' | 'spinning'>('idle')
  const paidRef = useRef(false)
  const pendingRef = useRef(0)
  const arrived = useRef(new Set<number>())
  const creditRef = useRef(wallet.credit)
  creditRef.current = wallet.credit
  const finishRef = useRef(() => {})

  finishRef.current = () => {
    if (paidRef.current) return
    paidRef.current = true
    phaseRef.current = 'idle'
    if (pendingRef.current > 0) creditRef.current(pendingRef.current)
    setPhase('idle')
    setLast(pendingRef.current)
  }

  useEffect(() => {
    return () => {
      if (phaseRef.current === 'spinning' && !paidRef.current) {
        paidRef.current = true
        if (pendingRef.current > 0) creditRef.current(pendingRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (spinId === 0) return
    const id = window.setTimeout(() => finishRef.current(), 2300)
    return () => window.clearTimeout(id)
  }, [spinId])

  const bet = STAKES[stakeIndex]
  const spinning = phase === 'spinning'
  const symbols = stops.map((stop) => STRIP[stop])

  function spin() {
    if (phaseRef.current === 'spinning') return
    if (!wallet.stake(bet)) {
      setShort(true)
      return
    }
    phaseRef.current = 'spinning'
    paidRef.current = false
    arrived.current = new Set()
    const next = [drawStop(), drawStop(), drawStop()]
    // chosen here; the reels only show it
    const multiple = linePayout(STRIP[next[0]], STRIP[next[1]], STRIP[next[2]])
    pendingRef.current = Math.round(multiple * bet)
    setStops(next)
    setSpinId((id) => id + 1)
    setPhase('spinning')
    setShort(false)
    setLast(null)
  }

  function onReel(index: number) {
    arrived.current.add(index)
    if (arrived.current.size >= 3) finishRef.current()
  }

  const names = symbols.map((id) => t(SYM_KEY[id])).join(', ')

  return (
    <Dialog title={game.title} closeLabel={t('slot.close')} onClose={onClose} locked={spinning} wide>
      <div className="sheet">
        <p className="muted">
          {game.provider} · {t(CAT_KEY[game.category])} · {t('sheet.released', { date: day(game.released, lang) })}
        </p>
        <p>
          {t('catalog.rtp', { rtp: percent(game.rtp, lang, 1) })} · {t('sheet.min')} {money(game.minBet, lang)} · {t('sheet.max')}{' '}
          {money(game.maxBet, lang)}
        </p>
        <p className="muted">{game.tags.map((tag) => t(TAG_KEY[tag])).join(' · ')}</p>
        {game.category !== 'slots' ? <p>{t('sheet.tableNote')}</p> : null}
        {game.category === 'slots' ? (
          <div className="cabinet">
            <p className="machine-note">
              {t('slot.rtp', {
                rtp: percent(MACHINE_RTP, lang, 2),
                hit: percent(MACHINE_HIT, lang, 1),
              })}
            </p>
            {window.matchMedia('(prefers-reduced-motion: reduce)').matches ? <p className="muted">{t('slot.reduce')}</p> : null}
            <div className="reels" aria-hidden="true">
              <Reel stop={stops[0]} spinId={spinId} travel={44} duration={980} onDone={() => onReel(0)} />
              <Reel stop={stops[1]} spinId={spinId} travel={66} duration={1320} onDone={() => onReel(1)} />
              <Reel stop={stops[2]} spinId={spinId} travel={80} duration={1680} onDone={() => onReel(2)} />
            </div>
            <p className="result" aria-live="polite">
              {spinning
                ? t('slot.spinning')
                : last === null
                  ? names
                  : last > 0
                    ? `${t('slot.win', { amount: money(last, lang) })} ${names}`
                    : `${t('slot.lose')} ${names}`}
            </p>
            {short ? <p role="alert">{t('slot.short')}</p> : null}
            <div className="stake-row">
              <span>{t('slot.bet')}</span>
              <button type="button" className="icon-btn" aria-label={t('slot.lower')} disabled={spinning || stakeIndex === 0} onClick={() => setStakeIndex((index) => Math.max(0, index - 1))}>
                −
              </button>
              <strong>{money(bet, lang)}</strong>
              <button
                type="button"
                className="icon-btn"
                aria-label={t('slot.raise')}
                disabled={spinning || stakeIndex === STAKES.length - 1}
                onClick={() => setStakeIndex((index) => Math.min(STAKES.length - 1, index + 1))}
              >
                +
              </button>
              <button type="button" className="solid spin" onClick={spin} disabled={spinning}>
                {spinning ? t('slot.spinning') : t('slot.spin')}
              </button>
            </div>
            <table className="pay">
              <caption>{t('slot.paytable')}</caption>
              <thead>
                <tr>
                  <th scope="col">{t('slot.paytable')}</th>
                  <th scope="col">{t('slot.three')}</th>
                  <th scope="col">{t('slot.pair')}</th>
                </tr>
              </thead>
              <tbody>
                {SYMBOLS.map((id) => (
                  <tr key={id}>
                    <th scope="row">{t(SYM_KEY[id])}</th>
                    <td>{TRIPLE[id]}×</td>
                    <td>{PAIR[id]}×</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </Dialog>
  )
}

function Reel({
  stop,
  spinId,
  travel,
  duration,
  onDone,
}: {
  stop: number
  spinId: number
  travel: number
  duration: number
  onDone: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const done = useRef(onDone)
  done.current = onDone
  const seen = useRef(0)
  const center = STRIP.length * 4 + stop

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    seen.current = spinId
    const endY = -(center - 1) * ROW
    const startY = -(center - travel - 1) * ROW
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    el.style.transition = 'none'
    el.style.transform = `translateY(${spinId === 0 ? endY : startY}px)`
    if (spinId === 0) return
    if (reduce) {
      el.style.transform = `translateY(${endY}px)`
      done.current()
      return
    }
    void el.offsetHeight
    el.style.transition = `transform ${duration}ms cubic-bezier(.15,.72,.08,1)`
    el.style.transform = `translateY(${endY}px)`
  }, [spinId, center, travel, duration])

  return (
    <div className="reel-window">
      <div
        className="strip"
        ref={ref}
        onTransitionEnd={(event) => {
          if (event.propertyName !== 'transform' || event.target !== event.currentTarget) return
          if (seen.current === 0 || seen.current !== spinId) return
          done.current()
        }}
      >
        {Array.from({ length: 7 }, (_, copy) =>
          STRIP.map((id, index) => (
            <div className={`sym sym-${id}`} key={`${copy}-${index}`} style={{ height: ROW }}>
              <Glyph id={id} />
            </div>
          )),
        )}
      </div>
    </div>
  )
}

function Glyph({ id }: { id: SymbolId }) {
  if (id === 'cherry') {
    return (
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <path d="M16 6c2 4 4 6 8 7" fill="none" stroke="currentColor" strokeWidth="1.4" />
        <circle cx="12" cy="18" r="5" />
        <circle cx="20" cy="20" r="5" />
      </svg>
    )
  }
  if (id === 'lemon' || id === 'orange' || id === 'plum') {
    return (
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <ellipse cx="16" cy="17" rx={id === 'lemon' ? 8 : 7} ry={id === 'plum' ? 8 : 7} />
      </svg>
    )
  }
  if (id === 'bell') {
    return (
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <path d="M10 20c0-6 2.2-10 6-10s6 4 6 10H10z" />
        <rect x="14.5" y="20" width="3" height="3" />
      </svg>
    )
  }
  if (id === 'bar') {
    return (
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <rect x="6" y="12" width="20" height="8" rx="1" fill="none" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <path d="M16 5l2.4 6.6H25l-5.4 4.1 2 6.6L16 18.8 10.4 22.3l2-6.6L7 11.6h6.6z" />
    </svg>
  )
}
