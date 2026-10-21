import type { Lang } from '../i18n/en'

const LOCALE: Record<Lang, string> = {
  en: 'en-GB',
  de: 'de-DE',
  ar: 'ar-EG',
}

export function money(cents: number, lang: Lang, currency = 'EUR') {
  return new Intl.NumberFormat(LOCALE[lang], {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100)
}

export function percent(fraction: number, lang: Lang, digits: number) {
  return new Intl.NumberFormat(LOCALE[lang], {
    style: 'percent',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(fraction)
}

export function clock(ms: number, lang: Lang) {
  return new Intl.DateTimeFormat(LOCALE[lang], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(ms)
}

export function day(iso: string, lang: Lang) {
  return new Intl.DateTimeFormat(LOCALE[lang], { dateStyle: 'medium' }).format(new Date(iso))
}

export function moneyParts(cents: number, lang: Lang, currency = 'EUR') {
  return new Intl.NumberFormat(LOCALE[lang], {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).formatToParts(cents / 100)
}
