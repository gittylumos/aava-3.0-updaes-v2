import { useCallback, useEffect, useState } from 'react'
import { flushSync } from 'react-dom'

export type Theme = 'dark' | 'light'

const KEY = 'aava-theme'

/* The theme swap plays as a blur-fade crossfade: the old look dissolves into a
   soft blur as the new one resolves out of one, via the View Transition API.
   Tuned here. */
const DUR = 460
const BLUR = 14
const EASE = 'ease-in-out'

/** Dark is the product's own look and the default everywhere — the OS is not
 *  consulted. An explicit choice overrides it and persists. */
function initial(): Theme {
  if (typeof window === 'undefined') return 'dark'
  const saved = window.localStorage.getItem(KEY)
  return saved === 'light' ? 'light' : 'dark'
}

type ViewTransitionDoc = Document & {
  startViewTransition?: (cb: () => void) => { finished?: Promise<void> }
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(initial)

  useEffect(() => {
    // `color-scheme` rides along in tokens.css, keyed off the same attribute.
    document.documentElement.dataset.theme = theme
    window.localStorage.setItem(KEY, theme)
  }, [theme])

  const toggle = useCallback(() => {
    const next: Theme = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light'
    const apply = () => {
      document.documentElement.dataset.theme = next
      window.localStorage.setItem(KEY, next)
      setTheme(next)
    }

    const doc = document as ViewTransitionDoc
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    /* Fallback when the View Transition API is absent or motion is reduced: the
       old snap-swap. A theme flip changes colour, background, border and shadow
       on nearly every element at once, so every `transition-colors` would fire
       together and smear the switch over ~180ms — suppress all transitions for
       the swap, flip synchronously, force a reflow, then restore next frame. */
    if (!doc.startViewTransition || reduced) {
      const css = document.createElement('style')
      css.textContent = '*,*::before,*::after{transition:none !important}'
      document.head.appendChild(css)
      apply()
      void document.documentElement.offsetWidth
      requestAnimationFrame(() => requestAnimationFrame(() => css.remove()))
      return
    }

    /* The blur-fade. The old root snapshot blurs out and fades; the new one
       resolves out of the same blur. The resets stop the browser's default
       cross-fade from doubling up with ours. */
    const style = document.createElement('style')
    style.textContent = `
      ::view-transition-old(root), ::view-transition-new(root) { animation: none; mix-blend-mode: normal; }
      ::view-transition-old(root) { z-index: 1; }
      ::view-transition-new(root) { z-index: 2147483646; }
      @keyframes aava-theme-blur-out { from { filter: blur(0); opacity: 1 } to { filter: blur(${BLUR}px); opacity: 0 } }
      @keyframes aava-theme-blur-in  { from { filter: blur(${BLUR}px); opacity: 0 } to { filter: blur(0); opacity: 1 } }
      ::view-transition-old(root) { animation: aava-theme-blur-out ${DUR}ms ${EASE} both; }
      ::view-transition-new(root) { animation: aava-theme-blur-in ${DUR}ms ${EASE} both; }
    `
    document.head.appendChild(style)

    const cleanup = () => style.remove()
    try {
      const t = doc.startViewTransition(() => flushSync(apply))
      if (t.finished) t.finished.then(cleanup, cleanup)
      else window.setTimeout(cleanup, DUR)
    } catch {
      cleanup()
      apply()
    }
  }, [])

  return { theme, toggle }
}
