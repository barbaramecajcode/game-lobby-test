import { useEffect, useId, useRef, type ReactNode } from 'react'

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function Dialog({
  title,
  onClose,
  closeLabel,
  children,
  locked,
  wide,
}: {
  title: string
  onClose: () => void
  closeLabel: string
  children: ReactNode
  locked?: boolean
  wide?: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  const titleId = useId()
  const closeRef = useRef(onClose)
  const lockedRef = useRef(locked)
  closeRef.current = onClose
  lockedRef.current = locked

  useEffect(() => {
    const back = document.activeElement as HTMLElement | null
    const root = ref.current
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const preferred = root?.querySelector<HTMLElement>('[data-autofocus]')
    const first = root?.querySelector<HTMLElement>(FOCUSABLE)
    ;(preferred ?? first ?? root)?.focus()

    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape' && !lockedRef.current) {
        event.preventDefault()
        closeRef.current()
        return
      }
      if (event.key !== 'Tab' || !root) return
      const list = [...root.querySelectorAll<HTMLElement>(FOCUSABLE)]
      if (!list.length) return
      const head = list[0]
      const tail = list[list.length - 1]
      if (event.shiftKey && document.activeElement === head) {
        event.preventDefault()
        tail.focus()
      } else if (!event.shiftKey && document.activeElement === tail) {
        event.preventDefault()
        head.focus()
      }
    }

    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
      back?.focus?.()
    }
  }, [])

  return (
    <div
      className="scrim"
      onMouseDown={(event) => {
        if (!locked && event.target === event.currentTarget) closeRef.current()
      }}
    >
      <div
        ref={ref}
        className={wide ? 'dialog wide' : 'dialog'}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <div className="dialog-top">
          <h2 id={titleId}>{title}</h2>
          <button type="button" className="icon-btn" onClick={() => closeRef.current()} disabled={locked} aria-label={closeLabel}>
            <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
              <path d="M3.2 3.2l9.6 9.6M12.8 3.2l-9.6 9.6" fill="none" stroke="currentColor" strokeWidth="1.4" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
