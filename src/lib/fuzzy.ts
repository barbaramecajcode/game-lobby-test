export function score(query: string, text: string) {
  const q = query.trim().toLowerCase()
  const t = text.toLowerCase()
  if (!q) return 1
  if (t === q) return 1200
  if (t.startsWith(q)) return 920 - Math.min(t.length, 60)
  const at = t.indexOf(q)
  if (at >= 0) return 740 - at * 4

  let qi = 0
  let total = 0
  let streak = 0
  let prev = -2
  for (let i = 0; i < t.length && qi < q.length; i++) {
    if (t[i] !== q[qi]) continue
    const boundary = i === 0 || /[^a-z0-9\u0600-\u06ff]/i.test(t[i - 1])
    streak = i === prev + 1 ? streak + 1 : 1
    total += 8 + streak * 7 + (boundary ? 16 : 0)
    prev = i
    qi++
  }
  if (qi !== q.length) return 0
  return Math.max(1, 70 + total - t.length * 0.2)
}
