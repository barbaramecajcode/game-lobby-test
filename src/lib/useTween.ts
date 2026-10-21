import { useEffect, useRef, useState } from 'react'

export function useTween(target: number) {
  const [display, setDisplay] = useState(target)
  const shown = useRef(target)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      shown.current = target
      setDisplay(target)
      return
    }
    const from = shown.current
    const to = target
    const started = performance.now()
    let frame = 0
    const step = (now: number) => {
      const progress = Math.min(1, (now - started) / 680)
      const eased = 1 - (1 - progress) ** 3
      const value = progress === 1 ? to : Math.round(from + (to - from) * eased)
      shown.current = value
      setDisplay(value)
      if (progress < 1) frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [target])

  return display
}
