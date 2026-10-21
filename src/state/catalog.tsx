import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { loadCatalog } from '../api'
import type { Game } from '../types'

type CatalogValue = {
  status: 'loading' | 'error' | 'ready'
  games: Game[]
  stale: boolean
  reload: () => void
}

const CatalogContext = createContext<CatalogValue | null>(null)

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [attempt, setAttempt] = useState(1)
  const [status, setStatus] = useState<CatalogValue['status']>('loading')
  const [games, setGames] = useState<Game[]>([])
  const [stale, setStale] = useState(false)

  useEffect(() => {
    let cancel = false
    setStatus('loading')
    loadCatalog(attempt)
      .then((res) => {
        if (cancel) return
        setGames(res.games)
        setStale(res.stale)
        setStatus('ready')
      })
      .catch(() => {
        if (cancel) return
        setStatus('error')
      })
    return () => {
      cancel = true
    }
  }, [attempt])

  const reload = useCallback(() => setAttempt((n) => n + 1), [])
  const value = useMemo(
    () => ({ status, games, stale, reload }),
    [status, games, stale, reload],
  )

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>
}

export function useCatalog() {
  const ctx = useContext(CatalogContext)
  if (!ctx) throw new Error('catalog')
  return ctx
}
