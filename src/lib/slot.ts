export const SYMBOLS = ['cherry', 'lemon', 'orange', 'plum', 'bell', 'bar', 'star'] as const
export type SymbolId = (typeof SYMBOLS)[number]

const COUNTS: Record<SymbolId, number> = {
  cherry: 6,
  lemon: 5,
  orange: 4,
  plum: 3,
  bell: 2,
  bar: 1,
  star: 1,
}

export const TRIPLE: Record<SymbolId, number> = {
  cherry: 10.5,
  lemon: 16.5,
  orange: 18,
  plum: 30,
  bell: 60,
  bar: 120,
  star: 360,
}

export const PAIR: Record<SymbolId, number> = {
  cherry: 1,
  lemon: 1,
  orange: 2,
  plum: 3,
  bell: 5,
  bar: 8,
  star: 15,
}

function weave(): SymbolId[] {
  const left: Record<SymbolId, number> = { ...COUNTS }
  const out: SymbolId[] = []
  const total = SYMBOLS.reduce((sum, id) => sum + COUNTS[id], 0)
  while (out.length < total) {
    for (const id of SYMBOLS) {
      if (left[id] <= 0) continue
      out.push(id)
      left[id] -= 1
    }
  }
  return out
}

export const STRIP = weave()

export function linePayout(a: SymbolId, b: SymbolId, c: SymbolId) {
  if (a === b && b === c) return TRIPLE[a]
  if (a === b) return PAIR[a]
  return 0
}

function measure() {
  let total = 0
  let weighted = 0
  let hits = 0
  for (const a of STRIP) {
    for (const b of STRIP) {
      for (const c of STRIP) {
        total += 1
        const pay = linePayout(a, b, c)
        weighted += pay
        if (pay > 0) hits += 1
      }
    }
  }
  return { rtp: weighted / total, hit: hits / total }
}

const measured = measure()
export const MACHINE_RTP = measured.rtp
export const MACHINE_HIT = measured.hit

export function drawStop() {
  const buf = new Uint32Array(1)
  crypto.getRandomValues(buf)
  return buf[0] % STRIP.length
}

export const STAKES = [20, 50, 100, 200, 500, 1000]
