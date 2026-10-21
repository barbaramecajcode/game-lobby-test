import { useEffect, useMemo, useRef, useState } from 'react'
import { useI18n } from '../i18n'
import { score } from '../lib/fuzzy'
import { clearFilters } from '../lib/query'
import { useFloorQuery } from '../lib/useQuery'
import { useCatalog } from '../state/catalog'
import { toggleTheme } from '../state/theme'
import { useWallet } from '../state/wallet'
import type { Game } from '../types'
import { Dialog } from './Dialog'

type Kind = 'action' | 'game' | 'studio'

type Row = {
  id: string
  kind: Kind
  label: string
  hint: string
  score: number
  run: () => void
}

export function Palette({ open, onClose, onToggle }: { open: boolean; onClose: () => void; onToggle: () => void }) {
  const toggleRef = useRef(onToggle)
  toggleRef.current = onToggle

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key.toLowerCase() !== 'k' || !(event.metaKey || event.ctrlKey) || event.altKey) return
      event.preventDefault()
      toggleRef.current()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  if (!open) return null
  return <PaletteDialog onClose={onClose} />
}

function PaletteDialog({ onClose }: { onClose: () => void }) {
  const { t, setLang } = useI18n()
  const catalog = useCatalog()
  const wallet = useWallet()
  const { patch } = useFloorQuery()
  const [draft, setDraft] = useState('')
  const [active, setActive] = useState(0)
  const listRef = useRef<HTMLDivElement>(null)

  const rows = useMemo(() => {
    const jump = (game: Game) => {
      patch((next) => {
        clearFilters(next)
        next.set('q', game.title)
        next.set('focus', game.id)
      })
      onClose()
    }
    const actions: Row[] = [
      {
        id: 'theme',
        kind: 'action',
        label: t('palette.theme'),
        hint: t('palette.actions'),
        score: 1,
        run: () => {
          toggleTheme()
          onClose()
        },
      },
      {
        id: 'deposit',
        kind: 'action',
        label: t('palette.deposit'),
        hint: t('palette.actions'),
        score: 1,
        run: () => {
          wallet.setView('deposit')
          onClose()
        },
      },
      {
        id: 'clear',
        kind: 'action',
        label: t('palette.clear'),
        hint: t('palette.actions'),
        score: 1,
        run: () => {
          patch(clearFilters)
          onClose()
        },
      },
      {
        id: 'lang-en',
        kind: 'action',
        label: t('palette.lang.en'),
        hint: t('palette.actions'),
        score: 1,
        run: () => {
          setLang('en')
          onClose()
        },
      },
      {
        id: 'lang-de',
        kind: 'action',
        label: t('palette.lang.de'),
        hint: t('palette.actions'),
        score: 1,
        run: () => {
          setLang('de')
          onClose()
        },
      },
      {
        id: 'lang-ar',
        kind: 'action',
        label: t('palette.lang.ar'),
        hint: t('palette.actions'),
        score: 1,
        run: () => {
          setLang('ar')
          onClose()
        },
      },
    ]

    const q = draft.trim()
    if (!q) {
      const top = [...catalog.games].sort((a, b) => b.heat - a.heat).slice(0, 6)
      return [
        ...actions,
        ...top.map((game) => ({
          id: game.id,
          kind: 'game' as const,
          label: game.title,
          hint: game.provider,
          score: 1,
          run: () => jump(game),
        })),
      ]
    }

    const found: Row[] = []
    for (const action of actions) {
      const value = score(q, action.label)
      if (value > 0) found.push({ ...action, score: value })
    }
    for (const game of catalog.games) {
      const value = score(q, game.title)
      if (value > 0) {
        found.push({
          id: game.id,
          kind: 'game',
          label: game.title,
          hint: game.provider,
          score: value,
          run: () => jump(game),
        })
      }
    }
    const studios = new Map<string, string>()
    for (const game of catalog.games) studios.set(game.providerId, game.provider)
    for (const [id, name] of studios) {
      const value = score(q, name)
      if (value > 0) {
        found.push({
          id: `studio-${id}`,
          kind: 'studio',
          label: name,
          hint: t('palette.studios'),
          score: value + 12,
          run: () => {
            patch((next) => {
              clearFilters(next)
              next.set('prov', id)
            })
            onClose()
          },
        })
      }
    }
    found.sort((a, b) => b.score - a.score || a.label.localeCompare(b.label))
    return found.slice(0, 12)
  }, [draft, catalog.games, onClose, patch, setLang, t, wallet])

  useEffect(() => {
    setActive(0)
  }, [draft])

  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' })
  }, [active, rows])

  const current = Math.min(active, Math.max(0, rows.length - 1))

  return (
    <Dialog title={t('palette.label')} closeLabel={t('sheet.close')} onClose={onClose}>
      <div className="palette">
        <label className="sr" htmlFor="palette-q">
          {t('palette.placeholder')}
        </label>
        <input
          id="palette-q"
          data-autofocus
          role="combobox"
          aria-expanded="true"
          aria-controls="palette-list"
          aria-activedescendant={rows[current] ? `pal-${rows[current].id}` : undefined}
          aria-autocomplete="list"
          placeholder={t('palette.placeholder')}
          autoComplete="off"
          spellCheck={false}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown') {
              event.preventDefault()
              setActive((index) => Math.min(rows.length - 1, index + 1))
            } else if (event.key === 'ArrowUp') {
              event.preventDefault()
              setActive((index) => Math.max(0, index - 1))
            } else if (event.key === 'Home') {
              event.preventDefault()
              setActive(0)
            } else if (event.key === 'End') {
              event.preventDefault()
              setActive(Math.max(0, rows.length - 1))
            } else if (event.key === 'Enter' && rows[current]) {
              event.preventDefault()
              rows[current].run()
            }
          }}
        />
        <p className="hint">{t('palette.hint')}</p>
        <div id="palette-list" ref={listRef} role="listbox" aria-label={t('palette.label')}>
          {rows.length === 0 ? <p className="muted">{t('palette.empty')}</p> : null}
          {rows.map((row, index) => (
            <button
              key={row.id}
              id={`pal-${row.id}`}
              type="button"
              role="option"
              aria-selected={index === current}
              className={index === current ? 'pal-row on' : 'pal-row'}
              onMouseEnter={() => setActive(index)}
              onClick={row.run}
            >
              <span>{row.label}</span>
              <span className="muted">{row.hint}</span>
            </button>
          ))}
        </div>
      </div>
    </Dialog>
  )
}
