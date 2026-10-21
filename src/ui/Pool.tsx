import { useEffect, useRef } from 'react'
import { useI18n } from '../i18n'
import { money } from '../lib/money'

const EPOCH = Date.UTC(2026, 0, 1)

function poolCents(now: number) {
  return 1_840_000 + ((now - EPOCH) / 1000) * 1.85
}

export function Pool() {
  const { t, lang } = useI18n()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const liveRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const live = liveRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    let frame = 0
    let stopped = false
    let cssWidth = 140

    const font = '600 22px Fraunces, Georgia, serif'
    let view = 22
    let baseline = 16
    let shownCents = Math.round(poolCents(Date.now()))
    let fromText = money(shownCents, lang)
    let toText = fromText
    let tickStart = 0

    function resize(width: number) {
      const next = Math.max(140, Math.ceil(width) + 8)
      const heightChanged = canvas!.height !== Math.floor(view * dpr)
      if (next <= cssWidth && canvas!.width !== 0 && !heightChanged) return
      cssWidth = Math.max(cssWidth, next)
      canvas!.width = Math.floor(cssWidth * dpr)
      canvas!.height = Math.floor(view * dpr)
      canvas!.style.width = `${cssWidth}px`
      canvas!.style.height = `${view}px`
    }

    function measureLine() {
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx!.font = font
      const box = ctx!.measureText('8')
      const ascent = box.actualBoundingBoxAscent || 14
      const descent = box.actualBoundingBoxDescent || 4
      view = Math.ceil(ascent + descent + 2)
      baseline = Math.ceil(ascent + 1)
    }

    function prepare(text: string) {
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx!.font = font
      resize(ctx!.measureText(text).width)
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx!.clearRect(0, 0, cssWidth, view)
      ctx!.beginPath()
      ctx!.rect(0, 0, cssWidth, view)
      ctx!.clip()
      ctx!.font = font
      ctx!.textBaseline = 'alphabetic'
    }

    function drawStatic(text: string, color: string) {
      ctx!.save()
      prepare(text)
      ctx!.fillStyle = color
      ctx!.fillText(text, 0, baseline)
      ctx!.restore()
    }

    function drawRolling(current: string, upcoming: string, frac: number, color: string) {
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx!.font = font
      const a = [...current]
      const b = [...upcoming]
      while (a.length < b.length) a.unshift(' ')
      while (b.length < a.length) b.unshift(' ')
      const widths = a.map((ch, index) => Math.max(ctx!.measureText(ch).width, ctx!.measureText(b[index] ?? ch).width))
      const total = widths.reduce((sum, width) => sum + width, 0)
      ctx!.save()
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)
      resize(total)
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx!.clearRect(0, 0, cssWidth, view)
      ctx!.beginPath()
      ctx!.rect(0, 0, cssWidth, view)
      ctx!.clip()
      ctx!.font = font
      ctx!.textBaseline = 'alphabetic'
      ctx!.fillStyle = color
      let x = 0
      const shift = Math.min(1, Math.max(0, frac)) * view
      for (let i = 0; i < a.length; i++) {
        const w = widths[i]
        if (a[i] === b[i]) ctx!.fillText(a[i], x, baseline)
        else {
          ctx!.fillText(a[i], x, baseline - shift)
          ctx!.fillText(b[i], x, baseline - shift + view)
        }
        x += w
      }
      ctx!.restore()
    }

    function paint(now: number) {
      if (!canvas || !ctx) return
      measureLine()
      const target = Math.round(poolCents(now))
      const color = getComputedStyle(canvas).color
      if (target !== shownCents && tickStart === 0) {
        fromText = money(shownCents, lang)
        shownCents = target
        toText = money(shownCents, lang)
        tickStart = now
        if (live) live.textContent = toText
      }
      if (reduce || lang === 'ar' || tickStart === 0) {
        drawStatic(toText, color)
        return
      }
      const frac = Math.min(1, (now - tickStart) / 280)
      if (frac >= 1) {
        tickStart = 0
        fromText = toText
        drawStatic(toText, color)
        return
      }
      drawRolling(fromText, toText, frac, color)
    }

    const loop = () => {
      if (stopped || document.hidden) return
      paint(Date.now())
      if (!reduce) frame = requestAnimationFrame(loop)
    }

    const onVis = () => {
      if (document.hidden) {
        cancelAnimationFrame(frame)
        return
      }
      paint(Date.now())
      if (!reduce) frame = requestAnimationFrame(loop)
    }

    paint(Date.now())
    document.fonts.ready.then(() => {
      if (!stopped) paint(Date.now())
    })
    document.addEventListener('visibilitychange', onVis)
    let interval = 0
    if (reduce) interval = window.setInterval(() => paint(Date.now()), 1000)
    else frame = requestAnimationFrame(loop)

    return () => {
      stopped = true
      cancelAnimationFrame(frame)
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [lang])

  return (
    <div className="pool">
      <span className="kicker">{t('pool.label')}</span>
      <canvas ref={canvasRef} aria-hidden="true" />
      <span className="sr" ref={liveRef} />
    </div>
  )
}
