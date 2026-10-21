import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { amountEndsWith9, convertedCents, Ledger } from '../lib/walletMath'
import type { PayCode, Tx } from '../types'

export const RATES: Record<PayCode, number> = {
  EUR: 1,
  USD: 0.92,
  GBP: 1.17,
}

export const PAY_CODES: PayCode[] = ['EUR', 'USD', 'GBP']

const KEY = 'halden.wallet'

type View = 'closed' | 'wallet' | 'deposit'
type Saved = { balance: number; txs: Tx[] }

function seed(): Tx[] {
  const evening = new Date(2026, 9, 15, 19, 12).getTime()
  return [
    { id: 'opening', cents: 20000, status: 'posted', at: evening - 86400000 * 6, code: 'EUR' },
    { id: 'tuesday', cents: 5000, status: 'posted', at: evening, code: 'EUR' },
  ]
}

function read(): Saved | null {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || 'null') as Saved | null
    if (!raw || typeof raw.balance !== 'number' || !Array.isArray(raw.txs)) return null
    return raw
  } catch {
    return null
  }
}

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

type WalletValue = {
  status: 'loading' | 'error' | 'ready'
  balance: number
  txs: Tx[]
  view: View
  busy: boolean
  error: 'declined' | 'invalid' | null
  setView: (view: View) => void
  reload: () => void
  deposit: (foreignCents: number, code: PayCode) => Promise<void>
  stake: (cents: number) => boolean
  credit: (cents: number) => void
  clearError: () => void
}

const WalletContext = createContext<WalletValue | null>(null)

export function WalletProvider({ children }: { children: ReactNode }) {
  const [attempt, setAttempt] = useState(1)
  const [status, setStatus] = useState<WalletValue['status']>('loading')
  const [balance, setBalance] = useState(25000)
  const [txs, setTxs] = useState<Tx[]>([])
  const [view, setView] = useState<View>('closed')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<WalletValue['error']>(null)
  const book = useRef(new Ledger(25000))
  const moved = useRef(false)

  useEffect(() => {
    let cancel = false
    setStatus('loading')
    wait(560).then(() => {
      if (cancel) return
      const broken = new URLSearchParams(location.search).get('broken')
      if ((broken === 'wallet' || broken === 'all') && attempt === 1) {
        setStatus('error')
        return
      }
      const saved = read()
      const empty = new URLSearchParams(location.search).get('empty') === 'wallet'
      const nextBalance = saved?.balance ?? 25000
      const nextTxs = empty ? [] : (saved?.txs ?? seed())
      if (!moved.current) {
        book.current.cents = nextBalance
        setBalance(nextBalance)
        setTxs(nextTxs)
      }
      setStatus('ready')
    })
    return () => {
      cancel = true
    }
  }, [attempt])

  useEffect(() => {
    if (status !== 'ready') return
    if (txs.some((tx) => tx.status === 'pending')) return
    localStorage.setItem(KEY, JSON.stringify({ balance, txs }))
  }, [status, balance, txs])

  const reload = useCallback(() => setAttempt((n) => n + 1), [])
  const clearError = useCallback(() => setError(null), [])

  const deposit = useCallback(async (foreignCents: number, code: PayCode) => {
    if (foreignCents <= 0 || foreignCents > 500000) {
      setError('invalid')
      return
    }
    const creditCents = convertedCents(foreignCents, RATES[code])
    const fail = amountEndsWith9(foreignCents)
    const id = `d-${Date.now()}`
    const tx: Tx = { id, cents: creditCents, status: 'pending', at: Date.now(), code }
    moved.current = true
    setBusy(true)
    setError(null)
    book.current.add(creditCents)
    setBalance(book.current.cents)
    setTxs((list) => [tx, ...list].slice(0, 12))
    await wait(760)
    if (fail) {
      book.current.add(-creditCents)
      setBalance(book.current.cents)
      setTxs((list) => list.filter((item) => item.id !== id))
      setError('declined')
      setBusy(false)
      return
    }
    setTxs((list) => list.map((item) => (item.id === id ? { ...item, status: 'posted' } : item)))
    setBusy(false)
    setView('wallet')
  }, [])

  const stake = useCallback((cents: number) => {
    const ok = book.current.take(cents)
    if (!ok) return false
    moved.current = true
    setBalance(book.current.cents)
    return true
  }, [])

  const credit = useCallback((cents: number) => {
    if (cents <= 0) return
    moved.current = true
    book.current.add(cents)
    setBalance(book.current.cents)
  }, [])

  const value = useMemo(
    () => ({
      status,
      balance,
      txs,
      view,
      busy,
      error,
      setView,
      reload,
      deposit,
      stake,
      credit,
      clearError,
    }),
    [status, balance, txs, view, busy, error, reload, deposit, stake, credit, clearError],
  )

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
}

export function useWallet() {
  const ctx = useContext(WalletContext)
  if (!ctx) throw new Error('wallet')
  return ctx
}
