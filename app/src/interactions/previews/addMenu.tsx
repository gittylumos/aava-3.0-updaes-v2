/* Add library — once a golden process is cloned it becomes editable, and the
 * "+" at the canvas's top-left opens the Add panel: matched artefacts to drop
 * in, logic (split, merge, routing) and building blocks. Mirrors the Library
 * panel in src/prd/OrchestrationCanvas.tsx. This preview runs itself — the +
 * pulses, the panel slides in from the left, an item lights up as if about to
 * be dragged onto the canvas, then it closes and loops; hovering pauses it. */
import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { PreviewBox } from '../shared'

const ARTEFACTS = [
  { label: 'AI-Powered Task', badge: 'Process' },
  { label: 'AI-Powered Task', badge: 'Workflow' },
  { label: 'AI-Powered Task', badge: 'Agent' },
]
const LOGIC = ['Split', 'Merge', 'If else', 'Multi-way Switch routing']
const BLOCKS = ['Start', 'End', 'Human in the loop']

function Section({ label, children, defaultOpen }: { label: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(!!defaultOpen)
  return (
    <div className="pb-1">
      <button type="button" onClick={() => setOpen((o) => !o)} className="press flex w-full items-center gap-1 px-1 py-1.5 text-[9.5px] font-semibold uppercase tracking-[.12em]" style={{ color: 'var(--muted-deep)' }}>
        <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden style={{ transform: open ? 'rotate(90deg)' : 'none', transition: 'transform .15s' }}><path d="M9 6l6 6-6 6" /></svg>
        {label}
      </button>
      {open && <div className="pt-0.5">{children}</div>}
    </div>
  )
}

function AddMenuDemo() {
  const [open, setOpen] = useState(false)
  const [spot, setSpot] = useState<string | null>(null)
  const paused = useRef(false)

  /* The reel: pulse + → open → an artefact lights up → close → loop. */
  useEffect(() => {
    const steps: Array<() => void> = [
      () => { setOpen(true); setSpot(null) },
      () => setSpot('AI-Powered Task·Process'),
      () => setSpot('Split'),
      () => { setSpot(null); setOpen(false) },
    ]
    let i = 0
    const iv = window.setInterval(() => { if (!paused.current) { steps[i % steps.length](); i += 1 } }, 1600)
    return () => window.clearInterval(iv)
  }, [])

  return (
    <div className="relative h-[420px] w-full overflow-hidden rounded-[14px]" style={{ border: '1px solid var(--glass-line)', background: 'var(--slab-raised)', backgroundImage: 'radial-gradient(var(--glass-line-soft) 1px, transparent 1px)', backgroundSize: '20px 20px' }}
      onMouseEnter={() => { paused.current = true }} onMouseLeave={() => { paused.current = false }}>
      {/* Faint node chain behind, so the panel reads as floating over a canvas. */}
      <div className="flex h-full items-center justify-center gap-3 opacity-40" aria-hidden>
        {[0, 1, 2].map((i) => <span key={i} className="h-10 w-24 rounded-[10px]" style={{ background: 'var(--slab)', border: '1px solid var(--glass-line)' }} />)}
      </div>

      {/* The + button — pulses until the panel is open. */}
      {!open && (
        <button type="button" onClick={() => setOpen(true)} aria-label="Open add panel"
          className="press absolute left-3 top-3 z-20 flex items-center gap-2 rounded-full px-3 py-2 shadow-lg"
          style={{ background: 'var(--slab-raised)', border: '1px solid var(--glass-line)' }}>
          <span className="relative grid place-items-center">
            <span className="absolute inline-flex h-5 w-5 animate-ping rounded-full" style={{ background: 'color-mix(in srgb, var(--brand) 40%, transparent)' }} />
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="var(--brand)" strokeWidth="2" strokeLinecap="round" aria-hidden><path d="M12 5v14M5 12h14" /></svg>
          </span>
          <span className="text-[12px] font-medium" style={{ color: 'var(--text-dim)' }}>Add</span>
        </button>
      )}

      {/* The Add library — expands out of the "+" corner and collapses back into
          it, growing from the top-left the "+" sits at. */}
      <AnimatePresence>
        {open && (
          <motion.div key="lib" initial={{ opacity: 0, scale: 0.82 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.82 }} transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            className="absolute left-3 top-3 z-20 flex max-h-[calc(100%-24px)] w-[248px] flex-col overflow-hidden rounded-[12px] shadow-xl"
            style={{ background: 'var(--slab-raised)', border: '1px solid var(--glass-line)', transformOrigin: 'top left' }}>
            <div className="flex items-center gap-2 px-3 py-2.5" style={{ borderBottom: '1px solid var(--glass-line-soft)' }}>
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="var(--brand)" strokeWidth="1.9" strokeLinecap="round" aria-hidden><circle cx="12" cy="12" r="9" /><path d="M12 8v8M8 12h8" /></svg>
              <span className="text-[12px] font-semibold" style={{ color: 'var(--text)' }}>Add</span>
              <button type="button" onClick={() => setOpen(false)} aria-label="Collapse add panel" className="press ml-auto grid h-6 w-6 place-items-center rounded-[6px] transition-colors hover:bg-[var(--wash-3)]" style={{ color: 'var(--muted)' }}>
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M15 6l-6 6 6 6" /><path d="M4 4v16" /></svg>
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-2.5 py-2">
              <div className="mb-2 flex items-center gap-1.5 rounded-[7px] px-2 py-1.5" style={{ background: 'var(--wash-2)', border: '1px solid var(--glass-line-soft)' }}>
                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><circle cx="11" cy="11" r="7" /><path d="m21 21-4.35-4.35" /></svg>
                <span className="text-[11.5px]" style={{ color: 'var(--muted-deep)' }}>Search</span>
              </div>
              <Section label="Artefacts" defaultOpen>
                {ARTEFACTS.map((a) => {
                  const on = spot === `${a.label}·${a.badge}`
                  return (
                    <div key={a.badge} className="mb-1 flex cursor-grab items-center gap-2 rounded-[8px] px-2 py-1.5 transition-colors" style={{ background: 'var(--wash-2)', border: `1px solid ${on ? 'color-mix(in srgb, var(--brand) 55%, transparent)' : 'var(--glass-line-soft)'}` }}>
                      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-[6px]" style={{ background: 'var(--wash-3)', color: 'var(--muted)' }}>
                        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><rect x="4" y="4" width="16" height="16" rx="3" /></svg>
                      </span>
                      <span className="min-w-0 flex-1 truncate text-[11.5px]" style={{ color: 'var(--text-dim)' }}>{a.label}</span>
                      <span className="shrink-0 rounded-full px-1.5 py-[1px] text-[9px] font-medium" style={{ background: 'var(--wash-3)', color: 'var(--muted)' }}>{a.badge}</span>
                    </div>
                  )
                })}
              </Section>
              <Section label="Logic">
                {LOGIC.map((l) => (
                  <div key={l} className="mb-0.5 flex cursor-grab items-center gap-2 rounded-[7px] border px-2 py-1.5 transition-colors" style={{ borderColor: spot === l ? 'color-mix(in srgb, var(--brand) 50%, transparent)' : 'transparent', background: spot === l ? 'var(--wash-2)' : 'transparent' }}>
                    <span className="text-[11.5px]" style={{ color: 'var(--text-dim)' }}>{l}</span>
                    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="var(--muted-deep)" strokeWidth="2" strokeLinecap="round" aria-hidden className="ml-auto"><circle cx="9" cy="6" r="1" /><circle cx="15" cy="6" r="1" /><circle cx="9" cy="12" r="1" /><circle cx="15" cy="12" r="1" /><circle cx="9" cy="18" r="1" /><circle cx="15" cy="18" r="1" /></svg>
                  </div>
                ))}
              </Section>
              <Section label="Building blocks">
                {BLOCKS.map((b) => <div key={b} className="mb-0.5 rounded-[7px] px-2 py-1.5 text-[11.5px]" style={{ color: 'var(--text-dim)' }}>{b}</div>)}
              </Section>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function AddMenuPreview() {
  return <PreviewBox minHeight={460}><AddMenuDemo /></PreviewBox>
}
