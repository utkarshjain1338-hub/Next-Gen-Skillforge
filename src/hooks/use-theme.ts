'use client'

import { useEffect, useState } from 'react'

type Theme = 'light' | 'dark'

const THEME_STORAGE_KEY = 'theme'

const getPreferredTheme = (): Theme => {
  if (typeof window === 'undefined') {
    return 'light'
  }

  const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY)
  if (savedTheme === 'light' || savedTheme === 'dark') {
    return savedTheme
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => getPreferredTheme())
  const mounted = true

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  const setTheme = (nextTheme: Theme) => {
    setThemeState(nextTheme)
    document.documentElement.classList.toggle('dark', nextTheme === 'dark')
    window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme)
  }

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  return { theme, setTheme, toggleTheme, mounted }
}
