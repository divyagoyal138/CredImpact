'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

export type Theme = 'light' | 'dark' | 'dark-warm' | 'system'
export type EffectiveTheme = 'light' | 'dark' | 'dark-warm'

interface ThemeContextType {
  theme: Theme
  effectiveTheme: EffectiveTheme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark')
  const [effectiveTheme, setEffectiveTheme] = useState<EffectiveTheme>('dark')
  const [mounted, setMounted] = useState(false)

  const resolveEffectiveTheme = (selectedTheme: Theme): EffectiveTheme => {
    if (selectedTheme === 'system') {
      if (typeof window !== 'undefined') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        return prefersDark ? 'dark' : 'light'
      }
      return 'dark'
    }
    return selectedTheme
  }

  const applyThemeToDOM = (effective: EffectiveTheme) => {
    const htmlElement = document.documentElement
    htmlElement.classList.remove('dark', 'dark-warm', 'light')

    if (effective === 'dark') {
      htmlElement.classList.add('dark')
    } else if (effective === 'dark-warm') {
      htmlElement.classList.add('dark', 'dark-warm')
    } else {
      htmlElement.classList.add('light')
    }
  }

  // Load theme from localStorage on mount
  useEffect(() => {
    const storedTheme = (localStorage.getItem('credimpact_theme') || localStorage.getItem('campuslink_theme')) as Theme | null
    const initialTheme = storedTheme || 'dark'
    const computedEffective = resolveEffectiveTheme(initialTheme)

    setThemeState(initialTheme)
    setEffectiveTheme(computedEffective)
    applyThemeToDOM(computedEffective)
    setMounted(true)
  }, [])

  // Listen for system theme changes when in 'system' mode
  useEffect(() => {
    if (theme !== 'system') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      const computedEffective = mediaQuery.matches ? 'dark' : 'light'
      setEffectiveTheme(computedEffective)
      applyThemeToDOM(computedEffective)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme])

  const setTheme = (newTheme: Theme) => {
    const computedEffective = resolveEffectiveTheme(newTheme)
    setThemeState(newTheme)
    setEffectiveTheme(computedEffective)
    applyThemeToDOM(computedEffective)

    localStorage.setItem('credimpact_theme', newTheme)
    localStorage.setItem('campuslink_theme', newTheme)
  }

  const toggleTheme = () => {
    const newTheme = effectiveTheme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
  }

  if (!mounted) {
    return <>{children}</>
  }

  return (
    <ThemeContext.Provider value={{ theme, effectiveTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}
