import { useEffect } from 'react'
import type { RefObject } from 'react'

/* Close on an outside click or Escape. Every menu in the product wants exactly
   this and nothing more, so it is a hook rather than a third hand-rolled copy.
   Escape is captured so a menu inside an overlay closes itself first. */
export function useDismiss(open: boolean, root: RefObject<HTMLElement | null>, close: () => void) {
  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as Node)) close()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      e.stopPropagation()
      close()
    }
    document.addEventListener('mousedown', onDoc)
    window.addEventListener('keydown', onKey, true)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      window.removeEventListener('keydown', onKey, true)
    }
  }, [open, root, close])
}
