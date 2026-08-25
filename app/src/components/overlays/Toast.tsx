import { AnimatePresence, motion } from 'motion/react'
import { prefersReducedMotion } from '../../state/timing'

export function Toast({ text }: { text: string | null }) {
  const reduced = prefersReducedMotion()
  return (
    <AnimatePresence>
      {text && (
        <motion.div role="status" aria-live="polite"
          initial={{ opacity: 0, y: reduced ? 0 : 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: reduced ? 0 : 8 }}
          transition={{ duration: reduced ? 0.01 : 0.2, ease: [0.16, 1, 0.3, 1] }}
          /* Sit above the composer (~112px tall with padding), not on top of it. */
          className="fixed bottom-[7.5rem] left-1/2 z-[60] -translate-x-1/2 rounded-full px-4 py-2.5 text-[13px] backdrop-blur-[20px]"
          style={{ background: 'rgba(24,22,38,.94)', border: '1px solid var(--glass-line)', color: 'var(--text-dim)' }}>
          {text}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
