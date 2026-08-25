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

  const toggle = useCallback(() => setTheme((t) => (t === 'dark' ? 'light' : 'dark')), [])

  return { theme, toggle }
}
