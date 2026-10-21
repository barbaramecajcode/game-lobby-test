import type { ReactNode } from 'react'

type IconProps = { className?: string }

function Svg({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <svg className={className} viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
      {children}
    </svg>
  )
}

export function IconClose({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M3.2 3.2l9.6 9.6M12.8 3.2l-9.6 9.6" fill="none" stroke="currentColor" strokeWidth="1.4" />
    </Svg>
  )
}

export function IconLamp({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M8 1.6a4.2 4.2 0 0 0-2.2 7.7c.3.2.5.6.5 1h3.4c0-.4.2-.8.5-1A4.2 4.2 0 0 0 8 1.6z" fill="none" stroke="currentColor" strokeWidth="1.3" />
      <path d="M6.2 12.2h3.6M7 14h2" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </Svg>
  )
}

export function IconStar({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true">
      <path
        d="M8 1.8l1.7 3.6 3.9.5-2.9 2.7.8 3.9L8 10.6 4.5 12.5l.8-3.9L2.4 5.9l3.9-.5z"
        fill={filled ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function IconGrip() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
      <path
        d="M5 3.5h.01M5 8h.01M5 12.5h.01M11 3.5h.01M11 8h.01M11 12.5h.01"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function IconChevron({ dir }: { dir: 'start' | 'end' }) {
  const d = dir === 'start' ? 'M10 3.2L5.2 8 10 12.8' : 'M6 3.2L10.8 8 6 12.8'
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
      <path d={d} fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
