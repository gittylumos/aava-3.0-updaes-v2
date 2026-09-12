/* Run status — always in view (P2). The Dynamic-Island task-progress dock,
 * matched to RunStrip.tsx. */
import { useLayoutEffect, useRef, useState } from 'react'
import { motion, useAnimationControls } from 'motion/react'
import { Replayable } from '../shared'

const DOCK_STEPS = [
  { label: 'Architecture analysis', result: 'Confirmed' },
  { label: 'Solution proposal', result: 'Drafted' },
  { label: 'C4 diagram generation', result: '' },
  { label: 'Design review', result: '' },
]

/* ── Run dock ──────────────────────────────────────────────────────────── */
function useMeasure() {
  const ref = useRef<HTMLDivElement | null>(null)
  const [bounds, setBounds] = useState({ width: 0, height: 0 })
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => setBounds({ width: entry.contentRect.width, height: entry.contentRect.height }))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return [ref, bounds] as const
}
function RunDockDemo() {
  const [open, setOpen] = useState(false)
  const [contentRef, bounds] = useMeasure()
  const controls = useAnimationControls()
  const first = useRef(true)
  const at = 2 // "current" step index — C4 diagram generation, waiting
  const accent = 'var(--warn)'

  useLayoutEffect(() => {
    if (!bounds.width) return
    const to = { width: bounds.width, height: bounds.height }
    if (first.current) { controls.set(to); first.current = false }
    else controls.start(to)
  }, [bounds.width, bounds.height, controls])

  return (
    <div className="relative flex w-full justify-center" style={{ height: 140 }}>
      <motion.div animate={controls} initial={false} transition={{ type: 'spring', stiffness: 320, damping: 26, mass: 1 }}
        className="absolute left-1/2 top-0 -translate-x-1/2 overflow-hidden"
        style={{ background: 'var(--slab)', borderRadius: '0 0 20px 20px', boxShadow: 'var(--shadow-panel)' }}>
        <div ref={contentRef} className="w-max max-w-[320px]">
          <button onClick={() => setOpen((o) => !o)} aria-expanded={open}
            className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left transition-colors hover:bg-[var(--wash-2)]">
            <span className="ilib-dock-pulse h-[8px] w-[8px] shrink-0 rounded-full" style={{ background: accent }} />
            <span className="ilib-dock-shimmer min-w-0 truncate text-[12.5px] font-medium">Waiting on you · C4 diagram generation</span>
            <span className="mono ml-auto shrink-0 pl-3 text-[11.5px] tabular-nums" style={{ color: 'var(--muted)' }}>{at}/{DOCK_STEPS.length} steps</span>
            <svg viewBox="0 0 24 24" width="13" height="13" aria-hidden className="shrink-0 transition-transform duration-200"
              style={{ color: 'var(--muted-deep)', transform: open ? 'rotate(180deg)' : undefined }}><path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          {open && (
            <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: 0.06 }}
              className="grid w-[320px] gap-0.5 p-2" style={{ borderTop: '1px solid var(--glass-line)' }}>
              {DOCK_STEPS.map((step, i) => {
                const state = i < at ? 'done' : i === at ? 'current' : 'ahead'
                return (
                  <div key={step.label} className="flex w-full min-w-0 items-center gap-2.5 rounded-[10px] px-2.5 py-1.5">
                    {state === 'done' ? (
                      <span className="mt-0.5 grid h-[17px] w-[17px] shrink-0 place-items-center rounded-full" style={{ background: 'var(--ok)' }}>
                        <svg viewBox="0 0 24 24" width="10" height="10" aria-hidden><path d="m5 13 4.5 4.5L19 7" fill="none" stroke="var(--on-text)" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      </span>
                    ) : state === 'current' ? (
                      <span className="mt-0.5 grid h-[17px] w-[17px] shrink-0 place-items-center rounded-full" style={{ border: `1.5px solid ${accent}` }}>
                        <span className="ilib-dock-pulse h-[7px] w-[7px] rounded-full" style={{ background: accent }} />
                      </span>
                    ) : (
                      <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden className="mt-0.5 shrink-0" style={{ color: 'var(--muted-deep)' }}>
                        <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.6" /><path d="M12 7.5V12l3 1.8" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                      </svg>
                    )}
                    <span className="grid min-w-0 flex-1 gap-0.5 pt-0.5">
                      <span className="min-w-0 truncate text-[12.5px]" style={{ color: state === 'current' ? 'var(--text)' : state === 'done' ? 'var(--text-dim)' : 'var(--muted)', fontWeight: state === 'current' ? 600 : 400 }}>{step.label}</span>
                      {state === 'current' && <span className="ilib-dock-shimmer truncate text-[11px]">Waiting on you</span>}
                    </span>
                    {state === 'done' && <span className="mono shrink-0 truncate text-[11px]" style={{ color: 'var(--muted-deep)' }}>{step.result}</span>}
                  </div>
                )
              })}
            </motion.div>
          )}
        </div>
      </motion.div>
      <style>{`
        .ilib-dock-pulse { animation: ilib-dock-pulse 1.4s ease-in-out infinite; }
        @keyframes ilib-dock-pulse { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: .35; transform: scale(.6); } }
        .ilib-dock-shimmer {
          background: linear-gradient(90deg, var(--warn) 0%, #ffffff 22%, var(--warn) 46%);
          background-size: 220% 100%; -webkit-background-clip: text; background-clip: text;
          color: transparent; animation: ilib-dock-sheen 1.8s linear infinite;
        }
        @keyframes ilib-dock-sheen { to { background-position: -220% 0; } }
      `}</style>
    </div>
  )
}
export function RunDockPreview() {
  return <Replayable render={(key) => <div key={key} className="w-full"><RunDockDemo /></div>} minHeight={200} />
}
