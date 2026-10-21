import { useEffect, useState } from 'react'
import { useI18n } from '../i18n'
import type { Lang } from '../i18n/en'
import { money } from '../lib/money'
import { useFloorQuery } from '../lib/useQuery'
import { useTween } from '../lib/useTween'
import { useWallet } from '../state/wallet'
import { currentTheme, subscribeTheme, toggleTheme } from '../state/theme'
import { IconLamp } from './icons'
import { Pool } from './Pool'

export function Header({ onPalette }: { onPalette: () => void }) {
  const { t, lang, setLang } = useI18n()
  const wallet = useWallet()
  const shown = useTween(wallet.balance)
  const [theme, setThemeState] = useState(currentTheme)
  const shortcut = /Macintosh|Mac OS/.test(navigator.userAgent) ? '⌘K' : 'Ctrl K'

  useEffect(() => subscribeTheme(() => setThemeState(currentTheme())), [])

  return (
    <header className="topbar">
      <a className="brand" href="#games">
        {t('brand')}
      </a>
      <Search />
      <Pool />
      <div className="tools">
        <button type="button" className="wallet-btn" onClick={() => wallet.setView('wallet')} aria-label={t('wallet.open', { balance: money(wallet.balance, lang) })}>
          <span className="wallet-word">{t('wallet.title')}</span>
          <span aria-hidden="true">{wallet.status === 'ready' ? money(shown, lang) : '—'}</span>
        </button>
        <button type="button" className="icon-btn kbd-btn" aria-label={t('palette.open')} aria-keyshortcuts="Control+K Meta+K" onClick={onPalette}>
          <span aria-hidden="true" className="kbd">{shortcut}</span>
        </button>
        <button type="button" className="icon-btn" onClick={toggleTheme} aria-label={theme === 'dark' ? t('theme.toLight') : t('theme.toDark')}>
          <IconLamp />
        </button>
        <label className="lang">
          <span className="sr">{t('lang.label')}</span>
          <select value={lang} onChange={(event) => setLang(event.target.value as Lang)} aria-label={t('lang.label')}>
            <option value="en">{t('lang.en')}</option>
            <option value="de">{t('lang.de')}</option>
            <option value="ar">{t('lang.ar')}</option>
          </select>
        </label>
        <details className="hue">
          <summary>{t('theme.hueGroup')}</summary>
          <label>
            <span className="sr">{t('theme.hue')}</span>
            <input
              type="range"
              min={0}
              max={360}
              defaultValue={localStorage.getItem('halden.hue') ?? '28'}
              aria-label={t('theme.hue')}
              onInput={(event) => {
                const value = event.currentTarget.value
                document.documentElement.style.setProperty('--hue', value)
                localStorage.setItem('halden.hue', value)
              }}
            />
          </label>
        </details>
      </div>
    </header>
  )
}

function Search() {
  const { t } = useI18n()
  const { query, patch } = useFloorQuery()
  const [draft, setDraft] = useState(query.q)

  useEffect(() => {
    setDraft(query.q)
  }, [query.q])

  useEffect(() => {
    if (draft === query.q) return
    const id = window.setTimeout(() => {
      patch((next) => {
        if (draft) next.set('q', draft)
        else next.delete('q')
        next.delete('focus')
      })
    }, 280)
    return () => window.clearTimeout(id)
  }, [draft, query.q, patch])

  return (
    <form className="search" role="search" onSubmit={(event) => event.preventDefault()}>
      <label className="sr" htmlFor="q">
        {t('search.label')}
      </label>
      <input
        id="q"
        type="text"
        inputMode="search"
        value={draft}
        placeholder={t('search.placeholder')}
        autoComplete="off"
        enterKeyHint="search"
        onChange={(event) => setDraft(event.target.value)}
      />
      {draft ? (
        <button type="button" className="search-clear" onClick={() => setDraft('')} aria-label={t('search.clear')}>
          ×
        </button>
      ) : null}
    </form>
  )
}
