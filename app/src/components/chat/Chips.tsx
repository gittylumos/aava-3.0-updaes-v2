import { motion } from 'motion/react'
import type { Chip } from '../../state/types'
import { prefersReducedMotion } from '../../state/timing'
import { easeOut } from '../../design/motion'

export function Chips({ chips, onPick }: { chips: Chip[]; onPick: (sends: string) => void }) {
  if (!chips.length) return null
  const reduced = prefersReducedMotion()
  return (
    <div className="mb-6 mt-1 flex flex-wrap gap-2">
      {chips.map((c, i) => (
        <motion.button
          key={c.label}
          onClick={() => onPick(c.sends)}
          initial={{ opacity: 0, y: reduced ? 0 : 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduced ? 0.01 : 0.18, delay: reduced ? 0 : i * 0.04, ease: easeOut }}
          className="press rounded-full px-3.5 py-2.5 text-[12.5px] leading-none hover:bg-[var(--wash-5)]"
          style={{
            background: 'var(--wash-3)',
            border: '1px solid var(--glass-line)',
            color: 'var(--text-dim)',
            minHeight: 'var(--hit)',
          }}
        >
          {c.label}
        </motion.button>
      ))}
    </div>
  )
}
