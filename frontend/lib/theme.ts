export type ThemeMode = 'light' | 'dark'

export const THEME_STORAGE_KEY = 'theme'
export const THEME_COOKIE_NAME = 'theme'
export const THEME_COOKIE_MAX_AGE = 60 * 60 * 24 * 365

export const THEME_PALETTE: Record<ThemeMode, { background: string; foreground: string }> = {
  light: { background: '#f8fafb', foreground: '#2b3642' },
  dark: { background: '#12100f', foreground: '#f3ede4' },
}

export function isThemeMode(value: unknown): value is ThemeMode {
  return value === 'light' || value === 'dark'
}

export function getStoredTheme(): ThemeMode | null {
  if (typeof window === 'undefined') {
    return null
  }

  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY)
  return isThemeMode(storedTheme) ? storedTheme : null
}

export function persistTheme(theme: ThemeMode) {
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(THEME_STORAGE_KEY, theme)
  document.cookie = `${THEME_COOKIE_NAME}=${theme}; path=/; max-age=${THEME_COOKIE_MAX_AGE}; samesite=lax`
}

export function applyTheme(theme: ThemeMode) {
  if (typeof document === 'undefined') {
    return
  }

  const root = document.documentElement
  const colors = THEME_PALETTE[theme]

  root.classList.toggle('dark', theme === 'dark')
  root.classList.toggle('light', theme === 'light')
  root.style.colorScheme = theme
  root.style.backgroundColor = colors.background
  root.style.color = colors.foreground
}

export function resolveInitialTheme(value: unknown, fallback: ThemeMode = 'light'): ThemeMode {
  return isThemeMode(value) ? value : fallback
}