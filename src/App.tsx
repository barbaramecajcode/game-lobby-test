import { memo, useCallback, useEffect, useState } from 'react'
import { useI18n, I18nProvider } from './i18n'
import { CatalogProvider } from './state/catalog'
import { FavoritesProvider } from './state/favorites'
import { WalletProvider } from './state/wallet'
import { Catalog } from './ui/Catalog'
import { Favorites } from './ui/Favorites'
import { Feed } from './ui/Feed'
import { Filters } from './ui/Filters'
import { Header } from './ui/Header'
import { Palette } from './ui/Palette'
import { PlaySheet } from './ui/Play'
import { Promos } from './ui/Promos'
import { WalletDialog } from './ui/Wallet'

export function App() {
  return (
    <I18nProvider>
      <CatalogProvider>
        <WalletProvider>
          <FavoritesProvider>
            <Shell />
          </FavoritesProvider>
        </WalletProvider>
      </CatalogProvider>
    </I18nProvider>
  )
}

const Shell = memo(function Shell() {
  const { t } = useI18n()
  const [palette, setPalette] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const openFilters = useCallback(() => setFiltersOpen(true), [])
  const togglePalette = useCallback(() => setPalette((open) => !open), [])

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) return
      const target = event.target as HTMLElement | null
      if (target?.closest('input, textarea, select')) return
      event.preventDefault()
      document.getElementById('q')?.focus()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <>
      <a className="skip" href="#games">
        {t('skip')}
      </a>
      <div className="shell">
        <Header onPalette={() => setPalette(true)} />
        <main>
          <Promos />
          <Favorites />
          <div className="floor">
            <Filters open={filtersOpen} onClose={() => setFiltersOpen(false)} />
            <Catalog onOpenFilters={openFilters} />
            <Feed />
          </div>
        </main>
        <p className="footer">{t('footer.note')}</p>
      </div>
      <Palette open={palette} onClose={() => setPalette(false)} onToggle={togglePalette} />
      <WalletDialog />
      <PlaySheet />
    </>
  )
})
