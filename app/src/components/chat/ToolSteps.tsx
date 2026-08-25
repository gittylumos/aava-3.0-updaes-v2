import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import type { ToolStep } from '../../state/types'

/* Tool calls resolving in real time.
 *
 * This is what makes AAVA read as an agent rather than a chatbot: before it
 * answers, you watch it go and fetch the things it needs. Each row shows
 * pending -> running -> done with the result it came back with.
 *
 * With a `title`, the whole run is a collapsible accordion: open and animating
 * while it works, folded to a one-line summary once every step is done — the way
 * agent tools group a finished sequence — with a chevron to reopen it. */
export function ToolSteps({ steps, done, title }: { steps: ToolStep[]; done: number; title?: string }) {
  const complete = done >= steps.length
  const [open, setOpen] = useState(true)

  // Fold automatically the moment the run finishes; the user can reopen it.
  useEffect(() => { if (complete && title) setOpen(false) }, [complete, title])

  const rows = (
    <div className="grid gap-[3px]">
      {steps.map((step, i) => {
        const state = i < done ? 'done' : i === done ? 'running' : 'pending'
        if (state === 'pending') return null
        return (
          <motion.div
            key={step.label}
            initial={{ opacity: 0, y: 3 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }}
            className="flex items-center gap-2.5 rounded-[var(--r-sm)] px-2.5 py-[7px]"
            style={{ background: 'var(--wash-2)' }}
          >
            <span className="grid h-[15px] w-[15px] shrink-0 place-items-center">
              {state === 'done' ? (
                <span className="text-[10px] leading-none" style={{ color: 'var(--ok)' }}>✓</span>
              ) : (
                <span
                  className="block h-[11px] w-[11px] rounded-full border-[1.6px] border-transparent"
                  style={{ borderTopColor: 'var(--muted)', borderRightColor: 'var(--muted)', animation: 'tool-spin .7s linear infinite' }}
                />
              )}
            </span>
            <span className="min-w-0 flex-1 truncate text-[12px]" style={{ color: state === 'done' ? 'var(--text-dim)' : 'var(--muted)' }}>
              {step.label}
            </span>
            {state === 'done' ? (
              <span className="mono shrink-0 text-[10.5px]" style={{ color: 'var(--muted-deep)' }}>{step.result}</span>
            ) : (
              <span className="shrink-0 text-[10px] uppercase tracking-[.13em]" style={{ color: 'var(--muted-deep)' }}>{step.source}</span>
            )}
          </motion.div>
        )
      })}
    </div>
  )

  const spin = <style>{`@keyframes tool-spin { to { transform: rotate(360deg) } }
    @media (prefers-reduced-motion: reduce) { @keyframes tool-spin { to { transform: none } } }`}</style>

  if (!title) return <div className="mb-1">{rows}{spin}</div>

  return (
    <div className="mb-1 overflow-hidden rounded-[var(--r-md)]" style={{ border: '1px solid var(--glass-line-soft)' }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="press flex w-full items-center gap-2 px-2.5 py-2 text-left"
        style={{ background: 'var(--wash-2)' }}
      >
        <span className="grid h-[15px] w-[15px] shrink-0 place-items-center">
          {complete ? (
            <span className="text-[11px] leading-none" style={{ color: 'var(--ok)' }}>✓</span>
          ) : (
            <span className="block h-[11px] w-[11px] rounded-full border-[1.6px] border-transparent"
              style={{ borderTopColor: 'var(--muted)', borderRightColor: 'var(--muted)', animation: 'tool-spin .7s linear infinite' }} />
          )}
        </span>
        <span className="min-w-0 flex-1 truncate text-[12.5px] font-medium" style={{ color: 'var(--text-dim)' }}>{title}</span>
        <span className="shrink-0 text-[10.5px]" style={{ color: 'var(--muted-deep)' }}>{Math.min(done, steps.length)}/{steps.length}</span>
        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          aria-hidden style={{ color: 'var(--muted)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform var(--dur)' }}>
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {open && <div className="p-1" style={{ borderTop: '1px solid var(--glass-line-soft)' }}>{rows}</div>}
      {spin}
    </div>
  )
}
