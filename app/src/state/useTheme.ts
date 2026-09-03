import { useCallback, useEffect, useState } from 'react'

export type Theme = 'dark' | 'light'

const KEY = 'aava-theme'

/** Dark is the product's own look and the default everywhere — the OS is not
 *  consulted. An explicit choice overrides it and persists. */
function initial(): Theme {
  if (typeof window === 'undefined') return 'dark'
  const saved = window.localStorage.getItem(KEY)
  return saved === 'light' ? 'light' : 'dark'
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(initial)

  useEffect(() => {
    // `color-scheme` rides along in tokens.css, keyed off the same attribute.
    document.documentElement.dataset.theme = theme
    window.localStorage.setItem(KEY, theme)
  }, [theme])

  /* A theme flip changes color, background, border and shadow on nearly every
     element at once. Without this, every `transition-colors` fires together and
     the switch smears over ~180ms instead of snapping. Suppress all transitions
     for the swap, flip synchronously, force a reflow, then restore next frame. */
  const toggle = useCallback(() => {
    const next: Theme = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light'
    const css = document.createElement('style')
    css.textContent = '*,*::before,*::after{transition:none !important}'
    document.head.appendChild(css)
    document.documentElement.dataset.theme = next
    window.localStorage.setItem(KEY, next)
    // Force a reflow so the theme paints with transitions still suppressed…
    void document.documentElement.offsetWidth
    // …then drop the suppression on the next frame so real interactions animate again.
    requestAnimationFrame(() => requestAnimationFrame(() => css.remove()))
    setTheme(next)
  }, [])

  return { theme, toggle }
}
