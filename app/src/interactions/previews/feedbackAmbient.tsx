/* Feedback & ambient. Staggered chips, the toast, the real tooltip, press
 * feedback, and a contained slice of the ambient field — matched to
 * Chips.tsx / Toast.tsx / Tooltip.tsx / .press / AmbientField.tsx. */
import { useEffect, useRef } from 'react'
import { motion } from 'motion/react'
import { Replayable } from '../shared'
import { Tooltip, TooltipProvider } from '../../components/chrome/Tooltip'

/* ── Suggestion chips ──────────────────────────────────────────────────── */
const CHIP_LABELS = ['Summarize this', 'Find related tickets', 'Draft a reply']
function ChipsDemo() {
  return (
    <div className="flex flex-wrap gap-2">
      {CHIP_LABELS.map((label, i) => (
        <motion.button key={label} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18, delay: i * 0.04, ease: [0.16, 1, 0.3, 1] }}
          className="press rounded-full px-3.5 py-2.5 text-[12.5px] leading-none"
          style={{ background: 'var(--wash-3)', border: '1px solid var(--glass-line)', color: 'var(--text-dim)' }}>
          {label}
        </motion.button>
      ))}
    </div>
  )
}
export function ChipsPreview() {
  return <Replayable render={(key) => <div key={key}><ChipsDemo /></div>} minHeight={140} />
}

/* ── Toast ─────────────────────────────────────────────────────────────── */
function ToastDemo() {
  return (
    <motion.div role="status" aria-live="polite" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-full px-4 py-2.5 text-[13px] backdrop-blur-[20px]"
      style={{ background: 'rgba(24,22,38,.94)', border: '1px solid var(--glass-line)', color: 'var(--text-dim)' }}>
      Working copy saved
    </motion.div>
  )
}
export function ToastPreview() {
  return <Replayable render={(key) => <div key={key}><ToastDemo /></div>} minHeight={140} />
}

/* ── Tooltip ───────────────────────────────────────────────────────────────
   The REAL component, imported directly — Tooltip carries no app-state, so
   there's nothing to re-implement. It auto-triggers by dispatching the same
   pointer events a real hover produces (Radix's TooltipTrigger opens on
   onPointerMove, closes on onPointerLeave — matched here rather than using
   .focus(), which some hosting contexts suppress when the tab isn't the
   OS-focused window), so the tooltip visibly opens and closes on its own —
   but a real hover still works too, since this is the actual Tooltip. */
function TooltipDemo() {
  const ref = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    const open = () => ref.current?.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, pointerType: 'mouse' }))
    const close = () => ref.current?.dispatchEvent(new PointerEvent('pointerleave', { bubbles: true, pointerType: 'mouse' }))
    const t1 = window.setTimeout(open, 500)
    const t2 = window.setTimeout(close, 2400)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])
  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip label="Duplicate" side="top">
        <button ref={ref} aria-label="Duplicate"
          className="icon-btn grid h-10 w-10 place-items-center rounded-[10px]"
          style={{ background: 'var(--wash-2)', border: '1px solid var(--glass-line-soft)', color: 'var(--muted)' }}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <rect x="9" y="9" width="12" height="12" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" />
          </svg>
        </button>
      </Tooltip>
    </TooltipProvider>
  )
}
export function TooltipPreview() {
  return <Replayable render={(key) => <div key={key}><TooltipDemo /></div>} minHeight={160} />
}
