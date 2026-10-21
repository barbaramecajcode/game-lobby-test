import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

type FavValue = {
  ids: string[]
  has: (id: string) => boolean
  toggle: (id: string) => void
  move: (id: string, dir: -1 | 1) => void
  reorder: (id: string, beforeId: string) => void
}

const FavContext = createContext<FavValue | null>(null)
const KEY = 'halden.favs'

function read(): string[] {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '[]') as unknown
    if (!Array.isArray(raw)) return []
    return raw.filter((item) => typeof item === 'string')
  } catch {
    return []
  }
}

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<string[]>(read)

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(ids))
  }, [ids])

  const has = useCallback((id: string) => ids.includes(id), [ids])

  const toggle = useCallback((id: string) => {
    setIds((curr) => (curr.includes(id) ? curr.filter((item) => item !== id) : [...curr, id]))
  }, [])

  const move = useCallback((id: string, dir: -1 | 1) => {
    setIds((curr) => {
      const index = curr.indexOf(id)
      const nextIndex = index + dir
      if (index < 0 || nextIndex < 0 || nextIndex >= curr.length) return curr
      const next = curr.slice()
      const [item] = next.splice(index, 1)
      next.splice(nextIndex, 0, item)
      return next
    })
  }, [])

  const reorder = useCallback((id: string, beforeId: string) => {
    if (id === beforeId) return
    setIds((curr) => {
      if (!curr.includes(id) || !curr.includes(beforeId)) return curr
      const next = curr.filter((item) => item !== id)
      next.splice(next.indexOf(beforeId), 0, id)
      return next
    })
  }, [])

  const value = useMemo(
    () => ({ ids, has, toggle, move, reorder }),
    [ids, has, toggle, move, reorder],
  )

  return <FavContext.Provider value={value}>{children}</FavContext.Provider>
}

export function useFavorites() {
  const ctx = useContext(FavContext)
  if (!ctx) throw new Error('favs')
  return ctx
}
