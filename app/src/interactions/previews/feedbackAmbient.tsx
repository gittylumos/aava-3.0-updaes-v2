/* Feedback & ambient. Staggered chips, the toast, the real tooltip, press
 * feedback, and a contained slice of the ambient field — matched to
 * Chips.tsx / Toast.tsx / Tooltip.tsx / .press / AmbientField.tsx. */
import { useEffect, useRef, useState } from 'react'
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

/* ── Press feedback ────────────────────────────────────────────────────── */
function PressFeedbackDemo() {
  const [count, setCount] = useState(0)
  return (
    <div className="flex flex-col items-center gap-3">
      <button onClick={() => setCount((c) => c + 1)}
        className="press rounded-[var(--r-md)] px-6 py-3.5 text-[13.5px] font-semibold"
        style={{ background: 'var(--wash-3)', border: '1px solid var(--glass-line)', color: 'var(--text)' }}>
        Click and hold to feel it
      </button>
      <span className="mono text-[11.5px]" style={{ color: 'var(--muted-deep)' }}>{count} press{count === 1 ? '' : 'es'}</span>
    </div>
  )
}
export function PressFeedbackPreview() {
  // Not replayable in the one-shot sense — the interaction itself IS the replay.
  return (
    <div className="relative overflow-hidden rounded-[var(--r-lg)]" style={{ background: 'var(--slab-raised)', border: '1px solid var(--glass-line)', backgroundImage: 'radial-gradient(var(--glass-line-soft) 1px, transparent 1px)', backgroundSize: '22px 22px' }}>
      <div className="flex items-center justify-center p-8" style={{ minHeight: 180 }}><PressFeedbackDemo /></div>
    </div>
  )
}

/* ── Ambient field ─────────────────────────────────────────────────────── */
function AmbientFieldDemo() {
  return (
    <div className="relative h-[160px] w-full max-w-[420px] overflow-hidden rounded-[var(--r-lg)]" style={{ background: 'var(--ground)' }}>
      <div className="ilib-lobe absolute -left-10 -top-10 h-[180px] w-[180px] rounded-full" style={{ background: 'var(--aurora-1)', opacity: 0.13, filter: 'blur(40px)' }} />
      <div className="ilib-lobe-2 absolute -bottom-16 left-1/3 h-[200px] w-[200px] rounded-full" style={{ background: 'var(--aurora-3)', opacity: 0.1, filter: 'blur(50px)' }} />
      <div className="ilib-lobe-3 absolute -right-10 top-1/4 h-[150px] w-[150px] rounded-full" style={{ background: 'var(--aurora-2)', opacity: 0.055, filter: 'blur(40px)' }} />
      <style>{`
        .ilib-lobe { animation: ilib-drift-1 22s ease-in-out infinite; }
        .ilib-lobe-2 { animation: ilib-drift-2 28s ease-in-out infinite; }
        .ilib-lobe-3 { animation: ilib-drift-3 25s ease-in-out infinite; }
        @keyframes ilib-drift-1 { 0%,100% { transform: translate(0,0); } 50% { transform: translate(30px,20px); } }
        @keyframes ilib-drift-2 { 0%,100% { transform: translate(0,0); } 50% { transform: translate(-20px,-25px); } }
        @keyframes ilib-drift-3 { 0%,100% { transform: translate(0,0); } 50% { transform: translate(-25px,15px); } }
      `}</style>
    </div>
  )
}
export function AmbientFieldPreview() {
  return <Replayable render={(key) => <div key={key} className="w-full max-w-[420px]"><AmbientFieldDemo /></div>} minHeight={180} />
}
