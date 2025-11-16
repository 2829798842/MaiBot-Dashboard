import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { ThemeProviderContext } from '@/lib/theme-context'

type Theme = 'dark' | 'light' | 'system'

type ThemeProviderProps = {
  children: ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'ui-theme',
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  )

  useEffect(() => {
    const root = window.document.documentElement

    root.classList.remove('light', 'dark')

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'

      root.classList.add(systemTheme)
      return
    }

    root.classList.add(theme)
  }, [theme])

  // 应用保存的主题色
  useEffect(() => {
    const savedAccentColor = localStorage.getItem('accent-color')
    if (savedAccentColor) {
      const root = document.documentElement
      const colors = {
        blue: { hsl: '221.2 83.2% 53.3%', darkHsl: '217.2 91.2% 59.8%' },
        purple: { hsl: '271 91% 65%', darkHsl: '270 95% 75%' },
        green: { hsl: '142 71% 45%', darkHsl: '142 76% 36%' },
        orange: { hsl: '25 95% 53%', darkHsl: '20 90% 48%' },
        pink: { hsl: '330 81% 60%', darkHsl: '330 85% 70%' },
      }

      const selectedColor = colors[savedAccentColor as keyof typeof colors]
      if (selectedColor) {
        root.style.setProperty('--primary', selectedColor.hsl)
      }
    }
  }, [])

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme)
      setTheme(theme)
    },
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}
