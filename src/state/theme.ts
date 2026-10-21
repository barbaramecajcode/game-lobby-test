export type ThemeName = 'dark' | 'light'

const listeners = new Set<() => void>()

export function currentTheme(): ThemeName {
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark'
}

export function setTheme(theme: ThemeName) {
  document.documentElement.dataset.theme = theme
  localStorage.setItem('halden.theme', theme)
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', theme === 'light' ? '#f3efe4' : '#12110e')
  listeners.forEach((listener) => listener())
}

export function toggleTheme() {
  setTheme(currentTheme() === 'dark' ? 'light' : 'dark')
}

export function subscribeTheme(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
