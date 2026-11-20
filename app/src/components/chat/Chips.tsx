import { motion } from 'motion/react'
import type { Chip } from '../../state/types'
import { prefersReducedMotion } from '../../state/timing'
import { easeOut } from '../../design/motion'

export function Chips({ chips, onPick }: { chips: Chip[]; onPick: (sends: string) => void }) {
  if (!chips.length) return null
  const reduced = prefersReducedMotion()
  const followups = chips.filter((c) => c.followup)
  const pills = chips.filter((c) => !c.followup)
  return (
    <>
    {/* Suggested next questions: a quiet "↳" list under a hairline, read as
        "you could ask this next" rather than as buttons that act. */}
    {followups.length > 0 && (
      <div className="mb-6 mt-1 border-t pt-1" style={{ borderColor: 'var(--glass-line)' }}>
        {followups.map((c, i) => (
          <motion.button
            key={c.label}
            onClick={() => onPick(c.sends)}
            initial={{ opacity: 0, y: reduced ? 0 : 3 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduced ? 0.01 : 0.18, delay: reduced ? 0 : i * 0.04, ease: easeOut }}
            className="press group flex w-full items-center gap-3 rounded-[8px] px-1.5 py-2.5 text-left text-[13.5px] transition-colors hover:bg-[var(--wash-3)]"
            style={{ color: 'var(--text-dim)', minHeight: 'var(--hit)' }}
          >
            <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden className="shrink-0" style={{ color: 'var(--muted)' }}>
              <path d="M5 4v7a3 3 0 0 0 3 3h11M15 10l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="min-w-0 flex-1 truncate group-hover:text-[var(--text)]">{c.label}</span>
          </motion.button>
        ))}
      </div>
    )}
    {pills.length > 0 && (
    <div className="mb-6 mt-1 flex flex-wrap gap-2">
      {pills.map((c, i) => (
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
  )}
    </>
  )
}
