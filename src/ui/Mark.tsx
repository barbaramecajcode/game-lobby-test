import { hash } from '../lib/hash'

export function Mark({ seed, label }: { seed: string; label: string }) {
  const h = hash(seed)
  const hue = h % 360
  const paper = `hsl(${hue} 28% 74%)`
  const ink = `hsl(${(hue + 18) % 360} 32% 24%)`
  const cut = h % 4
  const monogram = label
    .split(/[\s-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0] ?? '')
    .join('')
    .toUpperCase()

  return (
    <svg className="mark" viewBox="0 0 160 104" aria-hidden="true">
      <rect width="160" height="104" fill={paper} />
      {cut === 0 && <circle cx="116" cy="38" r="34" fill={ink} />}
      {cut === 1 && <path d="M0 70 L160 28 V104 H0 Z" fill={ink} />}
      {cut === 2 && <rect x="16" y="14" width="62" height="76" fill={ink} />}
      {cut === 3 && <path d="M18 90 L80 14 L142 90 Z" fill={ink} />}
      <rect x="8" y="74" width="40" height="22" fill={paper} />
      <text x="12" y="91" fill={ink} fontFamily="Fraunces, Georgia, serif" fontSize="16">
        {monogram}
      </text>
    </svg>
  )
}
