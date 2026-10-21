import { useEffect, useRef, useState } from 'react'
import { GAMES } from '../data/games'
import { useI18n } from '../i18n'
import { clock, money } from '../lib/money'
import { hash } from '../lib/hash'
import { useMediaQuery } from '../lib/useMedia'

const PEOPLE = [
  'Ava M.',
  'jonas92',
  'Leila S.',
  'noah.p',
  'Mara',
  'idris',
  'Hana V.',
  'theo7',
  'Noor A.',
  'ellis',
  'samir_j',
  'Greta B.',
  'yusuf',
  'Pia N.',
  'omar88',
]

type Win = {
  id: number
  name: string
  game: string
  cents: number
  at: number
}

const CAP = 40

function makeWin(id: number): Win {
  const game = GAMES[Math.floor(Math.random() * GAMES.length)]
  const roll = Math.random()
  const cents = roll > 0.94 ? 2000 + Math.floor(Math.random() * 8000) : 40 + Math.floor(Math.random() * 760)
  return {
    id,
    name: PEOPLE[Math.floor(Math.random() * PEOPLE.length)],
    game: game.title,
    cents,
    at: Date.now(),
  }
}

export function Feed() {
  const { t, lang } = useI18n()
  const wide = useMediaQuery('(min-width: 860px)')
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<Win[]>([])
  const [held, setHeld] = useState(false)
  const [phase, setPhase] = useState<'loading' | 'live' | 'error'>('loading')
  const [attempt, setAttempt] = useState(1)
  const heldRef = useRef(false)
  const seq = useRef(1)

  useEffect(() => {
    let cancel = false
    let timer = 0
    setPhase('loading')
    setItems([])

    const broken = new URLSearchParams(location.search).get('broken')
    const fail = (broken === 'feed' || broken === 'all') && attempt === 1

    const push = () => {
      if (document.hidden || heldRef.current) return
      const id = seq.current++
      setItems((curr) => [makeWin(id), ...curr].slice(0, CAP))
    }

    const arm = (delay: number) => {
      timer = window.setTimeout(() => {
        if (cancel) return
        push()
        arm(1400 + Math.random() * 1600)
      }, delay)
    }

    const boot = window.setTimeout(() => {
      if (cancel) return
      if (fail) {
        setPhase('error')
        return
      }
      setPhase('live')
      push()
      arm(1200)
    }, 640)

    return () => {
      cancel = true
      window.clearTimeout(boot)
      window.clearTimeout(timer)
    }
  }, [attempt])

  function hold(next: boolean) {
    heldRef.current = next
    setHeld(next)
  }

  const visible = wide || open

  return (
    <>
      {!wide ? (
        <button type="button" className="feed-launch" onClick={() => setOpen(true)}>
          {t('feed.open')}
        </button>
      ) : null}
      {open && !wide ? (
        <button type="button" className="scrim side-scrim" aria-label={t('feed.close')} onClick={() => setOpen(false)} />
      ) : null}
      <aside
        className={visible && !wide ? 'wire open' : 'wire'}
        inert={!visible ? true : undefined}
        aria-labelledby="feed-title"
        onPointerEnter={() => hold(true)}
        onPointerLeave={() => hold(false)}
        onFocus={() => hold(true)}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) hold(false)
        }}
      >
        <div className="wire-top">
          <h2 id="feed-title">{t('feed.title')}</h2>
          <span className={held ? 'pill' : 'pill live'}>{held ? t('feed.paused') : phase === 'live' ? t('feed.live') : ''}</span>
          {!wide ? (
            <button type="button" className="icon-btn" onClick={() => setOpen(false)} aria-label={t('feed.close')}>
              ×
            </button>
          ) : null}
        </div>
        {phase === 'loading' ? (
          <div aria-busy="true">
            <span className="sr">{t('feed.loading')}</span>
            <div className="skel skel-line" />
            <div className="skel skel-line" />
            <div className="skel skel-line short" />
          </div>
        ) : null}
        {phase === 'error' ? (
          <div className="state">
            <p>{t('feed.error')}</p>
            <button type="button" className="solid" onClick={() => setAttempt((n) => n + 1)}>
              {t('feed.retry')}
            </button>
          </div>
        ) : null}
        {phase === 'live' && items.length === 0 ? <p className="muted">{t('feed.empty')}</p> : null}
        {phase === 'live' ? (
          <ol className="wins" aria-label={t('feed.region')}>
            {items.map((item) => (
              <li key={item.id}>
                <span className="avatar" style={{ background: `hsl(${hash(item.name) % 360} 28% 36%)` }} aria-hidden="true">
                  {item.name.slice(0, 1)}
                </span>
                <p>{t('feed.won', { name: item.name, amount: money(item.cents, lang), game: item.game })}</p>
                <time dateTime={new Date(item.at).toISOString()}>{clock(item.at, lang)}</time>
              </li>
            ))}
          </ol>
        ) : null}
      </aside>
    </>
  )
}
