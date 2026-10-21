import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { readQuery } from './query'

export function useFloorQuery() {
  const [params, setParams] = useSearchParams()
  const query = useMemo(() => readQuery(params), [params])
  const patch = useCallback(
    (mutate: (next: URLSearchParams) => void) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          mutate(next)
          return next
        },
        { replace: true },
      )
    },
    [setParams],
  )
  return { query, patch }
}
