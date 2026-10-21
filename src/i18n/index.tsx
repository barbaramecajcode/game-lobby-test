import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { ar } from './ar'
import { de } from './de'
import { en, type Dict, type Lang } from './en'

const DICTS: Record<Lang, Dict> = { en, de, ar }

type I18nValue = {
  lang: Lang
  t: (key: keyof Dict, vars?: Record<string, string | number>) => string
  setLang: (lang: Lang) => void
}

const I18nContext = createContext<I18nValue | null>(null)

function fill(template: string, vars?: Record<string, string | number>) {
  if (!vars) return template
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(vars[key] ?? ''))
}

function storedLang(): Lang {
  const value = document.documentElement.lang
  if (value === 'de' || value === 'ar' || value === 'en') return value
  return 'en'
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(storedLang)

  const setLang = useCallback((next: Lang) => {
    setLangState(next)
    document.documentElement.lang = next
    document.documentElement.dir = next === 'ar' ? 'rtl' : 'ltr'
    localStorage.setItem('halden.lang', next)
  }, [])

  useEffect(() => {
    document.documentElement.lang = lang
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
  }, [lang])

  const t = useCallback(
    (key: keyof Dict, vars?: Record<string, string | number>) => fill(DICTS[lang][key], vars),
    [lang],
  )

  const value = useMemo(() => ({ lang, t, setLang }), [lang, t, setLang])
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('i18n')
  return ctx
}

export function gameCount(lang: Lang, count: number, t: I18nValue['t']) {
  if (lang === 'ar') {
    if (count === 0) return t('catalog.count.zero')
    if (count === 1) return t('catalog.count.one')
    if (count === 2) return t('catalog.count.two')
    if (count >= 3 && count <= 10) return t('catalog.count.few', { count })
    return t('catalog.count.many', { count })
  }
  if (count === 1) return t('catalog.count.one')
  return t('catalog.count.many', { count })
}
