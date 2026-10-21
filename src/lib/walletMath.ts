export function amountEndsWith9(cents: number) {
  const abs = Math.abs(Math.trunc(cents))
  const whole = Math.floor(abs / 100)
  let frac = abs % 100
  if (frac === 0) return whole % 10 === 9
  if (frac % 10 === 0) frac = Math.floor(frac / 10)
  return frac % 10 === 9
}

export function convertedCents(foreignCents: number, rate: number) {
  return Math.round(foreignCents * rate)
}

export class Ledger {
  cents: number

  constructor(cents: number) {
    this.cents = cents
  }

  add(delta: number) {
    this.cents += delta
    return this.cents
  }

  take(delta: number) {
    if (delta <= 0 || this.cents < delta) return false
    this.cents -= delta
    return true
  }
}

// Optimistic credit, then an optional stake, then a rollback of that same credit.
export function settleDeposit(book: Ledger, foreignCents: number, rate: number, stake: number | null) {
  const credit = convertedCents(foreignCents, rate)
  const fail = amountEndsWith9(foreignCents)
  book.add(credit)
  const took = stake === null ? false : book.take(stake)
  if (fail) book.add(-credit)
  return { fail, took, credit, cents: book.cents }
}
