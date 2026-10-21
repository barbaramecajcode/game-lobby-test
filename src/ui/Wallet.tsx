import { useEffect, useRef, useState } from 'react'
import { useI18n } from '../i18n'
import { clock, money } from '../lib/money'
import { useTween } from '../lib/useTween'
import { PAY_CODES, RATES, useWallet } from '../state/wallet'
import type { PayCode } from '../types'
import { Dialog } from './Dialog'

export function WalletDialog() {
  const wallet = useWallet()
  const { t } = useI18n()
  if (wallet.view === 'closed') return null
  const depositing = wallet.view === 'deposit'
  return (
    <Dialog
      title={depositing ? t('deposit.title') : t('wallet.title')}
      closeLabel={depositing ? t('deposit.close') : t('wallet.close')}
      onClose={() => wallet.setView('closed')}
    >
      {depositing ? <DepositForm /> : <WalletBody />}
    </Dialog>
  )
}

function WalletBody() {
  const wallet = useWallet()
  const { t, lang } = useI18n()
  const shown = useTween(wallet.balance)

  if (wallet.status === 'loading') {
    return (
      <div aria-busy="true">
        <span className="sr">{t('wallet.loading')}</span>
        <div className="skel skel-line" />
        <div className="skel skel-line" />
        <div className="skel skel-line short" />
      </div>
    )
  }

  if (wallet.status === 'error') {
    return (
      <div className="state">
        <p>{t('wallet.error')}</p>
        <button type="button" className="solid" onClick={wallet.reload}>
          {t('wallet.retry')}
        </button>
      </div>
    )
  }

  return (
    <div className="wallet-body">
      <p className="kicker">{t('wallet.balance')}</p>
      <p className="balance">{money(shown, lang)}</p>
      <button type="button" className="solid" onClick={() => wallet.setView('deposit')}>
        {t('wallet.deposit')}
      </button>
      <h3>{t('wallet.recent')}</h3>
      {wallet.txs.length === 0 ? <p className="muted">{t('wallet.empty')}</p> : null}
      {wallet.txs.length > 0 ? (
        <ul className="txs">
          {wallet.txs.map((tx) => (
            <li key={tx.id}>
              <span>{t('wallet.depositOf')}</span>
              <span>{money(tx.cents, lang)}</span>
              <span className="muted">{tx.status === 'pending' ? t('wallet.pending') : t('wallet.posted')}</span>
              <time dateTime={new Date(tx.at).toISOString()}>{clock(tx.at, lang)}</time>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

function parseAmount(raw: string) {
  const cleaned = raw.trim().replace(',', '.')
  if (!/^\d+(\.\d{0,2})?$/.test(cleaned)) return null
  const value = Number(cleaned)
  if (!(value > 0) || value > 5000) return null
  return Math.round(value * 100)
}

function DepositForm() {
  const wallet = useWallet()
  const { t, lang } = useI18n()
  const field = useRef<HTMLInputElement>(null)
  const [raw, setRaw] = useState('50')
  useEffect(() => { field.current?.focus() }, [])
  const [code, setCode] = useState<PayCode>('EUR')
  const parsed = parseAmount(raw)
  const credited = parsed === null ? null : Math.round(parsed * RATES[code])

  return (
    <form
      className="deposit"
      onSubmit={(event) => {
        event.preventDefault()
        if (wallet.busy) return
        void wallet.deposit(parsed ?? 0, code)
      }}
    >
      <p className="note">{t('deposit.note')}</p>
      <label>
        <span>{t('deposit.amount')}</span>
        <input
          ref={field}
          data-autofocus
          inputMode="decimal"
          autoComplete="off"
          value={raw}
          onChange={(event) => {
            wallet.clearError()
            setRaw(event.target.value)
          }}
        />
      </label>
      <label>
        <span>{t('deposit.currency')}</span>
        <select
          value={code}
          onChange={(event) => setCode(event.target.value as PayCode)}
        >
          {PAY_CODES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </label>
      <p className="rate">{t('deposit.rate', { code, amount: money(Math.round(RATES[code] * 100), lang) })}</p>
      <p>
        <span className="kicker">{t('deposit.credit')}</span>
        <strong>{credited === null ? '—' : money(credited, lang)}</strong>
      </p>
      {wallet.error === 'declined' ? <p role="alert">{t('deposit.declined')}</p> : null}
      {wallet.error === 'invalid' ? <p role="alert">{t('deposit.invalid')}</p> : null}
      {wallet.busy ? <p>{t('deposit.working')}</p> : null}
      <div className="dialog-actions">
        <button type="button" className="text-btn" onClick={() => wallet.setView('wallet')} disabled={wallet.busy}>
          {t('deposit.cancel')}
        </button>
        <button type="submit" className="solid" disabled={wallet.busy}>
          {t('deposit.confirm')}
        </button>
      </div>
    </form>
  )
}
